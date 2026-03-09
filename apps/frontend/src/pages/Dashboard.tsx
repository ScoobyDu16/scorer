import React from "react";
import { Link } from "react-router-dom";
import { DashboardStats } from "../components/DashboardStats";

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
        <DashboardStats />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Create Match
          </h3>
          <p className="text-gray-600 mb-4">
            Start a new cricket match with unified flow
          </p>
          <Link
            to="/match-flow"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
          >
            Create Match
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Manage Matches
          </h3>
          <p className="text-gray-600 mb-4">
            View, edit, and manage all cricket matches
          </p>
          <Link
            to="/match-management"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
          >
            Manage Matches
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Generate Access Code
          </h3>
          <p className="text-gray-600 mb-4">
            Generate access codes for upcoming matches
          </p>
          <Link
            to="/generate-code"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
          >
            Generate Code
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Manage Players
          </h3>
          <p className="text-gray-600 mb-4">
            Add, edit, and manage player profiles
          </p>
          <Link
            to="/players"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
          >
            Manage Players
          </Link>
        </div>
      </div>
    </div>
  );
};
