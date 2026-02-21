import { api, TurfLoginData, TurfRegisterData, AuthResponse, Player, Match } from './api';

export const authAPI = {
  login: async (data: TurfLoginData): Promise<AuthResponse> => {
    const response = await api.post('/turfs/login', data);
    return response.data;
  },

  register: async (data: TurfRegisterData): Promise<AuthResponse> => {
    const response = await api.post('/turfs/register', data);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/turfs/me');
    return response.data;
  },
};

export const playerAPI = {
  getPlayers: async (search?: string): Promise<Player[]> => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await api.get(`/players${params}`);
    return response.data;
  },

  createPlayer: async (data: { name: string; email?: string; phone?: string }): Promise<Player> => {
    const response = await api.post('/players', data);
    return response.data;
  },

  getPlayerStats: async (playerId: string) => {
    const response = await api.get(`/players/${playerId}/stats`);
    return response.data;
  },
};

export const matchAPI = {
  getMatches: async (): Promise<Match[]> => {
    const response = await api.get('/matches');
    return response.data;
  },

  createMatch: async (data: {
    teamAName: string;
    teamBName: string;
    overs: number;
    venue?: string;
    tossWinner?: string;
    tossDecision?: string;
  }): Promise<Match> => {
    const response = await api.post('/matches', data);
    return response.data;
  },

  getMatchScore: async (matchId: string) => {
    const response = await api.get(`/matches/${matchId}/score`);
    return response.data;
  },
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('token', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
};
