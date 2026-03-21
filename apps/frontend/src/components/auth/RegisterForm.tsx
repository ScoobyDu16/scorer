import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authAPI, RegisterRequest } from "../../lib/auth";
import { AdminRegistrationFlow } from "./AdminRegistrationFlow";

interface RegisterFormProps {
  onSuccess?: (user: any) => void;
  invitationToken?: string;
  isAdminInvitation?: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, invitationToken, isAdminInvitation }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Detect admin invitation from URL if not passed as props
  const { invitationToken: detectedToken, isAdminInvitation: detectedAdminInvitation } = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const type = params.get('type');
    console.log('RegisterForm - token:', token, 'type:', type);
    return {
      invitationToken: token,
      isAdminInvitation: type === 'admin',
    };
  }, [location.search]);

  // Use detected values or props
  const finalInvitationToken = invitationToken || detectedToken;
  const finalIsAdminInvitation = isAdminInvitation || detectedAdminInvitation;

  useEffect(() => {
    if (finalIsAdminInvitation) {
      console.log('Admin invitation detected!');
      console.log('Token:', finalInvitationToken);
    }
  }, [finalIsAdminInvitation, finalInvitationToken]);
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Details, Step 2: OTP Verification
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "PLAYER" as "SUPER_ADMIN" | "TURF_ADMIN" | "SCORER" | "PLAYER",
    turfId: "",
    otp: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const sendRegistrationOTP = async () => {
    // Validation based on role
    if (formData.role === "SUPER_ADMIN") {
      if (!formData.email || !formData.password) {
        setError("Email and password are required for Super Admin");
        return;
      }
    } else if (formData.role === "TURF_ADMIN") {
      if (!formData.email || !formData.password) {
        setError("Email and password are required for Turf Admin");
        return;
      }
    } else if (formData.role === "SCORER" || formData.role === "PLAYER") {
      if (!formData.phone) {
        setError("Phone number is required for Scorer/Player");
        return;
      }
    }

    if (!formData.name) {
      setError("Name is required");
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.sendRegistrationOTP(
        formData.email || undefined,
        formData.phone || undefined
      );

      if (result.success) {
        setStep(2);
        setError("");
      } else {
        setError(result.message || "Failed to send OTP");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      await sendRegistrationOTP();
      return;
    }

    // Step 2: Verify OTP and register
    if (!formData.otp) {
      setError("OTP is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const registerData: RegisterRequest = {
        name: formData.name,
        email: formData.email || undefined,
        password: formData.password || undefined,
        phone: formData.phone || undefined,
        role: formData.role,
        turfId: formData.turfId || undefined,
        otp: formData.otp,
      };

      const result = await authAPI.register(registerData);

      if (result.success) {
        setSuccess(true);
        // Store token
        localStorage.setItem("token", result.token!);
        localStorage.setItem("user", JSON.stringify(result.user));
        
        if (onSuccess) {
          onSuccess(result.user);
        } else {
          // Navigate to appropriate dashboard based on role
          setTimeout(() => {
            switch (result.user?.role) {
              case "SUPER_ADMIN":
                navigate("/admin/dashboard");
                break;
              case "TURF_ADMIN":
                navigate("/dashboard");
                break;
              case "SCORER":
                navigate("/scorer/dashboard");
                break;
              case "PLAYER":
                navigate("/player/dashboard");
                break;
              default:
                navigate("/dashboard");
            }
          }, 2000);
        }
      } else {
        setError(result.message || "Registration failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep(1);
    setFormData(prev => ({ ...prev, otp: "" }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Registration Successful!</h2>
            <p className="mb-4">Your account has been created successfully.</p>
            <p className="text-sm text-green-600">Redirecting to your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Admin Invitation Header */}
        {finalIsAdminInvitation && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Admin Invitation</h3>
                <p className="text-sm text-blue-600">You've been invited to join as an administrator</p>
              </div>
            </div>
          </div>
        )}

        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          {step === 1 ? 
            (finalIsAdminInvitation ? "Complete Admin Registration" : "Create your account") : 
            (finalIsAdminInvitation ? "Verify Admin Invitation" : "Verify your email/phone")
          }
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 1 ? 
            (finalIsAdminInvitation ? "Complete your admin account setup" : "Join the cricket scoring platform") : 
            (finalIsAdminInvitation ? "Verify your admin invitation" : "Enter OTP sent to your email/phone")
          }
        </p>
      </div>

      {/* If this is an admin invitation, show admin registration flow */}
      {finalIsAdminInvitation && finalInvitationToken && (
        <div className="min-h-screen bg-gray-50">
          <AdminRegistrationFlow invitationToken={finalInvitationToken} />
        </div>
      )}

      {!finalIsAdminInvitation && (
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 1 && (
            <form className="space-y-6" onSubmit={handleRegister}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Role Selection - Hide for admin invitations */}
              {!finalIsAdminInvitation && (
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    User Type *
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="PLAYER">Player</option>
                    <option value="SCORER">Scorer</option>
                    <option value="TURF_ADMIN">Turf Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              )}

              {/* Admin Role Display - Show for admin invitations */}
              {finalIsAdminInvitation && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role *
                  </label>
                  <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700">
                    Administrator
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form className="space-y-6" onSubmit={handleRegister}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
                <p className="text-sm">
                  OTP has been sent to: <strong>{formData.email || formData.phone}</strong>
                </p>
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  Enter OTP *
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  value={formData.otp}
                  onChange={handleInputChange}
                  placeholder="123456"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <a
                href="/auth"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Already have an account? Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
