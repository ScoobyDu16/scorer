import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthPage } from "./pages/AuthPage";
import { Dashboard } from "./pages/Dashboard";
import { PlayersPage } from "./pages/PlayersPage";
import { PlayerProfilePage } from "./pages/PlayerProfilePage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { GenerateAccessCodePage } from "./pages/GenerateAccessCodePage";
import { AccessCodePage } from "./pages/AccessCodePage";
import { ScoringPage } from "./pages/ScoringPage";
import { ScorecardPage } from "./pages/ScorecardPage";
import { MatchFlow } from "./components/MatchFlow";
import { MatchManagementPage } from "./pages/MatchManagementPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { SuperAdminDashboardPage } from "./pages/SuperAdminDashboardPage";
import { TurfAdminDashboardPage } from "./pages/TurfAdminDashboardPage";
import { ScorerDashboardPage } from "./pages/ScorerDashboardPage";
import { PlayerDashboardPage } from "./pages/PlayerDashboardPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  {/* Default redirect */}
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />

                  {/* Role-based Dashboard Routes */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/admin/dashboard" element={<SuperAdminDashboardPage />} />
                  <Route path="/scorer/dashboard" element={<ScorerDashboardPage />} />
                  <Route path="/player/dashboard" element={<PlayerDashboardPage />} />

                  {/* Existing Routes */}
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/players" element={<PlayersPage />} />
                  <Route
                    path="/players/:playerId"
                    element={<PlayerProfilePage />}
                  />
                  <Route
                    path="/generate-code"
                    element={<GenerateAccessCodePage />}
                  />
                  <Route path="/access-code" element={<AccessCodePage />} />
                  <Route path="/scoring/:matchId" element={<ScoringPage />} />
                  <Route
                    path="/match/:matchId/scorecard"
                    element={<ScorecardPage />}
                  />
                  <Route
                    path="/match-management"
                    element={<MatchManagementPage turfId="current" />}
                  />

                  {/* Unified Match Flow - handles all match lifecycle steps */}
                  <Route path="/match-flow/:matchId?" element={<MatchFlow />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
