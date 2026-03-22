import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminInvitationAPI, AdminInvitationStatus, AdminInvitationStatusResponse } from '../../lib/admin-invitation';

interface AdminRegistrationFlowProps {
  invitationToken: string;
}

type RegistrationStep = 'status' | 'email-otp' | 'password' | 'totp' | 'complete';

export const AdminRegistrationFlow: React.FC<AdminRegistrationFlowProps> = ({ invitationToken }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('status');
  const [invitationStatus, setInvitationStatus] = useState<AdminInvitationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form data for different steps
  const [emailOTP, setEmailOTP] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpQRCode, setTotpQRCode] = useState('');

  useEffect(() => {
    checkInvitationStatus();
  }, [invitationToken]);

  const checkInvitationStatus = async () => {
    try {
      setLoading(true);
      const response = await adminInvitationAPI.getStatus(invitationToken);
      setInvitationStatus(response.invitation);
      
      // Determine which step to show based on status
      if (response.invitation.status === 'PENDING') {
        setCurrentStep('email-otp');
      } else if (response.invitation.status === 'EMAIL_VERIFIED') {
        setCurrentStep('password'); // Skip phone OTP, go directly to password
      } else if (response.invitation.status === 'PASSWORD_SET') {
        setCurrentStep('totp');
      } else if (response.invitation.status === 'COMPLETED') {
        setError('This invitation has already been completed.');
      }
    } catch (err) {
      setError('Failed to load invitation status. Please check your invitation link.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailOTP = async () => {
    try {
      setLoading(true);
      const result = await adminInvitationAPI.sendEmailOTP(invitationToken);
      if (result.success) {
        setSuccess('Email OTP sent successfully!');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to send email OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const result = await adminInvitationAPI.verifyEmailOTP({ token: invitationToken, otp: emailOTP });
      if (result.success) {
        setSuccess('Email verified successfully!');
        setTimeout(() => setCurrentStep('password'), 2000); // Skip phone OTP, go directly to password
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to verify email OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const result = await adminInvitationAPI.setPassword({ token: invitationToken, password });
      if (result.success) {
        setSuccess('Password set successfully!');
        setTimeout(() => setCurrentStep('totp'), 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupTOTP = async () => {
    try {
      setLoading(true);
      const result = await adminInvitationAPI.setupTOTP(invitationToken);
      if (result.success) {
        setTotpSecret(result.secret || '');
        setTotpQRCode(result.qrCode || '');
        setSuccess('TOTP setup initiated! Scan the QR code with your authenticator app.');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to setup TOTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const result = await adminInvitationAPI.verifyTOTP({ token: invitationToken, otp: totpCode });
      if (result.success) {
        setSuccess('TOTP verified successfully!');
        setTimeout(() => setCurrentStep('complete'), 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to verify TOTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    try {
      setLoading(true);
      const result = await adminInvitationAPI.complete({
        token: invitationToken,
        name: invitationStatus?.email?.split('@')[0] || 'Admin',
        password: password
      });
      
      if (result.success && result.user && result.token) {
        // Store user data and token
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        setSuccess('Registration completed successfully!');
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 2000);
      } else {
        setError(result.message || 'Failed to complete registration.');
      }
    } catch (err) {
      setError('Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'status':
        return (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading invitation details...</p>
          </div>
        );

      case 'email-otp':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Step 1: Verify Email</h3>
              <p className="text-sm text-blue-600">We need to verify your email address first.</p>
            </div>
            
            {!success && (
              <button
                onClick={handleSendEmailOTP}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Email OTP'}
              </button>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">{success}</p>
                <form onSubmit={handleVerifyEmailOTP} className="mt-4 space-y-4">
                  <input
                    type="text"
                    maxLength={6}
                    value={emailOTP}
                    onChange={(e) => setEmailOTP(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify Email OTP'}
                  </button>
                </form>
              </div>
            )}
          </div>
        );

      case 'password':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Step 3: Set Password</h3>
              <p className="text-sm text-blue-600">Create a strong password for your admin account.</p>
            </div>
            
            <form onSubmit={handleSetPassword} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter strong password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                minLength={8}
              />
              <button
                type="submit"
                disabled={loading || !password}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Setting...' : 'Set Password'}
              </button>
            </form>
          </div>
        );

      case 'totp':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Step 4: Setup 2FA</h3>
              <p className="text-sm text-blue-600">Set up two-factor authentication for enhanced security.</p>
            </div>
            
            {!totpQRCode ? (
              <button
                onClick={handleSetupTOTP}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Setup TOTP'}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-4">Scan this QR code with your authenticator app:</p>
                  {totpQRCode && (
                    <div className="flex justify-center">
                      <img src={totpQRCode} alt="TOTP QR Code" className="w-48 h-48" />
                    </div>
                  )}
                  {totpSecret && (
                    <p className="text-xs text-gray-500 mt-2">Manual key: {totpSecret}</p>
                  )}
                </div>
                
                <form onSubmit={handleVerifyTOTP} className="space-y-4">
                  <input
                    type="text"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="Enter 6-digit code from app"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify TOTP'}
                  </button>
                </form>
              </div>
            )}
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-green-800 mb-2">Step 5: Complete Registration</h3>
              <p className="text-sm text-green-600">Your admin account is ready to be created!</p>
            </div>
            
            <button
              onClick={handleCompleteRegistration}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md mb-6">
          {success}
        </div>
      )}

      {/* Progress Indicator */}
      {invitationStatus && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Registration Progress</span>
            <span className="text-sm text-gray-500">{invitationStatus.status}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  invitationStatus.status === 'PENDING' ? '20%' :
                  invitationStatus.status === 'EMAIL_VERIFIED' ? '40%' :
                  invitationStatus.status === 'PHONE_VERIFIED' ? '60%' :
                  invitationStatus.status === 'PASSWORD_SET' ? '80%' :
                  invitationStatus.status === 'TOTP_SETUP' ? '90%' : '100%'
                }`
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Current Step */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {renderStep()}
      </div>
    </div>
  );
};
