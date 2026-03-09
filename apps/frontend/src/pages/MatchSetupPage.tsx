import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { playerAPI } from "../lib/auth";
import { matchAPI } from "../lib/auth";
import { getRouteWithMatchId, MATCH_STATUS } from "../lib/enums";

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

  // Fetch players with infinite scroll
  const [currentPage, setCurrentPage] = useState(1);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data: playersData, isLoading, isFetching } = useQuery({
    queryKey: ["players", searchTerm, currentPage],
    queryFn: () => playerAPI.getPlayers(searchTerm, currentPage, 20, "name", "asc"),
    enabled: true,
  });

  // Append new players to existing list when page changes
  useEffect(() => {
    if (playersData) {
      if (currentPage === 1) {
        // First page - replace all players
        setAllPlayers(playersData.players);
      } else {
        // Subsequent pages - append players
        setAllPlayers(prev => [...prev, ...playersData.players]);
      }
      setHasMore(playersData.pagination.hasNext);
      setIsLoadingMore(false);
    }
  }, [playersData, currentPage]);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
    setAllPlayers([]);
    setHasMore(true);
  }, [searchTerm]);

  const availablePlayers = allPlayers
    .filter(
      (player) =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !teamAPlayers.some((p) => p.id === player.id) &&
        !teamBPlayers.some((p) => p.id === player.id),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  // Infinite scroll handler
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);
  const [previousScrollHeight, setPreviousScrollHeight] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    setScrollContainer(element);
    
    if (
      element.scrollHeight - element.scrollTop <= element.clientHeight + 50 &&
      hasMore &&
      !isLoading &&
      !isFetching
    ) {
      setPreviousScrollHeight(element.scrollHeight);
      setIsLoadingMore(true);
      setCurrentPage(prev => prev + 1);
    }
  };

  // Preserve scroll position when new players are added
  useEffect(() => {
    if (scrollContainer && playersData && currentPage > 1) {
      const newScrollTop = scrollContainer.scrollTop + (scrollContainer.scrollHeight - previousScrollHeight);
      scrollContainer.scrollTop = newScrollTop;
    }
  }, [allPlayers, currentPage, scrollContainer, previousScrollHeight]);

  // Add players to match mutation
  const addPlayersMutation = useMutation({
    mutationFn: (data: { matchId: string; players: any[] }) => {
      // Call the real backend API to add players to match
      return matchAPI.addMatchPlayers(data.matchId, data.players);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      
      // Redirect to opening players selection page
      if (matchId) {
        const openingRoute = getRouteWithMatchId(MATCH_STATUS.PLAYERS_ADDED, matchId);
        navigate(openingRoute);
      }
    },
    onError: (error: any) => {
      alert(`Error adding players: ${error.message}`);
    },
  });

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

  // State for pagination, search, and sorting

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
                <div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto"
                  onScroll={handleScroll}
                >
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
                {availablePlayers.length === 0 && !isLoading && (
                  <div className="text-center text-gray-500 py-8">
                    No available players found
                  </div>
                )}
                {isLoadingMore && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading more players...</p>
                  </div>
                )}
                {!hasMore && availablePlayers.length > 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No more players to load
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
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={handleSubmitPlayers}
                    disabled={!isSetupComplete() || addPlayersMutation.isPending}
                    className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {addPlayersMutation.isPending
                      ? "Adding Players..."
                      : "Submit Players"}
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
