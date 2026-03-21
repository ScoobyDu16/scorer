import React from "react";
import { Navigate } from "react-router-dom";

// Placeholder for Scorer Dashboard component
const ScorerDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Scorer Dashboard</h1>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-600">Scorer dashboard component coming soon!</p>
            <p className="text-sm text-gray-500 mt-2">
              Features: Match scoring, lock management, real-time updates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ScorerDashboardPage: React.FC = () => {
  // Check if user is authenticated and has correct role
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const userData = JSON.parse(user);
  if (userData.role !== "SCORER") {
    // Redirect to appropriate dashboard based on role
    switch (userData.role) {
      case "SUPER_ADMIN":
        return <Navigate to="/admin/dashboard" replace />;
      case "TURF_ADMIN":
        return <Navigate to="/dashboard" replace />;
      case "PLAYER":
        return <Navigate to="/player/dashboard" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return <ScorerDashboard />;
};
