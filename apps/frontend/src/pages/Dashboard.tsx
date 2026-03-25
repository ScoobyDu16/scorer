import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getRolePermissions, UserRole } from "../lib/permissions";
import { SuperAdminDashboard } from "../components/dashboard/SuperAdminDashboard";
import { TurfAdminDashboard } from "../components/dashboard/TurfAdminDashboard";
import { ScorerDashboard } from "../components/dashboard/ScorerDashboard";
import { PlayerDashboard } from "../components/dashboard/PlayerDashboard";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role as UserRole;
  const permissions = getRolePermissions(userRole);

  // Render role-specific dashboard
  const renderRoleSpecificDashboard = () => {
    switch (userRole) {
      case 'SUPER_ADMIN':
        return <SuperAdminDashboard />;
      case 'TURF_ADMIN':
        return <TurfAdminDashboard />;
      case 'SCORER':
        return <ScorerDashboard />;
      case 'PLAYER':
        return <PlayerDashboard />;
      default:
        return <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No dashboard available</h3>
          <p className="mt-2 text-gray-600">Your role doesn't have a dashboard view.</p>
        </div>;
    }
  };

  // Render role-specific action cards
  const renderActionCards = () => {
    const cards = [];

    if (permissions.canCreateMatches) {
      cards.push(
        <div key="create-match" className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Create Match
          </h3>
          <p className="text-gray-600 mb-4">
            Start a new cricket match with unified flow
          </p>
          <Link
            to="/match-flow"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
          >
            Create Match
          </Link>
        </div>
      );
    }

    if (permissions.canManageMatches) {
      cards.push(
        <div key="manage-matches" className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Manage Matches
          </h3>
          <p className="text-gray-600 mb-4">
            View, edit, and manage all cricket matches
          </p>
          <Link
            to="/match-management"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
          >
            Manage Matches
          </Link>
        </div>
      );
    }

    if (permissions.canGenerateCodes) {
      cards.push(
        <div key="generate-code" className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Generate Access Code
          </h3>
          <p className="text-gray-600 mb-4">
            Generate access codes for upcoming matches
          </p>
          <Link
            to="/generate-code"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
          >
            Generate Code
          </Link>
        </div>
      );
    }

    if (permissions.canManagePlayers) {
      cards.push(
        <div key="manage-players" className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Manage Players
          </h3>
          <p className="text-gray-600 mb-4">
            Add, edit, and manage player profiles
          </p>
          <Link
            to="/players"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
          >
            Manage Players
          </Link>
        </div>
      );
    }

    if (permissions.canManageTurfs) {
      cards.push(
        <div key="manage-turfs" className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Manage Turfs
          </h3>
          <p className="text-gray-600 mb-4">
            Verify and manage all turf registrations
          </p>
          <Link
            to="/admin/turfs"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200"
          >
            Manage Turfs
          </Link>
        </div>
      );
    }

    if (permissions.canScoreMatches) {
      cards.push(
        <div key="score-matches" className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Score Matches
          </h3>
          <p className="text-gray-600 mb-4">
            View and score live cricket matches
          </p>
          <Link
            to="/scoring"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200"
          >
            Score Matches
          </Link>
        </div>
      );
    }

    return cards;
  };

  return (
    <div className="space-y-8">
      {/* Role-specific dashboard content */}
      {permissions.canViewDashboard && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {userRole === 'SUPER_ADMIN' ? 'Platform Overview' : 'Dashboard'}
          </h2>
          {renderRoleSpecificDashboard()}
        </div>
      )}

      {/* Action cards based on permissions */}
      {renderActionCards().length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {renderActionCards()}
          </div>
        </div>
      )}
    </div>
  );
};
