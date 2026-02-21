import React from "react";
import { useQuery } from "@tanstack/react-query";
import { matchAPI } from "../lib/auth";

export const MatchesList: React.FC = () => {
  const {
    data: matches,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["matches"],
    queryFn: () => matchAPI.getMatches(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
        Error loading matches: {error.message}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Matches</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {matches?.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No matches yet. Create your first match!
          </div>
        ) : (
          matches?.map((match) => (
            <div key={match.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-sm font-medium text-gray-900">
                      {match.teamAName} vs {match.teamBName}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}
                    >
                      {match.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {match.overs} overs • {match.venue || "No venue"}
                  </div>
                  {match.tossWinner && (
                    <div className="mt-1 text-sm text-gray-500">
                      Toss: {match.tossWinner} won and chose to{" "}
                      {match.tossDecision}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(match.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
