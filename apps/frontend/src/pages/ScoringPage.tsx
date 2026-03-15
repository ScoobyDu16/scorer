import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { matchAPI, playerAPI } from "../lib/auth";
import {
  WicketType,
  getWicketTypeDisplay,
  WICKET_TYPE,
} from "../lib/enums";

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

  const [activeTab, setActiveTab] = useState<"SCORING" | "SCORECARD">(
    "SCORING",
  );

  const [isWide, setIsWide] = useState(false);
  const [isNoBall, setIsNoBall] = useState(false);
  const [isByes, setIsByes] = useState(false);
  const [isLegByes, setIsLegByes] = useState(false);
  const [isWicket, setIsWicket] = useState(false);

  // Wicket-related state
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [selectedWicketType, setSelectedWicketType] = useState<WicketType>(
    WICKET_TYPE.BOWLED,
  );
  const [wicketData, setWicketData] = useState<WicketData>({
    wicketType: WICKET_TYPE.BOWLED,
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
    refetchInterval: (query) => {
      const data: any = query.state.data;
      const isCompleted = data?.status === "COMPLETED";
      return activeTab === "SCORING" && !isCompleted ? 2000 : false;
    },
  });

  const {
    data: matchScorecard,
    isLoading: scorecardLoading,
    error: scorecardError,
  } = useQuery({
    queryKey: ["matchScorecard", matchId],
    queryFn: () => matchAPI.getMatchScorecard(matchId!),
    enabled: !!matchId && activeTab === "SCORECARD",
    staleTime: 10_000,
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

  // Undo last ball mutation
  const undoLastBallMutation = useMutation({
    mutationFn: (matchId: string) => matchAPI.undoLastBall(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matchScore", matchId] });
    },
    onError: (error: any) => {
      alert(`Error undoing ball: ${error.message}`);
    },
  });

  // Extract data from match score response
  const currentInnings = matchScore?.innings?.find(
    (i: any) => i.inningsNumber === matchScore?.currentInnings,
  );
  const liveData = matchScore?.live;

  // Fetch players yet to bat for new batsman selection (only when wicket modal is open)
  const { data: playersYetToBat } = useQuery({
    queryKey: ["playersYetToBat", matchId, currentInnings?.battingTeam],
    queryFn: () => {
      if (!matchId || !currentInnings?.battingTeam) return [];
      return playerAPI.getPlayersYetToBat(matchId!, currentInnings.battingTeam);
    },
    enabled: !!matchId && !!currentInnings?.battingTeam && showWicketModal,
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

  // Determine match state based on backend data
  const getMatchState = () => {
    if (!matchScore) return "LOADING";
    if (matchScore.status === "COMPLETED") return "MATCH_COMPLETED";

    const currentInningsData = matchScore.innings?.find(
      (i: any) => i.inningsNumber === matchScore.currentInnings,
    );

    if (!currentInningsData) return "INNINGS_SETUP";
    if (currentInningsData.status === "UPCOMING") {
      return matchScore.currentInnings === 1
        ? "INNINGS_SETUP"
        : "INNINGS_BREAK";
    }
    if (currentInningsData.status === "COMPLETED") {
      return matchScore.currentInnings === 1
        ? "INNINGS_BREAK"
        : "MATCH_COMPLETED";
    }

    return "INNINGS_LIVE";
  };

  const matchState = getMatchState();

  useEffect(() => {
    if (matchScore?.status === "COMPLETED" && matchId) {
      navigate(`/match/${matchId}/scorecard`, { replace: true });
    }
  }, [matchScore?.status, matchId, navigate]);

  const ScorecardView = ({ scorecard }: { scorecard: any }) => {
    if (!scorecard) return null;

    const innings = scorecard.innings || [];

    const oversToDecimal = (overs: number) => {
      const whole = Math.floor(overs);
      const balls = Math.round((overs - whole) * 10);
      return whole + balls / 6;
    };

    const formatStrikeRate = (runs: number, balls: number) => {
      if (!balls) return "0.00";
      return ((runs / balls) * 100).toFixed(2);
    };

    const formatEconomy = (runs: number, overs: number) => {
      const d = oversToDecimal(overs);
      if (!d) return "0.00";
      return (runs / d).toFixed(2);
    };

    const formatRunRateFromInnings = (runs: number, overs: number) => {
      const d = oversToDecimal(overs);
      if (!d) return "0.00";
      return (runs / d).toFixed(2);
    };

    const formatDismissal = (d: any) => {
      if (!d) return "not out";

      const wicketType = d.wicketType;
      const bowlerName = d.bowlerName;
      const fielderName = d.fielderName;

      switch (wicketType) {
        case "BOWLED":
        case "LBW":
        case "HIT_WICKET":
          return `b ${bowlerName}`;
        case "CAUGHT":
          return `c ${fielderName} b ${bowlerName}`;
        case "STUMPED":
          return `st ${fielderName} b ${bowlerName}`;
        case "RUN_OUT":
          return `run out (${fielderName || ""})`;
        case "CAUGHT_AND_BOWLED":
          return `c&b ${bowlerName}`;
        default:
          return "out";
      }
    };

    const getTopLine = () => {
      if (scorecard.status === "COMPLETED" && scorecard.result) {
        return scorecard.result;
      }

      if (scorecard.status === "LIVE" && scorecard.currentInnings === 1) {
        if (!scorecard.tossWinner || !scorecard.tossDecision) return null;
        const tossWinnerName =
          scorecard.tossWinner === "A" ? scorecard.teamAName : scorecard.teamBName;
        const decision = scorecard.tossDecision === "BAT" ? "bat" : "bowl";
        return `${tossWinnerName} won the toss and elected to ${decision}`;
      }

      if (scorecard.status === "LIVE" && scorecard.currentInnings === 2) {
        const reqRuns = scorecard.requiredRuns;
        const reqBalls = scorecard.requiredBalls;
        if (reqRuns == null || reqBalls == null) return null;

        const battingInnings = innings.find((i: any) => i.inningsNumber === 2);
        const battingTeamName = battingInnings
          ? battingInnings.battingTeam === "A"
            ? scorecard.teamAName
            : scorecard.teamBName
          : "Batting team";

        return `${battingTeamName} need ${reqRuns} runs in ${reqBalls} balls`;
      }

      return null;
    };

    return (
      <div>
        {getTopLine() && (
          <div className="mb-4 text-sm font-semibold text-gray-800">
            {getTopLine()}
          </div>
        )}

        {innings.map((inn: any) => {
          const battingTeamName =
            inn.battingTeam === "A" ? scorecard.teamAName : scorecard.teamBName;

          const totalScoreText = `${inn.totalRuns}-${inn.totalWickets} (${inn.overs} Ov)`;
          const rr = formatRunRateFromInnings(inn.totalRuns, inn.overs);

          const didNotBatNames = (inn.yetToBat || [])
            .map((p: any) => p.name)
            .filter(Boolean);

          return (
            <div key={inn.inningsId} className="bg-white shadow rounded-lg mb-6 overflow-hidden">
              {/* Innings header */}
              <div className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between">
                <div className="font-semibold">{battingTeamName}</div>
                <div className="font-semibold">{totalScoreText}</div>
              </div>

              {/* Batting table */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Batter</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">R</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">B</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">4s</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">6s</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">SR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(inn.batting || []).map((b: any) => (
                      <tr key={b.playerId}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{b.name}</div>
                          <div className="text-xs text-gray-600">
                            {formatDismissal(b.dismissal)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {b.runs}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">{b.balls}</td>
                        <td className="px-4 py-3 text-right text-gray-900">{b.fours}</td>
                        <td className="px-4 py-3 text-right text-gray-900">{b.sixes}</td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {formatStrikeRate(b.runs, b.balls)}
                        </td>
                      </tr>
                    ))}

                    {/* Extras */}
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">Extras</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900" colSpan={5}>
                        {inn.extras?.total ?? 0} (b {inn.extras?.bye ?? 0}, lb {inn.extras?.legBye ?? 0}, w {inn.extras?.wide ?? 0}, nb {inn.extras?.noBall ?? 0})
                      </td>
                    </tr>

                    {/* Total */}
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">Total</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900" colSpan={5}>
                        {inn.totalRuns}-{inn.totalWickets} ({inn.overs} Overs, RR: {rr})
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Did not bat */}
              {didNotBatNames.length > 0 && (
                <div className="px-4 py-3 border-t text-sm">
                  <span className="font-semibold text-gray-900">Did not bat</span>{" "}
                  <span className="text-gray-700">{didNotBatNames.join(", ")}</span>
                </div>
              )}

              {/* Bowling table */}
              <div className="overflow-x-auto border-t">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Bowler</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">O</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">M</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">R</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">W</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">ECO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(inn.bowling || []).map((bo: any) => (
                      <tr key={bo.playerId}>
                        <td className="px-4 py-3 font-medium text-gray-900">{bo.name}</td>
                        <td className="px-4 py-3 text-right text-gray-900">{bo.overs}</td>
                        <td className="px-4 py-3 text-right text-gray-900">{bo.maidens}</td>
                        <td className="px-4 py-3 text-right text-gray-900">{bo.runsConceded}</td>
                        <td className="px-4 py-3 text-right text-gray-900">{bo.wickets}</td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {formatEconomy(bo.runsConceded, bo.overs)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Handlers for state transitions
  const handleStartInnings = async (data: {
    strikerId: string;
    nonStrikerId: string;
    bowlerId: string;
  }) => {
    try {
      await matchAPI.startMatch(matchId!, data);
      queryClient.invalidateQueries({ queryKey: ["matchScore", matchId] });
    } catch (error: any) {
      alert(`Error starting innings: ${error.message}`);
    }
  };

  const handleStartSecondInnings = async (data: {
    strikerId: string;
    nonStrikerId: string;
    bowlerId: string;
  }) => {
    try {
      await matchAPI.startSecondInnings(matchId!, data);
      queryClient.invalidateQueries({ queryKey: ["matchScore", matchId] });
    } catch (error: any) {
      alert(`Error starting second innings: ${error.message}`);
    }
  };

  // Component for innings break state
  const InningsBreakScreen = ({
    matchScore,
    onStartSecondInnings,
  }: {
    matchScore: any;
    onStartSecondInnings: (data: any) => void;
  }) => {
    const [showSetup, setShowSetup] = useState(false);
    const [selectedStriker, setSelectedStriker] = useState("");
    const [selectedNonStriker, setSelectedNonStriker] = useState("");
    const [selectedBowler, setSelectedBowler] = useState("");

    // Find 2nd inning from data.innings where inningsNumber=2, then pick the batting team
    const secondInnings = matchScore.innings?.find(
      (i: any) => i.inningsNumber === 2,
    );
    const firstInnings = matchScore.innings?.find(
      (i: any) => i.inningsNumber === 1,
    );
    const secondBattingTeam = secondInnings?.battingTeam;
    const secondBattingTeamName =
      secondBattingTeam === "A" ? matchScore.teamAName : matchScore.teamBName;

    // Fetch players for the second batting team
    const { data: secondBattingTeamPlayers } = useQuery({
      queryKey: ["matchPlayers", matchScore.matchId, secondBattingTeam],
      queryFn: () => {
        if (!matchScore.matchId) return [];
        return matchAPI.getMatchPlayers(matchScore.matchId);
      },
      enabled: !!matchScore.matchId && !!secondBattingTeam && showSetup,
      select: (data: any[]) =>
        data?.filter((p: any) => p.team === secondBattingTeam) || [],
    });

    const handleStartSecondInnings = () => {
      if (!selectedStriker || !selectedNonStriker || !selectedBowler) {
        alert("Please select all players");
        return;
      }
      onStartSecondInnings({
        strikerId: selectedStriker,
        nonStrikerId: selectedNonStriker,
        bowlerId: selectedBowler,
      });
    };

    if (!showSetup) {
      // Show banner view
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {/* Innings Break Banner */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-blue-900">
                      Innings Break - Ready to Start 2nd Innings
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <div className="font-semibold">
                        Target:{" "}
                        {firstInnings?.totalRuns
                          ? firstInnings.totalRuns + 1
                          : 0}{" "}
                        runs
                      </div>
                      <div>
                        {secondBattingTeamName} needs{" "}
                        {firstInnings?.totalRuns
                          ? firstInnings.totalRuns + 1
                          : 0}{" "}
                        runs to win
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSetup(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                  >
                    Start 2nd Innings
                  </button>
                </div>
              </div>

              {/* First Innings Summary */}
              {firstInnings && (
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-lg mb-4">
                    First Innings Summary
                  </h3>
                  <div className="text-2xl font-bold mb-2">
                    {matchScore.teamAName}: {firstInnings.totalRuns}/
                    {firstInnings.totalWickets}
                    <span className="text-gray-600 ml-2">
                      ({firstInnings.totalOvers} overs)
                    </span>
                  </div>
                  <div className="text-lg text-gray-700">
                    Run Rate:{" "}
                    {calculateRunRate(
                      firstInnings.totalRuns,
                      firstInnings.totalOvers,
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Show setup view
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="max-w-2xl w-full mx-auto px-4">
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Start Second Innings
              </h1>

              {/* Target Display */}
              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-lg mb-4">
                  Target for {secondBattingTeamName}
                </h3>
                <div className="text-3xl font-bold text-blue-600">
                  {firstInnings?.totalRuns ? firstInnings.totalRuns + 1 : 0}{" "}
                  runs
                </div>
              </div>

              {/* Player Selection */}
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">
                  Select Opening Players
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Striker
                  </label>
                  <select
                    value={selectedStriker}
                    onChange={(e) => setSelectedStriker(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select striker...</option>
                    {secondBattingTeamPlayers?.map((player: any) => (
                      <option key={player.playerId} value={player.playerId}>
                        {player.player?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Non-Striker
                  </label>
                  <select
                    value={selectedNonStriker}
                    onChange={(e) => setSelectedNonStriker(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select non-striker...</option>
                    {secondBattingTeamPlayers
                      ?.filter((p: any) => p.playerId !== selectedStriker)
                      ?.map((player: any) => (
                        <option key={player.playerId} value={player.playerId}>
                          {player.player?.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Bowler
                  </label>
                  <select
                    value={selectedBowler}
                    onChange={(e) => setSelectedBowler(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select bowler...</option>
                    {matchPlayers
                      ?.filter(
                        (p: any) =>
                          p.team === (secondBattingTeam === "A" ? "B" : "A"),
                      )
                      ?.map((player: any) => (
                        <option key={player.playerId} value={player.playerId}>
                          {player.player?.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleStartSecondInnings}
                    disabled={
                      !selectedStriker || !selectedNonStriker || !selectedBowler
                    }
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Start Second Innings
                  </button>
                  <button
                    onClick={() => setShowSetup(false)}
                    className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Component for innings setup state
  const InningsSetupScreen = ({
    matchScore,
    onStartInnings,
  }: {
    matchScore: any;
    onStartInnings: (data: any) => void;
  }) => {
    const [selectedStriker, setSelectedStriker] = useState("");
    const [selectedNonStriker, setSelectedNonStriker] = useState("");
    const [selectedBowler, setSelectedBowler] = useState("");

    const battingTeam = matchScore.currentInnings === 1 ? "A" : "B";
    const battingTeamName =
      battingTeam === "A" ? matchScore.teamAName : matchScore.teamBName;
    const bowlingTeamName =
      battingTeam === "A" ? matchScore.teamBName : matchScore.teamAName;

    const handleStartInnings = () => {
      if (!selectedStriker || !selectedNonStriker || !selectedBowler) {
        alert("Please select all players");
        return;
      }
      onStartInnings({
        strikerId: selectedStriker,
        nonStrikerId: selectedNonStriker,
        bowlerId: selectedBowler,
      });
    };

    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="max-w-2xl w-full mx-auto px-4">
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Start {matchScore.currentInnings === 1 ? "First" : "Second"}{" "}
                Innings
              </h1>

              <div className="space-y-6">
                <h3 className="font-semibold text-lg">
                  {battingTeamName} to Bat
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Striker
                  </label>
                  <select
                    value={selectedStriker}
                    onChange={(e) => setSelectedStriker(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select striker...</option>
                    {matchPlayers
                      ?.filter((p: any) => p.team === battingTeam)
                      ?.map((player: any) => (
                        <option key={player.playerId} value={player.playerId}>
                          {player.player?.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Non-Striker
                  </label>
                  <select
                    value={selectedNonStriker}
                    onChange={(e) => setSelectedNonStriker(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select non-striker...</option>
                    {matchPlayers
                      ?.filter(
                        (p: any) =>
                          p.team === battingTeam &&
                          p.playerId !== selectedStriker,
                      )
                      ?.map((player: any) => (
                        <option key={player.playerId} value={player.playerId}>
                          {player.player?.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Bowler ({bowlingTeamName})
                  </label>
                  <select
                    value={selectedBowler}
                    onChange={(e) => setSelectedBowler(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select bowler...</option>
                    {matchPlayers
                      ?.filter(
                        (p: any) =>
                          p.team === (battingTeam === "A" ? "B" : "A"),
                      )
                      ?.map((player: any) => (
                        <option key={player.playerId} value={player.playerId}>
                          {player.player?.name}
                        </option>
                      ))}
                  </select>
                </div>

                <button
                  onClick={handleStartInnings}
                  disabled={
                    !selectedStriker || !selectedNonStriker || !selectedBowler
                  }
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Start {matchScore.currentInnings === 1 ? "First" : "Second"}{" "}
                  Innings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
        wicketType: WICKET_TYPE.BOWLED,
        dismissedPlayerId: "",
        newBatsmanId: "",
        fielderId: "",
      });
      setSelectedWicketType(WICKET_TYPE.BOWLED);
    }
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
        wicketType: WICKET_TYPE.BOWLED,
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
      [WICKET_TYPE.CAUGHT, WICKET_TYPE.STUMPED, WICKET_TYPE.RUN_OUT].includes(
        selectedWicketType as any,
      )
    ) {
      if (!wicketData.fielderId) {
        alert("Fielder is required for this wicket type");
        return;
      }
    }

    // Handle caught & bowled logic
    let finalWicketType = selectedWicketType;
    let finalFielderId: string | null | undefined = wicketData.fielderId;

    if (
      selectedWicketType === WICKET_TYPE.CAUGHT &&
      wicketData.fielderId === currentPlayers.bowler?.id
    ) {
      finalWicketType = WICKET_TYPE.CAUGHT_AND_BOWLED;
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
      fielderId: finalFielderId,
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

  const PageShell = ({ children }: { children: React.ReactNode }) => {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab("SCORING")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeTab === "SCORING"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Scoring
                </button>
                <button
                  onClick={() => setActiveTab("SCORECARD")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeTab === "SCORECARD"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Scorecard
                </button>
              </div>

              {activeTab === "SCORECARD" && (
                <button
                  onClick={() =>
                    queryClient.invalidateQueries({
                      queryKey: ["matchScorecard", matchId],
                    })
                  }
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Refresh
                </button>
              )}
            </div>
          </div>
        </div>

        {children}
      </div>
    );
  };

  if (scoreLoading && activeTab === "SCORING") {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (activeTab === "SCORECARD" && scorecardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (activeTab === "SCORECARD" && scorecardError) {
    return (
      <PageShell>
        <div className="flex justify-center items-center py-10">
          <div className="bg-white shadow rounded-lg p-6 text-red-600">
            Error loading scorecard
          </div>
        </div>
      </PageShell>
    );
  }

  if (activeTab === "SCORECARD") {
    return (
      <PageShell>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <ScorecardView scorecard={matchScorecard} />
          </div>
        </div>
      </PageShell>
    );
  }

  if (!matchScore) {
    return (
      <PageShell>
        <div className="flex justify-center items-center py-10">
          <div className="text-red-600">Match score not found.</div>
        </div>
      </PageShell>
    );
  }

  // State-based rendering
  if (matchState === "MATCH_COMPLETED") {
    return (
      <PageShell>
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </PageShell>
    );
  }

  if (matchState === "INNINGS_BREAK") {
    return (
      <PageShell>
        <InningsBreakScreen
          matchScore={matchScore}
          onStartSecondInnings={handleStartSecondInnings}
        />
      </PageShell>
    );
  }

  if (matchState === "INNINGS_SETUP") {
    return (
      <PageShell>
        <InningsSetupScreen
          matchScore={matchScore}
          onStartInnings={handleStartInnings}
        />
      </PageShell>
    );
  }

  if (matchState === "LOADING") {
    return (
      <PageShell>
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </PageShell>
    );
  }

  if (!matchScore) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-red-600">Match score not found.</div>
      </div>
    );
  }

  // Default: INNINGS_LIVE - Show scoring interface
  const battingTeam =
    currentInnings?.battingTeam === "A"
      ? matchScore.teamAName
      : matchScore.teamBName;

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Match Header */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  {matchScore.teamAName} vs {matchScore.teamBName}
                </h1>
                {/* Toss Decision Display - Only during first innings */}
                {matchScore.currentInnings === 1 &&
                  matchScore.tossWinner &&
                  matchScore.tossDecision && (
                    <div className="mt-2 text-sm text-gray-600">
                      {matchScore.tossWinner === "A"
                        ? matchScore.teamAName
                        : matchScore.teamBName}{" "}
                      opted to {matchScore.tossDecision.toLowerCase()}
                    </div>
                  )}
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
                  CRR: {matchScore.currentRunRate}
                  {matchScore.currentInnings === 2 && matchScore.target && (
                    <span className="ml-4">
                      RR: {matchScore.requiredRunRate}
                    </span>
                  )}
                </div>
                {/* Extras Display */}
                {currentInnings?.extras && (
                  <div className="mt-2 text-sm text-gray-600">
                    Extras: {currentInnings.extras.total}
                    {currentInnings.extras.total > 0 && (
                      <span>
                        {" ("}
                        {currentInnings.extras.wide > 0 && (
                          <span>WD: {currentInnings.extras.wide}</span>
                        )}
                        {currentInnings.extras.noBall > 0 && (
                          <span>, NB: {currentInnings.extras.noBall}</span>
                        )}
                        {currentInnings.extras.bye > 0 && (
                          <span>, B: {currentInnings.extras.bye}</span>
                        )}
                        {currentInnings.extras.legBye > 0 && (
                          <span>, LB: {currentInnings.extras.legBye}</span>
                        )}
                        {")"}
                      </span>
                    )}
                  </div>
                )}
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
                      <button 
                        onClick={() => {
                          if (window.confirm("Are you sure you want to undo the last ball?")) {
                            undoLastBallMutation.mutate(matchId!);
                          }
                        }}
                        disabled={undoLastBallMutation.isPending}
                        className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 disabled:opacity-50"
                      >
                        {undoLastBallMutation.isPending ? "Undoing..." : "Undo Ball"}
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
                  setSelectedWicketType(e.target.value as WicketType)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={WICKET_TYPE.BOWLED}>
                  {getWicketTypeDisplay(WICKET_TYPE.BOWLED)}
                </option>
                <option value={WICKET_TYPE.CAUGHT}>
                  {getWicketTypeDisplay(WICKET_TYPE.CAUGHT)}
                </option>
                <option value={WICKET_TYPE.RUN_OUT}>
                  {getWicketTypeDisplay(WICKET_TYPE.RUN_OUT)}
                </option>
                <option value={WICKET_TYPE.LBW}>
                  {getWicketTypeDisplay(WICKET_TYPE.LBW)}
                </option>
                <option value={WICKET_TYPE.STUMPED}>
                  {getWicketTypeDisplay(WICKET_TYPE.STUMPED)}
                </option>
                <option value={WICKET_TYPE.HIT_WICKET}>
                  {getWicketTypeDisplay(WICKET_TYPE.HIT_WICKET)}
                </option>
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

            {(selectedWicketType === WICKET_TYPE.CAUGHT ||
              selectedWicketType === WICKET_TYPE.STUMPED ||
              selectedWicketType === WICKET_TYPE.RUN_OUT) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fielder{" "}
                  {selectedWicketType === WICKET_TYPE.STUMPED
                    ? "(Wicketkeeper)"
                    : ""}
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
                    selectedWicketType === WICKET_TYPE.CAUGHT ||
                    selectedWicketType === WICKET_TYPE.STUMPED
                  }
                >
                  <option value="">
                    {selectedWicketType === WICKET_TYPE.STUMPED
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
                onClick={() => {
                  setShowWicketModal(false);
                  setIsWicket(false);
                }}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleWicketSubmit()}
                disabled={
                  !wicketData.dismissedPlayerId ||
                  !wicketData.newBatsmanId ||
                  (selectedWicketType === WICKET_TYPE.CAUGHT &&
                    !wicketData.fielderId) ||
                  (selectedWicketType === WICKET_TYPE.STUMPED &&
                    !wicketData.fielderId) ||
                  (selectedWicketType === WICKET_TYPE.RUN_OUT &&
                    !wicketData.fielderId)
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
    </PageShell>
  );
};
