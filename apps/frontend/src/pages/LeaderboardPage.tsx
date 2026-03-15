import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { leaderboardAPI } from "../lib/auth";

type LeaderboardMetric =
  | "runs"
  | "wickets"
  | "fours"
  | "sixes"
  | "dotsBowled"
  | "strikeRate"
  | "average"
  | "economy"
  | "highestScore"
  | "most100s"
  | "most50s"
  | "bestBowlingAverage"
  | "bestBowlingFigures"
  | "most3WicketHauls"
  | "most5WicketHauls"
  | "bestBowlingStrikeRate";

type MetricCategory = "batting" | "bowling";

const battingMetrics: { metric: LeaderboardMetric; label: string }[] = [
  { metric: "runs", label: "Most Runs" },
  { metric: "highestScore", label: "Highest Score" },
  { metric: "average", label: "Best Average" },
  { metric: "strikeRate", label: "Best Strike Rate" },
  { metric: "most50s", label: "Most 50s" },
  { metric: "most100s", label: "Most 100s" },
  { metric: "fours", label: "Most Fours" },
  { metric: "sixes", label: "Most Sixes" },
];

const bowlingMetrics: { metric: LeaderboardMetric; label: string }[] = [
  { metric: "wickets", label: "Most Wickets" },
  { metric: "bestBowlingAverage", label: "Best Bowling Average" },
  { metric: "bestBowlingStrikeRate", label: "Best Bowling Strike Rate" },
  { metric: "economy", label: "Best Economy" },
  { metric: "bestBowlingFigures", label: "Best Bowling Figures" },
  { metric: "most3WicketHauls", label: "Most 3-Wicket Hauls" },
  { metric: "most5WicketHauls", label: "Most 5-Wicket Hauls" },
  { metric: "dotsBowled", label: "Most Dots Bowled" },
];

const metricDisplayNames: Record<LeaderboardMetric, string> = {
  runs: "Runs",
  wickets: "Wickets",
  fours: "Fours",
  sixes: "Sixes",
  dotsBowled: "Dots Bowled",
  strikeRate: "Strike Rate",
  average: "Average",
  economy: "Economy",
  highestScore: "Highest Score",
  most100s: "100s",
  most50s: "50s",
  bestBowlingAverage: "Bowling Avg",
  bestBowlingFigures: "Bowling Figures",
  most3WicketHauls: "3-Wicket Hauls",
  most5WicketHauls: "5-Wicket Hauls",
  bestBowlingStrikeRate: "Bowling SR",
};

export const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<MetricCategory>("batting");
  const [activeMetric, setActiveMetric] = useState<LeaderboardMetric>("runs");

  const currentMetrics = activeCategory === "batting" ? battingMetrics : bowlingMetrics;

  const { data, isLoading, error } = useQuery({
    queryKey: ["leaderboard", activeMetric],
    queryFn: () => leaderboardAPI.getLeaderboard({ metric: activeMetric, limit: 20, page: 1 }),
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
              <div className="text-lg font-semibold text-gray-900">Leaderboard</div>
              <div className="text-sm text-gray-600">Top players by category</div>
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
          <div className="bg-white shadow rounded-lg">
            {/* Category Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6" aria-label="Categories">
                <button
                  onClick={() => {
                    setActiveCategory("batting");
                    setActiveMetric("runs");
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeCategory === "batting"
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Batting
                </button>
                <button
                  onClick={() => {
                    setActiveCategory("bowling");
                    setActiveMetric("wickets");
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeCategory === "bowling"
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Bowling
                </button>
              </nav>
            </div>

            {/* Metric Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6" aria-label="Metrics">
                {currentMetrics.map(({ metric, label }) => (
                  <button
                    key={metric}
                    onClick={() => setActiveMetric(metric)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeMetric === metric
                        ? "border-green-500 text-green-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex justify-center items-center py-12">
                <div className="text-red-600">Error loading leaderboard</div>
              </div>
            )}

            {/* Table */}
            {!isLoading && !error && (
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
                      {metricDisplayNames[activeMetric]}
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
                        {activeMetric === "bestBowlingFigures" && data?.rows?.[idx]?.meta
                          ? `${data.rows[idx].meta?.wickets}/${data.rows[idx].meta?.runsConceded}`
                          : row.value}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
