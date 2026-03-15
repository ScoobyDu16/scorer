import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { playerAPI } from "../lib/auth";

type Tab = "BATTING" | "BOWLING";

export const PlayerProfilePage: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>("BATTING");

  const { data: player, isLoading: playerLoading } = useQuery({
    queryKey: ["player", playerId],
    queryFn: () => playerAPI.getPlayer(playerId!),
    enabled: !!playerId,
    staleTime: 60_000,
  });

  const {
    data: career,
    isLoading: careerLoading,
    error: careerError,
  } = useQuery({
    queryKey: ["playerCareer", playerId],
    queryFn: () => playerAPI.getPlayerCareer(playerId!),
    enabled: !!playerId,
    staleTime: 60_000,
  });

  const summary = useMemo(() => {
    const matches = Number(career?.batting?.matches ?? 0);
    const runs = Number(career?.batting?.runs ?? 0);
    const wickets = Number(career?.bowling?.wickets ?? 0);
    return { matches, runs, wickets };
  }, [career]);

  if (playerLoading || careerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (careerError) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-white shadow rounded-lg p-6 text-red-600">
          Error loading career stats
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
              <div className="text-sm text-gray-600">Player</div>
              <div className="text-lg font-semibold text-gray-900">
                {player?.name || "Player"}
              </div>
              {player?.phone && (
                <div className="text-sm text-gray-600">{player.phone}</div>
              )}
            </div>

            <button
              onClick={() => navigate("/players")}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-xs text-gray-600">Matches</div>
              <div className="text-2xl font-bold text-gray-900">
                {summary.matches}
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-xs text-gray-600">Runs</div>
              <div className="text-2xl font-bold text-gray-900">
                {summary.runs}
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-xs text-gray-600">Wickets</div>
              <div className="text-2xl font-bold text-gray-900">
                {summary.wickets}
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="border-b px-4 py-3 flex gap-2">
              <button
                onClick={() => setActiveTab("BATTING")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === "BATTING"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Batting
              </button>
              <button
                onClick={() => setActiveTab("BOWLING")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === "BOWLING"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Bowling
              </button>
            </div>

            {activeTab === "BATTING" ? (
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="py-2 text-gray-600">Matches</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.batting?.matches ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Innings</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.batting?.inningsBatted ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Runs</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.batting?.runs ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Highest</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.batting?.highestScore ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Balls</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.batting?.ballsFaced ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">4s</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.batting?.fours ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">6s</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.batting?.sixes ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">SR</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.batting?.strikeRate ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Avg</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.batting?.average ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Ducks</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.batting?.ducks ?? 0}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="py-2 text-gray-600">Innings</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.bowling?.inningsBowled ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Overs</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.bowling?.overs ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Runs</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.bowling?.runsConceded ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Wkts</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.bowling?.wickets ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">BBI</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.bowling?.bestBowling ?? "-"}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Econ</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.bowling?.economy ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Avg</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.bowling?.average ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">SR</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.bowling?.strikeRate ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Maidens</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.bowling?.maidens ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Dots</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {career?.bowling?.dotsBowled ?? 0}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
