import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../../lib/auth';

export const TurfAdminDashboard: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['turf-admin-dashboard'],
    queryFn: dashboardAPI.getTurfAdminStats,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Failed to load dashboard statistics. Please try again.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">P</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Players</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalPlayers || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">M</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Matches</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalMatches || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
