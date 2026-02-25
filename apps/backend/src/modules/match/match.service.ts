import { ballsToOvers, calculateRunRate } from "../../utils/cricket";
import { hasUsedAccessCodeForMatchRepo } from "../access-code/access-code.repository";
import { getLastBallsRepo } from "../ball/balls.repository";
import { matchServiceLogger } from "../../utils/business-logger";
import {
  getMatchPlayerStatsRepo,
  getPlayerByIdRepo,
  getPlayersByIdsRepo,
  updateBattingStatsRepo,
  updateBowlingStatsRepo,
  updateMaidensRepo,
  upsertPlayerMatchStatsRepo,
  getNextBattingOrderRepo,
} from "../player/player.repository";
import {
  addMatchPlayersRepo,
  completeMatchRepo,
  createBallRepo,
  createInningsRepo,
  createMatchRepo,
  deleteBallRepo,
  getCurrentInningsRepo,
  getInningsByIdRepo,
  getLastBallRepo,
  getMatchByIdRepo,
  getMatchPlayersRepo,
  getInningsByNumberRepo,
  getMatchWithInningsRepo,
  getMatchesByTurfRepo,
  revertInningsTotalsRepo,
  updateInningsCurrentPlayersRepo,
  updateInningsOpeningPlayersRepo,
  updateInningsStatusRepo,
  updateInningsTotalsRepo,
  updateMatchRepo,
} from "./match.repository";
import {
  inningsStatusEnum,
  matchStatusEnum,
  resultTypeEnum,
} from "../../db/schema/enums";
import { getMatchesWithoutActiveCodesService } from "../access-code/access-code.service";
import { calculateNextStrike } from "../../utils/strike.engine";
import { calculateExtras } from "../../utils/extra.engine";
import { formatRecentBalls } from "../../utils/ball-display";
import {
  validateWicketScenario,
  WicketValidationData,
} from "../wicket/wicket.validation.service";

export const createMatchService = async (turfId: string, data: any) => {
  const match = await createMatchRepo({
    turfId,
    teamAName: data.teamAName,
    teamBName: data.teamBName,
    overs: data.overs,
    venue: data.venue,
    tossWinner: data.tossWinner,
    tossDecision: data.tossDecision,
    status: matchStatusEnum.enumValues[0], // UPCOMING (index 1 in ["UPCOMING", "LIVE", "COMPLETED"])
    playersPerTeam: data.playersPerTeam || 11, // Default to 11 players per team
  });

  return match;
};

export const getMatchesService = async (turfId: string) => {
  const allMatches = await getMatchesByTurfRepo(turfId);
  return getMatchesWithoutActiveCodesService(allMatches);
};

export const addMatchPlayersService = async (
  matchId: string,
  players: any[],
) => {
  const records = players.map((p) => ({
    matchId,
    playerId: p.playerId,
    team: p.team,
  }));

  return addMatchPlayersRepo(records);
};

export const getMatchPlayersService = async (matchId: string) => {
  return getMatchPlayersRepo(matchId);
};

export const startSecondInningsService = async (
  matchId: string,
  openingPlayers: {
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

  if (match.status === matchStatusEnum.enumValues[0]) {
    // UPCOMING
    throw new Error("Match has not started yet");
  }

  if (match.status === matchStatusEnum.enumValues[2]) {
    // COMPLETED
    throw new Error("Match already completed");
  }

  /**
   * 2️⃣ Get second innings (should exist with UPCOMING status)
   */
  const secondInnings = await getCurrentInningsRepo(matchId, 2);

  if (!secondInnings) {
    throw new Error("Second innings not found");
  }

  if (secondInnings.status !== inningsStatusEnum.enumValues[0]) {
    // Not UPCOMING
    throw new Error("Second innings has already started");
  }

  /**
   * 3️⃣ Update second innings to LIVE with opening players
   */
  await updateInningsOpeningPlayersRepo(
    secondInnings.id,
    openingPlayers.strikerId,
    openingPlayers.nonStrikerId,
    openingPlayers.bowlerId,
  );

  await updateInningsStatusRepo(
    secondInnings.id,
    inningsStatusEnum.enumValues[1],
  ); // LIVE

  /**
   * 4️⃣ Create player stats for opening players
   */
  const battingTeam = secondInnings.battingTeam;

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
  const bowlingTeam = battingTeam === "A" ? "B" : "A";
  await upsertPlayerMatchStatsRepo(
    matchId,
    openingPlayers.bowlerId,
    bowlingTeam,
    undefined, // Bowlers don't have batting order
  );

  return secondInnings;
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

  if (match.status === matchStatusEnum.enumValues[1]) {
    // LIVE
    throw new Error("Match already started");
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
  let battingTeam: "A" | "B";

  if (match.tossDecision === "BAT") {
    battingTeam = match.tossWinner as "A" | "B";
  } else {
    battingTeam = match.tossWinner === "A" ? "B" : "A";
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
    currentStrikerId: openingPlayers?.strikerId,
    currentNonStrikerId: openingPlayers?.nonStrikerId,
    currentBowlerId: openingPlayers?.bowlerId,
    status: inningsStatusEnum.enumValues[1], // LIVE
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
    const bowlingTeam = battingTeam === "A" ? "B" : "A";
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
    status: matchStatusEnum.enumValues[1], // LIVE
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
  const bowlingTeam = innings.battingTeam === "A" ? "B" : "A";
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
  if (match.status === matchStatusEnum.enumValues[2]) {
    // COMPLETED
    throw new Error("Match already completed");
  }

  const innings = await getCurrentInningsRepo(
    matchId,
    match.currentInnings || 1,
  );

  if (!innings) throw new Error("No active innings");
  if (innings.status === inningsStatusEnum.enumValues[2]) {
    // COMPLETED
    throw new Error("Innings already completed");
  }
  if (innings.status === inningsStatusEnum.enumValues[0]) {
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
  const ball = await getLastBallRepo(matchId);

  if (!ball) {
    throw new Error("No balls to undo");
  }

  const totalRuns = (ball.runs || 0) + (ball.extraRuns || 0);

  // Delete ball
  await deleteBallRepo(ball.id);

  // Revert innings totals
  await revertInningsTotalsRepo(
    ball.inningsId,
    totalRuns,
    ball.isWicket,
    ball.isLegalDelivery,
  );

  return ball;
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
  await updateInningsStatusRepo(
    currentInnings.id,
    inningsStatusEnum.enumValues[2],
  ); // COMPLETED

  /**
   * If first innings → start second
   */
  if (currentInningsNumber === 1) {
    const nextBattingTeam = currentInnings.battingTeam === "A" ? "B" : "A";

    const secondInnings = await createInningsRepo({
      matchId,
      inningsNumber: 2,
      battingTeam: nextBattingTeam,
      status: inningsStatusEnum.enumValues[1],
    });

    await updateMatchRepo(matchId, {
      currentInnings: 2,
    });

    return {
      message: "Second innings started",
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

  const innings = match.innings.map((i) => ({
    id: i.id,
    inningsNumber: i.inningsNumber,
    battingTeam: i.battingTeam,
    totalRuns: i.totalRuns,
    totalWickets: i.totalWickets,
    totalOvers: ballsToOvers(i.totalBalls),
    status: i.status,
  }));

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
    target = firstInnings.totalRuns + 1;

    currentRunRate = calculateRunRate(
      secondInnings.totalRuns,
      secondInnings.totalBalls,
    );

    const totalMatchBalls = match.overs * 6;

    requiredRuns = Math.max(target - secondInnings.totalRuns, 0);
    requiredBalls = Math.max(totalMatchBalls - secondInnings.totalBalls, 0);

    requiredRunRate =
      requiredBalls > 0
        ? Number(((requiredRuns / requiredBalls) * 6).toFixed(2))
        : 0;
  }

  let live = null;

  if (match.status === matchStatusEnum.enumValues[1]) {
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

  if (match.status === matchStatusEnum.enumValues[2]) {
    // COMPLETED
    if (match.resultType === resultTypeEnum.enumValues[2]) {
      // TIE
      result = "Match tied";
    } else if (match.winner) {
      const winnerName =
        match.winner === "A" ? match.teamAName : match.teamBName;

      let unit: string;
      if (match.resultType === resultTypeEnum.enumValues[0]) {
        // RUNS
        unit = match.resultMargin === 1 ? "run" : "runs";
      } else if (match.resultType === resultTypeEnum.enumValues[1]) {
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
  if (secondInnings.status === inningsStatusEnum.enumValues[2]) return;

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
  await updateInningsStatusRepo(
    secondInnings.id,
    inningsStatusEnum.enumValues[2],
  );

  // Calculate result
  const { winner, resultType, margin } = calculateMatchOutcome(
    match,
    firstInnings.totalRuns,
    secondInnings,
  );

  // Man of the Match
  const manOfTheMatchPlayerId = await calculateManOfTheMatch(matchId);

  const updateData: any = {
    status: matchStatusEnum.enumValues[2], // COMPLETED
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
  if (innings.status === inningsStatusEnum.enumValues[2]) return; // COMPLETED

  // Get match players to determine players per team
  const matchPlayers = await getMatchPlayersRepo(matchId);
  const playersPerTeam = match.playersPerTeam || 11; // Default to 11 if not specified

  // Get team-specific players
  const battingTeamPlayers = matchPlayers.filter(
    (player: any) => player.team === innings.battingTeam,
  );
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
      await updateInningsStatusRepo(
        innings.id,
        inningsStatusEnum.enumValues[2],
      ); // COMPLETED

      // Determine match result
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
          resultType = resultTypeEnum.enumValues[1]; // WICKETS
          margin = wicketsRemaining;
        } else {
          resultType = resultTypeEnum.enumValues[0]; // RUNS
          margin = currentInningsRuns - firstInningsRuns;
        }
      } else {
        winner = firstInnings.battingTeam;
        resultType = resultTypeEnum.enumValues[0]; // RUNS
        margin = firstInningsRuns - currentInningsRuns;
      }

      // Calculate Man of the Match
      const manOfTheMatchPlayerId = await calculateManOfTheMatch(matchId);

      // Prepare match update data
      const matchUpdateData: any = {
        status: matchStatusEnum.enumValues[matchStatus === "COMPLETED" ? 2 : 1], // COMPLETED or LIVE
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
    await updateInningsStatusRepo(innings.id, inningsStatusEnum.enumValues[2]); // COMPLETED

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
        resultType = resultTypeEnum.enumValues[1]; // WICKETS
        margin = wicketsRemaining;
      } else {
        resultType = resultTypeEnum.enumValues[0]; // RUNS
        margin = currentInningsRuns - firstInningsRuns;
      }
    } else {
      winner = firstInnings.battingTeam;
      resultType = resultTypeEnum.enumValues[0]; // RUNS
      margin = firstInningsRuns - currentInningsRuns;
    }

    // Calculate Man of the Match
    const manOfTheMatchPlayerId = await calculateManOfTheMatch(matchId);

    // Prepare match update data
    const matchUpdateData: any = {
      status: matchStatusEnum.enumValues[matchStatus === "COMPLETED" ? 2 : 1], // COMPLETED or LIVE
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
  await updateInningsStatusRepo(
    currentInnings.id,
    inningsStatusEnum.enumValues[2],
  );

  const match = await getMatchWithInningsRepo(matchId);
  if (!match) return;

  // FIRST INNINGS → create 2nd as UPCOMING
  if (currentInnings.inningsNumber === 1) {
    const nextBattingTeam = currentInnings.battingTeam === "A" ? "B" : "A";

    await createInningsRepo({
      matchId,
      inningsNumber: 2,
      battingTeam: nextBattingTeam,
      status: inningsStatusEnum.enumValues[0], // UPCOMING
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
    status: matchStatusEnum.enumValues[2],
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
     * Check if the most recent over has 6 legal deliveries
     */
    const latestOverNumber = Math.max(
      ...normalizedBalls.map((b) => b.overNumber),
    );

    const legalBallsInLatestOver = normalizedBalls.filter(
      (b) => b.overNumber === latestOverNumber && b.isLegalDelivery,
    ).length;

    isOverCompleted = legalBallsInLatestOver >= 6;
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

  let winner: "A" | "B" | null = null;
  let resultType: string | null = null;
  let margin: number | null = null;

  // Chase successful
  if (runs >= target) {
    winner = secondInnings.battingTeam;

    const wicketsRemaining = playersPerTeam - 1 - wicketsFallen;

    resultType = resultTypeEnum.enumValues[1]; // WICKETS
    margin = wicketsRemaining;
  }
  // Target not reached
  else if (runs < firstInningsRuns) {
    winner = match.innings.find((i: any) => i.inningsNumber === 1)?.battingTeam;

    resultType = resultTypeEnum.enumValues[0]; // RUNS
    margin = firstInningsRuns - runs;
  }
  // Tie
  else {
    winner = null;
    resultType = resultTypeEnum.enumValues[2]; // TIE
    margin = 0;
  }

  return { winner, resultType, margin };
};
