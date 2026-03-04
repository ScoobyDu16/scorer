import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { matchAPI } from "../lib/auth";
import { useNavigate, useParams } from "react-router-dom";
import { getRouteWithMatchId, MATCH_STATUS } from "../lib/enums";

interface Player {
  id: string;
  name: string;
}

interface MatchPlayer {
  playerId: string;
  team: "A" | "B";
  player: Player;
}

export const OpeningPlayersPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedStriker, setSelectedStriker] = useState<string>("");
  const [selectedNonStriker, setSelectedNonStriker] = useState<string>("");
  const [selectedBowler, setSelectedBowler] = useState<string>("");

  // Fetch match players
  const { data: matchPlayers, isLoading } = useQuery({
    queryKey: ["matchPlayers", matchId],
    queryFn: () => matchAPI.getMatchPlayers(matchId!),
    enabled: !!matchId,
  });

  // Filter players by team
  const teamAPlayers =
    matchPlayers?.filter((p: MatchPlayer) => p.team === "A") || [];
  const teamBPlayers =
    matchPlayers?.filter((p: MatchPlayer) => p.team === "B") || [];

  // Start match mutation
  const startMatchMutation = useMutation({
    mutationFn: (data: {
      matchId: string;
      strikerId: string;
      nonStrikerId: string;
      bowlerId: string;
    }) => matchAPI.startMatch(data.matchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matchScore", matchId] });

      // Redirect to scoring page
      if (matchId) {
        const scoringRoute = getRouteWithMatchId(MATCH_STATUS.LIVE, matchId);
        navigate(scoringRoute);
      }
    },
    onError: (error: any) => {
      alert(`Error starting match: ${error.message}`);
    },
  });

  const handleStartMatch = () => {
    if (!selectedStriker || !selectedNonStriker || !selectedBowler) {
      alert("Please select all opening players");
      return;
    }

    if (selectedStriker === selectedNonStriker) {
      alert("Striker and non-striker must be different players");
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Select Opening Players
              </h1>
              <p className="text-sm text-gray-600 mb-8">
                Choose the opening batsmen (striker & non-striker) and opening
                bowler to start the match.
              </p>

              <div className="space-y-8">
                {/* Team A Batsmen */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Team A - Opening Batsmen
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Striker Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Striker *
                      </label>
                      <select
                        value={selectedStriker}
                        onChange={(e) => setSelectedStriker(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select striker...</option>
                        {teamAPlayers.map((player: MatchPlayer) => (
                          <option key={player.playerId} value={player.playerId}>
                            {player.player.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Non-Striker Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Non-Striker *
                      </label>
                      <select
                        value={selectedNonStriker}
                        onChange={(e) => setSelectedNonStriker(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select non-striker...</option>
                        {teamAPlayers
                          .filter(
                            (p: MatchPlayer) => p.playerId !== selectedStriker,
                          )
                          .map((player: MatchPlayer) => (
                            <option
                              key={player.playerId}
                              value={player.playerId}
                            >
                              {player.player.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Team B Bowler */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Team B - Opening Bowler
                  </h2>
                  <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opening Bowler *
                    </label>
                    <select
                      value={selectedBowler}
                      onChange={(e) => setSelectedBowler(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select bowler...</option>
                      {teamBPlayers.map((player: MatchPlayer) => (
                        <option key={player.playerId} value={player.playerId}>
                          {player.player.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Start Match Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleStartMatch}
                    disabled={
                      !selectedStriker ||
                      !selectedNonStriker ||
                      !selectedBowler ||
                      startMatchMutation.isPending
                    }
                    className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {startMatchMutation.isPending
                      ? "Starting Match..."
                      : "Start Match"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
