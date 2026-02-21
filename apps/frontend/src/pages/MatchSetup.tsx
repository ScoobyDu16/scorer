import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/axios";
import { useState, useEffect } from "react";

interface Match {
  id: string;
  teamAName: string;
  teamBName: string;
  overs: number;
  venue?: string;
  status: string;
  tossWinner?: "A" | "B";
  tossDecision?: "BAT" | "BOWL";
}

interface AccessCode {
  id: string;
  code: string;
  matchId: string;
  expiresAt: string;
}

const MatchSetup: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();

  const [match, setMatch] = useState<Match | null>(null);
  const [accessCode, setAccessCode] = useState<AccessCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [accessCodeValidated, setAccessCodeValidated] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [showPlayerSelectionModal, setShowPlayerSelectionModal] =
    useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [initialSelection, setInitialSelection] = useState({
    striker: "",
    nonStriker: "",
    bowler: "",
  });

  useEffect(() => {
    const loadMatchData = async () => {
      if (!matchId) {
        navigate("/dashboard");
        return;
      }

      try {
        // Load match details
        const matchResponse = await api.get(`/matches/${matchId}`);
        setMatch(matchResponse.data);

        // Load access code from backend
        const accessCodeResponse = await api.get(`/access-codes/${matchId}`);
        setAccessCode(accessCodeResponse.data);

        // Load players for the match
        const playersResponse = await api.get(`/matches/${matchId}/players`);
        setPlayers(playersResponse.data);
      } catch (error) {
        console.error("Failed to load match data:", error);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadMatchData();
  }, [matchId, navigate]);

  const handleStartMatch = async () => {
    if (!match) return;

    try {
      // Show player selection modal
      setShowPlayerSelectionModal(true);
    } catch (error: any) {
      console.error("Failed to show player selection:", error);
    }
  };

  const handleValidateAccessCode = async () => {
    if (!accessCode) return;

    try {
      setValidationError("");
      await api.post("/access-codes/validate", {
        matchId,
        code: accessCode.code,
      });
      setAccessCodeValidated(true);
    } catch (error: any) {
      setValidationError(
        error.response?.data?.message || "Invalid access code",
      );
      setAccessCodeValidated(false);
    }
  };

  const handleShareAccess = () => {
    if (accessCode?.code) {
      const shareUrl = `${window.location.origin}/access/${matchId}`;
      navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Handle player selection modal
  const handlePlayerSelectionSubmit = async () => {
    if (!initialSelection.striker || !initialSelection.nonStriker || !initialSelection.bowler) {
      setValidationError("Please select all players");
      return;
    }
    
    if (initialSelection.striker === initialSelection.nonStriker) {
      setValidationError("Striker and non-striker must be different");
      return;
    }

    try {
      // Update innings with opening players (toss already set)
      await api.post(`/matches/${matchId}/start-with-players`, {
        strikerId: initialSelection.striker,
        nonStrikerId: initialSelection.nonStriker,
        bowlerId: initialSelection.bowler
      });

      // Close modal and navigate to scoring page
      setShowPlayerSelectionModal(false);
      navigate(`/scoring/${matchId}`);
    } catch (error: any) {
      setValidationError(
        error.response?.data?.message || "Failed to start innings",
      );
    }
  };

  const handlePlayerSelectionCancel = () => {
    setShowPlayerSelectionModal(false);
    setInitialSelection({ striker: "", nonStriker: "", bowler: "" });
    setValidationError("");
  };

  // Helper functions to get players by team
  const getBattingPlayers = () => {
    if (!match || !match.tossWinner || !match.tossDecision) {
      console.log('getBattingPlayers: No match or toss data');
      return [];
    }
    const battingTeam =
      match.tossDecision === "BAT"
        ? match.tossWinner
        : match.tossWinner === "A"
          ? "B"
          : "A";
    console.log("getBattingPlayers:", {
      tossWinner: match.tossWinner,
      tossDecision: match.tossDecision,
      battingTeam,
    });
    const battingPlayers = players.filter((p) => p.team === battingTeam);
    console.log("getBattingPlayers result:", battingPlayers);
    return battingPlayers;
  };

  const getBowlingPlayers = () => {
    if (!match || !match.tossWinner || !match.tossDecision) {
      console.log('getBowlingPlayers: No match or toss data');
      return [];
    }
    const bowlingTeam =
      match.tossDecision === "BAT"
        ? match.tossWinner === "A"
          ? "B"
          : "A"
        : match.tossWinner;
    console.log("getBowlingPlayers:", {
      tossWinner: match.tossWinner,
      tossDecision: match.tossDecision,
      bowlingTeam,
    });
    const bowlingPlayers = players.filter((p) => p.team === bowlingTeam);
    console.log("getBowlingPlayers result:", bowlingPlayers);
    console.log("All players structure:", players);
    return bowlingPlayers;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading match setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-xl rounded-lg">
          {/* Match Header */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Cricket Match Setup
                </h1>
                <p className="text-blue-100 text-sm">
                  Configure your match settings
                </p>
              </div>
              <div className="text-blue-100 text-sm">
                {match?.venue && <span>📍 {match.venue}</span>}
                <span className="ml-2">🏏 {match?.overs} Overs</span>
              </div>
            </div>
          </div>

          {/* Match Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team A */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">A</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {match?.teamAName}
                    </h3>
                    <p className="text-gray-600">Team A</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Match ID:</strong> {match?.id}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Status:</strong>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        match?.status === "UPCOMING"
                          ? "bg-yellow-100 text-yellow-800"
                          : match?.status === "LIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {match?.status}
                    </span>
                  </p>
                </div>
              </div>

              {/* Team B */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">B</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {match?.teamBName}
                    </h3>
                    <p className="text-gray-600">Team B</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Match ID:</strong> {match?.id}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Status:</strong>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        match?.status === "UPCOMING"
                          ? "bg-yellow-100 text-yellow-800"
                          : match?.status === "LIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {match?.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Access Code Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Access Code
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Access Code
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={accessCode?.code || ""}
                        onChange={(e) =>
                          setAccessCode({
                            ...accessCode!,
                            code: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter access code"
                      />
                      <button
                        onClick={handleShareAccess}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        {copySuccess ? "✅ Copied!" : "📋 Share Link"}
                      </button>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleValidateAccessCode}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                    >
                      Validate
                    </button>
                    {accessCode && (
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(accessCode.code)
                        }
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                      >
                        📱 Copy Code: {accessCode.code}
                      </button>
                    )}
                  </div>
                </div>
                {validationError && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {validationError}
                  </div>
                )}
                {!accessCodeValidated && (
                  <div className="text-sm text-green-700">
                    ✅ Access code has been validated. You can now start the
                    match.
                  </div>
                )}
                {accessCodeValidated && accessCode && (
                  <div className="text-sm text-yellow-700">
                    ⚠️ Access code will expire on{" "}
                    {new Date(accessCode.expiresAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 text-center space-x-4">
              <button
                onClick={handleStartMatch}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  !match ||
                  match.status !== "UPCOMING" ||
                  !accessCodeValidated
                }
              >
                {!match
                  ? "Loading..."
                  : match.status === "UPCOMING"
                    ? accessCodeValidated
                      ? "🏏 Select Players"
                      : "🔒 Validate Access Code First"
                    : "⚡ Match Already Started"}
              </button>

              <button
                onClick={() => navigate(`/match/${matchId}/players`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
              >
                Add Players
              </button>
            </div>
          </div>
        </div>

        {/* Player Selection Modal */}
        {showPlayerSelectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Select Opening Players
              </h2>

              {validationError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {validationError}
                </div>
              )}

              <div className="space-y-4">
                {/* Striker Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Striker
                  </label>
                  <select
                    value={initialSelection.striker}
                    onChange={(e) =>
                      setInitialSelection((prev) => ({
                        ...prev,
                        striker: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select striker</option>
                    {getBattingPlayers().map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Non-Striker Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Non-Striker
                  </label>
                  <select
                    value={initialSelection.nonStriker}
                    onChange={(e) =>
                      setInitialSelection((prev) => ({
                        ...prev,
                        nonStriker: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select non-striker</option>
                    {getBattingPlayers()
                      .filter((player) => player.id !== initialSelection.striker)
                      .map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Bowler Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opening Bowler
                  </label>
                  <select
                    value={initialSelection.bowler}
                    onChange={(e) =>
                      setInitialSelection((prev) => ({
                        ...prev,
                        bowler: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select bowler</option>
                    {getBowlingPlayers().map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handlePlayerSelectionCancel}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlayerSelectionSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  Start Match
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchSetup;
