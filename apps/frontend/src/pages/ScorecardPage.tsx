import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { matchAPI } from "../lib/auth";

export const ScorecardPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();

  const {
    data: matchScorecard,
    isLoading: scorecardLoading,
    error: scorecardError,
  } = useQuery({
    queryKey: ["matchScorecard", matchId],
    queryFn: () => matchAPI.getMatchScorecard(matchId!),
    enabled: !!matchId,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (matchScorecard?.status === "LIVE" && matchId) {
      navigate(`/scoring/${matchId}`, { replace: true });
    }
  }, [matchScorecard?.status, matchId, navigate]);

  const innings = matchScorecard?.innings || [];

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
    if (!matchScorecard) return null;

    if (matchScorecard.status === "COMPLETED" && matchScorecard.result) {
      return matchScorecard.result;
    }

    return null;
  };

  if (scorecardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (scorecardError) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-white shadow rounded-lg p-6 text-red-600">
          Error loading scorecard
        </div>
      </div>
    );
  }

  if (!matchScorecard) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-red-600">Scorecard not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="text-lg font-semibold text-gray-900">Scorecard</div>
            <button
              onClick={() => navigate("/match-management")}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {getTopLine() && (
            <div className="mb-4 text-sm font-semibold text-gray-800">
              {getTopLine()}
            </div>
          )}

          {innings.map((inn: any) => {
            const battingTeamName =
              inn.battingTeam === "A"
                ? matchScorecard.teamAName
                : matchScorecard.teamBName;

            const totalScoreText = `${inn.totalRuns}-${inn.totalWickets} (${inn.overs} Ov)`;
            const rr = formatRunRateFromInnings(inn.totalRuns, inn.overs);

            const didNotBatNames = (inn.yetToBat || [])
              .map((p: any) => p.name)
              .filter(Boolean);

            return (
              <div
                key={inn.inningsId}
                className="bg-white shadow rounded-lg mb-6 overflow-hidden"
              >
                <div className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between">
                  <div className="font-semibold">{battingTeamName}</div>
                  <div className="font-semibold">{totalScoreText}</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Batter
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700">
                          R
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700">
                          B
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700">
                          4s
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700">
                          6s
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700">
                          SR
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(inn.batting || []).map((b: any) => (
                        <tr key={b.playerId}>
                          <td className="px-4 py-3">
                            <div 
                              className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                              onClick={() => navigate(`/players/${b.playerId}`)}
                            >
                              {b.name}
                            </div>
                            <div className="text-xs text-gray-600">
                              {formatDismissal(b.dismissal)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            {b.runs}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900">
                            {b.balls}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900">
                            {b.fours}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900">
                            {b.sixes}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900">
                            {formatStrikeRate(b.runs, b.balls)}
                          </td>
                        </tr>
                      ))}

                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          Extras
                        </td>
                        <td
                          className="px-4 py-3 text-right font-semibold text-gray-900"
                          colSpan={5}
                        >
                          {inn.extras?.total ?? 0} (b {inn.extras?.bye ?? 0}, lb{" "}
                          {inn.extras?.legBye ?? 0}, w {inn.extras?.wide ?? 0}, nb{" "}
                          {inn.extras?.noBall ?? 0})
                        </td>
                      </tr>

                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          Total
                        </td>
                        <td
                          className="px-4 py-3 text-right font-semibold text-gray-900"
                          colSpan={5}
                        >
                          {inn.totalRuns}-{inn.totalWickets} ({inn.overs} Overs, RR: {rr})
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {didNotBatNames.length > 0 && (
                  <div className="px-4 py-3 border-t text-sm">
                    <span className="font-semibold text-gray-900">Did not bat</span>{" "}
                    <span className="text-gray-700">{didNotBatNames.join(", ")}</span>
                  </div>
                )}

                <div className="overflow-x-auto border-t">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Bowler
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700">
                          O
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700">
                          M
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700">
                          R
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700">
                          W
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700">
                          ECO
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(inn.bowling || []).map((bo: any) => (
                        <tr key={bo.playerId}>
                          <td className="px-4 py-3">
                            <div 
                              className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                              onClick={() => navigate(`/players/${bo.playerId}`)}
                            >
                              {bo.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900">
                            {bo.overs}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900">
                            {bo.maidens}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900">
                            {bo.runsConceded}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900">
                            {bo.wickets}
                          </td>
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
      </div>
    </div>
  );
};
