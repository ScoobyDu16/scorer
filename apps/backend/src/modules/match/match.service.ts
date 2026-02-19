import { ballsToOvers, calculateRunRate } from "../../utils/cricket";
import {
  getMatchPlayerStatsRepo,
  getPlayerByIdRepo,
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
  getLastBallRepo,
  getMatchByIdRepo,
  getMatchWithInningsRepo,
  revertInningsTotalsRepo,
  updateInningsStatusRepo,
  updateInningsTotalsRepo,
  updateMatchRepo,
} from "./match.repository";

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
  });

  return match;
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

export const startInningsService = async (matchId: string) => {
  const match = await getMatchByIdRepo(matchId);

  if (!match) {
    throw new Error("Match not found");
  }

  if (match.status === "LIVE") {
    throw new Error("Match already started");
  }

  /**
   * Determine batting team
   */
  let battingTeam: "A" | "B";

  if (match.tossDecision === "BAT") {
    battingTeam = match.tossWinner as "A" | "B";
  } else {
    battingTeam = match.tossWinner === "A" ? "B" : "A";
  }

  // Create first innings
  const inningsRecord = await createInningsRepo({
    matchId,
    inningsNumber: 1,
    battingTeam,
    status: "LIVE",
  });

  // Update match
  await updateMatchRepo(matchId, {
    status: "LIVE",
    currentInnings: 1,
    startTime: new Date(),
  });

  return inningsRecord;
};

export const addBallService = async (matchId: string, data: any) => {
  const match = await getMatchByIdRepo(matchId);

  if (!match) {
    throw new Error("Match not found");
  }

  if (match.status === "COMPLETED") {
    throw new Error("Match already completed. No more balls allowed.");
  }

  const innings = await getCurrentInningsRepo(matchId, match.currentInnings);

  if (!innings || innings.status === "COMPLETED") {
    throw new Error("Innings already completed");
  }

  const totalRuns = (data.runs || 0) + (data.extraRuns || 0);

  // 1️⃣ Save ball
  const ball = await createBallRepo({
    matchId,
    inningsId: data.inningsId,
    overNumber: data.overNumber,
    ballNumber: data.ballNumber,
    batsmanId: data.batsmanId,
    bowlerId: data.bowlerId,
    runs: data.runs,
    extraType: data.extraType,
    extraRuns: data.extraRuns,
    isWicket: data.isWicket,
    wicketType: data.wicketType,
    dismissedPlayerId: data.dismissedPlayerId,
    isLegalDelivery: data.isLegalDelivery,
  });

  // 2️⃣ Update innings totals
  await updateInningsTotalsRepo(
    data.inningsId,
    totalRuns,
    data.isWicket,
    data.isLegalDelivery,
  );

  // 3️⃣ Batting stats
  if (data.batsmanId) {
    await upsertPlayerMatchStatsRepo(matchId, data.batsmanId, data.battingTeam);

    await updateBattingStatsRepo(
      matchId,
      data.batsmanId,
      data.runs || 0,
      data.isLegalDelivery,
    );
  }

  // 4️⃣ Bowling stats
  if (data.bowlerId) {
    await upsertPlayerMatchStatsRepo(matchId, data.bowlerId, data.bowlingTeam);

    await updateBowlingStatsRepo(
      matchId,
      data.bowlerId,
      totalRuns,
      data.isWicket,
      data.isLegalDelivery,
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
  const match = await getMatchWithInningsRepo(matchId);

  if (!match) {
    throw new Error("Match not found");
  }

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
