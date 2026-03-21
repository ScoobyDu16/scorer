import React from "react";
import { Navigate } from "react-router-dom";
import { TurfAdminDashboard } from "../components/dashboard/TurfAdminDashboard";

export const TurfAdminDashboardPage: React.FC = () => {
  // Check if user is authenticated and has correct role
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const userData = JSON.parse(user);
  if (userData.role !== "TURF_ADMIN") {
    // Redirect to appropriate dashboard based on role
    switch (userData.role) {
      case "SUPER_ADMIN":
        return <Navigate to="/admin/dashboard" replace />;
      case "SCORER":
        return <Navigate to="/scorer/dashboard" replace />;
      case "PLAYER":
        return <Navigate to="/player/dashboard" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return <TurfAdminDashboard />;
};
