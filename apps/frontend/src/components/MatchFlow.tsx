import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { matchAPI } from "../lib/auth";
import { MATCH_STATUS } from "../lib/enums";
import { CreateMatchPage } from "../pages/CreateMatchPage";
import { AccessCodePage } from "../pages/AccessCodePage";
import { AddMatchPlayersPage } from "../pages/MatchSetupPage";
import { OpeningPlayersPage } from "../pages/OpeningPlayersPage";

interface MatchFlowProps {
  className?: string;
}

export const MatchFlow: React.FC<MatchFlowProps> = ({ className = "" }) => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState<string>("CREATE_MATCH");

  // Fetch match data to determine current step
  const { data: match, isLoading } = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => {
      if (!matchId) return null;
      return matchAPI.getMatchScore(matchId);
    },
    enabled: !!matchId,
  });

  // Update current step based on match status
  useEffect(() => {
    if (match) {
      if (match.status === MATCH_STATUS.CREATED) {
        setCurrentStep("ACCESS_CODE");
      } else if (match.status === MATCH_STATUS.ACCESS_VERIFIED) {
        setCurrentStep("ADD_MATCH_PLAYERS");
      } else if (match.status === MATCH_STATUS.PLAYERS_ADDED) {
        setCurrentStep("OPENING_PLAYERS");
      } else if (match.status === MATCH_STATUS.LIVE) {
        if (matchId) {
          navigate(`/scoring/${matchId}`, { replace: true });
        }
      } else if (match.status === MATCH_STATUS.COMPLETED) {
        setCurrentStep("MATCH_COMPLETED");
      }
    } else {
      // No match exists, we're in creation step
      setCurrentStep("CREATE_MATCH");
    }
  }, [match, matchId, navigate]);

  const steps = [
    {
      id: "CREATE_MATCH",
      name: "Create Match",
      description: "Enter match details",
    },
    {
      id: "ACCESS_CODE",
      name: "Access Code",
      description: "Enter and validate access code",
    },
    {
      id: "ADD_MATCH_PLAYERS",
      name: "Add Match Players",
      description: "Add players to both teams",
    },
    {
      id: "OPENING_PLAYERS",
      name: "Opening Players",
      description: "Select opening batsmen and bowler",
    },
  ];

  const getStepStatus = (stepId: string, currentStatus: string) => {
    const statusOrder = [
      "CREATE_MATCH",
      "ACCESS_CODE",
      "ADD_MATCH_PLAYERS",
      "OPENING_PLAYERS",
    ];

    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "CREATE_MATCH":
        return (
          <CreateMatchPage
            onMatchCreated={(newMatchId: string) => {
              navigate(`/match-flow/${newMatchId}`, { replace: true });
              queryClient.invalidateQueries({ queryKey: ["match", newMatchId] });
            }}
          />
        );

      case "ACCESS_CODE":
        return matchId ? (
          <AccessCodePage
            matchId={matchId}
            onCodeValidated={() => {
              queryClient.invalidateQueries({ queryKey: ["match", matchId] });
            }}
          />
        ) : null;

      case "ADD_MATCH_PLAYERS":
        return matchId ? <AddMatchPlayersPage /> : null;

      case "OPENING_PLAYERS":
        return matchId ? <OpeningPlayersPage /> : null;

      case "MATCH_COMPLETED":
        return (
          <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Match Completed</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 mb-4">
                View final results, winner details, and man of the match.
              </p>
              <button
                onClick={() => navigate(`/result/${matchId}`)}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 mr-4"
              >
                View Results
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Unknown Step</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">Current step: {currentStep}</p>
            </div>
          </div>
        );
    }
  };

  // Determine if stepper should be visible (only for first 5 steps)
  const shouldShowStepper = [
    "CREATE_MATCH",
    "ACCESS_CODE",
    "ADD_MATCH_PLAYERS",
    "OPENING_PLAYERS",
  ].includes(currentStep);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Stepper Header - Only show for first 5 steps */}
      {shouldShowStepper && (
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <nav aria-label="Progress">
                <ol className="flex items-center justify-between">
                  {steps.map((step, stepIdx) => (
                    <li key={step.id} className="flex-1">
                      {stepIdx !== steps.length - 1 ? (
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {getStepStatus(step.id, currentStep) ===
                            "completed" ? (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600">
                                <span className="text-white font-bold">✓</span>
                              </div>
                            ) : getStepStatus(step.id, currentStep) ===
                              "current" ? (
                              <div
                                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-green-600 bg-white"
                                aria-current="step"
                              >
                                <span className="text-sm font-medium text-green-600">
                                  {stepIdx + 1}
                                </span>
                              </div>
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                                <span className="text-sm font-medium text-gray-500">
                                  {stepIdx + 1}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4 flex min-w-0 flex-col">
                            <p
                              className={`text-sm font-medium ${
                                getStepStatus(step.id, currentStep) ===
                                "completed"
                                  ? "text-green-600"
                                  : getStepStatus(step.id, currentStep) ===
                                      "current"
                                    ? "text-green-600"
                                    : "text-gray-500"
                              }`}
                            >
                              {step.name}
                            </p>
                            <p
                              className={`text-sm ${
                                getStepStatus(step.id, currentStep) ===
                                "completed"
                                  ? "text-green-600"
                                  : getStepStatus(step.id, currentStep) ===
                                      "current"
                                    ? "text-green-600"
                                    : "text-gray-500"
                              }`}
                            >
                              {step.description}
                            </p>
                          </div>
                          {stepIdx !== steps.length - 1 && (
                            <div
                              className={`ml-4 h-0.5 w-full ${
                                getStepStatus(step.id, currentStep) ===
                                "completed"
                                  ? "bg-green-600"
                                  : "bg-gray-300"
                              }`}
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {getStepStatus(step.id, currentStep) ===
                            "completed" ? (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600">
                                <span className="text-white font-bold">✓</span>
                              </div>
                            ) : getStepStatus(step.id, currentStep) ===
                              "current" ? (
                              <div
                                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-green-600 bg-white"
                                aria-current="step"
                              >
                                <span className="text-sm font-medium text-green-600">
                                  {stepIdx + 1}
                                </span>
                              </div>
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                                <span className="text-sm font-medium text-gray-500">
                                  {stepIdx + 1}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4 flex min-w-0 flex-col">
                            <p
                              className={`text-sm font-medium ${
                                getStepStatus(step.id, currentStep) ===
                                "completed"
                                  ? "text-green-600"
                                  : getStepStatus(step.id, currentStep) ===
                                      "current"
                                    ? "text-green-600"
                                    : "text-gray-500"
                              }`}
                            >
                              {step.name}
                            </p>
                            <p
                              className={`text-sm ${
                                getStepStatus(step.id, currentStep) ===
                                "completed"
                                  ? "text-green-600"
                                  : getStepStatus(step.id, currentStep) ===
                                      "current"
                                    ? "text-green-600"
                                    : "text-gray-500"
                              }`}
                            >
                              {step.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="step-content">{renderCurrentStep()}</div>
        </div>
      </div>

      <style>{`
        .step-content {
          min-height: calc(100vh - 200px);
        }
      `}</style>
    </div>
  );
};
