import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { leaderboardAPI } from "../lib/auth";

type StatType =
  | "mostRuns"
  | "mostWickets"
  | "mostFours"
  | "mostSixes"
  | "mostDotsBowled"
  | "bestStrikeRate"
  | "bestAverage"
  | "bestEconomy";

const metricFromStatType = (statType: StatType): string => {
  switch (statType) {
    case "mostRuns":
      return "runs";
    case "mostWickets":
      return "wickets";
    case "mostFours":
      return "fours";
    case "mostSixes":
      return "sixes";
    case "mostDotsBowled":
      return "dotsBowled";
    case "bestStrikeRate":
      return "strikeRate";
    case "bestAverage":
      return "average";
    case "bestEconomy":
      return "economy";
    default:
      return "runs";
  }
};

const titleFromStatType = (statType: StatType) => {
  switch (statType) {
    case "mostRuns":
      return "Most Runs";
    case "mostWickets":
      return "Most Wickets";
    case "mostFours":
      return "Most Fours";
    case "mostSixes":
      return "Most Sixes";
    case "mostDotsBowled":
      return "Most Dots (Bowled)";
    case "bestStrikeRate":
      return "Best Strike Rate";
    case "bestAverage":
      return "Best Batting Average";
    case "bestEconomy":
      return "Best Economy";
    default:
      return "Leaderboard";
  }
};

export const LeaderboardPage: React.FC = () => {
  const { statType } = useParams<{ statType: StatType }>();
  const navigate = useNavigate();

  const metric = useMemo(() => {
    if (!statType) return "runs";
    return metricFromStatType(statType);
  }, [statType]);

  const title = useMemo(() => {
    if (!statType) return "Leaderboard";
    return titleFromStatType(statType);
  }, [statType]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["leaderboard", metric],
    queryFn: () => leaderboardAPI.getLeaderboard({ metric, limit: 20, page: 1 }),
    enabled: !!metric,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-white shadow rounded-lg p-6 text-red-600">
          Error loading leaderboard
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <div className="text-lg font-semibold text-gray-900">{title}</div>
              <div className="text-sm text-gray-600">Top players</div>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(data?.rows || []).map((row: any, idx: number) => (
                  <tr
                    key={row.playerId}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/players/${row.playerId}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {row.value}
                    </td>
                  </tr>
                ))}

                {(data?.rows || []).length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      No data yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
