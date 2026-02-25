import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchAPI, accessCodeAPI } from '../lib/auth';
import { MATCH_STATUS } from '../lib/enums';

export const GenerateAccessCodePage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);

  // Fetch upcoming matches
  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: matchAPI.getMatches,
  });

  // Filter matches ready for access code generation
  const availableMatches = matches?.filter(match => match.status === MATCH_STATUS.CREATED) || [];

  const generateCodeMutation = useMutation({
    mutationFn: accessCodeAPI.generateAccessCode,
    onSuccess: (data) => {
      setGeneratedCode(data.code);
      setShowCodeModal(true);
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    onError: (error: any) => {
      alert(`Error generating code: ${error.message}`);
    },
  });

  const handleGenerateCode = () => {
    if (!selectedMatchId) {
      alert('Please select a match');
      return;
    }
    generateCodeMutation.mutate(selectedMatchId);
  };

  const closeModal = () => {
    setShowCodeModal(false);
    setGeneratedCode('');
    setSelectedMatchId('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    alert('Code copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Generate Access Code</h1>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="match" className="block text-sm font-medium text-gray-700 mb-2">
                      Select Match *
                    </label>
                    <select
                      id="match"
                      value={selectedMatchId}
                      onChange={(e) => setSelectedMatchId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Choose a match...</option>
                      {availableMatches.length === 0 ? (
                        <option disabled>No available matches</option>
                      ) : (
                        availableMatches.map((match: any) => (
                          <option key={match.id} value={match.id}>
                            {match.teamAName} vs {match.teamBName} - {new Date(match.createdAt).toLocaleDateString()}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {availableMatches.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        No available matches found. Create a match first to generate access codes.
                      </p>
                    </div>
                  )}

                  {availableMatches.length > 0 && (
                    <div className="flex justify-end">
                      <button
                        onClick={handleGenerateCode}
                        disabled={!selectedMatchId || generateCodeMutation.isPending}
                        className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {generateCodeMutation.isPending ? 'Generating...' : 'Generate Code'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generated Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h6m2 5H7a2 2 0 01-2-2v-6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707H19a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707H19a2 2 0 012 2v6a2 2 0 01-2 2H7z" />
                </svg>
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Access Code Generated!</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Share this code with the players to allow them to join the match.
                </p>
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-2xl font-mono font-bold text-green-800">
                    {generatedCode}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Valid for 10 minutes
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md"
              >
                Copy Code
              </button>
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
