import React from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { RegisterForm } from "../components/auth/RegisterForm";

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const type = searchParams.get('type');

  // Check if user is already logged in
  const authToken = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (authToken && user) {
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

  // If this is an admin invitation, show admin registration
  if (token && type === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <RegisterForm invitationToken={token} isAdminInvitation={true} />
      </div>
    );
  }

  // Regular registration
  return (
    <div className="min-h-screen bg-gray-50">
      <RegisterForm />
    </div>
  );
};
