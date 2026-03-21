import React from "react";
import { Navigate } from "react-router-dom";

// Placeholder for Player Dashboard component
const PlayerDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Player Dashboard</h1>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-600">Player dashboard component coming soon!</p>
            <p className="text-sm text-gray-500 mt-2">
              Features: Career stats, match history, performance analysis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PlayerDashboardPage: React.FC = () => {
  // Check if user is authenticated and has correct role
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const userData = JSON.parse(user);
  if (userData.role !== "PLAYER") {
    // Redirect to appropriate dashboard based on role
    switch (userData.role) {
      case "SUPER_ADMIN":
        return <Navigate to="/admin/dashboard" replace />;
      case "TURF_ADMIN":
        return <Navigate to="/dashboard" replace />;
      case "SCORER":
        return <Navigate to="/scorer/dashboard" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return <PlayerDashboard />;
};
