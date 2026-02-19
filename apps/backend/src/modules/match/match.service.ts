import { ballsToOvers, calculateRunRate } from "../../utils/cricket";
import {
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

  const inningsData = match.innings.map((i) => ({
    id: i.id,
    inningsNumber: i.inningsNumber,
    battingTeam: i.battingTeam,
    totalRuns: i.totalRuns,
    totalWickets: i.totalWickets,
    totalOvers: ballsToOvers(i.totalBalls),
    totalBalls: i.totalBalls,
    status: i.status,
  }));

  // Find innings
  const firstInnings = inningsData.find((i) => i.inningsNumber === 1);
  const secondInnings = inningsData.find((i) => i.inningsNumber === 2);

  let target: number | null = null;
  let currentRunRate = 0;
  let requiredRuns: number | null = null;
  let requiredBalls: number | null = null;
  let requiredRunRate: number | null = null;

  /**
   * CASE 1: First innings running
   */
  if (match.currentInnings === 1 && firstInnings) {
    currentRunRate = calculateRunRate(
      firstInnings.totalRuns,
      firstInnings.totalBalls,
    );
  }

  /**
   * CASE 2: Second innings
   */
  if (match.currentInnings === 2 && firstInnings && secondInnings) {
    target = firstInnings.totalRuns + 1;

    currentRunRate = calculateRunRate(
      secondInnings.totalRuns,
      secondInnings.totalBalls,
    );

    const totalMatchBalls = match.overs * 6;

    requiredRuns = Math.max(target - secondInnings.totalRuns, 0);
    requiredBalls = Math.max(totalMatchBalls - secondInnings.totalBalls, 0);

    if (requiredBalls > 0 && requiredRuns > 0) {
      requiredRunRate = Number(((requiredRuns / requiredBalls) * 6).toFixed(2));
    } else {
      requiredRunRate = 0;
    }
  }

  // Remove totalBalls from response (internal use)
  const innings = inningsData.map(({ totalBalls, ...rest }) => rest);

  return {
    matchId: match.id,
    status: match.status,
    currentInnings: match.currentInnings,
    teamAName: match.teamAName,
    teamBName: match.teamBName,
    overs: match.overs,

    // ⭐ New fields
    target,
    currentRunRate,
    requiredRuns,
    requiredBalls,
    requiredRunRate,

    innings,
  };
};

export const checkMatchResultService = async (matchId: string) => {
  const match = await getMatchWithInningsRepo(matchId);

  if (!match) {
    throw new Error("Match not found");
  }

  if (match.currentInnings !== 2) return;

  const oversLimitBalls = match.overs * 6;

  const firstInnings = match.innings.find(
    (i: (typeof match.innings)[number]) => i.inningsNumber === 1,
  );

  const secondInnings = match.innings.find(
    (i: (typeof match.innings)[number]) => i.inningsNumber === 2,
  );

  if (!firstInnings || !secondInnings) return;

  // Already completed → do nothing
  if (secondInnings.status === "COMPLETED") return;

  const target = firstInnings.totalRuns + 1;

  const runs = secondInnings.totalRuns;
  const balls = secondInnings.totalBalls;
  const wickets = secondInnings.totalWickets;

  let isMatchCompleted = false;

  // Case 1 — Target achieved
  if (runs >= target) {
    isMatchCompleted = true;
  }

  // Case 2 — Overs finished or all out
  else if (balls >= oversLimitBalls || wickets >= 10) {
    isMatchCompleted = true;
  }

  if (isMatchCompleted) {
    // ⭐ Complete innings first
    await updateInningsStatusRepo(secondInnings.id, "COMPLETED");

    // ⭐ Complete match
    await completeMatchRepo(matchId);
  }
};
