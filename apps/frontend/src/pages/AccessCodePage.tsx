import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { accessCodeAPI } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { getRouteWithMatchId, MatchStatus } from '../lib/enums';

interface AccessCodePageProps {
  matchId?: string;
  onCodeValidated?: (matchData: any) => void;
}

export const AccessCodePage: React.FC<AccessCodePageProps> = ({ matchId: propMatchId, onCodeValidated }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    matchId: propMatchId || '',
    code: '',
  });

  // Load matchId from localStorage on component mount
  useEffect(() => {
    if (!propMatchId) {
      const storedMatch = localStorage.getItem('currentMatch');
      if (storedMatch) {
        const matchData = JSON.parse(storedMatch);
        setFormData(prev => ({
          ...prev,
          matchId: matchData.matchId || ''
        }));
      }
    }
  }, [propMatchId]);

  const validateCodeMutation = useMutation({
    mutationFn: ({ matchId, code }: { matchId: string; code: string }) => 
      accessCodeAPI.validateAccessCode(matchId, code),
    onSuccess: (data) => {
      // Store match info in localStorage for later use
      localStorage.setItem('currentMatch', JSON.stringify(data));
      
      // Use custom callback if provided, otherwise use default navigation
      if (onCodeValidated) {
        onCodeValidated(data);
      } else {
        // Redirect based on match status using enum-based routing with matchId
        const matchStatus = data.status as MatchStatus;
        const targetRoute = getRouteWithMatchId(matchStatus, data.matchId);
        navigate(targetRoute);
      }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Enter Access Code</h1>
              <p className="text-sm text-gray-600 mb-6">
                Enter the access code to continue with the match setup.
              </p>
              
              {/* Display match ID (read-only) */}
              {formData.matchId && (
                <div className="mb-6 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">Match ID:</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{formData.matchId}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
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
    </div>
  );
};
