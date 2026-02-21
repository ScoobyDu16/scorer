import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { accessCodeAPI } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

export const AccessCodePage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    matchId: '',
    code: '',
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validatedMatch, setValidatedMatch] = useState<any>(null);

  const validateCodeMutation = useMutation({
    mutationFn: ({ matchId, code }: { matchId: string; code: string }) => 
      accessCodeAPI.validateAccessCode(matchId, code),
    onSuccess: (data) => {
      setValidatedMatch(data);
      setShowSuccessModal(true);
    },
    onError: (error: any) => {
      alert(`Invalid or expired code: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateCodeMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const proceedToMatch = () => {
    // Store match info in localStorage for later use
    localStorage.setItem('currentMatch', JSON.stringify(validatedMatch));
    navigate(`/match-setup/${formData.matchId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Enter Access Code</h1>
              <p className="text-sm text-gray-600 mb-6">
                Enter the match ID and access code to continue with the match setup.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="matchId" className="block text-sm font-medium text-gray-700 mb-2">
                    Match ID *
                  </label>
                  <input
                    type="text"
                    id="matchId"
                    name="matchId"
                    value={formData.matchId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter match ID"
                  />
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Access Code *
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    maxLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-lg text-center"
                    placeholder="Enter 6-digit code"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={validateCodeMutation.isPending}
                    className="w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {validateCodeMutation.isPending ? 'Validating...' : 'Continue'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && validatedMatch && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0" />
                </svg>
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Access Code Valid!</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  You can now proceed with the match setup.
                </p>
                <div className="mt-4 p-3 bg-gray-100 rounded-md">
                  <p className="text-sm font-semibold text-gray-900">
                    Match: {validatedMatch.matchId}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={proceedToMatch}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
              >
                Continue to Match Setup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
