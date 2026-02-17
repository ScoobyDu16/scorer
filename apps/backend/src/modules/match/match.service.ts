import {
  addMatchPlayersRepo,
  createInningsRepo,
  createMatchRepo,
  getMatchByIdRepo,
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
