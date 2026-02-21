import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/axios';

interface Match {
  id: string;
  teamAName: string;
  teamBName: string;
  overs: number;
  venue?: string;
  status: string;
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

const Scoring: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  
  const [match, setMatch] = useState<Match | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state for adding ball
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
        
      } catch (error) {
        console.error('Failed to load scoring data:', error);
        setError('Failed to load match data');
      } finally {
        setLoading(false);
      }
    };

    loadScoringData();
  }, [matchId, navigate]);

  const handleAddBall = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!matchId) return;

    try {
      await api.post(`/matches/${matchId}/balls`, {
        runs: ballData.runs,
        extras: {
          wides: ballData.wides,
          noBalls: ballData.noBalls,
          byes: ballData.byes,
          legByes: ballData.legByes
        },
        wicket: ballData.isWicket ? {
          isWicket: true,
          type: ballData.wicketType,
          batsmanId: ballData.strikerId
        } : {
          isWicket: false
        },
        bowlerId: ballData.bowlerId,
        batsmanId: ballData.strikerId,
        strikerId: ballData.strikerId,
        nonStrikerId: '' // Placeholder - will be implemented when player management is added
      });

      // Reset form
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

  const handleUndoLastBall = async () => {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            {match.teamAName} vs {match.teamBName}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {match.venue && `${match.venue} •`} {match.overs} Overs
          </p>
        </div>

        {/* Score Display */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {score.teamAName} vs {score.teamBName}
              </h2>
              <div className="text-4xl font-bold text-blue-600 mb-4">
                {score.currentRunRate.toFixed(2)} Run Rate
              </div>
              <div className="text-lg text-gray-600">
                {score.overs} Overs • Innings {score.currentInnings}
              </div>
              {score.target && (
                <div className="text-lg text-gray-600 mt-2">
                  Target: {score.target}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Match Status</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className="text-sm font-medium">{score.status}</span>
                  </div>
                  {score.result && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Result:</span>
                      <span className="text-sm font-medium">{score.result}</span>
                    </div>
                  )}
                  {score.winner && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Winner:</span>
                      <span className="text-sm font-medium">{score.winner}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Match Info</h3>
                <div className="text-sm font-medium">
                  Match ID: {score.matchId}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ball Entry Form */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Add Ball</h2>
            
            <form onSubmit={handleAddBall} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Runs</label>
                <input
                  type="number"
                  min="0"
                  max="6"
                  value={ballData.runs}
                  onChange={(e) => setBallData({...ballData, runs: parseInt(e.target.value) || 0})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Wides</label>
                  <input
                    type="number"
                    min="0"
                    value={ballData.wides}
                    onChange={(e) => setBallData({...ballData, wides: parseInt(e.target.value) || 0})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">No Balls</label>
                  <input
                    type="number"
                    min="0"
                    value={ballData.noBalls}
                    onChange={(e) => setBallData({...ballData, noBalls: parseInt(e.target.value) || 0})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Byes</label>
                  <input
                    type="number"
                    min="0"
                    value={ballData.byes}
                    onChange={(e) => setBallData({...ballData, byes: parseInt(e.target.value) || 0})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Leg Byes</label>
                  <input
                    type="number"
                    min="0"
                    value={ballData.legByes}
                    onChange={(e) => setBallData({...ballData, legByes: parseInt(e.target.value) || 0})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={ballData.isWicket}
                    onChange={(e) => setBallData({...ballData, isWicket: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Wicket</span>
                </label>
              </div>

              {ballData.isWicket && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Wicket Type</label>
                  <select
                    value={ballData.wicketType}
                    onChange={(e) => setBallData({...ballData, wicketType: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select wicket type</option>
                    <option value="bowled">Bowled</option>
                    <option value="caught">Caught</option>
                    <option value="lbw">LBW</option>
                    <option value="runOut">Run Out</option>
                    <option value="stumped">Stumped</option>
                    <option value="hitWicket">Hit Wicket</option>
                  </select>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  Add Ball
                </button>
                <button
                  type="button"
                  onClick={handleUndoLastBall}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  Undo Last
                </button>
              </div>
            </form>
          </div>

          {/* Recent Balls */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Balls</h2>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {!score.innings || score.innings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No balls recorded yet</p>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Ball history will be available once match starts
                </p>
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
  );
};

export default Scoring;
