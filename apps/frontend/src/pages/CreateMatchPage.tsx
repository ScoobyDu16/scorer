import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { matchAPI } from "../lib/auth";
import { useNavigate } from "react-router-dom";

interface CreateMatchPageProps {
  onMatchCreated?: (matchId: string) => void;
}

export const CreateMatchPage: React.FC<CreateMatchPageProps> = ({ onMatchCreated }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    teamAName: "",
    teamBName: "",
    overs: 20,
    venue: "",
    tossWinner: "A" as "A" | "B",
    tossDecision: "BAT" as "BAT" | "BOWL",
    playersPerTeam: 11,
  });

  const createMatchMutation = useMutation({
    mutationFn: matchAPI.createMatch,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      // Store match data with playersPerTeam for setup page
      const matchDataForSetup = {
        matchId: data.id,
        playersPerTeam: formData.playersPerTeam || 11,
      };
      localStorage.setItem("currentMatch", JSON.stringify(matchDataForSetup));
      
      // Use custom callback if provided, otherwise use default navigation
      if (onMatchCreated) {
        onMatchCreated(data.id);
      } else {
        navigate("/access-code");
      }
    },
    onError: (error: any) => {
      alert(`Error creating match: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMatchMutation.mutate(formData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "overs" || name === "playersPerTeam"
          ? value === "" ? "" : Number(value)
          : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Create New Match
              </h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="teamAName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Team A Name *
                    </label>
                    <input
                      type="text"
                      id="teamAName"
                      name="teamAName"
                      value={formData.teamAName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter Team A name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="teamBName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Team B Name *
                    </label>
                    <input
                      type="text"
                      id="teamBName"
                      name="teamBName"
                      value={formData.teamBName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter Team B name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label
                      htmlFor="overs"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Overs *
                    </label>
                    <input
                      type="text"
                      id="overs"
                      name="overs"
                      value={formData.overs}
                      onChange={handleInputChange}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      required
                      min="1"
                      max="50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="playersPerTeam"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Players Per Team *
                    </label>
                    <input
                      type="text"
                      id="playersPerTeam"
                      name="playersPerTeam"
                      value={formData.playersPerTeam}
                      onChange={handleInputChange}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      required
                      min="1"
                      max="11"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="venue"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Venue
                    </label>
                    <input
                      type="text"
                      id="venue"
                      name="venue"
                      value={formData.venue}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter venue (optional)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="tossWinner"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Toss Winner *
                    </label>
                    <select
                      id="tossWinner"
                      name="tossWinner"
                      value={formData.tossWinner}
                      onChange={handleInputChange}
                      required
                      disabled={!formData.teamAName || !formData.teamBName}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {!formData.teamAName || !formData.teamBName
                          ? "Enter both team names first"
                          : "Select toss winner"}
                      </option>
                      {formData.teamAName && formData.teamBName && (
                        <>
                          <option value="A">{formData.teamAName}</option>
                          <option value="B">{formData.teamBName}</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="tossDecision"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Toss Decision *
                    </label>
                    <select
                      id="tossDecision"
                      name="tossDecision"
                      value={formData.tossDecision}
                      onChange={handleInputChange}
                      required
                      disabled={!formData.tossWinner || !formData.teamAName || !formData.teamBName}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {!formData.tossWinner
                          ? "Select toss winner first"
                          : "Select toss decision"}
                      </option>
                      <option value="BAT">Bat First</option>
                      <option value="BOWL">Bowl First</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={
                      createMatchMutation.isPending ||
                      !formData.teamAName ||
                      !formData.teamBName ||
                      !formData.overs ||
                      !formData.playersPerTeam ||
                      !formData.tossWinner ||
                      !formData.tossDecision
                    }
                    className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {createMatchMutation.isPending
                      ? "Creating..."
                      : "Create Match"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
