import {
  api,
  TurfLoginData,
  TurfRegisterData,
  AuthResponse,
  Player,
  Match,
} from "./api";

export const authAPI = {
  login: async (data: TurfLoginData): Promise<AuthResponse> => {
    const response = await api.post("/turfs/login", data);
    return response.data;
  },

  register: async (data: TurfRegisterData): Promise<AuthResponse> => {
    const response = await api.post("/turfs/register", data);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/turfs/me");
    return response.data;
  },
};

export const playerAPI = {
  getPlayers: async (
    search?: string,
    page = 1,
    limit = 20,
    sortBy = "name",
    sortOrder: "asc" | "desc" = "asc",
  ): Promise<{
    players: Player[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> => {
    const params = new URLSearchParams({
      search: search || "",
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder,
    });
    const response = await api.get(`/players?${params}`);
    return response.data;
  },

  getPlayersYetToBat: async (matchId: string, team: "A" | "B") => {
    const response = await api.get(
      `/players/yet-to-bat?matchId=${matchId}&team=${team}`,
    );
    return response.data;
  },

  getPlayer: async (playerId: string): Promise<Player> => {
    const response = await api.get(`/players/${playerId}`);
    return response.data;
  },

  createPlayer: async (data: {
    name: string;
    email?: string;
    phone?: string;
  }): Promise<Player> => {
    const response = await api.post("/players", data);
    return response.data;
  },

  updatePlayer: async (
    playerId: string,
    data: { name: string; email?: string; phone?: string },
  ): Promise<Player> => {
    const response = await api.put(`/players/${playerId}`, data);
    return response.data;
  },

  deletePlayer: async (playerId: string): Promise<void> => {
    await api.delete(`/players/${playerId}`);
  },

  getPlayerStats: async (playerId: string) => {
    const response = await api.get(`/players/${playerId}/stats`);
    return response.data;
  },
};

export const accessCodeAPI = {
  generateAccessCode: async (matchId: string) => {
    const response = await api.post("/access-codes/generate", { matchId });
    return response.data;
  },

  validateAccessCode: async (matchId: string, code: string) => {
    const response = await api.post("/access-codes/validate", {
      matchId,
      code,
    });
    return response.data;
  },
};

export const matchAPI = {
  getMatches: async (): Promise<Match[]> => {
    const response = await api.get("/matches");
    return response.data;
  },

  getCreatedMatches: async (): Promise<Match[]> => {
    const response = await api.get("/matches/created");
    return response.data;
  },

  getMatch: async (matchId: string): Promise<Match> => {
    const response = await api.get(`/matches/${matchId}`);
    return response.data;
  },

  getCurrentInnings: async (matchId: string): Promise<any> => {
    const response = await api.get(`/matches/${matchId}/current-innings`);
    return response.data;
  },

  getBalls: async (inningsId: string): Promise<any[]> => {
    const response = await api.get(`/innings/${inningsId}/balls`);
    return response.data;
  },

  addBall: async (data: {
    matchId: string;
    inningsId: string;
    strikerId: string;
    bowlerId: string;
    runs: number;
    isWide: boolean;
    isNoBall: boolean;
    isByes: boolean;
    isLegByes: boolean;
    isWicket: boolean;
  }): Promise<any> => {
    const response = await api.post(`/matches/${data.matchId}/balls`, data);
    return response.data;
  },

  createMatch: async (data: {
    teamAName: string;
    teamBName: string;
    overs: number;
    venue?: string;
    tossWinner?: "A" | "B";
    tossDecision?: "BAT" | "BOWL";
    playersPerTeam?: number;
  }): Promise<Match> => {
    const response = await api.post("/matches", data);
    return response.data;
  },

  addMatchPlayers: async (
    matchId: string,
    players: {
      playerId: string;
      team: "A" | "B";
    }[],
  ): Promise<void> => {
    const response = await api.post(`/matches/${matchId}/players`, { players });
    return response.data;
  },

  startMatch: async (
    matchId: string,
    data: {
      strikerId: string;
      nonStrikerId: string;
      bowlerId: string;
    },
  ): Promise<any> => {
    const response = await api.post(`/matches/${matchId}/start`, data);
    return response.data;
  },

  startSecondInnings: async (
    matchId: string,
    data: {
      strikerId: string;
      nonStrikerId: string;
      bowlerId: string;
    },
  ): Promise<any> => {
    const response = await api.post(`/matches/${matchId}/start-second`, data);
    return response.data;
  },

  getMatchScore: async (matchId: string) => {
    const response = await api.get(`/matches/${matchId}/score`);
    return response.data;
  },

  getMatchScorecard: async (matchId: string) => {
    const response = await api.get(`/matches/${matchId}/scorecard`);
    return response.data;
  },

  getMatchPlayers: async (matchId: string) => {
    const response = await api.get(`/matches/${matchId}/players`);
    return response.data;
  },

  changeBowler: async (inningsId: string, newBowlerId: string) => {
    const response = await api.post(`/innings/${inningsId}/change-bowler`, {
      newBowlerId,
    });
    return response.data;
  },

  undoLastBall: async (matchId: string): Promise<any> => {
    const response = await api.delete(`/matches/${matchId}/balls/last`);
    return response.data;
  },

  deleteMatch: async (matchId: string): Promise<void> => {
    await api.delete(`/matches/${matchId}`);
  },
};

export const dashboardAPI = {
  getStats: async (): Promise<{
    totalPlayers: number;
    totalMatches: number;
  }> => {
    const response = await api.get("/dashboard");
    return response.data;
  },
};

export const setAuthToken = (token: string) => {
  localStorage.setItem("token", token);
};

export const getAuthToken = () => {
  return localStorage.getItem("token");
};

export const removeAuthToken = () => {
  localStorage.removeItem("token");
};
