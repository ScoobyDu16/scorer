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
  upsertPlayerMatchStatsRepo,
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
  getMatchWithInningsRepo,
  getMatchesByTurfRepo,
  revertInningsTotalsRepo,
  updateInningsStatusRepo,
  updateInningsTotalsRepo,
  updateMatchRepo,
} from "./match.repository";
import { getMatchesWithoutActiveCodesService } from "../access-code/access-code.service";

export const createMatchService = async (turfId: string, data: any) => {
  const match = await createMatchRepo({
    turfId,
    teamAName: data.teamAName,
    teamBName: data.teamBName,
    overs: data.overs,
    venue: data.venue,
    tossWinner: data.tossWinner,
    tossDecision: data.tossDecision,
    status: "UPCOMING",
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

export const startInningsService = async (
  matchId: string,
  openingPlayers?: { strikerId: string; nonStrikerId: string; bowlerId: string }
) => {
  /**
   * 1️⃣ Get match
   */
  const match = await getMatchByIdRepo(matchId);

  if (!match) {
    throw new Error("Match not found");
  }

  if (match.status === "LIVE") {
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
    status: "LIVE",
  });

  /**
   * 5️⃣ Update match
   */
  await updateMatchRepo(matchId, {
    status: "LIVE",
    currentInnings: 1,
    startTime: new Date(),
  });

  // Return innings with opening bowler for frontend temporary state
  return {
    ...inningsRecord,
    openingBowlerId: openingPlayers?.bowlerId, // Temporary UI state, not stored
  };
};

export const addBallService = async (matchId: string, data: any) => {
  const match = await getMatchByIdRepo(matchId);

  if (!match) {
    throw new Error("Match not found");
  }

  if (match.status === "COMPLETED") {
    throw new Error("Match already completed. No more balls allowed.");
  }

  const innings = await getCurrentInningsRepo(matchId, match.currentInnings || 1);

  if (!innings) {
    throw new Error("No active innings");
  }

  if (innings.status === "COMPLETED") {
    throw new Error("Innings already completed");
  }

  // Calculate over and ball numbers
  const lastBall = await getLastBallRepo(matchId);
  
  let overNumber = 1;
  let ballNumber = 1;
  
  if (lastBall) {
    if (lastBall.ballNumber < 6) {
      // Same over, next ball
      overNumber = lastBall.overNumber;
      ballNumber = lastBall.ballNumber + 1;
    } else {
      // New over
      overNumber = lastBall.overNumber + 1;
      ballNumber = 1;
    }
  }

  // Calculate runs and extras
  const totalRuns = (data.runs || 0) + (data.extraRuns || 0);
  
  // Determine extra type and runs
  let extraType = null;
  let extraRuns = 0;
  
  if (data.isWide) {
    extraType = "WIDE";
    extraRuns = 1; // Wide ball adds 1 run
  } else if (data.isNoBall) {
    extraType = "NO_BALL";
    extraRuns = 1; // No ball adds 1 run
  } else if (data.isByes) {
    extraType = "BYE";
    extraRuns = data.runs || 0;
  } else if (data.isLegByes) {
    extraType = "LEG_BYE";
    extraRuns = data.runs || 0;
  }

  // Determine if legal delivery
  const isLegalDelivery = !data.isWide && !data.isNoBall;

  // 1️⃣ Save ball
  const ball = await createBallRepo({
    matchId,
    inningsId: data.inningsId,
    overNumber,
    ballNumber,
    batsmanId: data.strikerId, // Frontend sends strikerId
    bowlerId: data.bowlerId,
    runs: isLegalDelivery ? (data.runs || 0) : 0, // Runs from bat only for legal deliveries
    extraType,
    extraRuns,
    isWicket: data.isWicket || false,
    wicketType: data.isWicket ? "BOWLED" : null, // Default wicket type
    dismissedPlayerId: null, // Will be set when wicket details are provided
    isLegalDelivery,
  });

  // 2️⃣ Update innings totals
  await updateInningsTotalsRepo(
    data.inningsId,
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

  // 4️⃣ Bowling stats
  if (data.bowlerId) {
    const bowlingTeam = innings.battingTeam === "A" ? "B" : "A"; // Opposite team
    await upsertPlayerMatchStatsRepo(matchId, data.bowlerId, bowlingTeam);

    await updateBowlingStatsRepo(
      matchId,
      data.bowlerId,
      totalRuns,
      data.isWicket,
      isLegalDelivery,
    );
  }

  await checkInningsCompletionService(matchId, data.inningsId);

  // 5️⃣ ⭐ Check match result
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
  await updateInningsStatusRepo(currentInnings.id, "COMPLETED");

  /**
   * If first innings → start second
   */
  if (currentInningsNumber === 1) {
    const nextBattingTeam = currentInnings.battingTeam === "A" ? "B" : "A";

    const secondInnings = await createInningsRepo({
      matchId,
      inningsNumber: 2,
      battingTeam: nextBattingTeam,
      status: "LIVE",
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
  matchServiceLogger.fetching('match score', matchId);
  
  const match = await getMatchWithInningsRepo(matchId);
  
  if (!match) {
    matchServiceLogger.error('fetching match score', new Error('Match not found'), { matchId });
    throw new Error("Match not found");
  }

  matchServiceLogger.found('match', match, { matchId });
  
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

  if (match.status === "LIVE") {
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

  if (match.status === "COMPLETED") {
    if (match.resultType === "TIE") {
      result = "Match tied";
    } else if (match.winner) {
      const winnerName =
        match.winner === "A" ? match.teamAName : match.teamBName;

      const unit = match.resultType === "RUNS" ? "runs" : "wickets";

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

  // Only check during 2nd innings
  if (match.currentInnings !== 2) return;

  const firstInnings = match.innings.find((i) => i.inningsNumber === 1);
  const secondInnings = match.innings.find((i) => i.inningsNumber === 2);

  if (!firstInnings || !secondInnings) return;

  // Already completed
  if (secondInnings.status === "COMPLETED") return;

  const oversLimitBalls = match.overs * 6;
  const target = firstInnings.totalRuns + 1;

  const runs = secondInnings.totalRuns;
  const balls = secondInnings.totalBalls;
  const wickets = secondInnings.totalWickets;

  let winner: "A" | "B" | null = null;
  let resultType: "RUNS" | "WICKETS" | "TIE" | null = null;
  let margin: number | null = null;
  let isCompleted = false;

  /**
   * Case 1: Chase successful
   */
  if (runs >= target) {
    winner = secondInnings.battingTeam;
    resultType = "WICKETS";
    margin = 10 - wickets;
    isCompleted = true;
  } else if (balls >= oversLimitBalls || wickets >= 10) {
    /**
     * Case 2: Overs finished OR all out
     */
    isCompleted = true;

    if (runs === firstInnings.totalRuns) {
      resultType = "TIE";
    } else {
      winner = firstInnings.battingTeam;
      resultType = "RUNS";
      margin = firstInnings.totalRuns - runs;
    }
  }

  if (!isCompleted) return;

  // 1️⃣ Complete innings
  await updateInningsStatusRepo(secondInnings.id, "COMPLETED");

  // 2️⃣ Calculate Man of the Match
  const manOfTheMatchPlayerId = await calculateManOfTheMatch(matchId);

  // 3️⃣ Update match
  await updateMatchRepo(matchId, {
    status: "COMPLETED",
    endTime: new Date(),
    winner,
    resultType,
    resultMargin: margin,
    manOfTheMatchPlayerId,
  });
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
  if (innings.status === "COMPLETED") return;

  const maxBalls = match.overs * 6;

  const isCompleted =
    innings.totalBalls >= maxBalls || innings.totalWickets >= 10;

  if (!isCompleted) return;

  /**
   * Complete current innings
   */
  await updateInningsStatusRepo(innings.id, "COMPLETED");

  /**
   * If first innings → start second
   */
  if (innings.inningsNumber === 1) {
    const nextBattingTeam = innings.battingTeam === "A" ? "B" : "A";

    await createInningsRepo({
      matchId,
      inningsNumber: 2,
      battingTeam: nextBattingTeam,
      status: "LIVE",
    });

    await updateMatchRepo(matchId, {
      currentInnings: 2,
    });
  }

  /**
   * If second innings → match result will be handled
   * by existing checkMatchResultService
   */
};

const buildLiveScoreDetails = async (inningsId: string) => {
  // Get last 12 balls (enough to detect over + batsmen)
  const recentBalls = await getLastBallsRepo(inningsId, 12);

  // If no balls delivered yet, use opening players
  if (!recentBalls.length) {
    // Get innings details to get opening players
    const innings = await getInningsByIdRepo(inningsId);
    
    if (!innings?.openingStrikerId || !innings?.openingNonStrikerId) {
      return null;
    }

    const playerIds = [innings.openingStrikerId, innings.openingNonStrikerId];
    const players = await getPlayersByIdsRepo(playerIds);
    const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));

    return {
      striker: {
        id: innings.openingStrikerId,
        name: playerMap[innings.openingStrikerId]?.name,
        runs: 0,
        balls: 0,
      },
      nonStriker: {
        id: innings.openingNonStrikerId,
        name: playerMap[innings.openingNonStrikerId]?.name,
        runs: 0,
        balls: 0,
      },
      bowler: null, // Opening bowler handled by frontend temporary state
      lastOver: [],
    };
  }

  const lastBall = recentBalls[0];

  const strikerId = lastBall.batsmanId;
  const bowlerId = lastBall.bowlerId;

  /**
   * Determine non-striker
   */
  let nonStrikerId: string | null = null;

  for (const ball of recentBalls) {
    if (ball.batsmanId !== strikerId) {
      nonStrikerId = ball.batsmanId;
      break;
    }
  }

  const playerIds = [strikerId, nonStrikerId, bowlerId].filter(
    Boolean,
  ) as string[];

  const players = await getPlayersByIdsRepo(playerIds);

  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));

  /**
   * Get match stats
   */
  const stats = await getMatchPlayerStatsRepo(lastBall.matchId);
  const statsMap = Object.fromEntries(stats.map((s) => [s.playerId, s]));

  /**
   * Current batsmen
   */
  const strikerStats = statsMap[strikerId];
  const nonStrikerStats = nonStrikerId ? statsMap[nonStrikerId] : null;

  /**
   * Bowler stats
   */
  const bowlerStats = statsMap[bowlerId];

  /**
   * Last over summary
   */
  const currentOverNumber = lastBall.overNumber;

  const lastOverBalls = recentBalls
    .filter((b) => b.overNumber === currentOverNumber)
    .reverse();

  const lastOver = lastOverBalls.map((b) => {
    if (b.isWicket) return "W";
    if (b.extraType === "WIDE") return "Wd";
    if (b.extraType === "NO_BALL") return "Nb";
    return String(b.runs + (b.extraRuns || 0));
  });

  return {
    striker: strikerStats
      ? {
          id: strikerId,
          name: playerMap[strikerId]?.name,
          runs: strikerStats.runs,
          balls: strikerStats.ballsFaced,
        }
      : null,

    nonStriker: nonStrikerStats
      ? {
          id: nonStrikerId,
          name: playerMap[nonStrikerId!]?.name,
          runs: nonStrikerStats.runs,
          balls: nonStrikerStats.ballsFaced,
        }
      : null,

    bowler: bowlerStats
      ? {
          id: bowlerId,
          name: playerMap[bowlerId]?.name,
          overs: ballsToOvers(bowlerStats.ballsBowled),
          runs: bowlerStats.runsConceded,
          wickets: bowlerStats.wickets,
        }
      : null,

    lastOver,
  };
};
