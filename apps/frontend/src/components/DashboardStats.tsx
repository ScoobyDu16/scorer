import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../lib/auth';
import { useNavigate } from "react-router-dom";

export const DashboardStats: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardAPI.getStats(),
  });

  const {
    data: topPlayers,
    isLoading: topPlayersLoading,
    error: topPlayersError,
  } = useQuery({
    queryKey: ["dashboard-top-players"],
    queryFn: () => dashboardAPI.getTopPlayers(),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
        Error loading dashboard stats: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0110-7v-4a6 6 0 00-10-7v-4a6 6 0 0110 7v1m0 0h18" />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Total Players</dt>
              <dd className="text-lg font-medium text-gray-900">{stats?.totalPlayers || 0}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 9a1 1 0 000 2v3a1 1 0 001 1h6a1 1 0 001-1V9a1 1 0 00-1-1H9z" />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Total Matches</dt>
              <dd className="text-lg font-medium text-gray-900">{stats?.totalMatches || 0}</dd>
            </dl>
          </div>
        </div>
      </div>

      </div>

      {topPlayersError ? (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          Error loading top players
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              key: "mostRuns",
              title: "Most Runs",
              leader: topPlayers?.mostRuns,
            },
            {
              key: "mostWickets",
              title: "Most Wickets",
              leader: topPlayers?.mostWickets,
            },
            {
              key: "mostFours",
              title: "Most Fours",
              leader: topPlayers?.mostFours,
            },
            {
              key: "mostSixes",
              title: "Most Sixes",
              leader: topPlayers?.mostSixes,
            },
            {
              key: "mostDotsBowled",
              title: "Most Dots (Bowled)",
              leader: topPlayers?.mostDotsBowled,
            },
            {
              key: "bestStrikeRate",
              title: "Best Strike Rate",
              leader: topPlayers?.bestStrikeRate,
            },
            {
              key: "bestAverage",
              title: "Best Average",
              leader: topPlayers?.bestAverage,
            },
            {
              key: "bestEconomy",
              title: "Best Economy",
              leader: topPlayers?.bestEconomy,
            },
          ].map((card: any) => (
            <div key={card.key} className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">
                {card.title}
              </div>

              {topPlayersLoading ? (
                <div className="mt-3 h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              ) : card.leader ? (
                <>
                  <div className="mt-2 text-lg font-semibold text-gray-900">
                    {card.leader.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {card.leader.value}
                  </div>
                </>
              ) : (
                <div className="mt-2 text-sm text-gray-500">No data</div>
              )}

              <button
                onClick={() => navigate(`/leaderboard/${card.key}`)}
                className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                View Leaderboard
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
