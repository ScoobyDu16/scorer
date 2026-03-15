import { ballsToOvers, calculateRunRate } from "../../utils/cricket";
import { hasUsedAccessCodeForMatchRepo, getMatchesWithActiveCodesRepo } from "../access-code/access-code.repository";
import { getLastBallsRepo } from "../ball/balls.repository";
import { matchServiceLogger } from "../../utils/business-logger";
import {
  getMatchPlayerStatsRepo,
  getPlayerByIdRepo,
  getPlayersByIdsRepo,
  updateBattingStatsRepo,
  updateBowlingStatsRepo,
  revertBattingStatsRepo,
  revertBowlingStatsRepo,
  updateMaidensRepo,
  upsertPlayerMatchStatsRepo,
  getNextBattingOrderRepo,
  setDismissalTypeRepo,
  clearDismissalTypeRepo,
} from "../player/player.repository";
import { getWicketBallsByInningsRepo } from "../ball/balls.repository";
import {
  addMatchPlayersRepo,
  createBallRepo,
  createInningsRepo,
  createMatchRepo,
  deleteBallRepo,
  deleteMatchRepo,
  getCurrentInningsRepo,
  getInningsByIdRepo,
  getLastBallRepo,
  getMatchByIdRepo,
  getMatchPlayersRepo,
  getInningsByNumberRepo,
  getMatchWithInningsRepo,
  getMatchesByTurfRepo,
  revertInningsTotalsRepo,
  revertInningsExtrasRepo,
  updateInningsCurrentPlayersRepo,
  updateInningsOpeningPlayersRepo,
  updateInningsExtrasRepo,
  updateInningsStatusRepo,
  updateInningsTotalsRepo,
  updateMatchRepo,
} from "./match.repository";
import {
  TEAM,
  MATCH_STATUS,
  TOSS_DECISION,
  INNINGS_STATUS,
  RESULT_TYPE,
  Team,
  ResultType,
} from "../../db/schema/enums";
import { getMatchesWithoutActiveCodesService } from "../access-code/access-code.service";
import { calculateNextStrike } from "../../utils/strike.engine";
import { calculateExtras } from "../../utils/extra.engine";
import { formatRecentBalls } from "../../utils/ball-display";
import { validateWicketScenario } from "../wicket/wicket.validation.service";

const getExtrasBreakdownFromInnings = (i: any) => {
  const wideRuns = i.wideRuns || 0;
  const noBallRuns = i.noBallRuns || 0;
  const byeRuns = i.byeRuns || 0;
  const legByeRuns = i.legByeRuns || 0;
  const total = wideRuns + noBallRuns + byeRuns + legByeRuns;

  return {
    wide: wideRuns,
    noBall: noBallRuns,
    bye: byeRuns,
    legBye: legByeRuns,
    total,
  };
};

export const createMatchService = async (turfId: string, data: any) => {
  const match = await createMatchRepo({
    turfId,
    teamAName: data.teamAName,
    teamBName: data.teamBName,
    overs: data.overs,
    venue: data.venue,
    tossWinner: data.tossWinner,
    tossDecision: data.tossDecision,
    status: MATCH_STATUS.CREATED,
    playersPerTeam: data.playersPerTeam || 11, // Default to 11 players per team
  });

  return match;
};

export const getMatchesService = async (turfId: string) => {
  const allMatches = await getMatchesByTurfRepo(turfId);
  return allMatches; // Return all matches for Match Management page
};

export const getCreatedMatchesService = async (turfId: string) => {
  const allMatches = await getMatchesByTurfRepo(turfId);
  // Filter only CREATED status matches for generate code page
  // Also filter out matches that have active access codes
  const matchesWithActiveCodes = await getMatchesWithActiveCodesRepo(allMatches.map(m => m.id));
  const activeCodeMatchIds = new Set(matchesWithActiveCodes);
  
  return allMatches.filter((match: any) => 
    match.status === MATCH_STATUS.CREATED && !activeCodeMatchIds.has(match.id)
  );
};

export const getMatchService = async (matchId: string) => {
  const match = await getMatchByIdRepo(matchId);
  return match;
};

export const deleteMatchService = async (matchId: string) => {
  await deleteMatchRepo(matchId);
};

export const addMatchPlayersService = async (
  matchId: string,
  players: {
    playerId: string;
    team: "A" | "B";
  }[],
): Promise<void> => {
  matchServiceLogger.start("adding players to match", {
    matchId,
    playerCount: players.length,
  });

  // Check if players already exist
  const existingPlayers = await getMatchPlayersRepo(matchId);
  if (existingPlayers.length > 0) {
    matchServiceLogger.error(
      "players already exist",
      new Error("Players already added for this match"),
      { matchId },
    );
    throw new Error("Players already added for this match");
  }

  // Add players and update match status
  const records = players.map((p) => ({
    matchId,
    playerId: p.playerId,
    team: p.team,
  }));
  await addMatchPlayersRepo(records);

  // Update match with players added status
  await getMatchByIdRepo(matchId);
  await updateMatchRepo(matchId, {
    status: MATCH_STATUS.PLAYERS_ADDED,
    playersAddedStatus: "PLAYERS_ADDED",
  });

  matchServiceLogger.success("players added to match", {
    matchId,
    playerCount: players.length,
  });
};

export const getMatchPlayersService = async (matchId: string) => {
  return getMatchPlayersRepo(matchId);
};

export const startSecondInningsService = async (
  matchId: string,
  data: {
    strikerId: string;
    nonStrikerId: string;
    bowlerId: string;
  },
): Promise<any> => {
  matchServiceLogger.start("starting second innings", {
    matchId,
    strikerId: data.strikerId,
    nonStrikerId: data.nonStrikerId,
    bowlerId: data.bowlerId,
  });

  // Get current match to check status
  const match = await getMatchWithInningsRepo(matchId);
  if (!match) {
    matchServiceLogger.error(
      "starting second innings",
      new Error("Match not found"),
      { matchId },
    );
    throw new Error("Match not found");
  }

  // Validate that match is in correct state for starting second innings
  if (match.status !== MATCH_STATUS.LIVE) {
    matchServiceLogger.error(
      "starting second innings",
      new Error("Match must be live to start second innings"),
      { matchId },
    );
    throw new Error("Match must be live to start second innings");
  }

  // Validate that first innings exists and is completed
  const firstInnings = match.innings.find((i: any) => i.inningsNumber === 1);
  if (!firstInnings || firstInnings.status !== INNINGS_STATUS.COMPLETED) {
    matchServiceLogger.error(
      "starting second innings",
      new Error(
        "First innings must be completed before starting second innings",
      ),
      { matchId },
    );
    throw new Error(
      "First innings must be completed before starting second innings",
    );
  }

  // Find the existing second innings with UPCOMING status
  const secondInnings = match.innings.find((i: any) => 
    i.inningsNumber === 2 && i.status === INNINGS_STATUS.UPCOMING
  );

  if (!secondInnings) {
    matchServiceLogger.error(
      "starting second innings",
      new Error("Second innings with UPCOMING status not found"),
      { matchId },
    );
    throw new Error("Second innings not found or already started");
  }

  // Validate that all player IDs exist
  const strikerPlayer = await getPlayerByIdRepo(data.strikerId);
  const nonStrikerPlayer = await getPlayerByIdRepo(data.nonStrikerId);
  const bowlerPlayer = await getPlayerByIdRepo(data.bowlerId);

  if (!strikerPlayer || !nonStrikerPlayer || !bowlerPlayer) {
    matchServiceLogger.error(
      "starting second innings",
      new Error("One or more player IDs are invalid"),
      { 
        strikerId: data.strikerId,
        nonStrikerId: data.nonStrikerId,
        bowlerId: data.bowlerId,
        strikerExists: !!strikerPlayer,
        nonStrikerExists: !!nonStrikerPlayer,
        bowlerExists: !!bowlerPlayer,
      },
    );
    throw new Error("One or more player IDs are invalid");
  }

  // Update the existing second innings with player details and change status to LIVE
  await updateInningsOpeningPlayersRepo(
    secondInnings.id,
    data.strikerId,
    data.nonStrikerId,
    data.bowlerId,
  );
  
  await updateInningsStatusRepo(secondInnings.id, INNINGS_STATUS.LIVE);
  
  // Create player stats for second innings opening players
  const battingTeam = secondInnings.battingTeam;
  const bowlingTeam = battingTeam === TEAM.A ? TEAM.B : TEAM.A;
  
  // Create stats for opening batsmen
  await upsertPlayerMatchStatsRepo(
    matchId,
    data.strikerId,
    battingTeam,
    1, // Opening striker gets batting order 1
  );
  await upsertPlayerMatchStatsRepo(
    matchId,
    data.nonStrikerId,
    battingTeam,
    2, // Opening non-striker gets batting order 2
  );

  // Create stats for opening bowler (bowling team)
  await upsertPlayerMatchStatsRepo(
    matchId,
    data.bowlerId,
    bowlingTeam,
    undefined, // Bowlers don't have batting order
  );
  
  // Get the updated innings to return
  const updatedInnings = await getInningsByIdRepo(secondInnings.id);

  // Update match status to live and set current innings to 2
  await updateMatchRepo(matchId, {
    status: MATCH_STATUS.LIVE,
    currentInnings: 2,
    matchStartedStatus: "LIVE",
  });

  matchServiceLogger.success("second innings started", {
    matchId,
    inningsId: updatedInnings.id,
  });

  return {
    message: "Second innings started",
    innings: updatedInnings,
  };
};

export const getMatchScorecardService = async (matchId: string) => {
  matchServiceLogger.fetching("match scorecard", matchId);

  const match = await getMatchWithInningsRepo(matchId);

  if (!match) {
    matchServiceLogger.error(
      "fetching match scorecard",
      new Error("Match not found"),
      { matchId },
    );
    throw new Error("Match not found");
  }

  const matchPlayers = await getMatchPlayersRepo(matchId);
  const stats = await getMatchPlayerStatsRepo(matchId);

  const allPlayerIds = Array.from(
    new Set([
      ...matchPlayers.map((p: any) => p.playerId),
      ...stats.map((s: any) => s.playerId),
    ]),
  );
  const players = await getPlayersByIdsRepo(allPlayerIds);
  const playerMap: Record<string, any> = Object.fromEntries(
    players.map((p: any) => [p.id, p]),
  );

  const dismissalsByInnings: Record<string, any[]> = {};

  for (const inn of match.innings as any[]) {
    const wicketBalls = await getWicketBallsByInningsRepo(inn.id);

    dismissalsByInnings[inn.id] = wicketBalls.map((b: any) => {
      const dismissedId = b.dismissedPlayerId;
      const bowlerId = b.bowlerId;
      const fielderId = b.fielderId;

      return {
        overNumber: b.overNumber,
        ballNumber: b.ballNumber,
        batsmanId: dismissedId,
        batsmanName: dismissedId ? playerMap[dismissedId]?.name : null,
        wicketType: b.wicketType,
        bowlerId,
        bowlerName: bowlerId ? playerMap[bowlerId]?.name : null,
        fielderId,
        fielderName: fielderId ? playerMap[fielderId]?.name : null,
      };
    });
  }

  const inningsScorecards = (match.innings as any[])
    .sort((a, b) => a.inningsNumber - b.inningsNumber)
    .map((inn) => {
      const battingTeam = inn.battingTeam;
      const bowlingTeam = battingTeam === TEAM.A ? TEAM.B : TEAM.A;

      const teamBattingStats = (stats as any[])
        .filter((s) => s.team === battingTeam)
        .filter((s) => s.battingOrder !== null && s.battingOrder !== undefined)
        .sort((a, b) => (a.battingOrder || 0) - (b.battingOrder || 0));

      const teamBowlingStats = (stats as any[])
        .filter((s) => s.team === bowlingTeam)
        .filter((s) => (s.ballsBowled || 0) > 0)
        .sort((a, b) => (b.wickets || 0) - (a.wickets || 0));

      const dismissalMap: Record<string, any> = {};
      for (const d of dismissalsByInnings[inn.id] || []) {
        if (d.batsmanId) dismissalMap[d.batsmanId] = d;
      }

      const battingTable = teamBattingStats.map((s) => {
        const d = dismissalMap[s.playerId];
        return {
          playerId: s.playerId,
          name: playerMap[s.playerId]?.name,
          runs: s.runs,
          balls: s.ballsFaced,
          fours: s.fours,
          sixes: s.sixes,
          dots: s.dotsFaced,
          out: !!d,
          dismissal: d
            ? {
                wicketType: d.wicketType,
                bowlerId: d.bowlerId,
                bowlerName: d.bowlerName,
                fielderId: d.fielderId,
                fielderName: d.fielderName,
                overNumber: d.overNumber,
                ballNumber: d.ballNumber,
              }
            : null,
        };
      });

      const bowlingTable = teamBowlingStats.map((s) => ({
        playerId: s.playerId,
        name: playerMap[s.playerId]?.name,
        overs: ballsToOvers(s.ballsBowled || 0),
        maidens: s.maidens,
        runsConceded: s.runsConceded,
        wickets: s.wickets,
        dotsBowled: s.dotsBowled,
      }));

      const extras = getExtrasBreakdownFromInnings(inn);

      const teamMatchPlayers = matchPlayers
        .filter((p: any) => p.team === battingTeam)
        .map((p: any) => ({
          playerId: p.playerId,
          name: p.player?.name || playerMap[p.playerId]?.name,
        }));

      const battedPlayerIds = new Set(teamBattingStats.map((s) => s.playerId));
      const yetToBat = teamMatchPlayers.filter((p: any) => !battedPlayerIds.has(p.playerId));

      return {
        inningsId: inn.id,
        inningsNumber: inn.inningsNumber,
        battingTeam,
        totalRuns: inn.totalRuns,
        totalWickets: inn.totalWickets,
        overs: ballsToOvers(inn.totalBalls),
        status: inn.status,
        extras,
        batting: battingTable,
        bowling: bowlingTable,
        yetToBat,
        dismissals: dismissalsByInnings[inn.id] || [],
      };
    });

  const firstInnings = (match.innings as any[]).find((i) => i.inningsNumber === 1);
  const secondInnings = (match.innings as any[]).find((i) => i.inningsNumber === 2);

  let target: number | null = null;
  let currentRunRate = 0;
  let requiredRuns: number | null = null;
  let requiredBalls: number | null = null;
  let requiredRunRate: number | null = null;

  if (match.currentInnings === 1 && firstInnings) {
    currentRunRate = calculateRunRate(firstInnings.totalRuns, firstInnings.totalBalls);
  }

  if (match.currentInnings === 2 && firstInnings && secondInnings) {
    const computedTarget = firstInnings.totalRuns + 1;
    target = computedTarget;
    currentRunRate = calculateRunRate(secondInnings.totalRuns, secondInnings.totalBalls);

    const totalMatchBalls = match.overs * 6;
    requiredRuns = Math.max(computedTarget - secondInnings.totalRuns, 0);
    requiredBalls = Math.max(totalMatchBalls - secondInnings.totalBalls, 0);
    requiredRunRate =
      requiredBalls > 0 ? Number(((requiredRuns / requiredBalls) * 6).toFixed(2)) : 0;
  }

  let result: string | null = null;
  if (match.status === MATCH_STATUS.COMPLETED) {
    if (match.resultType === RESULT_TYPE.TIE) {
      result = "Match tied";
    } else if (match.winner) {
      const winnerName = match.winner === TEAM.A ? match.teamAName : match.teamBName;

      let unit: string;
      if (match.resultType === RESULT_TYPE.RUNS) {
        unit = match.resultMargin === 1 ? "run" : "runs";
      } else if (match.resultType === RESULT_TYPE.WICKETS) {
        unit = match.resultMargin === 1 ? "wicket" : "wickets";
      } else {
        unit = "runs";
      }

      result = `${winnerName} won by ${match.resultMargin} ${unit}`;
    }
  }

  return {
    matchId: match.id,
    status: match.status,
    currentInnings: match.currentInnings,
    teamAName: match.teamAName,
    teamBName: match.teamBName,
    overs: match.overs,

    tossWinner: match.tossWinner,
    tossDecision: match.tossDecision,

    target,
    currentRunRate,
    requiredRuns,
    requiredBalls,
    requiredRunRate,

    result,

    innings: inningsScorecards,
  };
};

export const startInningsService = async (
  matchId: string,
  openingPlayers?: {
    strikerId: string;
    nonStrikerId: string;
    bowlerId: string;
  },
) => {
  /**
   * 1️⃣ Get match
   */
  const match = await getMatchByIdRepo(matchId);

  if (!match) {
    throw new Error("Match not found");
  }

  if (match.status === MATCH_STATUS.LIVE) {
    // LIVE
    throw new Error("Match already started");
  }

  if (match.status !== MATCH_STATUS.PLAYERS_ADDED) {
    throw new Error("Players must be added before starting the match");
  }

  /**
   * 2️⃣ ⭐ Access Code Validation Check (NEW)
   */
  const hasValidAccess = await hasUsedAccessCodeForMatchRepo(matchId);

  if (!hasValidAccess) {
    throw new Error(
      "Access code validation required before starting this match",
    );
  }

  /**
   * 3️⃣ Determine batting team
   */
  let battingTeam: Team;

  if (match.tossDecision === TOSS_DECISION.BAT) {
    battingTeam = match.tossWinner as Team;
  } else {
    battingTeam = match.tossWinner === TEAM.A ? TEAM.B : TEAM.A;
  }

  /**
   * 4️⃣ Create first innings
   */
  const inningsRecord = await createInningsRepo({
    matchId,
    inningsNumber: 1,
    battingTeam,
    openingStrikerId: openingPlayers?.strikerId,
    openingNonStrikerId: openingPlayers?.nonStrikerId,
    openingBowlerId: openingPlayers?.bowlerId,
    currentStrikerId: openingPlayers?.strikerId,
    currentNonStrikerId: openingPlayers?.nonStrikerId,
    currentBowlerId: openingPlayers?.bowlerId,
    status: INNINGS_STATUS.LIVE,
  });

  /**
   * 5️⃣ Create player stats for opening players
   */
  if (
    openingPlayers?.strikerId &&
    openingPlayers?.nonStrikerId &&
    openingPlayers?.bowlerId
  ) {
    // Create stats for opening batsmen
    await upsertPlayerMatchStatsRepo(
      matchId,
      openingPlayers.strikerId,
      battingTeam,
      1, // Opening striker gets batting order 1
    );
    await upsertPlayerMatchStatsRepo(
      matchId,
      openingPlayers.nonStrikerId,
      battingTeam,
      2, // Opening non-striker gets batting order 2
    );

    // Create stats for opening bowler (bowling team)
    const bowlingTeam = battingTeam === TEAM.A ? TEAM.B : TEAM.A;
    await upsertPlayerMatchStatsRepo(
      matchId,
      openingPlayers.bowlerId,
      bowlingTeam,
      undefined, // Bowlers don't have batting order
    );
  }

  /**
   * 6️⃣ Update match
   */
  await updateMatchRepo(matchId, {
    status: MATCH_STATUS.LIVE,
    currentInnings: 1,
    startTime: new Date(),
  });

  // Return innings with opening bowler for frontend temporary state
  return inningsRecord;
};

export const changeBowlerService = async (
  inningsId: string,
  newBowlerId: string,
) => {
  const innings = await getInningsByIdRepo(inningsId);
  if (!innings) {
    throw new Error("Innings not found");
  }

  // Get current bowler to enforce ICC rule (no consecutive overs)
  const currentBowlerId = innings.currentBowlerId;
  if (currentBowlerId === newBowlerId) {
    throw new Error("Same bowler cannot bowl consecutive overs (ICC rule)");
  }

  // Create player stats for new bowler if not exists
  const bowlingTeam = innings.battingTeam === TEAM.A ? TEAM.B : TEAM.A;
  await upsertPlayerMatchStatsRepo(
    innings.matchId,
    newBowlerId,
    bowlingTeam,
    undefined, // Bowlers don't have batting order
  );

  // Update current bowler in innings
  await updateInningsCurrentPlayersRepo(
    inningsId,
    innings.currentStrikerId || innings.openingStrikerId || "",
    innings.currentNonStrikerId || innings.openingNonStrikerId || "",
    newBowlerId,
  );

  return { success: true, newBowlerId };
};

export const addBallService = async (matchId: string, data: any) => {
  const match = await getMatchByIdRepo(matchId);

  if (!match) throw new Error("Match not found");
  if (match.status === MATCH_STATUS.COMPLETED) {
    // COMPLETED
    throw new Error("Match already completed");
  }

  const innings = await getCurrentInningsRepo(
    matchId,
    match.currentInnings || 1,
  );

  if (!innings) throw new Error("No active innings");
  if (innings.status === INNINGS_STATUS.COMPLETED) {
    // COMPLETED
    throw new Error("Innings already completed");
  }
  if (innings.status === INNINGS_STATUS.UPCOMING) {
    // UPCOMING
    throw new Error(
      "Innings has not started yet. Please select opening players and start the innings.",
    );
  }

  /**
   * 1️⃣ Wicket validation if this is a wicket ball
   */
  if (data.isWicket) {
    const validation = await validateWicketScenario(matchId, innings.id, data);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
  }

  /**
   * 2️⃣ Current batsmen (SOURCE OF TRUTH)
   */
  const strikerId = innings.currentStrikerId || innings.openingStrikerId;

  const nonStrikerId =
    innings.currentNonStrikerId || innings.openingNonStrikerId;

  // Get current bowler from innings (backend-controlled)
  const currentBowlerId = innings.currentBowlerId;

  if (!strikerId || !nonStrikerId) {
    throw new Error("Current batsmen not set");
  }

  /**
   * 2️⃣ Over / ball calculation
   */
  const lastBall = await getLastBallRepo(matchId);

  let overNumber = 1;
  let ballNumber = 1;

  if (lastBall) {
    if (lastBall.ballNumber < 6) {
      overNumber = lastBall.overNumber;
      ballNumber = lastBall.ballNumber + 1;
    } else {
      overNumber = lastBall.overNumber + 1;
      ballNumber = 1;
    }
  }

  /**
   * 3️⃣ Extras & legality
   */
  const { extraType, extraRuns, batRuns, totalRuns, isLegalDelivery } =
    calculateExtras({
      runs: data.runs,
      isWide: data.isWide,
      isNoBall: data.isNoBall,
      isByes: data.isByes,
      isLegByes: data.isLegByes,
    });

  /**
   * 4️⃣ Save ball
   */
  const ball = await createBallRepo({
    matchId,
    inningsId: innings.id,
    overNumber,
    ballNumber,
    batsmanId: strikerId,
    bowlerId: currentBowlerId || data.bowlerId, // Use backend-controlled bowler
    runs: isLegalDelivery ? data.runs || 0 : 0,
    extraType,
    extraRuns,
    isWicket: data.isWicket || false,
    wicketType: data.wicketType || null,
    dismissedPlayerId: data.dismissedPlayerId || null,
    fielderId: data.fielderId || null,
    isLegalDelivery,
  });

  /**
   * 5️⃣ Update innings totals
   */
  await updateInningsTotalsRepo(
    innings.id,
    totalRuns,
    data.isWicket,
    isLegalDelivery,
  );

  /**
   * 5️⃣1️⃣ Update innings extras (O(1) performance for scoreboard)
   */
  await updateInningsExtrasRepo(innings.id, extraType, extraRuns);

  // 3️⃣ Batting stats
  const batsmanId = data.strikerId || data.batsmanId; // Handle both parameter names
  if (batsmanId) {
    const battingTeam = innings.battingTeam; // Get team from current innings
    await upsertPlayerMatchStatsRepo(matchId, batsmanId, battingTeam);

    await updateBattingStatsRepo(
      matchId,
      batsmanId,
      data.runs || 0,
      isLegalDelivery,
    );
  }

  // 3️⃣️⃣ Handle new batsman stats when wicket falls
  if (data.isWicket && data.newBatsmanId) {
    // Get next batting order for this innings
    const nextBattingOrder = await getNextBattingOrderRepo(
      matchId,
      innings.battingTeam,
    );

    await upsertPlayerMatchStatsRepo(
      matchId,
      data.newBatsmanId,
      innings.battingTeam,
      (nextBattingOrder ?? 0) + 1,
    );
  }

  if (data.isWicket && data.dismissedPlayerId && data.wicketType) {
    await upsertPlayerMatchStatsRepo(
      matchId,
      data.dismissedPlayerId,
      innings.battingTeam,
    );
    await setDismissalTypeRepo(matchId, data.dismissedPlayerId, data.wicketType);
  }

  // 3️⃣️⃣ Non-striker stats - ensure non-striker has stats record
  const recentBalls = await getLastBallsRepo(data.inningsId, 6);

  if (recentBalls.length === 0) {
    // First ball of innings - create both opening batsmen stats
    const inningsDetails = await getInningsByIdRepo(data.inningsId);
    if (
      inningsDetails?.openingStrikerId &&
      inningsDetails?.openingNonStrikerId
    ) {
      const battingTeam = innings.battingTeam;

      // Create stats for opening striker (batting order 1)
      await upsertPlayerMatchStatsRepo(
        matchId,
        inningsDetails.openingStrikerId,
        battingTeam,
        1, // Opening striker gets batting order 1
      );

      // Create stats for opening non-striker (batting order 2)
      await upsertPlayerMatchStatsRepo(
        matchId,
        inningsDetails.openingNonStrikerId,
        battingTeam,
        2, // Opening non-striker gets batting order 2
      );
    }
  } else {
    // Subsequent balls - find and create non-striker stats
    const lastBall = recentBalls[0];
    const strikerId = lastBall.batsmanId;

    // Find non-striker from recent balls
    let nonStrikerId: string | null = null;
    for (const ball of recentBalls) {
      if (ball.batsmanId !== strikerId) {
        nonStrikerId = ball.batsmanId;
        break;
      }
    }

    // If no non-striker found in recent balls, check innings opening players
    if (!nonStrikerId) {
      const inningsDetails = await getInningsByIdRepo(data.inningsId);
      if (
        inningsDetails?.openingNonStrikerId &&
        inningsDetails.openingNonStrikerId !== strikerId
      ) {
        nonStrikerId = inningsDetails.openingNonStrikerId;
      }
    }

    // Create non-striker stats record if found
    if (nonStrikerId) {
      const battingTeam = innings.battingTeam;
      await upsertPlayerMatchStatsRepo(matchId, nonStrikerId, battingTeam);
    }
  }

  // 4️⃣ Bowling stats
  if (currentBowlerId) {
    const bowlingTeam = innings.battingTeam === "A" ? "B" : "A"; // Opposite team
    await upsertPlayerMatchStatsRepo(matchId, currentBowlerId, bowlingTeam);

    await updateBowlingStatsRepo(
      matchId,
      currentBowlerId,
      totalRuns,
      data.isWicket,
      isLegalDelivery,
    );
  }

  /**
   * 6️⃣ Strike Rotation (ICC Production Logic)
   */
  const { nextStriker, nextNonStriker } = calculateNextStrike({
    strikerId,
    nonStrikerId,
    runs: totalRuns,
    isLegalDelivery,
    ballNumber,
    isWicket: data.isWicket,
    wicketType: data.wicketType,
    dismissedPlayerId: data.dismissedPlayerId,
    newBatsmanId: data.newBatsmanId,
    crossingOccurred: data.crossingOccurred || false,
  });

  // Update bowler at end of over
  if (ballNumber === 6 && isLegalDelivery) {
    // Over completed - keep same bowler for now
    // In production, you might want to allow bowler changes

    // Check for maiden over and update maidens
    if (currentBowlerId) {
      await updateMaidensRepo(matchId, currentBowlerId);
    }
  }

  await updateInningsCurrentPlayersRepo(
    innings.id,
    nextStriker,
    nextNonStriker,
    currentBowlerId || undefined, // Keep same bowler, convert null to undefined
  );

  /**
   * 7️⃣ Completion checks
   */
  await checkInningsCompletionService(matchId, innings.id);
  await checkMatchResultService(matchId);

  return ball;
};

export const undoLastBallService = async (matchId: string) => {
  // 1️⃣ Get current innings from match
  const match = await getMatchByIdRepo(matchId);
  if (!match) {
    throw new Error("Match not found");
  }

  const currentInningsNumber = match.currentInnings;
  const currentInnings = await getCurrentInningsRepo(matchId, currentInningsNumber);
  if (!currentInnings) {
    throw new Error("Current innings not found");
  }

  // 2️⃣ Get last ball of current innings (source of truth)
  const lastBall = await getLastBallsRepo(currentInnings.id, 1);
  if (!lastBall || lastBall.length === 0) {
    throw new Error("No balls to undo");
  }
  const ballToDelete = lastBall[0];

  // 3️⃣ Start database transaction
  // Note: In production, wrap all following operations in a proper DB transaction
  
  // 4️⃣ Delete the ball from balls table
  await deleteBallRepo(ballToDelete.id);

  // 5️⃣ Update innings aggregates by subtracting ball's impact
  const totalRuns = (ballToDelete.runs || 0) + (ballToDelete.extraRuns || 0);
  const ballsToSubtract = ballToDelete.isLegalDelivery ? 1 : 0;
  const wicketsToSubtract = ballToDelete.isWicket ? 1 : 0;

  await revertInningsTotalsRepo(
    currentInnings.id,
    totalRuns, // Pass positive runs to subtract
    ballToDelete.isWicket,
    ballToDelete.isLegalDelivery,
  );

  // Revert extras based on extra type and runs
  await revertInningsExtrasRepo(
    currentInnings.id,
    ballToDelete.extraType,
    ballToDelete.extraRuns || 0,
  );

  // 6️⃣ Revert player_match_stats according to deleted ball event
  if (ballToDelete.batsmanId) {
    // Revert batting stats for striker
    await revertBattingStatsRepo(
      matchId,
      ballToDelete.batsmanId,
      ballToDelete.runs || 0, // Pass runs to subtract
      ballToDelete.isLegalDelivery, // Pass legality for ball count adjustment
    );
  }

  if (ballToDelete.bowlerId) {
    // Revert bowling stats
    await revertBowlingStatsRepo(
      matchId,
      ballToDelete.bowlerId,
      totalRuns, // Pass total runs to subtract
      ballToDelete.isWicket, // Pass wicket flag
      ballToDelete.isLegalDelivery, // Pass legality for ball count
    );
  }

  if (ballToDelete.isWicket && ballToDelete.dismissedPlayerId) {
    await clearDismissalTypeRepo(matchId, ballToDelete.dismissedPlayerId);
  }

  // 7️⃣ Rebuild live match state by fetching new last ball
  const newLastBall = await getLastBallsRepo(currentInnings.id, 1);
  
  if (!newLastBall || newLastBall.length === 0) {
    // No balls exist - reset to opening state
    await updateInningsCurrentPlayersRepo(
      currentInnings.id,
      currentInnings.openingStrikerId || '',
      currentInnings.openingNonStrikerId || '',
      currentInnings.openingBowlerId || undefined, // Use opening bowler
    );
  } else {
    const remainingBall = newLastBall[0];
    
    // Determine correct non-striker by analyzing ball sequence
    const recentBalls = await getLastBallsRepo(currentInnings.id, 6);
    let strikerId = currentInnings.openingStrikerId;
    let nonStrikerId = currentInnings.openingNonStrikerId;
    
    // Simulate through all balls to find correct state after remainingBall
    for (const ball of recentBalls) {
      if (ball.id === remainingBall.id) {
        // This is our remaining ball - stop here
        break;
      }
      
      // Calculate strike rotation for this ball
      if (ball.batsmanId === strikerId && ball.isLegalDelivery) {
        if (ball.runs % 2 === 1) {
          // Odd runs (1, 3, 5) - strike changes
          [strikerId, nonStrikerId] = [nonStrikerId, strikerId];
        }
      }
      
      // Update striker for next ball
      strikerId = ball.batsmanId;
    }
    
    // Recompute striker/non-striker using strike engine with correct non-striker
    const nextStrike = calculateNextStrike({
      runs: remainingBall.runs || 0,
      isLegalDelivery: remainingBall.isLegalDelivery,
      strikerId: remainingBall.batsmanId,
      nonStrikerId: nonStrikerId || currentInnings.openingNonStrikerId || '',
      ballNumber: remainingBall.ballNumber,
      isWicket: remainingBall.isWicket,
    });

    await updateInningsCurrentPlayersRepo(
      currentInnings.id,
      nextStrike.nextStriker,
      nextStrike.nextNonStriker,
      remainingBall.bowlerId,
    );
  }

  // 8️⃣ Revert statuses if undone ball had completed over/innings/match
  const updatedInnings = await getInningsByIdRepo(currentInnings.id);
  if (updatedInnings) {
    // Check if innings was completed and should be reopened
    if (updatedInnings.status === INNINGS_STATUS.COMPLETED) {
      const ballsInInnings = updatedInnings.totalBalls;
      const maxBalls = (match.overs || 20) * 6; // Default 20 overs
      
      if (ballsInInnings < maxBalls) {
        // Reopen innings if not actually complete
        await updateInningsStatusRepo(currentInnings.id, INNINGS_STATUS.LIVE);
      }
    }
  }

  // Check if match was completed and should be reopened
  if (match.status === MATCH_STATUS.COMPLETED) {
    const hasRemainingBalls = newLastBall && newLastBall.length > 0;
    if (hasRemainingBalls) {
      // Reopen match if balls remain
      await updateMatchRepo(matchId, {
        status: MATCH_STATUS.LIVE,
      });
    }
  }

  // 9️⃣ Return comprehensive undo result
  return {
    undoneBall: ballToDelete,
    newLiveState: await buildLiveScoreDetails(currentInnings.id),
    message: "Last ball undone successfully",
  };
};

export const endInningsService = async (matchId: string) => {
  const match = await getMatchByIdRepo(matchId);

  if (!match) {
    throw new Error("Match not found");
  }

  const currentInningsNumber = match.currentInnings;

  const currentInnings = await getCurrentInningsRepo(
    matchId,
    currentInningsNumber,
  );

  if (!currentInnings) {
    throw new Error("Innings not found");
  }

  // Mark current innings completed
  await updateInningsStatusRepo(currentInnings.id, INNINGS_STATUS.COMPLETED); // COMPLETED

  /**
   * If first innings → start second
   */
  if (currentInningsNumber === 1) {
    const nextBattingTeam =
      currentInnings.battingTeam === TEAM.A ? TEAM.B : TEAM.A;

    // Create second innings with UPCOMING status
    const secondInnings = await createInningsRepo({
      matchId,
      inningsNumber: 2,
      battingTeam: nextBattingTeam,
      status: INNINGS_STATUS.UPCOMING,
    });

    await updateMatchRepo(matchId, {
      currentInnings: 2,
    });

    return {
      message: "First innings completed, second innings ready",
      innings: secondInnings,
    };
  }

  /**
   * If second innings → check result
   */
  await checkMatchResultService(matchId);

  return {
    message: "Match completed",
  };
};

export const getMatchScoreService = async (matchId: string) => {
  matchServiceLogger.fetching("match score", matchId);

  const match = await getMatchWithInningsRepo(matchId);

  if (!match) {
    matchServiceLogger.error(
      "fetching match score",
      new Error("Match not found"),
      { matchId },
    );
    throw new Error("Match not found");
  }

  matchServiceLogger.found("match", match, { matchId });

  const innings = match.innings.map((i) => {
    // Compute extras breakdown from individual fields
    const wideRuns = i.wideRuns || 0;
    const noBallRuns = i.noBallRuns || 0;
    const byeRuns = i.byeRuns || 0;
    const legByeRuns = i.legByeRuns || 0;
    const totalExtras = wideRuns + noBallRuns + byeRuns + legByeRuns;

    return {
      id: i.id,
      inningsNumber: i.inningsNumber,
      battingTeam: i.battingTeam,
      totalRuns: i.totalRuns,
      totalWickets: i.totalWickets,
      totalOvers: ballsToOvers(i.totalBalls),
      status: i.status,
      extras: {
        wide: wideRuns,
        noBall: noBallRuns,
        bye: byeRuns,
        legBye: legByeRuns,
        total: totalExtras,
      },
    };
  });

  /**
   * Run Rate / Target Logic (your existing)
   */
  const firstInnings = match.innings.find((i) => i.inningsNumber === 1);
  const secondInnings = match.innings.find((i) => i.inningsNumber === 2);

  let target: number | null = null;
  let currentRunRate = 0;
  let requiredRuns: number | null = null;
  let requiredBalls: number | null = null;
  let requiredRunRate: number | null = null;

  if (match.currentInnings === 1 && firstInnings) {
    currentRunRate = calculateRunRate(
      firstInnings.totalRuns,
      firstInnings.totalBalls,
    );
  }

  if (match.currentInnings === 2 && firstInnings && secondInnings) {
    const computedTarget = firstInnings.totalRuns + 1;
    target = computedTarget;

    currentRunRate = calculateRunRate(
      secondInnings.totalRuns,
      secondInnings.totalBalls,
    );

    const totalMatchBalls = match.overs * 6;

    requiredRuns = Math.max(computedTarget - secondInnings.totalRuns, 0);
    requiredBalls = Math.max(totalMatchBalls - secondInnings.totalBalls, 0);

    requiredRunRate =
      requiredBalls > 0
        ? Number(((requiredRuns / requiredBalls) * 6).toFixed(2))
        : 0;
  }

  let live = null;

  if (match.status === MATCH_STATUS.LIVE) {
    // LIVE
    const currentInnings = match.innings.find(
      (i) => i.inningsNumber === match.currentInnings,
    );

    if (currentInnings) {
      live = await buildLiveScoreDetails(currentInnings.id);
    }
  }

  /**
   * ⭐ RESULT TEXT
   */
  let result: string | null = null;

  if (match.status === MATCH_STATUS.COMPLETED) {
    // COMPLETED
    if (match.resultType === RESULT_TYPE.TIE) {
      // TIE
      result = "Match tied";
    } else if (match.winner) {
      const winnerName =
        match.winner === TEAM.A ? match.teamAName : match.teamBName;

      let unit: string;
      if (match.resultType === RESULT_TYPE.RUNS) {
        // RUNS
        unit = match.resultMargin === 1 ? "run" : "runs";
      } else if (match.resultType === RESULT_TYPE.WICKETS) {
        // WICKETS
        unit = match.resultMargin === 1 ? "wicket" : "wickets";
      } else {
        unit = "runs"; // fallback
      }

      result = `${winnerName} won by ${match.resultMargin} ${unit}`;
    }
  }

  /**
   * ⭐ MAN OF THE MATCH
   */
  let manOfTheMatch: any = null;

  if (match.manOfTheMatchPlayerId) {
    const player = await getPlayerByIdRepo(match.manOfTheMatchPlayerId);

    if (player) {
      manOfTheMatch = {
        id: player.id,
        name: player.name,
      };
    }
  }

  return {
    matchId: match.id,
    status: match.status,
    currentInnings: match.currentInnings,
    teamAName: match.teamAName,
    teamBName: match.teamBName,
    overs: match.overs,

    // Toss information
    tossWinner: match.tossWinner,
    tossDecision: match.tossDecision,

    target,
    currentRunRate,
    requiredRuns,
    requiredBalls,
    requiredRunRate,

    // ⭐ New fields
    result,
    winner: match.winner,
    winType: match.resultType,
    margin: match.resultMargin,
    manOfTheMatch,

    innings,

    live,
  };
};

export const checkMatchResultService = async (matchId: string) => {
  const match = await getMatchWithInningsRepo(matchId);
  if (!match) throw new Error("Match not found");

  // Only during second innings
  if (match.currentInnings !== 2) return;

  const firstInnings = match.innings.find((i) => i.inningsNumber === 1);
  const secondInnings = match.innings.find((i) => i.inningsNumber === 2);

  if (!firstInnings || !secondInnings) return;

  // Already completed
  if (secondInnings.status === INNINGS_STATUS.COMPLETED) return;

  const oversLimitBalls = match.overs * 6;
  const target = firstInnings.totalRuns + 1;

  const runs = secondInnings.totalRuns || 0;
  const balls = secondInnings.totalBalls || 0;
  const wickets = secondInnings.totalWickets || 0;
  const playersPerTeam = match.playersPerTeam || 11;

  let isCompleted = false;

  // Case 1: Target achieved
  if (runs >= target) {
    isCompleted = true;
  }
  // Case 2: Overs finished or all out
  else if (balls >= oversLimitBalls || wickets >= playersPerTeam - 1) {
    isCompleted = true;
  }

  if (!isCompleted) return;

  // Complete innings
  await updateInningsStatusRepo(secondInnings.id, INNINGS_STATUS.COMPLETED);

  // Calculate result
  const { winner, resultType, margin } = calculateMatchOutcome(
    match,
    firstInnings.totalRuns,
    secondInnings,
  );

  // Man of the Match
  const manOfTheMatchPlayerId = await calculateManOfTheMatch(matchId);

  const updateData: any = {
    status: MATCH_STATUS.COMPLETED, // COMPLETED
    endTime: new Date(),
    winner,
    resultType,
    resultMargin: margin,
  };

  if (manOfTheMatchPlayerId) {
    updateData.manOfTheMatchPlayerId = manOfTheMatchPlayerId;
  }

  await updateMatchRepo(matchId, updateData);
};

const calculateManOfTheMatch = async (matchId: string) => {
  const stats = await getMatchPlayerStatsRepo(matchId);

  if (!stats.length) return null;

  let bestPlayerId: string | null = null;
  let bestScore = -1;

  for (const s of stats) {
    let score = 0;

    // Batting impact
    score += s.runs;
    score += s.fours;
    score += s.sixes * 2;

    // Bowling impact
    score += s.wickets * 25;

    if (s.ballsBowled > 0) {
      const economy = (s.runsConceded / s.ballsBowled) * 6;
      if (economy < 6) score += 10;
    }

    if (score > bestScore) {
      bestScore = score;
      bestPlayerId = s.playerId;
    }
  }

  // Verify the player exists in the players table
  if (bestPlayerId) {
    const player = await getPlayerByIdRepo(bestPlayerId);
    if (!player) {
      console.warn(
        `Man of the match player ${bestPlayerId} not found in players table`,
      );
      return null;
    }
  }

  return bestPlayerId;
};

export const checkInningsCompletionService = async (
  matchId: string,
  inningsId: string,
) => {
  const match = await getMatchByIdRepo(matchId);
  if (!match) throw new Error("Match not found");

  const innings = await getCurrentInningsRepo(matchId, match.currentInnings);
  if (!innings) return;

  // Already completed
  if (innings.status === INNINGS_STATUS.COMPLETED) return; // COMPLETED

  // Get match players to determine players per team
  const playersPerTeam = match.playersPerTeam || 11; // Default to 11 if not specified

  const totalWickets = innings.totalWickets || 0;

  /**
   * 1️⃣ All-out condition: All batsmen dismissed
   */
  if (totalWickets >= playersPerTeam - 1) {
    await completeInningsAndHandleNext(matchId, innings);
    return;
  }

  /**
   * 2️⃣ Overs limit condition: Legal balls completed
   */
  const maxLegalBalls = match.overs * 6;
  if (innings.totalBalls >= maxLegalBalls) {
    await completeInningsAndHandleNext(matchId, innings);
    return;
  }

  /**
   * 3️⃣ Target chase condition (Second innings only)
   */
  if (innings.inningsNumber === 2) {
    const firstInnings = await getInningsByNumberRepo(matchId, 1);
    if (!firstInnings) return;

    const firstInningsRuns = firstInnings.totalRuns || 0;
    const currentInningsRuns = innings.totalRuns || 0;

    if (currentInningsRuns > firstInningsRuns) {
      // Target achieved - complete innings and match
      await updateInningsStatusRepo(innings.id, INNINGS_STATUS.COMPLETED); // COMPLETED

      // Determine match result
      let matchStatus: "COMPLETED" | "TIED" = "COMPLETED";
      if (currentInningsRuns === firstInningsRuns) {
        matchStatus = "TIED";
      }

      let winner: string | null = null;
      let resultType: ResultType | null = null;
      let margin: number | null = null;

      if (currentInningsRuns > firstInningsRuns) {
        winner = innings.battingTeam;
        // Check if won by wickets (reached target with wickets remaining)
        const wicketsFallen = innings.totalWickets || 0;
        const playersPerTeam = match.playersPerTeam || 11;
        const wicketsRemaining = playersPerTeam - 1 - wicketsFallen;

        if (wicketsRemaining > 0) {
          resultType = RESULT_TYPE.WICKETS; // WICKETS
          margin = wicketsRemaining;
        } else {
          resultType = RESULT_TYPE.RUNS; // RUNS
          margin = currentInningsRuns - firstInningsRuns;
        }
      } else {
        winner = firstInnings.battingTeam;
        resultType = RESULT_TYPE.RUNS; // RUNS
        margin = firstInningsRuns - currentInningsRuns;
      }

      // Calculate Man of the Match
      const manOfTheMatchPlayerId = await calculateManOfTheMatch(matchId);

      // Prepare match update data
      const matchUpdateData: any = {
        status:
          matchStatus === "COMPLETED"
            ? MATCH_STATUS.COMPLETED
            : MATCH_STATUS.LIVE, // COMPLETED or LIVE
        endTime: new Date(),
        winner,
        resultType,
        resultMargin: margin,
      };

      // Only add manOfTheMatchPlayerId if it exists and is valid
      if (manOfTheMatchPlayerId) {
        matchUpdateData.manOfTheMatchPlayerId = manOfTheMatchPlayerId;
      }

      await updateMatchRepo(matchId, matchUpdateData);

      return;
    }
  }

  /**
   * 4️⃣ Match tie/limit condition: Second innings balls exhausted
   */
  if (innings.inningsNumber === 2 && innings.totalBalls >= maxLegalBalls) {
    const firstInnings = await getInningsByNumberRepo(matchId, 1);
    if (!firstInnings) return;

    const firstInningsRuns = firstInnings.totalRuns || 0;
    const currentInningsRuns = innings.totalRuns || 0;

    // Complete innings and determine match result
    await updateInningsStatusRepo(innings.id, INNINGS_STATUS.COMPLETED); // COMPLETED

    let matchStatus: "COMPLETED" | "TIED" = "COMPLETED";
    if (currentInningsRuns === firstInningsRuns) {
      matchStatus = "TIED";
    }

    let winner: string | null = null;
    let resultType: string | null = null;
    let margin: number | null = null;

    if (currentInningsRuns > firstInningsRuns) {
      winner = innings.battingTeam;
      // Check if won by wickets (reached target with wickets remaining)
      const wicketsFallen = innings.totalWickets || 0;
      const playersPerTeam = match.playersPerTeam || 11;
      const wicketsRemaining = playersPerTeam - 1 - wicketsFallen;

      if (wicketsRemaining > 0) {
        resultType = RESULT_TYPE.WICKETS; // WICKETS
        margin = wicketsRemaining;
      } else {
        resultType = RESULT_TYPE.RUNS; // RUNS
        margin = currentInningsRuns - firstInningsRuns;
      }
    } else {
      winner = firstInnings.battingTeam;
      resultType = RESULT_TYPE.RUNS; // RUNS
      margin = firstInningsRuns - currentInningsRuns;
    }

    // Calculate Man of the Match
    const manOfTheMatchPlayerId = await calculateManOfTheMatch(matchId);

    // Prepare match update data
    const matchUpdateData: any = {
      status:
        matchStatus === "COMPLETED"
          ? MATCH_STATUS.COMPLETED
          : MATCH_STATUS.LIVE, // COMPLETED or LIVE
      endTime: new Date(),
      winner,
      resultType,
      resultMargin: margin,
    };

    // Only add manOfTheMatchPlayerId if it exists and is valid
    if (manOfTheMatchPlayerId) {
      matchUpdateData.manOfTheMatchPlayerId = manOfTheMatchPlayerId;
    }

    await updateMatchRepo(matchId, matchUpdateData);

    return;
  }

  /**
   * 5️⃣ Manual termination: Check for manual completion flag
   * This can be triggered by admin API or retirement scenarios
   */
  // Note: Manual termination would be handled by a separate API endpoint
  // This function focuses on automatic completion conditions only

  // If none of the completion conditions are met, innings continues
  return;
};

/**
 * Helper function to complete innings and handle next steps
 */
const completeInningsAndHandleNext = async (
  matchId: string,
  currentInnings: any,
) => {
  await updateInningsStatusRepo(currentInnings.id, INNINGS_STATUS.COMPLETED);

  const match = await getMatchWithInningsRepo(matchId);
  if (!match) return;

  // FIRST INNINGS → create 2nd as UPCOMING
  if (currentInnings.inningsNumber === 1) {
    const nextBattingTeam =
      currentInnings.battingTeam === TEAM.A ? TEAM.B : TEAM.A;

    await createInningsRepo({
      matchId,
      inningsNumber: 2,
      battingTeam: nextBattingTeam,
      status: INNINGS_STATUS.UPCOMING, // UPCOMING
    });

    await updateMatchRepo(matchId, {
      currentInnings: 2,
    });

    return;
  }

  // SECOND INNINGS → match result
  const firstInnings = match.innings.find((i: any) => i.inningsNumber === 1);

  if (!firstInnings) return;

  const { winner, resultType, margin } = calculateMatchOutcome(
    match,
    firstInnings.totalRuns,
    currentInnings,
  );

  const manOfTheMatchPlayerId = await calculateManOfTheMatch(matchId);

  const updateData: any = {
    status: MATCH_STATUS.COMPLETED,
    endTime: new Date(),
    winner,
    resultType,
    resultMargin: margin,
  };

  if (manOfTheMatchPlayerId) {
    updateData.manOfTheMatchPlayerId = manOfTheMatchPlayerId;
  }

  await updateMatchRepo(matchId, updateData);
};

const buildLiveScoreDetails = async (inningsId: string) => {
  const innings = await getInningsByIdRepo(inningsId);
  if (!innings) return null;

  /**
   * 1️⃣ Current players (SOURCE OF TRUTH)
   */
  const strikerId = innings.currentStrikerId || innings.openingStrikerId;

  const nonStrikerId =
    innings.currentNonStrikerId || innings.openingNonStrikerId;

  /**
   * 2️⃣ Recent balls
   */
  const recentBallsData = await getLastBallsRepo(inningsId, 18); // enough for 3 overs

  let bowlerId = innings.currentBowlerId;

  if (!bowlerId && recentBallsData.length) {
    bowlerId = recentBallsData[0].bowlerId;
  }

  let recentBalls: string[] = [];
  let isOverCompleted = false;

  if (recentBallsData.length) {
    // Normalize DB data
    const normalizedBalls = recentBallsData.map((ball) => ({
      overNumber: ball.overNumber,
      runs: ball.runs || 0,
      extraType: ball.extraType,
      extraRuns: ball.extraRuns ?? 0,
      isWicket: ball.isWicket,
      isLegalDelivery: ball.isLegalDelivery,
    }));

    const formattedResult = formatRecentBalls(normalizedBalls);
    recentBalls = formattedResult.formatted;

    /**
     * 3️⃣ Over completion logic
     * Production-grade: Use innings.totalBalls % 6 === 0
     * totalBalls only increments for legal deliveries
     */
    isOverCompleted = innings.totalBalls > 0 && innings.totalBalls % 6 === 0;

    // Debug logging (can be removed in production)
    console.log("=== DEBUG: Over Completion Logic ===");
    console.log("Innings Total Balls (legal only):", innings.totalBalls);
    console.log("Is Over Completed:", isOverCompleted);
    console.log("Recent Balls:", recentBalls);
  }

  /**
   * 4️⃣ Player details
   */
  const playerIds = [strikerId, nonStrikerId, bowlerId].filter(
    Boolean,
  ) as string[];

  const players = await getPlayersByIdsRepo(playerIds);
  const playerMap: Record<string, any> = Object.fromEntries(
    players.map((p) => [p.id, p]),
  );

  /**
   * 5️⃣ Match stats
   */
  const stats = await getMatchPlayerStatsRepo(innings.matchId);
  const statsMap: Record<string, any> = Object.fromEntries(
    stats.map((s) => [s.playerId, s]),
  );

  const striker =
    strikerId && statsMap[strikerId]
      ? {
          id: strikerId,
          name: playerMap[strikerId]?.name,
          runs: statsMap[strikerId].runs,
          balls: statsMap[strikerId].ballsFaced,
          dotsFaced: statsMap[strikerId].dotsFaced,
          fours: statsMap[strikerId].fours,
          sixes: statsMap[strikerId].sixes,
        }
      : null;

  const nonStriker =
    nonStrikerId && statsMap[nonStrikerId]
      ? {
          id: nonStrikerId,
          name: playerMap[nonStrikerId]?.name,
          runs: statsMap[nonStrikerId].runs,
          balls: statsMap[nonStrikerId].ballsFaced,
          dotsFaced: statsMap[nonStrikerId].dotsFaced,
          fours: statsMap[nonStrikerId].fours,
          sixes: statsMap[nonStrikerId].sixes,
        }
      : null;

  const bowler = bowlerId
    ? {
        id: bowlerId,
        name: playerMap[bowlerId]?.name,
        overs: statsMap[bowlerId]
          ? ballsToOvers(statsMap[bowlerId].ballsBowled)
          : "0.0",
        runs: statsMap[bowlerId]?.runsConceded || 0,
        wickets: statsMap[bowlerId]?.wickets || 0,
        dotsBowled: statsMap[bowlerId]?.dotsBowled || 0,
        maidens: statsMap[bowlerId]?.maidens || 0,
      }
    : null;

  return {
    striker,
    nonStriker,
    bowler,
    recentBalls,
    isOverCompleted,
  };
};

const calculateMatchOutcome = (
  match: any,
  firstInningsRuns: number,
  secondInnings: any,
) => {
  const playersPerTeam = match.playersPerTeam || 11;
  const wicketsFallen = secondInnings.totalWickets || 0;
  const runs = secondInnings.totalRuns || 0;

  const target = firstInningsRuns + 1;

  let winner: Team | null = null;
  let resultType: ResultType | null = null;
  let margin: number | null = null;

  // Chase successful
  if (runs >= target) {
    winner = secondInnings.battingTeam;

    const wicketsRemaining = playersPerTeam - 1 - wicketsFallen;

    resultType = RESULT_TYPE.WICKETS; // WICKETS
    margin = wicketsRemaining;
  }
  // Target not reached
  else if (runs < firstInningsRuns) {
    winner = match.innings.find((i: any) => i.inningsNumber === 1)?.battingTeam;

    resultType = RESULT_TYPE.RUNS; // RUNS
    margin = firstInningsRuns - runs;
  }
  // Tie
  else {
    winner = null;
    resultType = RESULT_TYPE.TIE; // TIE
    margin = 0;
  }

  return { winner, resultType, margin };
};
