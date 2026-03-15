import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { matchAPI } from "../lib/auth";

interface Match {
  id: string;
  teamAName: string;
  teamBName: string;
  overs: number;
  status: string;
  currentInnings?: number;
  createdAt: string;
  totalRuns?: number;
  totalWickets?: number;
  totalOvers?: number;
}

interface MatchManagementProps {
  turfId: string;
}

export const MatchManagementPage: React.FC<MatchManagementProps> = ({
  turfId,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    matchId: string | null;
  }>({
    open: false,
    matchId: null,
  });

  const {
    data: matches = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["matches", turfId],
    queryFn: () => matchAPI.getMatches(),
  });

  const deleteMatchMutation = useMutation({
    mutationFn: (matchId: string) => matchAPI.deleteMatch(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", turfId] });
      setDeleteModal({ open: false, matchId: null });
    },
    onError: (error: any) => {
      alert(`Error deleting match: ${error.message}`);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "LIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "CREATED":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ACCESS_VERIFIED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PLAYERS_ADDED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleMatchClick = async (matchId: string) => {
    try {
      // Fetch full match details to get current status
      const matchDetails = await matchAPI.getMatch(matchId);

      // Navigate based on match status state machine
      switch (matchDetails.status) {
        case "CREATED":
          navigate(`/access-code/${matchId}`);
          break;
        case "ACCESS_VERIFIED":
          navigate(`/match-setup/${matchId}`);
          break;
        case "PLAYERS_ADDED":
          navigate(`/opening/${matchId}`);
          break;
        case "LIVE":
          navigate(`/scoring/${matchId}`);
          break;
        case "COMPLETED":
          navigate(`/match/${matchId}/scorecard`);
          break;
        default:
          alert("Unknown match status");
      }
    } catch (error: any) {
      alert(`Error loading match: ${error.message}`);
    }
  };

  const handleDeleteMatch = () => {
    if (deleteModal.matchId) {
      deleteMatchMutation.mutate(deleteModal.matchId);
    }
  };

  const formatScore = (match: Match) => {
    if (match.status === "LIVE" && match.totalRuns !== undefined) {
      return `${match.totalRuns}/${match.totalWickets || 0} (${match.totalOvers || 0} ov)`;
    }
    return "Not started";
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading matches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">
          Error loading matches: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Match Management</h1>
          <p className="mt-2 text-gray-600">
            Manage all your cricket matches from creation to completion
          </p>
        </div>

        {/* Create New Match Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/match-flow")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create New Match
          </button>
        </div>

        {/* Matches List */}
        <div className="bg-white shadow overflow-hidden rounded-md">
          {matches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No matches found. Create your first match to get started!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {matches.map((match: Match) => (
                <div
                  key={match.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    {/* Match Info - Clickable */}
                    <div
                      className="flex-1"
                      onClick={() => handleMatchClick(match.id)}
                    >
                      <div className="flex items-center space-x-4">
                        {/* Status Badge */}
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                            match.status,
                          )}`}
                        >
                          {match.status}
                        </span>

                        {/* Teams */}
                        <div className="flex-1">
                          <div className="text-lg font-medium text-gray-900">
                            {match.teamAName} vs {match.teamBName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {match.overs} overs •{" "}
                            {formatDateTime(match.createdAt)}
                          </div>
                        </div>

                        {/* Live Score */}
                        {match.status === "LIVE" && (
                          <div className="text-lg font-bold text-green-600">
                            {formatScore(match)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {/* View/Open Match Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMatchClick(match.id);
                        }}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        View
                      </button>

                      {/* Delete Button - Visible for all matches */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({ open: true, matchId: match.id });
                        }}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModal.open && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Match
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this match? This action
                    cannot be undone and all match data will be permanently
                    lost.
                  </p>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() =>
                      setDeleteModal({ open: false, matchId: null })
                    }
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteMatch}
                    disabled={deleteMatchMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {deleteMatchMutation.isPending ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
