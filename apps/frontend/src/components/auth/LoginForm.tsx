import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, LoginRequest } from "../../lib/auth";

interface LoginFormProps {
  onSuccess?: (user: any) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [loginType, setLoginType] = useState<"phone" | "email" | "admin">("phone");
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    password: "",
    otp: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const sendOTP = async () => {
    if (!formData.phone) {
      setError("Phone number is required");
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.sendOTP(formData.phone);

      if (result.success) {
        setOtpSent(true);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const loginData: LoginRequest = {};

      if (loginType === "phone") {
        if (!formData.phone || !formData.otp) {
          setError("Phone number and OTP are required");
          setLoading(false);
          return;
        }
        loginData.phone = formData.phone;
        loginData.otp = formData.otp;
      } else if (loginType === "email") {
        if (!formData.email || !formData.password) {
          setError("Email and password are required");
          setLoading(false);
          return;
        }
        loginData.email = formData.email;
        loginData.password = formData.password;
      } else if (loginType === "admin") {
        if (!formData.email || !formData.password || !formData.otp) {
          setError("Email, password, and 2FA code are required");
          setLoading(false);
          return;
        }
        loginData.email = formData.email;
        loginData.password = formData.password;
        loginData.otp = formData.otp;
      }

      const result = await authAPI.login(loginData);

      if (result.success) {
        // Store token
        localStorage.setItem("token", result.token!);
        localStorage.setItem("user", JSON.stringify(result.user));
        
        if (onSuccess) {
          onSuccess(result.user);
        } else {
          // Navigate to appropriate dashboard based on role
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
        }
      } else {
        setError(result.message || "Login failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Choose your login method below
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Login Type Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setLoginType("phone")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    loginType === "phone"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Phone OTP
                </button>
                <button
                  onClick={() => setLoginType("email")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    loginType === "email"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Email Password
                </button>
                <button
                  onClick={() => setLoginType("admin")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    loginType === "admin"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Super Admin
                </button>
              </nav>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {loginType === "phone" && (
              <>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={sendOTP}
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                ) : (
                  <>
                    <div>
                      <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                        OTP
                      </label>
                      <div className="mt-1">
                        <input
                          id="otp"
                          name="otp"
                          type="text"
                          required
                          maxLength={6}
                          value={formData.otp}
                          onChange={handleInputChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Enter 6-digit OTP"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? "Signing in..." : "Sign in"}
                    </button>
                  </>
                )}
              </>
            )}

            {loginType === "email" && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </>
            )}

            {loginType === "admin" && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Admin Email
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="admin@yourapp.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter admin password"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                    2FA Code
                  </label>
                  <div className="mt-1">
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      required
                      maxLength={6}
                      value={formData.otp}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter 6-digit 2FA code"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign in as Admin"}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
