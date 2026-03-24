import React, { createContext, useContext, useEffect, useState } from "react";
import { adminAuthAPI } from "../lib/admin-auth";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "TURF_ADMIN" | "SCORER" | "PLAYER";
  turfId?: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedAccessToken = localStorage.getItem("admin_access_token");
      const storedRefreshToken = localStorage.getItem("admin_refresh_token");

      if (storedAccessToken && storedRefreshToken) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);

        try {
          // Verify access token by making a protected request
          await adminAuthAPI.getDashboardStats();
          // If successful, we know the token is valid
          const userData = JSON.parse(
            localStorage.getItem("admin_user") || "{}",
          );
          setAdmin(userData);
        } catch (error) {
          console.error("Access token invalid, attempting refresh:", error);
          try {
            // Try to refresh tokens
            await refreshTokensFunction();
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            logout();
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting admin login with:", { email, password: "***" });
      const response = await adminAuthAPI.login(email, password);
      console.log("Login API response:", response);

      setAdmin(response.data.user);
      setAccessToken(response.data.data.tokens.accessToken);
      setRefreshToken(response.data.data.tokens.refreshToken);

      localStorage.setItem(
        "admin_access_token",
        response.data.data.tokens.accessToken,
      );
      localStorage.setItem(
        "admin_refresh_token",
        response.data.data.tokens.refreshToken,
      );
      localStorage.setItem("admin_user", JSON.stringify(response.data.user));

      console.log("Login successful, user set to:", response.data.user);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const refreshTokensFunction = async () => {
    const storedRefreshToken = localStorage.getItem("admin_refresh_token");
    if (!storedRefreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await adminAuthAPI.refreshToken(storedRefreshToken);

    const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
    setAccessToken(accessToken);
    setRefreshToken(newRefreshToken);

    localStorage.setItem("admin_access_token", accessToken);
    localStorage.setItem("admin_refresh_token", newRefreshToken);
  };

  const logout = () => {
    setAdmin(null);
    setAccessToken(null);
    setRefreshToken(null);

    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user");
  };

  const refreshTokens = async () => {
    try {
      await refreshTokensFunction();
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
    }
  };

  const isAuthenticated = !!admin && !!accessToken;

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        accessToken,
        refreshToken,
        login,
        logout,
        refreshTokens,
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};
