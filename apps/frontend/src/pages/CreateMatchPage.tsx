import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchAPI } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

export const CreateMatchPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    teamAName: '',
    teamBName: '',
    overs: 20,
    venue: '',
    tossWinner: 'A' as 'A' | 'B',
    tossDecision: 'BAT' as 'BAT' | 'FIELD',
    playersPerTeam: 11,
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdMatchId, setCreatedMatchId] = useState('');

  const createMatchMutation = useMutation({
    mutationFn: matchAPI.createMatch,
    onSuccess: (data) => {
      setCreatedMatchId(data.id);
      setShowSuccessModal(true);
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    onError: (error: any) => {
      alert(`Error creating match: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMatchMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'overs' || name === 'playersPerTeam' ? Number(value) : value,
    }));
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    navigate('/access-code');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Match</h1>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="teamAName" className="block text-sm font-medium text-gray-700 mb-2">
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
                    <label htmlFor="teamBName" className="block text-sm font-medium text-gray-700 mb-2">
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
                    <label htmlFor="overs" className="block text-sm font-medium text-gray-700 mb-2">
                      Overs *
                    </label>
                    <input
                      type="number"
                      id="overs"
                      name="overs"
                      value={formData.overs}
                      onChange={handleInputChange}
                      required
                      min="1"
                      max="50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="playersPerTeam" className="block text-sm font-medium text-gray-700 mb-2">
                      Players Per Team *
                    </label>
                    <input
                      type="number"
                      id="playersPerTeam"
                      name="playersPerTeam"
                      value={formData.playersPerTeam}
                      onChange={handleInputChange}
                      required
                      min="1"
                      max="11"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">
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
                    <label htmlFor="tossWinner" className="block text-sm font-medium text-gray-700 mb-2">
                      Toss Winner *
                    </label>
                    <select
                      id="tossWinner"
                      name="tossWinner"
                      value={formData.tossWinner}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="A">Team A</option>
                      <option value="B">Team B</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="tossDecision" className="block text-sm font-medium text-gray-700 mb-2">
                      Toss Decision *
                    </label>
                    <select
                      id="tossDecision"
                      name="tossDecision"
                      value={formData.tossDecision}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="BAT">Bat First</option>
                      <option value="FIELD">Field First</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={createMatchMutation.isPending}
                    className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {createMatchMutation.isPending ? 'Creating...' : 'Create Match'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Match Created Successfully!</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Your match has been created with status "UPCOMING".
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Share the match ID with the admin to generate an access code.
                </p>
                <div className="mt-4 p-3 bg-gray-100 rounded-md">
                  <p className="text-sm font-mono font-semibold text-gray-900">
                    Match ID: {createdMatchId}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
