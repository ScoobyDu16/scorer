import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/axios';

interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  team: 'A' | 'B';
  isPlaying: boolean;
}


interface Match {
  id: string;
  teamAName: string;
  teamBName: string;
  overs: number;
  venue?: string;
  status: string;
  playersPerTeam: number;
}

interface Score {
  matchId: string;
  status: string;
  currentInnings: number;
  teamAName: string;
  teamBName: string;
  overs: number;
  target: number | null;
  currentRunRate: number;
  requiredRuns: number | null;
  requiredBalls: number | null;
  requiredRunRate: number | null;
  result: string | null;
  winner: string | null;
  winType: string | null;
  margin: number | null;
  manOfTheMatch: string | null;
  innings: any[];
  live: any;
}

const EnhancedScoring: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  
  const [match, setMatch] = useState<Match | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Ball entry state
  const [ballData, setBallData] = useState({
    runs: 0,
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
    isWicket: false,
    wicketType: '',
    strikerId: '',
    bowlerId: ''
  });

  // Player selection state
  const [currentPlayers, setCurrentPlayers] = useState({
    striker: '',
    nonStriker: '',
    bowler: ''
  });

  // Wicket details modal state
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketDetails, setWicketDetails] = useState({
    type: '',
    batsmanOut: '',
    helperBatsman: '',
    catcher: '',
    runOutBatsman: ''
  });

  // Initial player selection modal state
  const [showInitialSelectionModal, setShowInitialSelectionModal] = useState(false);
  const [initialSelection, setInitialSelection] = useState({
    striker: '',
    nonStriker: '',
    bowler: ''
  });

  // Bowler selection modal state
  const [showBowlerSelectionModal, setShowBowlerSelectionModal] = useState(false);
  const [newBowler, setNewBowler] = useState('');

  useEffect(() => {
    const loadScoringData = async () => {
      if (!matchId) {
        navigate('/dashboard');
        return;
      }

      try {
        // Load match details
        const matchResponse = await api.get(`/matches/${matchId}`);
        setMatch(matchResponse.data);

        // Load current score
        const scoreResponse = await api.get(`/matches/${matchId}/score`);
        setScore(scoreResponse.data);

        // Load players for this match
        const playersResponse = await api.get(`/matches/${matchId}/players`);
        setPlayers(playersResponse.data || []);
        
      } catch (error) {
        console.error('Failed to load scoring data:', error);
        setError('Failed to load match data');
      } finally {
        setLoading(false);
      }
    };

    loadScoringData();
  }, [matchId, navigate]);

  // Check if initial player selection is needed
  // useEffect(() => {
//   if (score && !loading) {
//     const currentInnings = score.innings?.find(innings => innings.inningsNumber === score.currentInnings);
//     // Show modal if no balls recorded yet or if currentPlayers is empty
//     if (currentInnings && (!currentPlayers.striker || !currentPlayers.nonStriker || !currentPlayers.bowler)) {
//       setShowInitialSelectionModal(true);
//     }
//   }
// }, [score, loading, currentPlayers]);

  // Helper functions to get players by team and role
  const getBattingTeamPlayers = () => {
    if (!score || !score.innings.length) return [];
    const currentInnings = score.innings.find(innings => innings.inningsNumber === score.currentInnings);
    if (!currentInnings) return [];
    
    return players.filter(player => player.team === currentInnings.battingTeam);
  };

  const getBowlingTeamPlayers = () => {
    if (!score || !score.innings.length) return [];
    const currentInnings = score.innings.find(innings => innings.inningsNumber === score.currentInnings);
    if (!currentInnings) return [];
    
    return players.filter(player => player.team !== currentInnings.battingTeam);
  };

  // Derive current players from balls (event-driven approach)
  const deriveCurrentPlayers = () => {
    if (!score?.live) {
      return { striker: '', nonStriker: '', bowler: '' };
    }

    const result = {
      striker: score.live.striker?.id || '',
      nonStriker: score.live.nonStriker?.id || '',
      bowler: score.live.bowler?.id || ''
    };

    return result;
  };

  const isPlayerSelectionValid = () => {
    // For initial validation, use currentPlayers state
    // For subsequent balls, use derived players
    const players = currentPlayers.striker ? currentPlayers : deriveCurrentPlayers();
    return players.striker && 
           players.nonStriker && 
           players.bowler &&
           players.striker !== players.nonStriker;
  };

  // Handle initial player selection
  const handleInitialSelectionSubmit = async () => {
    if (!initialSelection.striker || !initialSelection.nonStriker || !initialSelection.bowler) {
      setError('Please select all players');
      return;
    }
    
    if (initialSelection.striker === initialSelection.nonStriker) {
      setError('Striker and non-striker must be different');
      return;
    }

    try {
      // Start innings with opening players
      await api.post(`/matches/${matchId}/start-with-players`, {
        strikerId: initialSelection.striker,
        nonStrikerId: initialSelection.nonStriker,
        bowlerId: initialSelection.bowler
      });

      // Set initial players - this will be used only for the first ball
      setCurrentPlayers({
        striker: initialSelection.striker,
        nonStriker: initialSelection.nonStriker,
        bowler: initialSelection.bowler
      });

      setShowInitialSelectionModal(false);
      
      // Reload score to get the updated match data
      const scoreResponse = await api.get(`/matches/${matchId}/score`);
      setScore(scoreResponse.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to start innings');
    }
  };

  // Handle bowler selection after over
  const handleBowlerSelectionSubmit = async () => {
    if (!newBowler) {
      setError('Please select a bowler');
      return;
    }

    const current = deriveCurrentPlayers();
    if (newBowler === current.bowler) {
      setError('Same bowler cannot bowl consecutive overs');
      return;
    }

    setCurrentPlayers(prev => ({ ...prev, bowler: newBowler }));
    setNewBowler('');
    setShowBowlerSelectionModal(false);
  };

  
  const handleAddBall = async (runs: number) => {
    if (!matchId) return;

    try {
      // Calculate extras
      let extraType = null;
      let extraRuns = 0;
      let isLegalDelivery = true;

      if (ballData.wides > 0) {
        extraType = 'WIDE';
        extraRuns += ballData.wides;
        isLegalDelivery = false;
      }
      if (ballData.noBalls > 0) {
        extraType = extraType ? 'NO_BALL' : 'NO_BALL';
        extraRuns += ballData.noBalls;
        isLegalDelivery = false;
      }
      if (ballData.byes > 0) {
        extraRuns += ballData.byes;
      }
      if (ballData.legByes > 0) {
        extraRuns += ballData.legByes;
      }

      // Use currentPlayers for first ball, derived players for subsequent balls
      const current = currentPlayers.striker ? currentPlayers : deriveCurrentPlayers();

      const payload = {
        runs: ballData.isWicket && runs === 0 ? 0 : runs,
        extraType,
        extraRuns,
        isWicket: ballData.isWicket,
        wicketType: ballData.wicketType || null,
        dismissedPlayerId: ballData.isWicket ? current.striker : null,
        isLegalDelivery,
        batsmanId: current.striker,
        bowlerId: current.bowler,
        strikerId: current.striker,
        nonStrikerId: current.nonStriker
      };

      await api.post(`/matches/${matchId}/balls`, payload);
      
      // Reset ball data
      setBallData({
        runs: 0,
        wides: 0,
        noBalls: 0,
        byes: 0,
        legByes: 0,
        isWicket: false,
        wicketType: '',
        strikerId: '',
        bowlerId: ''
      });

      // Reload score
      const scoreResponse = await api.get(`/matches/${matchId}/score`);
      setScore(scoreResponse.data);
      
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add ball');
    }
  };

  const handleWicket = () => {
    if (ballData.runs === 0) {
      setShowWicketModal(true);
    } else {
      // For run-outs, add runs and then show wicket modal
      handleAddBall(ballData.runs);
      setTimeout(() => setShowWicketModal(true), 100);
    }
  };

  const handleSwapStrike = () => {
    const current = deriveCurrentPlayers();
    if (current.striker && current.nonStriker) {
      setCurrentPlayers(prev => ({
        ...prev,
        striker: current.nonStriker,
        nonStriker: current.striker
      }));
    }
  };

  const handleRetire = () => {
    // TODO: Implement retire batsman functionality
    console.log('Retire batsman functionality to be implemented');
  };

  const handleUndoBall = async () => {
    if (!matchId) return;

    try {
      await api.delete(`/matches/${matchId}/balls/last`);
      
      // Reload score
      const scoreResponse = await api.get(`/matches/${matchId}/score`);
      setScore(scoreResponse.data);
      
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to undo last ball');
    }
  };

  const handleWicketSubmit = async () => {
    if (!matchId) return;

    try {
      const current = deriveCurrentPlayers();

      const payload = {
        runs: 0,
        extraType: null,
        extraRuns: 0,
        isWicket: true,
        wicketType: wicketDetails.type,
        batsmanId: current.striker,
        ...(wicketDetails.type === 'caught' && {
          caughtBy: wicketDetails.catcher
        }),
        ...(wicketDetails.type === 'runOut' && {
          runOutBatsmanId: wicketDetails.runOutBatsman,
          helperBatsmanId: wicketDetails.helperBatsman
        })
      };

      await api.post(`/matches/${matchId}/balls`, payload);
      
      // Update striker for next batsman
      const currentPlayers = deriveCurrentPlayers();
      if (wicketDetails.type === 'runOut') {
        setCurrentPlayers(prev => ({
          ...prev,
          striker: wicketDetails.helperBatsman
        }));
      } else {
        // Find next batsman who hasn't batted yet
        const nextBatsman = players.find(p => 
          p.id !== currentPlayers.striker && 
          p.id !== currentPlayers.nonStriker && 
          p.id !== wicketDetails.runOutBatsman && 
          p.id !== wicketDetails.helperBatsman
        );
        if (nextBatsman) {
          setCurrentPlayers(prev => ({
            ...prev,
            striker: nextBatsman.id
          }));
        }
      }

      setShowWicketModal(false);
      setWicketDetails({
        type: '',
        batsmanOut: '',
        helperBatsman: '',
        catcher: '',
        runOutBatsman: ''
      });

      // Reload score
      const scoreResponse = await api.get(`/matches/${matchId}/score`);
      setScore(scoreResponse.data);
      
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to record wicket');
    }
  };

  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading scoring...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!match || !score) {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            {match.teamAName} vs {match.teamBName}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {match.venue && `${match.venue} •`} {match.overs} Overs • Innings {score?.currentInnings || 1}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Score Display */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {match.teamAName} Batting
                </h2>
                <div className="text-5xl font-bold text-blue-600 mb-4">
                  {score?.innings?.find(i => i.inningsNumber === score?.currentInnings)?.totalRuns || 0}/{score?.innings?.find(i => i.inningsNumber === score?.currentInnings)?.totalWickets || 0}
                </div>
                <div className="text-lg text-gray-600">
                  Run Rate: {score?.currentRunRate?.toFixed(2) || '0.00'} • Overs: {score?.innings?.find(i => i.inningsNumber === score?.currentInnings)?.totalOvers?.toFixed(1) || '0.0'}
                </div>
              </div>

              
              <div className="flex space-x-4">
                <button
                  onClick={handleSwapStrike}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isPlayerSelectionValid()}
                >
                  Swap Strike
                </button>
                <button
                  onClick={handleRetire}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isPlayerSelectionValid()}
                >
                  Retire
                </button>
              </div>
            </div>
          </div>

          {/* Ball Entry */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Add Ball</h2>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Run Buttons */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Runs</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6].map(runs => (
                      <button
                        key={runs}
                        onClick={() => handleAddBall(runs)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!isPlayerSelectionValid() || (ballData.isWicket && runs === 0)}
                      >
                        {runs}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extras */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Extras</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={ballData.wides > 0}
                        onChange={(e) => setBallData(prev => ({ ...prev, wides: e.target.checked ? 1 : 0 }))}
                        className="mr-2"
                      />
                      <label className="text-sm">Wide Ball</label>
                      {ballData.wides > 0 && (
                        <input
                          type="number"
                          min="0"
                          value={ballData.runs}
                          onChange={(e) => setBallData(prev => ({ ...prev, runs: parseInt(e.target.value) || 0 }))}
                          className="w-16 border border-gray-300 rounded px-2 py-1"
                          placeholder="Runs"
                        />
                      )}
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={ballData.noBalls > 0}
                        onChange={(e) => setBallData(prev => ({ ...prev, noBalls: e.target.checked ? 1 : 0 }))}
                        className="mr-2"
                      />
                      <label className="text-sm">No Ball</label>
                      {ballData.noBalls > 0 && (
                        <input
                          type="number"
                          min="0"
                          value={ballData.runs}
                          onChange={(e) => setBallData(prev => ({ ...prev, runs: parseInt(e.target.value) || 0 }))}
                          className="w-16 border border-gray-300 rounded px-2 py-1"
                          placeholder="Runs"
                        />
                      )}
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={ballData.byes > 0}
                        onChange={(e) => setBallData(prev => ({ ...prev, byes: e.target.checked ? 1 : 0 }))}
                        className="mr-2"
                      />
                      <label className="text-sm">Byes</label>
                      {ballData.byes > 0 && (
                        <input
                          type="number"
                          min="0"
                          value={ballData.runs}
                          onChange={(e) => setBallData(prev => ({ ...prev, runs: parseInt(e.target.value) || 0 }))}
                          className="w-16 border border-gray-300 rounded px-2 py-1"
                          placeholder="Runs"
                        />
                      )}
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={ballData.legByes > 0}
                        onChange={(e) => setBallData(prev => ({ ...prev, legByes: e.target.checked ? 1 : 0 }))}
                        className="mr-2"
                      />
                      <label className="text-sm">Leg Byes</label>
                      {ballData.legByes > 0 && (
                        <input
                          type="number"
                          min="0"
                          value={ballData.runs}
                          onChange={(e) => setBallData(prev => ({ ...prev, runs: parseInt(e.target.value) || 0 }))}
                          className="w-16 border border-gray-300 rounded px-2 py-1"
                          placeholder="Runs"
                        />
                      )}
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={ballData.isWicket}
                        onChange={(e) => setBallData(prev => ({ ...prev, isWicket: e.target.checked }))}
                        className="mr-2"
                      />
                      <label className="text-sm">Wicket</label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={handleWicket}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isPlayerSelectionValid()}
                  >
                    Wicket
                  </button>
                  <button
                    onClick={handleSwapStrike}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isPlayerSelectionValid()}
                  >
                    Swap Strike
                  </button>
                  <button
                    onClick={handleUndoBall}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                  >
                    Undo
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Player Statistics */}
          <div className="lg:col-span-3 space-y-6">
            {/* Batsmen Stats */}
            {(score?.live?.striker || currentPlayers.striker) && (
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Batsmen</h3>
                <div className="space-y-3">
                  {/* Striker */}
                  <div className="border-b pb-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {score?.live?.striker?.name || players.find(p => p.id === currentPlayers.striker)?.name || 'Unknown'} *
                      </span>
                      <span className="text-sm text-gray-600"> striker</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm mt-2">
                      <div>R: {score?.live?.striker?.runs || 0}</div>
                      <div>B: {score?.live?.striker?.balls || 0}</div>
                      <div>4s: 0</div>
                      <div>6s: 0</div>
                      <div>SR: {score?.live?.striker?.balls > 0 ? ((score.live.striker.runs / score.live.striker.balls) * 100).toFixed(2) : '0.00'}</div>
                    </div>
                  </div>
                  {/* Non-Striker */}
                  {(score?.live?.nonStriker || currentPlayers.nonStriker) && (
                    <div className="border-b pb-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {score?.live?.nonStriker?.name || players.find(p => p.id === currentPlayers.nonStriker)?.name || 'Unknown'}
                        </span>
                        <span className="text-sm text-gray-600"> non-striker</span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm mt-2">
                        <div>R: {score?.live?.nonStriker?.runs || 0}</div>
                        <div>B: {score?.live?.nonStriker?.balls || 0}</div>
                        <div>4s: 0</div>
                        <div>6s: 0</div>
                        <div>SR: {score?.live?.nonStriker?.balls > 0 ? ((score.live.nonStriker.runs / score.live.nonStriker.balls) * 100).toFixed(2) : '0.00'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bowler Stats */}
            {(score?.live?.bowler || currentPlayers.bowler) && (
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bowler</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {score?.live?.bowler?.name || players.find(p => p.id === currentPlayers.bowler)?.name || 'Unknown'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                    <div>O: {score?.live?.bowler?.overs || '0.0'}</div>
                    <div>R: {score?.live?.bowler?.runs || 0}</div>
                    <div>W: {score?.live?.bowler?.wickets || 0}</div>
                    <div>Eco: {score?.live?.bowler?.overs > 0 ? (score.live.bowler.runs / score.live.bowler.overs).toFixed(2) : '0.00'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Balls */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Balls</h2>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {score?.live?.lastOver?.map((ball: string, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">
                        Ball {index + 1}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {ball}
                      </span>
                    </div>
                  </div>
                ))}
                {(!score?.live?.lastOver || score?.live?.lastOver?.length === 0) && (
                  <div className="text-center text-gray-500 py-8">
                    No balls recorded yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-md font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Wicket Modal */}
      {showWicketModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Wicket Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Wicket Type</label>
                  <select
                    value={wicketDetails.type}
                    onChange={(e) => setWicketDetails(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select wicket type</option>
                    <option value="bowled">Bowled</option>
                    <option value="caught">Caught</option>
                    <option value="lbw">LBW</option>
                    <option value="stumping">Stumping</option>
                    <option value="hitWicket">Hit Wicket</option>
                    <option value="runOut">Run Out</option>
                  </select>
                </div>

                {wicketDetails.type === 'caught' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Catcher</label>
                    <select
                      value={wicketDetails.catcher}
                      onChange={(e) => setWicketDetails(prev => ({ ...prev, catcher: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select catcher</option>
                      {players.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {wicketDetails.type === 'runOut' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Batsman Out</label>
                      <select
                        value={wicketDetails.runOutBatsman}
                        onChange={(e) => setWicketDetails(prev => ({ ...prev, runOutBatsman: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Select batsman out</option>
                        {players.map(player => (
                          <option key={player.id} value={player.id}>
                            {player.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Helper Batsman</label>
                      <select
                        value={wicketDetails.helperBatsman}
                        onChange={(e) => setWicketDetails(prev => ({ ...prev, helperBatsman: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Select helper</option>
                        {players.map(player => (
                          <option key={player.id} value={player.id}>
                            {player.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">New Batsman</label>
                  <select
                    value={wicketDetails.batsmanOut}
                    onChange={(e) => setWicketDetails(prev => ({ ...prev, batsmanOut: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select new batsman</option>
                    {players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowWicketModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWicketSubmit}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                  disabled={!wicketDetails.type || (wicketDetails.type === 'runOut' && (!wicketDetails.runOutBatsman || !wicketDetails.helperBatsman))}
                >
                  Record Wicket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Initial Player Selection Modal */}
      {showInitialSelectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Players to Start Innings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Striker *</label>
                <select
                  value={initialSelection.striker}
                  onChange={(e) => setInitialSelection(prev => ({ ...prev, striker: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select Striker</option>
                  {getBattingTeamPlayers().map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Non-Striker *</label>
                <select
                  value={initialSelection.nonStriker}
                  onChange={(e) => setInitialSelection(prev => ({ ...prev, nonStriker: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select Non-Striker</option>
                  {getBattingTeamPlayers().map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bowler *</label>
                <select
                  value={initialSelection.bowler}
                  onChange={(e) => setInitialSelection(prev => ({ ...prev, bowler: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select Bowler</option>
                  {getBowlingTeamPlayers().map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowInitialSelectionModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleInitialSelectionSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Start Scoring
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bowler Selection Modal */}
      {showBowlerSelectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select New Bowler</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Next Bowler *</label>
                <select
                  value={newBowler}
                  onChange={(e) => setNewBowler(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select Bowler</option>
                  {getBowlingTeamPlayers()
                    .filter(player => player.id !== currentPlayers.bowler)
                    .map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowBowlerSelectionModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleBowlerSelectionSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedScoring;
