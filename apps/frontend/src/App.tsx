import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CreateMatch from './pages/CreateMatch'
import AccessCode from './pages/AccessCode'
import Scoring from './pages/Scoring'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create-match" element={<CreateMatch />} />
        <Route path="/access/:matchId" element={<AccessCode />} />
        <Route path="/scoring/:matchId" element={<Scoring />} />
      </Routes>
    </div>
  )
}

export default App
