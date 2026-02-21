import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/axios';

interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface TeamPlayers {
  A: Player[];
  B: Player[];
}

const PlayerManagement: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  
  const [match, setMatch] = useState<any>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayers>({
    A: [],
    B: []
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!matchId) {
        navigate('/dashboard');
        return;
      }

      try {
        // Load match details
        const matchResponse = await api.get(`/matches/${matchId}`);
        setMatch(matchResponse.data);

        // Load all players
        const playersResponse = await api.get('/players');
        setAllPlayers(playersResponse.data);
        
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Failed to load match data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [matchId, navigate]);

  const handleCreatePlayer = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const response = await api.post('/players', newPlayer);
    setAllPlayers(prev => [...prev, response.data]);
    setNewPlayer({ name: '', email: '', phone: '' });
    setShowAddPlayerModal(false);
  } catch (error: any) {
    console.error('Failed to create player:', error);
    alert(error.response?.data?.message || 'Failed to create player');
  }
};

  const handlePlayerSelect = (playerId: string, team: 'A' | 'B') => {
    const player = allPlayers.find(p => p.id === playerId);
    if (!player) return;

    setTeamPlayers(prev => {
      const otherTeam = team === 'A' ? 'B' : 'A';
      
      // Remove player from other team if selected there
      const otherTeamPlayers = prev[otherTeam].filter((player: Player) => player.id !== playerId);
      
      // Add to selected team if not already there
      const selectedTeamPlayers = prev[team].find((player: Player) => player.id === playerId)
        ? prev[team]
        : [...prev[team], player];

      return {
        ...prev,
        [team]: selectedTeamPlayers,
        [otherTeam]: otherTeamPlayers
      };
    });
  };

  const handleRemovePlayer = (playerId: string, team: 'A' | 'B') => {
    setTeamPlayers(prev => ({
      ...prev,
      [team]: prev[team].filter((player: Player) => player.id !== playerId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (teamPlayers.A.length !== teamPlayers.B.length) {
      setError('Both teams must have the same number of players');
      return;
    }

    const expectedPlayers = match?.playersPerTeam || 11;
    if (teamPlayers.A.length !== expectedPlayers) {
      setError(`Each team must have exactly ${expectedPlayers} players`);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Add players to match
      const playersData = [
        ...teamPlayers.A.map(player => ({ playerId: player.id, team: 'A' })),
        ...teamPlayers.B.map(player => ({ playerId: player.id, team: 'B' }))
      ];

      await api.post(`/matches/${matchId}/players`, { players: playersData });
      
      setSuccess('Players added successfully! Redirecting to match setup...');
      
      setTimeout(() => {
        navigate(`/match/${matchId}/setup`);
      }, 2000);
      
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add players');
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailablePlayers = (team: 'A' | 'B') => {
    const otherTeam = team === 'A' ? 'B' : 'A';
    const selectedOtherTeamIds = teamPlayers[otherTeam].map((player: Player) => player.id);
    
    return allPlayers
      .filter((player: Player) => 
        !teamPlayers[team].find((selectedPlayer: Player) => selectedPlayer.id === player.id) && 
        !selectedOtherTeamIds.includes(player.id) &&
        (searchTerm === '' || player.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a: Player, b: Player) => a.name.localeCompare(b.name));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading players...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-5xl mb-4">🏏</div>
          <h2 className="text-xl font-semibold text-gray-900">Match not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Add Players
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {match.teamAName} vs {match.teamBName} • {match.playersPerTeam} players per team
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search players by name..."
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Team A */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {match.teamAName}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Players ({teamPlayers.A.length}/{match.playersPerTeam})
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md">
                  {teamPlayers.A.sort((a: Player, b: Player) => a.name.localeCompare(b.name)).map((player: Player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 border-b border-gray-200 hover:bg-gray-50">
                      <span className="text-sm font-medium">{player.name}</span>
                      <button
                        onClick={() => handleRemovePlayer(player.id, 'A')}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Players
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md p-2">
                  <button
                    onClick={() => setShowAddPlayerModal(true)}
                    className="w-full text-left px-3 py-2 mb-2 bg-green-50 border border-green-200 rounded-md text-green-700 font-medium hover:bg-green-100"
                  >
                    + Add New Player
                  </button>
                  {getAvailablePlayers('A').map(player => (
                    <button
                      key={player.id}
                      onClick={() => handlePlayerSelect(player.id, 'A')}
                      className="w-full text-left px-3 py-2 mb-1 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-md text-gray-700 hover:text-blue-700 hover:border-blue-200 transition-colors"
                    >
                      {player.name}
                    </button>
                  ))}
                  {getAvailablePlayers('A').length === 0 && (
                    <p className="text-gray-500 text-center py-4">No available players</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Team B */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {match.teamBName}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Players ({teamPlayers.B.length}/{match.playersPerTeam})
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md">
                  {teamPlayers.B.sort((a: Player, b: Player) => a.name.localeCompare(b.name)).map((player: Player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 border-b border-gray-200 hover:bg-gray-50">
                      <span className="text-sm font-medium">{player.name}</span>
                      <button
                        onClick={() => handleRemovePlayer(player.id, 'B')}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Players
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md p-2">
                  <button
                    onClick={() => setShowAddPlayerModal(true)}
                    className="w-full text-left px-3 py-2 mb-2 bg-green-50 border border-green-200 rounded-md text-green-700 font-medium hover:bg-green-100"
                  >
                    + Add New Player
                  </button>
                  {getAvailablePlayers('B').map(player => (
                    <button
                      key={player.id}
                      onClick={() => handlePlayerSelect(player.id, 'B')}
                      className="w-full text-left px-3 py-2 mb-1 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-md text-gray-700 hover:text-blue-700 hover:border-blue-200 transition-colors"
                    >
                      {player.name}
                    </button>
                  ))}
                  {getAvailablePlayers('B').length === 0 && (
                    <p className="text-gray-500 text-center py-4">No available players</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            disabled={submitting || teamPlayers.A.length !== match.playersPerTeam || teamPlayers.B.length !== match.playersPerTeam}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Adding Players...' : 'Add Players to Match'}
          </button>
          
          <div className="mt-4 space-x-4">
            <button
              onClick={() => navigate(`/match/${matchId}/setup`)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-md font-medium"
            >
              Back to Setup
            </button>
          </div>
        </div>
      </div>

      {/* Add Player Modal */}
      {showAddPlayerModal && (
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
                    onClick={() => setShowAddPlayerModal(false)}
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

export default PlayerManagement;
