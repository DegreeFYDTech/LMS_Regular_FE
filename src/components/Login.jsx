import React, { useState, useEffect } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { loginCounsellor, supervisorLogin, analyserLogin } from "../network/auth";
import { login as loginAction } from "../features/auth/authSlice";
import { useDispatch } from "react-redux";
import { showToast } from "../utils/toast";
import { Modal } from "antd";
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [selectedRole, setSelectedRole] = useState("counsellor");
  const dispatch = useDispatch()
  const roles = [
    {
      id: "counsellor",
      label: "Counsellor",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
        </svg>
      ),
      description: "Provide guidance and support"
    },
    {
      id: "supervisor",
      label: "Supervisor",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001 1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
        </svg>
      ),
      description: "Manage and oversee operations"
    },
    {
      id: "analyser",
      label: "Analyser",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      description: "Analyze data and reports"
    }
  ];

  useEffect(() => {
    let timer;
    if (showSuccessPopup && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (showSuccessPopup && countdown === 0) {
      window.location.href = "/";
    }
    return () => clearTimeout(timer);
  }, [showSuccessPopup, countdown]);

const doLogin = async (forceLogout = false) => {
  let result;
  switch (selectedRole) {
    case "counsellor":
      result = await loginCounsellor(email, password, forceLogout);
      dispatch(loginAction({ user: result.counsellor }));
      showToast("Counsellor login successful", "success");
      setShowSuccessPopup(true);
      break;
    case "supervisor":
      result = await supervisorLogin(email, password);
      dispatch(loginAction({ user: result.supervisor }));
      showToast("Supervisor login successful", "success");
      setShowSuccessPopup(true);
      break;
    case "analyser":
      result = await analyserLogin(email, password);
      dispatch(loginAction({ user: result.analyser }));
      showToast("Analyser login successful", "success");
      setShowSuccessPopup(true);
      break;
    default:
      showToast("Please select a valid role", "warning");
  }
};

const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    await doLogin(false);
  } catch (error) {
    if (error?.response?.status === 409 && error?.response?.data?.requires_force_logout) {
      setLoading(false);
      Modal.confirm({
        title: "Already Logged In!",
        content: error.response.data.message || "You are already logged in on another device. Force logout?",
        okText: "Yes, force login!",
        cancelText: "Cancel",
        okButtonProps: { danger: true },
        onOk: async () => {
          setLoading(true);
          try {
            await doLogin(true);
          } finally {
            setLoading(false);
          }
        },
      });
      return;
    }
    showToast(error?.response?.data?.message || "Login failed", "error");
  }

  setLoading(false);
};



  const getRoleIcon = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.icon : roles[0].icon;
  };

  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Heart Animation Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
          <div className="text-center">
            <div className="flex justify-center items-center h-24 mb-6">
              <svg
                className="animate-pulse"
                width="80"
                height="80"
                viewBox="0 0 100 100"
              >
                <path
                  fill="#ff4b4b"
                  d="M92.71,7.27L92.71,7.27c-9.71-9.69-25.46-9.69-35.18,0L50,14.79l-7.54-7.52C32.75-2.42,17-2.42,7.29,7.27v0 c-9.71,9.69-9.71,25.41,0,35.1L50,85l42.71-42.63C102.43,32.68,102.43,16.96,92.71,7.27z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Proudly Made By DegreeFyd
            </h3>
            <p className="text-gray-600">
              Redirecting to dashboard in <span className="font-bold">{countdown}</span> seconds...
            </p>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-row items-center gap-4 mb-6 justify-center">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-700">
            {getRoleIcon(selectedRole)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Welcome back
            </h2>
            <p className="text-gray-600">
              Sign in to your {selectedRole} account
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white py-6 px-6 shadow-lg rounded-2xl border border-gray-100">
          <div className="space-y-4">

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select your role
              </label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className={`relative rounded-lg border p-3 cursor-pointer transition-all duration-200 ${selectedRole === role.id
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                      : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    onClick={() => setSelectedRole(role.id)}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="role"
                        value={role.id}
                        checked={selectedRole === role.id}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="ml-3 flex items-center">
                        <div className={`mr-3 ${selectedRole === role.id ? "text-blue-600" : "text-gray-500"}`}>
                          {role.icon}
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${selectedRole === role.id ? "text-blue-900" : "text-gray-900"}`}>
                            {role.label}
                          </div>
                          <div className={`text-xs ${selectedRole === role.id ? "text-blue-700" : "text-gray-500"}`}>
                            {role.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>



            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <AiOutlineEye className="w-5 h-5" />
                  ) : (
                    <AiOutlineEyeInvisible className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                onClick={handleLogin}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-200 ${loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:shadow-md transform hover:-translate-y-0.5"
                  }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  `Sign in as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;