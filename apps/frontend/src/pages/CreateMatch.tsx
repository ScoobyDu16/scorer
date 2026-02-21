import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';

interface CreateMatchData {
  teamAName: string;
  teamBName: string;
  overs: number;
  venue?: string;
  playersPerTeam: number;
  tossWinner?: 'A' | 'B';
  tossDecision?: 'BAT' | 'BOWL';
}

const CreateMatch: React.FC = () => {
  const [formData, setFormData] = useState<CreateMatchData>({
    teamAName: '',
    teamBName: '',
    overs: 20,
    venue: '',
    playersPerTeam: 11,
    tossWinner: undefined,
    tossDecision: undefined
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'overs' || name === 'playersPerTeam' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/matches', formData);
      
      setSuccess('Match created successfully! Generating access code...');
      
      // Generate access code for the match
      setTimeout(async () => {
        try {
          const codeResponse = await api.post('/access-codes/generate', {
            matchId: response.data.id
          });
          
          setSuccess(`Match created! Access code: ${codeResponse.data.code}`);
          
          // Redirect to match setup after 3 seconds
          setTimeout(() => {
            navigate(`/match/${response.data.id}/setup`);
          }, 3000);
          
        } catch (codeError: any) {
          setError('Failed to generate access code');
        }
      }, 1000);
      
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Create New Match
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Set up a new cricket match
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="teamAName" className="block text-sm font-medium text-gray-700">
                  Team A Name *
                </label>
                <input
                  id="teamAName"
                  name="teamAName"
                  type="text"
                  required
                  value={formData.teamAName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Team A name"
                />
              </div>

              <div>
                <label htmlFor="teamBName" className="block text-sm font-medium text-gray-700">
                  Team B Name *
                </label>
                <input
                  id="teamBName"
                  name="teamBName"
                  type="text"
                  required
                  value={formData.teamBName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter Team B name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="overs" className="block text-sm font-medium text-gray-700">
                  Number of Overs *
                </label>
                <input
                  id="overs"
                  name="overs"
                  type="number"
                  min="1"
                  max="999"
                  required
                  value={formData.overs}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter number of overs"
                />
              </div>

              <div>
                <label htmlFor="playersPerTeam" className="block text-sm font-medium text-gray-700">
                  Players Per Team *
                </label>
                <input
                  id="playersPerTeam"
                  name="playersPerTeam"
                  type="number"
                  min="1"
                  max="99"
                  required
                  value={formData.playersPerTeam}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter players per team"
                />
              </div>

              <div>
                <label htmlFor="venue" className="block text-sm font-medium text-gray-700">
                  Venue (Optional)
                </label>
                <input
                  id="venue"
                  name="venue"
                  type="text"
                  value={formData.venue}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter venue name"
                />
              </div>
            </div>

            {/* Toss Configuration */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Toss Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="tossWinner" className="block text-sm font-medium text-gray-700">
                    Toss Winner *
                  </label>
                  <select
                    id="tossWinner"
                    name="tossWinner"
                    value={formData.tossWinner || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select winner</option>
                    <option value="A">{formData.teamAName || 'Team A'}</option>
                    <option value="B">{formData.teamBName || 'Team B'}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="tossDecision" className="block text-sm font-medium text-gray-700">
                    Toss Decision *
                  </label>
                  <select
                    id="tossDecision"
                    name="tossDecision"
                    value={formData.tossDecision || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select decision</option>
                    <option value="BAT">Bat First</option>
                    <option value="BOWL">Bowl First</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-md font-medium"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Match...' : 'Create Match'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateMatch;
