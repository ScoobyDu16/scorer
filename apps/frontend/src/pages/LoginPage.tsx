import React from "react";
import { Navigate } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm";

export const LoginPage: React.FC = () => {
  // Check if user is already logged in
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (token && user) {
    const userData = JSON.parse(user);
    // Redirect to appropriate dashboard based on role
    switch (userData.role) {
      case "SUPER_ADMIN":
        return <Navigate to="/admin/dashboard" replace />;
      case "TURF_ADMIN":
        return <Navigate to="/dashboard" replace />;
      case "SCORER":
        return <Navigate to="/scorer/dashboard" replace />;
      case "PLAYER":
        return <Navigate to="/player/dashboard" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LoginForm />
    </div>
  );
};
