import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../../lib/auth';

export const SuperAdminDashboard: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['super-admin-dashboard'],
    queryFn: dashboardAPI.getSuperAdminStats,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
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
    <div className="space-y-8">
      {/* Platform Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">T</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Turfs</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.stats.totalTurfs || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">S</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.stats.activeSubscriptions || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">U</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.stats.totalUsers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">M</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Matches</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.stats.todayMatches || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Turfs */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Turf Registrations</h3>
          </div>
          <div className="p-6">
            {stats?.recentActivity.recentTurfs?.length ? (
              <div className="space-y-4">
                {stats.recentActivity.recentTurfs.map((turf: any) => (
                  <div key={turf.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{turf.name}</p>
                      <p className="text-sm text-gray-500">{turf.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        turf.verificationStatus === 'VERIFIED' 
                          ? 'bg-green-100 text-green-800'
                          : turf.verificationStatus === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {turf.verificationStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent turf registrations</p>
            )}
          </div>
        </div>

        {/* Recent Matches */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Matches</h3>
          </div>
          <div className="p-6">
            {stats?.recentActivity.recentMatches?.length ? (
              <div className="space-y-4">
                {stats.recentActivity.recentMatches.map((match: any) => (
                  <div key={match.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {match.teamAName} vs {match.teamBName}
                      </p>
                      <p className="text-sm text-gray-500">{match.turfName}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        match.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800'
                          : match.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {match.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent matches</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
