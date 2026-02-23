import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { matchAPI } from "../lib/auth";

export const ScoringPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isWide, setIsWide] = useState(false);
  const [isNoBall, setIsNoBall] = useState(false);
  const [isByes, setIsByes] = useState(false);
  const [isLegByes, setIsLegByes] = useState(false);
  const [isWicket, setIsWicket] = useState(false);

  // Fetch match score data (includes current innings and live data)
  const { data: matchScore, isLoading: scoreLoading } = useQuery({
    queryKey: ["matchScore", matchId],
    queryFn: () => matchAPI.getMatchScore(matchId!),
    enabled: !!matchId,
  });

  // Extract data from match score response
  const currentInnings = matchScore?.innings?.find(
    (i: any) => i.inningsNumber === matchScore?.currentInnings,
  );
  const liveData = matchScore?.live;

  // Calculate current striker, non-striker, bowler from live data
  const getCurrentPlayers = () => {
    if (!liveData || !liveData.balls || liveData.balls.length === 0) {
      return {
        striker: liveData?.striker,
        nonStriker: liveData?.nonStriker,
        bowler: liveData?.bowler,
      };
    }

    // Derive from latest ball
    const latestBall = liveData.balls[liveData.balls.length - 1];
    return {
      striker: latestBall.strikerId,
      nonStriker: null, // Need to track strike rotation
      bowler: latestBall.bowlerId,
    };
  };

  const currentPlayers = getCurrentPlayers();

  // Add ball mutation
  const addBallMutation = useMutation({
    mutationFn: (data: {
      matchId: string;
      inningsId: string;
      strikerId: string;
      bowlerId: string;
      runs: number;
      isWide: boolean;
      isNoBall: boolean;
      isByes: boolean;
      isLegByes: boolean;
      isWicket: boolean;
    }) => matchAPI.addBall(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matchScore", matchId] });
      // Reset extras only, keep selectedRuns for next ball
      setIsWide(false);
      setIsNoBall(false);
      setIsByes(false);
      setIsLegByes(false);
      setIsWicket(false);
    },
    onError: (error: any) => {
      alert(`Error adding ball: ${error.message}`);
    },
  });

  const handleScoreBall = (runs?: number) => {
    if (!currentInnings || !currentPlayers.striker) return;

    addBallMutation.mutate({
      matchId: matchId!,
      inningsId: currentInnings.id,
      strikerId: currentPlayers.striker.id,
      bowlerId: currentPlayers.bowler?.id || "", // Need to handle first ball case
      runs: runs !== undefined ? runs : 0, // Use parameter or default
      isWide,
      isNoBall,
      isByes,
      isLegByes,
      isWicket,
    });
  };

  const formatOvers = (overs: number) => {
    // If already a decimal (from backend), return as is with 1 decimal place
    if (overs % 1 !== 0) {
      return overs.toFixed(1);
    }
    // If integer, it represents complete overs, add .0
    return `${overs}.0`;
  };

  const calculateRunRate = (runs: number, overs: number) => {
    if (overs === 0) return "0.00";
    // Convert cricket notation (0.3 = 3 balls) to decimal overs (0.5 = 3 balls)
    const decimalOvers = Math.floor(overs) + ((overs % 1) * 10) / 6;
    return (runs / decimalOvers).toFixed(2);
  };

  const calculateRequiredRunRate = (
    target: number,
    currentRuns: number,
    balls: number,
  ) => {
    if (balls === 0) return 0;
    const remainingRuns = target - currentRuns;
    const remainingOvers = balls / 6;
    return (remainingRuns / remainingOvers).toFixed(2);
  };

  if (scoreLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!matchScore) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-red-600">Match score not found.</div>
      </div>
    );
  }

  const battingTeam =
    currentInnings?.battingTeam === "A"
      ? matchScore.teamAName
      : matchScore.teamBName;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Match Header */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  {matchScore.teamAName} vs {matchScore.teamBName}
                </h1>
                <div className="mt-4 text-lg">
                  <span className="font-medium">{battingTeam}</span>
                  <span className="mx-2">
                    {currentInnings?.totalRuns || 0}/
                    {currentInnings?.totalWickets || 0}
                  </span>
                  <span className="text-gray-600">
                    ({formatOvers(currentInnings?.totalOvers || 0)})
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  CRR:{" "}
                  {calculateRunRate(
                    currentInnings?.totalRuns || 0,
                    currentInnings?.totalOvers || 0,
                  )}
                  {matchScore.currentInnings === 2 && matchScore.target && (
                    <span className="ml-4">
                      RR:{" "}
                      {calculateRequiredRunRate(
                        matchScore.target,
                        currentInnings?.totalRuns || 0,
                        currentInnings?.totalOvers || 0,
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Batsmen Stats */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Batsmen
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Batsman
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Runs
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Balls
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            4s
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            6s
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            SR
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {liveData?.striker && (
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {liveData.striker.name}*
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {liveData.striker.runs}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {liveData.striker.balls}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {liveData.striker.fours}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {liveData.striker.sixes}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {liveData.striker.balls > 0
                                ? Math.round(
                                    (liveData.striker.runs /
                                      liveData.striker.balls) *
                                      100,
                                  )
                                : 0}
                            </td>
                          </tr>
                        )}
                        {liveData?.nonStriker && (
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {liveData.nonStriker.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {liveData.nonStriker.runs}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {liveData.nonStriker.balls}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {liveData.nonStriker.fours}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {liveData.nonStriker.sixes}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {liveData.nonStriker.balls > 0
                                ? Math.round(
                                    (liveData.nonStriker.runs /
                                      liveData.nonStriker.balls) *
                                      100,
                                  )
                                : 0}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Bowler Stats */}
              <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Bowler
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bowler
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Overs
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Maidens
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Runs
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Wickets
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Economy
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {liveData?.bowler && (
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {liveData.bowler.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {liveData.bowler.overs}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {liveData.bowler.maidens}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {liveData.bowler.runs}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {liveData.bowler.wickets}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {liveData.bowler.overs > 0
                                ? (() => {
                                    // Convert cricket notation (0.3 = 3 balls) to decimal overs (0.5 = 3 balls)
                                    const decimalOvers =
                                      Math.floor(liveData.bowler.overs) +
                                      ((liveData.bowler.overs % 1) * 10) / 6;
                                    return (
                                      liveData.bowler.runs / decimalOvers
                                    ).toFixed(2);
                                  })()
                                : "0.00"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Recent Balls */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Recent Balls
                  </h2>
                  <div className="flex space-x-2 overflow-x-auto">
                    {liveData?.lastOver?.map((ball: string, index: number) => (
                      <div
                        key={index}
                        className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-medium"
                      >
                        {ball}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Scoring Controls */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Score Ball
                  </h2>

                  {/* Run Buttons */}
                  <div className="mb-6">
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2, 3, 4, 5, 6].map((runs) => (
                        <button
                          key={runs}
                          onClick={() => {
                            handleScoreBall(runs);
                          }}
                          className="px-4 py-3 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          {runs}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Extras Checkboxes */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Extras
                    </h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isWide}
                          onChange={(e) => setIsWide(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Wide</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isNoBall}
                          onChange={(e) => setIsNoBall(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">No Ball</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isByes}
                          onChange={(e) => setIsByes(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Byes</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isLegByes}
                          onChange={(e) => setIsLegByes(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Leg Byes</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isWicket}
                          onChange={(e) => setIsWicket(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Wicket</span>
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200">
                        Undo Ball
                      </button>
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200">
                        Change Strike
                      </button>
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200">
                        Retire Batsman
                      </button>
                      <button
                        onClick={() => navigate("/dashboard")}
                        className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-md hover:bg-red-200"
                      >
                        End Match
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
