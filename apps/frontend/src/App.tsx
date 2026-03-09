import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { PlayersPage } from './pages/PlayersPage';
import { CreateMatchPage } from './pages/CreateMatchPage';
import { GenerateAccessCodePage } from './pages/GenerateAccessCodePage';
import { AccessCodePage } from './pages/AccessCodePage';
import { MatchSetupPage } from './pages/MatchSetupPage';
import { OpeningPlayersPage } from './pages/OpeningPlayersPage';
import { ScoringPage } from './pages/ScoringPage';
import { MatchFlow } from './components/MatchFlow';
import { MatchManagementPage } from './pages/MatchManagementPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
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
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/players" element={<PlayersPage />} />
                <Route path="/create-match" element={<CreateMatchPage />} />
                <Route path="/generate-code" element={<GenerateAccessCodePage />} />
                <Route path="/access-code" element={<AccessCodePage />} />
                <Route path="/match-setup/:matchId" element={<MatchSetupPage />} />
                <Route path="/opening/:matchId" element={<OpeningPlayersPage />} />
                <Route path="/scoring/:matchId" element={<ScoringPage />} />
                <Route path="/match-management" element={<MatchManagementPage turfId="current" />} />
                
                {/* Unified Match Flow - handles all match lifecycle steps */}
                <Route path="/match-flow/:matchId?" element={<MatchFlow />} />
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
