export type UserRole = 'SUPER_ADMIN' | 'TURF_ADMIN' | 'SCORER' | 'PLAYER';

export interface Permission {
  canViewDashboard: boolean;
  canManageTurfs: boolean;
  canManageUsers: boolean;
  canManageMatches: boolean;
  canCreateMatches: boolean;
  canScoreMatches: boolean;
  canManagePlayers: boolean;
  canGenerateCodes: boolean;
  canViewAnalytics: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  SUPER_ADMIN: {
    canViewDashboard: true,
    canManageTurfs: true,
    canManageUsers: true,
    canManageMatches: false, // Can view all matches but not manage specific turf matches
    canCreateMatches: false,
    canScoreMatches: false,
    canManagePlayers: false,
    canGenerateCodes: false,
    canViewAnalytics: true,
  },
  TURF_ADMIN: {
    canViewDashboard: true,
    canManageTurfs: false, // Can only manage own turf
    canManageUsers: true, // Can manage turf users
    canManageMatches: true,
    canCreateMatches: true,
    canScoreMatches: false, // Can assign scorers but not score
    canManagePlayers: true,
    canGenerateCodes: true,
    canViewAnalytics: true,
  },
  SCORER: {
    canViewDashboard: false,
    canManageTurfs: false,
    canManageUsers: false,
    canManageMatches: false,
    canCreateMatches: false,
    canScoreMatches: true,
    canManagePlayers: false,
    canGenerateCodes: false,
    canViewAnalytics: false,
  },
  PLAYER: {
    canViewDashboard: false,
    canManageTurfs: false,
    canManageUsers: false,
    canManageMatches: false,
    canCreateMatches: false,
    canScoreMatches: false,
    canManagePlayers: false,
    canGenerateCodes: false,
    canViewAnalytics: false,
  },
};

export const getRolePermissions = (role?: UserRole): Permission => {
  return ROLE_PERMISSIONS[role || 'PLAYER'];
};

export const hasPermission = (role: UserRole | undefined, permission: keyof Permission): boolean => {
  if (!role) return false;
  return ROLE_PERMISSIONS[role][permission];
};
