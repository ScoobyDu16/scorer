import React from 'react';

export const ScorerDashboard: React.FC = () => {
  return (
    <div className="text-center py-12">
      <div className="mb-8">
        <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-orange-600 text-2xl">🏏</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Scorer Dashboard</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          As a scorer, you can access and score live matches. Use the "Score Matches" 
          action below to view available matches and start scoring.
        </p>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
        <h4 className="font-medium text-blue-900 mb-2">Quick Start</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click "Score Matches" to view available matches</li>
          <li>• Select a match to start scoring</li>
          <li>• Use the scoring interface to record ball-by-ball data</li>
        </ul>
      </div>
    </div>
  );
};
