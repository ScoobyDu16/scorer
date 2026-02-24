import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { matchAPI, playerAPI } from "../lib/auth";

type WicketType =
  | "BOWLED"
  | "CAUGHT"
  | "CAUGHT_AND_BOWLED"
  | "RUN_OUT"
  | "LBW"
  | "STUMPED"
  | "HIT_WICKET";

interface WicketData {
  wicketType: WicketType;
  dismissedPlayerId: string;
  newBatsmanId: string;
  fielderId?: string;
}

export const ScoringPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isWide, setIsWide] = useState(false);
  const [isNoBall, setIsNoBall] = useState(false);
  const [isByes, setIsByes] = useState(false);
  const [isLegByes, setIsLegByes] = useState(false);
  const [isWicket, setIsWicket] = useState(false);

  // Wicket-related state
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [selectedWicketType, setSelectedWicketType] =
    useState<WicketType>("BOWLED");
  const [wicketData, setWicketData] = useState<WicketData>({
    wicketType: "BOWLED",
    dismissedPlayerId: "",
    newBatsmanId: "",
    fielderId: "",
  });

  // Bowler selection modal state
  const [showBowlerSelection, setShowBowlerSelection] = useState(false);
  const [selectedNewBowler, setSelectedNewBowler] = useState<string>("");

  // Fetch match score data (includes current innings and live data)
  const { data: matchScore, isLoading: scoreLoading } = useQuery({
    queryKey: ["matchScore", matchId],
    queryFn: () => matchAPI.getMatchScore(matchId!),
    enabled: !!matchId,
  });

  // Fetch match players for bowler selection
  const { data: matchPlayers } = useQuery({
    queryKey: ["matchPlayers", matchId],
    queryFn: () => matchAPI.getMatchPlayers(matchId!),
    enabled: !!matchId,
  });

  // Change bowler mutation
  const changeBowlerMutation = useMutation({
    mutationFn: (data: { inningsId: string; newBowlerId: string }) =>
      matchAPI.changeBowler(data.inningsId, data.newBowlerId),
    onSuccess: () => {
      setShowBowlerSelection(false);
      setSelectedNewBowler("");
      queryClient.invalidateQueries({ queryKey: ["matchScore", matchId] });
    },
    onError: (error: any) => {
      alert(`Error changing bowler: ${error.message}`);
    },
  });

  // Extract data from match score response
  const currentInnings = matchScore?.innings?.find(
    (i: any) => i.inningsNumber === matchScore?.currentInnings,
  );
  const liveData = matchScore?.live;

  // Fetch players yet to bat for new batsman selection
  const { data: playersYetToBat } = useQuery({
    queryKey: ["playersYetToBat", matchId, currentInnings?.battingTeam],
    queryFn: () => {
      if (!matchId || !currentInnings?.battingTeam) return [];
      return playerAPI.getPlayersYetToBat(matchId!, currentInnings.battingTeam);
    },
    enabled: !!matchId && !!currentInnings?.battingTeam,
  });

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
    const lastOverBalls = liveData?.recentBalls || [];
    const latestBall = lastOverBalls[lastOverBalls.length - 1];
    return {
      striker: latestBall.strikerId,
      nonStriker: null, // Need to track strike rotation
      bowler: latestBall.bowlerId,
    };
  };

  const currentPlayers = getCurrentPlayers();

  // Detect over completion and show bowler selection modal
  useEffect(() => {
    if (liveData?.isOverCompleted && currentInnings) {
      setShowBowlerSelection(true);
    }
  }, [liveData?.isOverCompleted, currentInnings]);

  // Get available bowlers (bowling team players, excluding current bowler)
  const getAvailableBowlers = () => {
    if (!matchPlayers || !currentInnings || !liveData?.bowler) return [];

    const bowlingTeam = currentInnings.battingTeam === "A" ? "B" : "A";
    const currentBowlerId = liveData.bowler.id;

    return matchPlayers
      .filter((player: any) => player.team === bowlingTeam)
      .filter((player: any) => player.playerId !== currentBowlerId)
      .map((player: any) => ({
        id: player.playerId,
        name: player.player?.name || player.playerId,
      }));
  };

  // Handle extra type changes - only allow one at a time
  const handleExtraChange = (
    extraType: "wide" | "noBall" | "byes" | "legByes",
    value: boolean,
  ) => {
    if (!value) {
      // If unchecking, just update that type
      switch (extraType) {
        case "wide":
          setIsWide(false);
          break;
        case "noBall":
          setIsNoBall(false);
          break;
        case "byes":
          setIsByes(false);
          break;
        case "legByes":
          setIsLegByes(false);
          break;
      }
    } else {
      // If checking, uncheck all others first
      setIsWide(false);
      setIsNoBall(false);
      setIsByes(false);
      setIsLegByes(false);

      // Then check the selected one
      switch (extraType) {
        case "wide":
          setIsWide(true);
          break;
        case "noBall":
          setIsNoBall(true);
          break;
        case "byes":
          setIsByes(true);
          break;
        case "legByes":
          setIsLegByes(true);
          break;
      }
    }
  };

  // Handle wicket checkbox change
  const handleWicketChange = (value: boolean) => {
    setIsWicket(value);
    if (!value) {
      // Reset wicket data when unchecking
      setWicketData({
        wicketType: "BOWLED",
        dismissedPlayerId: "",
        newBatsmanId: "",
        fielderId: "",
      });
      setSelectedWicketType("BOWLED");
    }
  };

  // Handle wicket type selection
  const handleWicketTypeChange = (wicketType: WicketType) => {
    setSelectedWicketType(wicketType);
    setWicketData((prev) => ({ ...prev, wicketType }));
  };
  const handleBowlerChange = () => {
    if (!selectedNewBowler || !currentInnings) {
      alert("Please select a bowler");
      return;
    }

    changeBowlerMutation.mutate({
      inningsId: currentInnings.id,
      newBowlerId: selectedNewBowler,
    });
  };

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
      wicketType?: WicketType;
      dismissedPlayerId?: string;
      newBatsmanId?: string;
      fielderId?: string;
      crossingOccurred?: boolean;
    }) => matchAPI.addBall(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matchScore", matchId] });
      queryClient.invalidateQueries({
        queryKey: ["playersYetToBat", matchId, currentInnings?.battingTeam],
      });
      // Reset all state after successful ball
      setIsWide(false);
      setIsNoBall(false);
      setIsByes(false);
      setIsLegByes(false);
      setIsWicket(false);
      setShowWicketModal(false);
      setWicketData({
        wicketType: "BOWLED",
        dismissedPlayerId: "",
        newBatsmanId: "",
        fielderId: "",
      });
    },
    onError: (error: any) => {
      alert(`Error adding ball: ${error.message}`);
    },
  });

  const handleScoreBall = (runs?: number) => {
    if (!currentInnings || !currentPlayers.striker) return;

    // If wicket is checked, show wicket modal instead of scoring runs
    if (isWicket) {
      setShowWicketModal(true);
      return;
    }

    addBallMutation.mutate({
      matchId: matchId!,
      inningsId: currentInnings.id,
      strikerId: currentPlayers.striker.id,
      bowlerId: currentPlayers.bowler?.id || "",
      runs: runs !== undefined ? runs : 0,
      isWide,
      isNoBall,
      isByes,
      isLegByes,
      isWicket,
    });
  };

  // Handle wicket submission
  const handleWicketSubmit = (runs?: number) => {
    if (!currentInnings || !currentPlayers.striker) return;

    // Validate wicket data
    if (!wicketData.dismissedPlayerId) {
      alert("Please select a dismissed player");
      return;
    }
    if (!wicketData.newBatsmanId) {
      alert("Please select a new batsman");
      return;
    }

    // Check if fielder is required
    if (
      selectedWicketType === "CAUGHT" ||
      selectedWicketType === "STUMPED" ||
      selectedWicketType === "RUN_OUT"
    ) {
      if (!wicketData.fielderId) {
        alert(
          `Fielder is required for ${selectedWicketType.replace("_", " ")}`,
        );
        return;
      }
    }

    // Handle caught & bowled logic
    let finalWicketType = selectedWicketType;
    let finalFielderId: string | null | undefined = wicketData.fielderId;

    if (
      selectedWicketType === "CAUGHT" &&
      wicketData.fielderId === currentPlayers.bowler?.id
    ) {
      finalWicketType = "CAUGHT_AND_BOWLED";
      finalFielderId = undefined; // Don't send fielderId for caught & bowled
    }

    // Build payload - omit fielderId if undefined
    const payload: any = {
      matchId: matchId!,
      inningsId: currentInnings.id,
      strikerId: currentPlayers.striker.id,
      bowlerId: currentPlayers.bowler?.id || "",
      runs: runs !== undefined ? runs : 0,
      isWide,
      isNoBall,
      isByes,
      isLegByes,
      isWicket: true,
      wicketType: finalWicketType,
      dismissedPlayerId: wicketData.dismissedPlayerId,
      newBatsmanId: wicketData.newBatsmanId,
      crossingOccurred: false,
    };

    // Only include fielderId if it's defined (not undefined)
    if (finalFielderId !== undefined) {
      payload.fielderId = finalFielderId;
    }

    addBallMutation.mutate(payload);
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
                    {liveData?.recentBalls?.map(
                      (ball: string, index: number) => (
                        <div
                          key={index}
                          className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-sm font-medium ${
                            ball === "|"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100"
                          }`}
                        >
                          {ball}
                        </div>
                      ),
                    )}
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
                          disabled={runs === 0 && (isByes || isLegByes)}
                          className={`px-4 py-3 text-sm font-medium rounded-md ${
                            runs === 0 && (isByes || isLegByes)
                              ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
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
                          onChange={(e) =>
                            handleExtraChange("wide", e.target.checked)
                          }
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Wide</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isNoBall}
                          onChange={(e) =>
                            handleExtraChange("noBall", e.target.checked)
                          }
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">No Ball</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isByes}
                          onChange={(e) =>
                            handleExtraChange("byes", e.target.checked)
                          }
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Byes</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isLegByes}
                          onChange={(e) =>
                            handleExtraChange("legByes", e.target.checked)
                          }
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Leg Byes</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isWicket}
                          onChange={(e) => handleWicketChange(e.target.checked)}
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

      {/* Wicket Selection Modal */}
      {showWicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Record Wicket
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Select wicket type and players
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wicket Type
              </label>
              <select
                value={selectedWicketType}
                onChange={(e) =>
                  handleWicketTypeChange(e.target.value as WicketType)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="BOWLED">Bowled</option>
                <option value="CAUGHT">Caught</option>
                <option value="RUN_OUT">Run Out</option>
                <option value="LBW">LBW</option>
                <option value="STUMPED">Stumped</option>
                <option value="HIT_WICKET">Hit Wicket</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dismissed Player
              </label>
              <select
                value={wicketData.dismissedPlayerId}
                onChange={(e) =>
                  setWicketData((prev) => ({
                    ...prev,
                    dismissedPlayerId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select dismissed player...</option>
                {liveData?.striker && (
                  <option value={liveData.striker.id}>
                    {liveData.striker.name} (Striker)
                  </option>
                )}
                {liveData?.nonStriker && (
                  <option value={liveData.nonStriker.id}>
                    {liveData.nonStriker.name} (Non-Striker)
                  </option>
                )}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Batsman
              </label>
              <select
                value={wicketData.newBatsmanId}
                onChange={(e) =>
                  setWicketData((prev) => ({
                    ...prev,
                    newBatsmanId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select new batsman...</option>
                {playersYetToBat?.map((player: any) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            {(selectedWicketType === "CAUGHT" ||
              selectedWicketType === "STUMPED" ||
              selectedWicketType === "RUN_OUT") && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fielder{" "}
                  {selectedWicketType === "STUMPED" ? "(Wicketkeeper)" : ""}
                </label>
                <select
                  value={wicketData.fielderId || ""}
                  onChange={(e) =>
                    setWicketData((prev) => ({
                      ...prev,
                      fielderId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={
                    selectedWicketType === "CAUGHT" ||
                    selectedWicketType === "STUMPED"
                  }
                >
                  <option value="">
                    {selectedWicketType === "STUMPED"
                      ? "Select wicketkeeper..."
                      : "Select fielder..."}
                  </option>
                  {matchPlayers
                    ?.filter(
                      (player: any) =>
                        player.team !== currentInnings?.battingTeam,
                    )
                    ?.map((player: any) => (
                      <option key={player.playerId} value={player.playerId}>
                        {player.player?.name || player.playerId}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowWicketModal(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleWicketSubmit()}
                disabled={
                  !wicketData.dismissedPlayerId ||
                  !wicketData.newBatsmanId ||
                  (selectedWicketType === "CAUGHT" && !wicketData.fielderId) ||
                  (selectedWicketType === "STUMPED" && !wicketData.fielderId) ||
                  (selectedWicketType === "RUN_OUT" && !wicketData.fielderId)
                }
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                Record Wicket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bowler Selection Modal */}
      {showBowlerSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Select Next Bowler
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Choose a bowler from the bowling team. Same bowler cannot bowl
              consecutive overs (ICC rule).
            </p>

            <div className="mb-4">
              <select
                value={selectedNewBowler}
                onChange={(e) => setSelectedNewBowler(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select bowler...</option>
                {getAvailableBowlers().map(
                  (bowler: { id: string; name: string }) => (
                    <option key={bowler.id} value={bowler.id}>
                      {bowler.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBowlerSelection(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBowlerChange}
                disabled={!selectedNewBowler || changeBowlerMutation.isPending}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {changeBowlerMutation.isPending
                  ? "Changing..."
                  : "Change Bowler"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
