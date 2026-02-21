import { Routes, Route } from 'react-router-dom'
import TurfLogin from './pages/TurfLogin'
import TurfRegister from './pages/TurfRegister'
import Dashboard from './pages/Dashboard'
import CreateMatch from './pages/CreateMatch'
import MatchSetup from './pages/MatchSetup'
import PlayerManagement from './pages/PlayerManagement'
import AccessCode from './pages/AccessCode'
import EnhancedScoring from './pages/EnhancedScoring'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<TurfLogin />} />
        <Route path="/register" element={<TurfRegister />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-match" element={<CreateMatch />} />
        <Route path="/match/:matchId/setup" element={<MatchSetup />} />
        <Route path="/match/:matchId/players" element={<PlayerManagement />} />
        <Route path="/scoring/:matchId" element={<EnhancedScoring />} />
        <Route path="/access/:matchId" element={<AccessCode />} />
        <Route path="/" element={<TurfLogin />} />
      </Routes>
    </div>
  );
}

export default App;
