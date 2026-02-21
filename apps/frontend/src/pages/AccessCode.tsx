import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/axios';

const AccessCode: React.FC = () => {
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId') || '';
  
  const [formData, setFormData] = useState({
    matchId,
    code: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/access-codes/validate', formData);
      
      setSuccess('Access code validated! Redirecting to scoring...');
      
      // Store match info for scoring
      localStorage.setItem('currentMatch', JSON.stringify({
        matchId: response.data.matchId,
        turfId: response.data.turfId
      }));
      
      // Redirect to scoring page after 2 seconds
      setTimeout(() => {
        navigate(`/scoring/${response.data.matchId}`);
      }, 2000);
      
    } catch (error: any) {
      setError(error.response?.data?.message || 'Invalid access code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Enter Access Code
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Get the access code from the match organizer to join the scoring
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="matchId" className="block text-sm font-medium text-gray-700">
                Match ID
              </label>
              <input
                id="matchId"
                name="matchId"
                type="text"
                value={formData.matchId}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                placeholder="Enter match ID"
                readOnly={!!matchId}
              />
              {matchId && (
                <p className="mt-1 text-sm text-gray-500">
                  Match ID pre-filled from URL
                </p>
              )}
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Access Code *
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                value={formData.code}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
                placeholder="000000"
                maxLength={6}
                pattern="[0-9]{6}"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the 6-digit access code provided by the match organizer
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    How to get access code?
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Contact the match organizer</li>
                      <li>Ask for the 6-digit access code</li>
                      <li>Codes expire after 10 minutes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Validating...' : 'Join Match'}
              </button>
            </div>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                Want to create your own match?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Go to Dashboard
                </button>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccessCode;
