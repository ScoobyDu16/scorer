import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminAPI } from "../lib/auth";

interface AnalyticsData {
  totalTurfs: number;
  activeSubscriptions: number;
  totalUsers: number;
  totalMatches: number;
  monthlyRevenue: number;
  topPlans: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  recentGrowth: Array<{
    month: string;
    turfs: number;
    users: number;
    matches: number;
  }>;
}

interface Trend {
  date: string;
  count: number;
  planName?: string;
}

interface Stat {
  status: string;
  count: number;
  percentage: string;
}

export const AdminAnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState("30");

  const {
    data: overviewData,
    isLoading: overviewLoading,
    error: overviewError,
  } = useQuery({
    queryKey: ["admin-analytics-overview", period],
    queryFn: () => adminAPI.getAnalyticsOverview(period),
  });

  const { data: registrationData, isLoading: registrationLoading } = useQuery({
    queryKey: ["admin-analytics-registrations", period],
    queryFn: () => adminAPI.getRegistrationTrends(period),
  });

  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["admin-analytics-subscriptions", period],
    queryFn: () => adminAPI.getSubscriptionTrends(period),
  });

  const { data: matchData, isLoading: matchLoading } = useQuery({
    queryKey: ["admin-analytics-matches", period],
    queryFn: () => adminAPI.getMatchStatistics(period),
  });

  const { data: verificationData, isLoading: verificationLoading } = useQuery({
    queryKey: ["admin-analytics-verifications"],
    queryFn: adminAPI.getVerificationStats,
  });

  const isLoading =
    overviewLoading ||
    registrationLoading ||
    subscriptionLoading ||
    matchLoading ||
    verificationLoading;
  const error = overviewError;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Failed to load analytics data. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Platform Analytics
          </h1>
          <p className="text-gray-600">
            Overview of platform performance and growth metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      {overviewData && (
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
                <p className="text-2xl font-bold text-gray-900">
                  {overviewData?.overview?.turfs?.total || 0}
                </p>
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
                <p className="text-sm font-medium text-gray-600">
                  Active Subscriptions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {overviewData?.overview?.subscriptions?.active || 0}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {overviewData?.overview?.users?.total || 0}
                </p>
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
                <p className="text-sm font-medium text-gray-600">
                  Total Matches
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {overviewData?.overview?.matches?.total || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">₹</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Monthly Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{overviewData?.overview?.revenue?.total || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Trends */}
        {registrationData && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                User Registration Trends
              </h2>
            </div>
            <div className="p-6">
              {registrationData?.trends?.length ? (
                <div className="space-y-3">
                  {registrationData.trends.map(
                    (trend: Trend, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {trend.date}
                        </span>
                        <span className="text-sm text-blue-600 font-bold">
                          {trend.count} users
                        </span>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No registration data available
                </p>
              )}
            </div>
          </div>
        )}

        {/* Subscription Trends */}
        {subscriptionData && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Subscription Trends
              </h2>
            </div>
            <div className="p-6">
              {subscriptionData?.trends?.length ? (
                <div className="space-y-3">
                  {subscriptionData.trends.map(
                    (trend: Trend, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {trend.date}
                          </span>
                          <span className="text-xs text-gray-600 ml-2">
                            {trend.planName}
                          </span>
                        </div>
                        <span className="text-sm text-green-600 font-bold">
                          {trend.count} subscriptions
                        </span>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No subscription data available
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Verification Statistics */}
      {verificationData && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Turf Verification Statistics
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {verificationData?.breakdown?.map((stat: Stat, index: number) => (
                <div key={index} className="text-center">
                  <div
                    className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      stat.status === "VERIFIED"
                        ? "bg-green-100 text-green-800"
                        : stat.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : stat.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {stat.status}
                  </div>
                  <div className="mt-2">
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.count}
                    </p>
                    <p className="text-sm text-gray-600">
                      {stat.percentage}% of total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
