import React, { useEffect } from 'react';

/**
 * Simple Admin Invitation Test Component
 * Shows when admin invitation is detected
 */
export const AdminInvitationTest: React.FC<{
  invitationToken: string;
}> = ({ invitationToken }) => {
  useEffect(() => {
    console.log('Admin Invitation Component Loaded!');
    console.log('Token:', invitationToken);
  }, [invitationToken]);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 className="text-lg font-medium text-blue-800">Admin Invitation Detected!</h3>
          <p className="text-sm text-blue-600">You've been invited to join as an administrator</p>
        </div>
      </div>
      
      <div className="bg-white rounded p-4 border border-blue-200">
        <h4 className="font-medium text-gray-900 mb-2">Invitation Details:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Token:</span>
            <span className="font-mono text-blue-600">{invitationToken.substring(0, 20)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span className="text-green-600 font-medium">Administrator</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className="text-yellow-600 font-medium">Pending Verification</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Complete the registration process to activate your admin account.</p>
        <p>This includes email verification, phone verification, and password setup.</p>
      </div>
    </div>
  );
};
