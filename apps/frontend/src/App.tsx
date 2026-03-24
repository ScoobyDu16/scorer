import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { PublicRoute } from "./components/PublicRoute";
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
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminTurfsPage } from "./pages/AdminTurfsPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminSubscriptionsPage } from "./pages/AdminSubscriptionsPage";
import { AdminAuditLogsPage } from "./pages/AdminAuditLogsPage";

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin/*"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                    <Route path="/admin/turfs" element={<AdminTurfsPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
                    <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
                    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          {/* Public Routes */}
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            }
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route
                      path="/"
                      element={<Navigate to="/dashboard" replace />}
                    />
                    <Route path="/dashboard" element={<Dashboard />} />
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
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
