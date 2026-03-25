import React from 'react';

export const PlayerDashboard: React.FC = () => {
  return (
    <div className="text-center py-12">
      <div className="mb-8">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-green-600 text-2xl">👤</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Player Dashboard</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Welcome! As a player, you can view match scores and your performance statistics 
          when access codes are provided by your turf administrator.
        </p>
      </div>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
        <h4 className="font-medium text-green-900 mb-2">How to Participate</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Get access code from your turf administrator</li>
          <li>• Enter the code to view live matches</li>
          <li>• Check your performance statistics</li>
          <li>• View match scorecards and results</li>
        </ul>
      </div>
    </div>
  );
};
