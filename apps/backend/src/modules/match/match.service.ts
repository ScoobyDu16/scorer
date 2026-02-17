import {
  addMatchPlayersRepo,
  createBallRepo,
  createInningsRepo,
  createMatchRepo,
  getMatchByIdRepo,
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
  const totalRuns = (data.runs || 0) + (data.extraRuns || 0);

  // Save ball
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

  // Update innings totals
  await updateInningsTotalsRepo(
    data.inningsId,
    totalRuns,
    data.isWicket,
    data.overNumber,
    data.ballNumber,
  );

  return ball;
};
