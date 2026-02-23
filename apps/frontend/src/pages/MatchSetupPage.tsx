import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { playerAPI, matchAPI } from "../lib/auth";
import { useNavigate, useParams } from "react-router-dom";

interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface MatchSetupData {
  matchId: string;
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  playersPerTeam: number;
}

export const MatchSetupPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<"A" | "B">("A");

  // Get match info from localStorage
  const [matchData, setMatchData] = useState<MatchSetupData | null>(null);

  useEffect(() => {
    const storedMatch = localStorage.getItem("currentMatch");
    if (storedMatch) {
      const parsed = JSON.parse(storedMatch);
      // Handle both old and new response structures
      const matchData = parsed.match
        ? {
            matchId: parsed.matchId,
            playersPerTeam: parsed.match.playersPerTeam,
            teamAPlayers: [],
            teamBPlayers: [],
          }
        : {
            matchId: parsed.matchId,
            playersPerTeam: parsed.playersPerTeam || 11,
            teamAPlayers: [],
            teamBPlayers: [],
          };
      setMatchData(matchData);
    }
  }, []);

  // Fetch all players
  const { data: playersData, isLoading } = useQuery({
    queryKey: ["players"],
    queryFn: () => playerAPI.getPlayers(),
  });

  const allPlayers = playersData?.players || [];

  // Filter and sort players
  const availablePlayers = allPlayers
    .filter(
      (player) =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !teamAPlayers.some((p) => p.id === player.id) &&
        !teamBPlayers.some((p) => p.id === player.id),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  // Add players to match mutation
  const addPlayersMutation = useMutation({
    mutationFn: (data: { matchId: string; players: any[] }) => {
      // Call the real backend API to add players to match
      return matchAPI.addMatchPlayers(data.matchId, data.players);
    },
    onSuccess: () => {
      setShowPlayerSelectionModal(true);
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
    onError: (error: any) => {
      alert(`Error adding players: ${error.message}`);
    },
  });

  // Player selection state
  const [showPlayerSelectionModal, setShowPlayerSelectionModal] =
    useState(false);
  const [selectedStriker, setSelectedStriker] = useState<string>("");
  const [selectedNonStriker, setSelectedNonStriker] = useState<string>("");
  const [selectedBowler, setSelectedBowler] = useState<string>("");

  const addPlayerToTeam = (player: Player) => {
    const maxPlayers = matchData?.playersPerTeam || 11;

    if (selectedTeam === "A") {
      if (teamAPlayers.length < maxPlayers) {
        setTeamAPlayers([...teamAPlayers, player]);
      }
    } else {
      if (teamBPlayers.length < maxPlayers) {
        setTeamBPlayers([...teamBPlayers, player]);
      }
    }
  };

  const removePlayerFromTeam = (playerId: string, team: "A" | "B") => {
    if (team === "A") {
      setTeamAPlayers(teamAPlayers.filter((p) => p.id !== playerId));
    } else {
      setTeamBPlayers(teamBPlayers.filter((p) => p.id !== playerId));
    }
  };

  const canAddMorePlayers = () => {
    const maxPlayers = matchData?.playersPerTeam || 11;
    const currentTeam = selectedTeam === "A" ? teamAPlayers : teamBPlayers;
    return currentTeam.length < maxPlayers;
  };

  const isSetupComplete = () => {
    const maxPlayers = matchData?.playersPerTeam || 11;
    return (
      teamAPlayers.length === maxPlayers && teamBPlayers.length === maxPlayers
    );
  };

  const handleSubmitPlayers = () => {
    if (!isSetupComplete()) return;

    const allMatchPlayers = [
      ...teamAPlayers.map((player) => ({ playerId: player.id, team: "A" })),
      ...teamBPlayers.map((player) => ({ playerId: player.id, team: "B" })),
    ];

    addPlayersMutation.mutate({ matchId: matchId!, players: allMatchPlayers });
  };

  const canStartMatch = () => {
    return isSetupComplete() && showPlayerSelectionModal;
  };

  const startMatchMutation = useMutation({
    mutationFn: (data: {
      matchId: string;
      strikerId: string;
      nonStrikerId: string;
      bowlerId: string;
    }) => matchAPI.startMatch(data.matchId, data),
    onSuccess: () => {
      // Pass opening bowler state to ScoringPage via navigation state
      navigate(`/scoring/${matchId}`);
    },
    onError: (error: any) => {
      alert(`Error starting match: ${error.message}`);
    },
  });

  const handleStartMatch = () => {
    if (!selectedStriker || !selectedNonStriker || !selectedBowler) {
      alert("Please select striker, non-striker, and bowler");
      return;
    }
    startMatchMutation.mutate({
      matchId: matchId!,
      strikerId: selectedStriker,
      nonStrikerId: selectedNonStriker,
      bowlerId: selectedBowler,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-red-600">
          Match data not found. Please validate access code again.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Match Setup
              </h1>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search players..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Team Selection Tabs */}
              <div className="mb-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setSelectedTeam("A")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        selectedTeam === "A"
                          ? "border-green-500 text-green-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Team A ({teamAPlayers.length}/
                      {matchData?.playersPerTeam || 11})
                    </button>
                    <button
                      onClick={() => setSelectedTeam("B")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        selectedTeam === "B"
                          ? "border-green-500 text-green-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Team B ({teamBPlayers.length}/
                      {matchData?.playersPerTeam || 11})
                    </button>
                  </nav>
                </div>
              </div>

              {/* Available Players */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Available Players
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                  {availablePlayers.map((player) => (
                    <div
                      key={player.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        canAddMorePlayers()
                          ? "border-gray-200 hover:border-green-500 hover:bg-green-50"
                          : "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
                      }`}
                      onClick={() =>
                        canAddMorePlayers() && addPlayerToTeam(player)
                      }
                    >
                      <div className="font-medium text-gray-900">
                        {player.name}
                      </div>
                      {player.email && (
                        <div className="text-sm text-gray-500">
                          {player.email}
                        </div>
                      )}
                      {player.phone && (
                        <div className="text-sm text-gray-500">
                          {player.phone}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {availablePlayers.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No available players found
                  </div>
                )}
              </div>

              {/* Team Players */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Team A */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Team A Players
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {teamAPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {player.name}
                          </div>
                          {player.email && (
                            <div className="text-sm text-gray-500">
                              {player.email}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removePlayerFromTeam(player.id, "A")}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {teamAPlayers.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        No players added yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Team B */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Team B Players
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {teamBPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {player.name}
                          </div>
                          {player.email && (
                            <div className="text-sm text-gray-500">
                              {player.email}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removePlayerFromTeam(player.id, "B")}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {teamBPlayers.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        No players added yet
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Dashboard
                </button>
                <div className="space-x-4">
                  <button
                    onClick={handleSubmitPlayers}
                    disabled={
                      !isSetupComplete() || addPlayersMutation.isPending
                    }
                    className={`px-6 py-3 border border-transparent text-base font-medium rounded-md ${
                      isSetupComplete() && !addPlayersMutation.isPending
                        ? "text-white bg-green-600 hover:bg-green-700"
                        : "text-gray-400 bg-gray-300 cursor-not-allowed"
                    }`}
                  >
                    {addPlayersMutation.isPending
                      ? "Adding Players..."
                      : "Submit Players"}
                  </button>
                  {canStartMatch() && (
                    <button
                      onClick={handleStartMatch}
                      disabled={startMatchMutation.isPending}
                      className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {startMatchMutation.isPending
                        ? "Starting..."
                        : "Start Match"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Selection Modal */}
      {showPlayerSelectionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-8">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Select Opening Players
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Choose the opening batsmen (striker & non-striker) and
                        opening bowler to start the match.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="grid grid-cols-1 gap-4">
                    {/* Striker Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Striker (Team A)
                      </label>
                      <select
                        value={selectedStriker}
                        onChange={(e) => setSelectedStriker(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select striker...</option>
                        {teamAPlayers.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Non-Striker Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Non-Striker (Team A)
                      </label>
                      <select
                        value={selectedNonStriker}
                        onChange={(e) => setSelectedNonStriker(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select non-striker...</option>
                        {teamAPlayers
                          .filter((p) => p.id !== selectedStriker)
                          .map((player) => (
                            <option key={player.id} value={player.id}>
                              {player.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Bowler Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bowler (Team B)
                      </label>
                      <select
                        value={selectedBowler}
                        onChange={(e) => setSelectedBowler(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select bowler...</option>
                        {teamBPlayers.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    onClick={() => setShowPlayerSelectionModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStartMatch}
                    disabled={
                      !selectedStriker ||
                      !selectedNonStriker ||
                      !selectedBowler ||
                      startMatchMutation.isPending
                    }
                    className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {startMatchMutation.isPending
                      ? "Starting..."
                      : "Start Match"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
