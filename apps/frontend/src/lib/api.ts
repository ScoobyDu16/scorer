import axios from 'axios';
import { Team, MatchStatus, TossDecision, ResultType, InningsStatus } from './enums';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if not on login page and not a login request
    if (error.response?.status === 401 && 
        !window.location.pathname.includes('/auth') && 
        !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      window.location.href = '/auth';
    }
    // Don't redirect on network errors, let components handle them
    return Promise.reject(error);
  }
);

export interface TurfLoginData {
  email: string;
  password: string;
}

export interface TurfRegisterData {
  // Turf details
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  
  // Admin user details
  adminName: string;
  adminEmail: string;
  adminPhone?: string;
  adminPassword: string;
  
  // Subscription plan
  planId?: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    status?: string;
    role?: string;
    turfId?: string;
    avatarUrl?: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  turfId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  turfId: string;
  teamAName: string;
  teamBName: string;
  overs: number;
  venue?: string;
  tossWinner?: Team;
  tossDecision?: TossDecision;
  status: MatchStatus;
  playersPerTeam?: number;
  currentInnings?: number;
  startTime?: string;
  endTime?: string;
  winner?: Team | null;
  resultType?: ResultType | null;
  resultMargin?: number | null;
  manOfTheMatchPlayerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Innings {
  id: string;
  matchId: string;
  inningsNumber: 1 | 2;
  battingTeam: Team;
  status: InningsStatus;
  totalRuns?: number;
  totalBalls?: number;
  totalWickets?: number;
  openingStrikerId?: string;
  openingNonStrikerId?: string;
  openingBowlerId?: string;
  currentStrikerId?: string;
  currentNonStrikerId?: string;
  currentBowlerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchPlayer {
  id: string;
  matchId: string;
  playerId: string;
  team: Team;
  player: Player;
  createdAt: string;
}

export interface CreateMatchData {
  teamAName: string;
  teamBName: string;
  overs: number;
  venue?: string;
  tossWinner: Team;
  tossDecision: TossDecision;
  playersPerTeam?: number;
}

export interface AddMatchPlayersData {
  players: Array<{
    playerId: string;
    team: Team;
  }>;
}

export interface StartInningsData {
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
}

export interface AddBallData {
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runs: number;
  extraType?: string;
  extraRuns?: number;
  isWicket?: boolean;
  wicketType?: string;
  wicketBatsmanId?: string;
  wicketBowlerId?: string;
  wicketFielderId?: string;
}
