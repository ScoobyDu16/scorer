import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { playerAPI } from '../lib/auth';
import { Player } from '../lib/api';

export const PlayersList: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: players, isLoading, error } = useQuery({
    queryKey: ['players', search],
    queryFn: () => playerAPI.getPlayers(search),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
        Error loading players: {error.message}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Players</h2>
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {players?.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            {search ? 'No players found matching your search.' : 'No players yet. Create your first player!'}
          </div>
        ) : (
          players?.map((player) => (
            <div key={player.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{player.name}</h3>
                  {player.email && (
                    <p className="text-sm text-gray-500">{player.email}</p>
                  )}
                  {player.phone && (
                    <p className="text-sm text-gray-500">{player.phone}</p>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(player.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
