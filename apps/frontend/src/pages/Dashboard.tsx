import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";

interface Match {
  id: string;
  teamAName: string;
  teamBName: string;
  overs: number;
  venue?: string;
  status: string;
  startTime?: string;
  createdAt: string;
}

interface Turf {
  id: string;
  name: string;
  email: string;
}

interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

const Dashboard: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [turf, setTurf] = useState<Turf | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load turf data from localStorage
        const storedTurf = localStorage.getItem("turf");
        if (storedTurf) {
          setTurf(JSON.parse(storedTurf));
        }

        // Load players
        try {
          const playersResponse = await api.get('/players');
          setPlayers(playersResponse.data);
        } catch (error) {
          console.log('No players found or failed to load players');
        }

        setMatches([]);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  useEffect(() => {
    const filtered = players
      .filter(player => 
        playerSearchTerm === '' || player.name.toLowerCase().includes(playerSearchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    setFilteredPlayers(filtered);
  }, [players, playerSearchTerm]);

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await api.post('/players', newPlayer);
      setPlayers(prev => [...prev, response.data]);
      setNewPlayer({ name: '', email: '', phone: '' });
      setShowPlayerModal(false);
    } catch (error: any) {
      console.error('Failed to create player:', error);
      alert(error.response?.data?.message || 'Failed to create player');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("turf");
    navigate("/login");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-100 text-blue-800";
      case "LIVE":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Cricket Scorer
              </h1>
              {turf && (
                <p className="text-sm text-gray-600 mt-1">
                  Welcome, {turf.name}
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Quick Actions */}
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <button
              onClick={() => navigate('/create-match')}
              className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg shadow-md transition-colors"
            >
              <div className="text-3xl mb-2">🏏</div>
              <h3 className="text-lg font-semibold mb-1">Create New Match</h3>
              <p className="text-sm opacity-90">Start a new cricket match</p>
            </button>

            <button
              onClick={() => setShowPlayerModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg shadow-md transition-colors"
            >
              <div className="text-3xl mb-2">👥</div>
              <h3 className="text-lg font-semibold mb-1">Add Player</h3>
              <p className="text-sm opacity-90">Add players to your roster</p>
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg shadow-md transition-colors"
            >
              <div className="text-3xl mb-2">📊</div>
              <h3 className="text-lg font-semibold mb-1">View Players</h3>
              <p className="text-sm opacity-90">Manage your player roster ({filteredPlayers.length} players)</p>
            </button>
          </div>

          {/* Player List Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Player Roster ({filteredPlayers.length} players)
                </h2>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={playerSearchTerm}
                    onChange={(e) => setPlayerSearchTerm(e.target.value)}
                    className="block w-48 pl-9 pr-3 py-1 text-sm border border-gray-300 rounded-md leading-4 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search players..."
                  />
                </div>
              </div>
            </div>

            {filteredPlayers.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-400 text-5xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {playerSearchTerm ? 'No players found' : 'No players yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {playerSearchTerm ? 'Try a different search term' : 'Add your first player to get started'}
                </p>
                <button
                  onClick={() => setShowPlayerModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Add Player
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredPlayers.slice(0, 10).map((player) => (
                  <div key={player.id} className="px-6 py-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{player.name}</h4>
                        {player.email && (
                          <p className="text-xs text-gray-500">{player.email}</p>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {player.phone && `📱 ${player.phone}`}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredPlayers.length > 10 && (
                  <div className="px-6 py-3 text-center">
                    <p className="text-sm text-gray-500">
                      ... and {filteredPlayers.length - 10} more players
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Matches */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Matches
              </h2>
            </div>

            {matches.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-400 text-5xl mb-4">🏏</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No matches yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Create your first match to get started
                </p>
                <button
                  onClick={() => navigate('/create-match')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Create Match
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {matches.map((match) => (
                  <div key={match.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            {match.teamAName} vs {match.teamBName}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(match.status)}`}
                          >
                            {match.status}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          {match.overs} overs
                          {match.venue && ` • ${match.venue}`}
                          {match.startTime &&
                            ` • ${new Date(match.startTime).toLocaleDateString()}`}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {match.status === "UPCOMING" && (
                          <button
                            onClick={() => navigate(`/match/${match.id}/setup`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Setup
                          </button>
                        )}
                        {match.status === "LIVE" && (
                          <button
                            onClick={() => navigate(`/scoring/${match.id}`)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Score
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/match/${match.id}/view`)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Match Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Create New Match
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-0 right-0 mt-4 mr-4 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Team A Name
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter Team A name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Team B Name
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter Team B name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Overs
                  </label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="10">10 Overs</option>
                    <option value="20">20 Overs</option>
                    <option value="50">50 Overs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Venue (Optional)
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter venue name"
                  />
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  Create Match
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      {showPlayerModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Player</h3>
              
              <form onSubmit={handleCreatePlayer}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Player Name *</label>
                    <input
                      type="text"
                      required
                      value={newPlayer.name}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter player name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
                    <input
                      type="email"
                      value={newPlayer.email}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone (Optional)</label>
                    <input
                      type="tel"
                      value={newPlayer.phone}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowPlayerModal(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                  >
                    Add Player
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
