import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerAgent } from "../network/counsellor";
import { CounsellorvalidateForm as validateForm } from "../utils/validators";
import { getAllCounsellors } from "../network/counsellor";
import { useSelector } from "react-redux";

function AddCounsellor() {
  const navigate = useNavigate();
  const storedRole = useSelector((state) => state.auth.role);
  const roletosend = useSelector((state) => state.auth.user);
  
  // Fix: Determine if user is team owner
  const isTeamOwner = storedRole === "to" || storedRole === "to_l3";
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    preferredMode: "Regular",
    teamOwnerId: isTeamOwner ? (roletosend?.id || "") : "", // Handle undefined case
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [teamOwners, setTeamOwners] = useState([]);
  const [loadingTeamOwners, setLoadingTeamOwners] = useState(false);

  useEffect(() => {
    if (isTO) return;
    const loadTeamOwners = async () => {
      // Only load if user is NOT a team owner
      if (!isTeamOwner) {
        setLoadingTeamOwners(true);
        try {
          const owners = await getAllCounsellors("to");
          setTeamOwners(owners);
        } catch (error) {
          console.error("Failed to fetch team owners:", error);
          setErrors((prev) => ({
            ...prev,
            teamOwners: "Failed to load team owners",
          }));
        } finally {
          setLoadingTeamOwners(false);
        }
      }
    };

    loadTeamOwners();
  }, [isTeamOwner]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value.trimStart(),
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccess("");

    const { isValid, errors: validationErrors } = validateForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const payload = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== "")
      );
      await registerAgent(payload);
      setSuccess("Counsellor added successfully!");
      
      // Reset form but preserve teamOwnerId logic
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "",
        preferredMode: "Regular",
        teamOwnerId: isTeamOwner ? (roletosend?.id || "") : "",
      });
      
      // Navigate after a short delay to show success message
      // setTimeout(() => {
      //   navigate("/counsellorslisting");
      // }, 1500);
      
    } catch (err) {
      setErrors({
        form: err.response?.data?.message || err.Error || "Email already registered",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[84vh] flex overflow-hidden">
      {/* Left Side - Decorative (unchanged) */}
      <div className="hidden h-full lg:flex lg:flex-1 justify-center relative overflow-hidden [clip-path:polygon(0_0,100%_0,100%_85%,0_100%)] bg-gradient-to-br from-blue-600 via-blue-600 to-blue-600">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>

        <div className="absolute top-0 right-0 w-[300px] opacity-30">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="#9333ea"
              d="M52.4,-66.4C67.2,-54.2,78.7,-35.1,78.3,-17.7C77.9,-0.3,65.7,15.3,54.6,29.6C43.4,44,33.2,57.1,18.8,65.2C4.4,73.4,-14.2,76.6,-29.4,70.2C-44.6,63.9,-56.3,47.9,-60.7,31.8C-65.2,15.7,-62.5,-0.4,-55.1,-16.5C-47.8,-32.6,-35.8,-48.7,-20.7,-61.3C-5.7,-73.8,12.4,-82.8,29.7,-78.7C47,-74.7,64.7,-57.7,52.4,-66.4Z"
              transform="translate(100 100)"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center px-8 text-white">
          <div className="mb-6 p-4 bg-white bg-opacity-20 rounded-full backdrop-blur-sm">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold mb-3 text-center">
            Supervisor Panel
            <span className="block bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent text-2xl mt-1">
              Add New Counsellor
            </span>
          </h1>

          <p className="text-lg text-center text-blue-100 mb-6 max-w-md leading-relaxed">
            Expand your counselling team by adding qualified professionals to
            serve your clients
          </p>

          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
              <span className="text-blue-100">Secure Registration Process</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
              <span className="text-blue-100">Role-Based Access Control</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
              <span className="text-blue-100">Team Management Tools</span>
            </div>
          </div>

          <div className="absolute top-16 right-16 w-24 h-24 border border-white border-opacity-20 rounded-full"></div>
          <div className="absolute bottom-16 left-16 w-20 h-20 border border-white border-opacity-20 rounded-full"></div>
        </div>

        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg
            className="relative block w-full h-[100px]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
          >
            <path
              fill="#2563eb"
              fillOpacity="1"
              d="M0,256L48,234.7C96,213,192,171,288,165.3C384,160,480,192,576,181.3C672,171,768,117,864,106.7C960,96,1056,128,1152,144C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 lg:flex-1 bg-gray-50 h-full">
        <div className="min-h-full flex flex-col justify-center px-6 py-8 lg:px-8">
          <div className="sm:mx-auto sm:w-full">
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="bg-white px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Register New Counsellor
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Add a new team member to your counselling practice
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {errors.form && (
                  <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    <svg
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{errors.form}</span>
                  </div>
                )}

                {errors.teamOwners && (
                  <div className="mb-4 flex items-start gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
                    <svg
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{errors.teamOwners}</span>
                  </div>
                )}

                {success && (
                  <div className="mb-4 flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                    <svg
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{success}</span>
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 grid-cols-2 grid gap-4"
                >
                  <InputField
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    required
                    placeholder="Enter counsellor's full name"
                  />

                  <InputField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    required
                    placeholder="Enter email address"
                  />

                  <InputField
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    required
                    placeholder="Create a password (min 6 characters)"
                  />

                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 py-2 border ${errors.role ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white`}
                    >
                      <option value="">Select Role</option>
                      <option value="l2">Level 2 Counsellor</option>
                      <option value="l3">Level 3 Counsellor</option>
                    </select>
                    {errors.role && (
                      <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                    )}
                  </div>

             

                  {/* FIXED: Correct conditional logic */}
                  {!isTeamOwner && (
                    <div>
                      <label
                        htmlFor="teamOwnerId"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Team Owner
                        <span className="text-gray-500 text-xs ml-1"></span>
                      </label>
                      <select
                        id="teamOwnerId"
                        name="teamOwnerId"
                        value={formData.teamOwnerId}
                        onChange={handleChange}
                        disabled={loadingTeamOwners}
                        className={`w-full px-3 py-2 border ${errors.teamOwnerId ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${loadingTeamOwners ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <option value="">
                          {loadingTeamOwners
                            ? "Loading team owners..."
                            : "Select Team Owner"}
                        </option>
                        {teamOwners.map((owner) => (
                          <option
                            key={owner.counsellor_id}
                            value={owner.counsellor_id}
                          >
                            {owner.counsellor_name}
                          </option>
                        ))}
                      </select>
                      {errors.teamOwnerId && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.teamOwnerId}
                        </p>
                      )}
                      {teamOwners.length === 0 && !loadingTeamOwners && (
                        <p className="mt-1 text-sm text-gray-500">
                          No team owners available
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 col-span-2">
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`px-6 py-2 rounded-md shadow-sm text-sm font-medium text-white transition-all
                        ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105"}`}
                    >
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Adding...
                        </>
                      ) : (
                        "Add Counsellor"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  required = false,
  placeholder,
}) => (
  <div>
    <label
      htmlFor={name}
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      required={required}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border ${error ? "border-red-500" : "border-gray-300"} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors`}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

export default AddCounsellor;