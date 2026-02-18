import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import Modal from "../common/Modal";
import {
  updateCollegeSentStatusCreds,
} from "../network/credential";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { showToast } from "../utils/toast";

const StatusUpdateModal = ({
  showModal,
  selectedCollege,
  selectedStatus,
  setSelectedStatus,
  examInterviewDate,
  setExamInterviewDate,
  lastAdmissionDate,
  setLastAdmissionDate,
  notes,
  setNotes,
  depositAmount,
  setDepositAmount,
  currency,
  setCurrency,
  updatingStatus,
  onUpdateStatus,
  onClose,
  studentData,
}) => {
  const currencyOptions = ["INR", "USD", "EUR", "GBP", "AUD", "CAD"];
  const [isCredsFound, setIsCredsFound] = useState(false);
  const [internalUpdatingStatus, setInternalUpdatingStatus] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formID, setFormID] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const statusOptions = [
    { type: "header", label: "Pre Form" },
    { type: "option", label: "Walkin marked" },
    { type: "header", label: "Applied" },
    { type: "option", label: "Form Submitted – Portal Pending" },
    { type: "option", label: "Form Submitted – Completed" },
    { type: "option", label: "Walkin Completed" },
    { type: "option", label: "Exam Interview Pending" },
    { type: "option", label: "Offer Letter/Results Pending" },
    { type: "option", label: "Offer Letter/Results Released" },
    { type: "header", label: "Admission Completed" },
    { type: "option", label: "Registration done" },
    { type: "option", label: "Semester fee paid" },
    { type: "header", label: "Drop" },
    { type: "option", label: "NI - College Reject" },
    { type: "option", label: "NI - Student denied" },
  ];

  const { studentId } = useParams();

  // Check if it's an online college
  const isOnlineCollege = (collegeName) => {
    const onlineColleges = ["Online", "Distance", "E-Learning"];
    return onlineColleges.some((keyword) =>
      collegeName.toLowerCase().includes(keyword.toLowerCase()),
    );
  };

  // Check if credentials already exist for the selected college
  const checkExistingCredentials = (collegeData, studentData) => {
    if (!studentData?.collegeCredentials || !collegeData?.course_id) {
      return false;
    }

    return studentData.collegeCredentials.some(
      (cred) => cred.course_id === collegeData.course_id,
    );
  };

  // Get college type for validation
  const getCollegeType = (collegeName) => {
    const name = collegeName.toLowerCase();
    if (name.includes("amity")) return "amity";
    if (name.includes("lovely professional university") || name.includes("lpu"))
      return "lpu";
    if (name.includes("chandigarh university")) return "chandigarh";
    return "regular";
  };

  // Get placeholder text based on college type
  const getUsernamePlaceholder = (collegeType) => {
    switch (collegeType) {
      case "amity":
        return "e.g., 9876543210 (10-digit mobile number)";
      case "lpu":
        return "e.g., student@example.com (email address)";
      case "chandigarh":
        return "e.g., 9876543210 (10-digit phone number)";
      default:
        return "Enter username";
    }
  };

  // Validate username format based on college type
  const validateUsernameFormat = (value, collegeType) => {
    if (!value) return true;

    switch (collegeType) {
      case "amity":
        return /^\d{10}$/.test(value);
      case "lpu":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); // Email format
      case "chandigarh":
        return /^\d{10}$/.test(value); // 10-digit phone number
      default:
        return true; // No specific validation for regular colleges
    }
  };

  // Validate form fields based on college type
  const validateFormFields = () => {
    const collegeType = getCollegeType(selectedCollege?.universityName || "");

    // Check username format validation first
    if (userName && !validateUsernameFormat(userName, collegeType)) {
      return false;
    }

    if (collegeType === "amity") {
      // All 4 fields are compulsory for Amity and username must be valid
      return (
        formID &&
        couponCode &&
        userName &&
        password &&
        validateUsernameFormat(userName, collegeType)
      );
    }
    if (collegeType === "lpu") {
      // Username is compulsory for LPU and must be valid
      return userName && validateUsernameFormat(userName, collegeType);
    }
    if (collegeType === "chandigarh") {
      // Username is compulsory for Chandigarh and must be valid
      return userName && validateUsernameFormat(userName, collegeType);
    }

    // For other colleges, if username is provided, it must be valid
    if (userName && !validateUsernameFormat(userName, collegeType)) {
      return false;
    }

    return true;
  };

  // Handle step navigation
  const handleNextStep = () => {
    if (currentStep === 1 && selectedStatus) {
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  // Get validation message for username
  const getUsernameValidationMessage = (collegeType) => {
    switch (collegeType) {
      case "amity":
        return "Please enter a valid 10-digit mobile number";
      case "lpu":
        return "Please enter a valid email address";
      case "chandigarh":
        return "Please enter a valid 10-digit phone number";
      default:
        return "";
    }
  };

  const shouldShowSteps = () => {
    const hasExistingCreds = checkExistingCredentials(
      selectedCollege,
      studentData,
    );
    const isOnline = isOnlineCollege(selectedCollege?.university_name || "");
    return !hasExistingCreds && !isOnline;
  };

  const counsellorId = useSelector((state) => state.auth.user).id;
  const counsellorName = useSelector((state) => state.auth.user).name;

  const handleUpdateStatus = async () => {
    if (!selectedCollege || !selectedStatus) return;

    try {
      setInternalUpdatingStatus(true);

      if (shouldShowSteps() && currentStep === 2) {
        // Step 2: Update with form data (call form API)
        if (!validateFormFields()) return;

        try {
          let response = await updateCollegeSentStatusCreds({
            formID,
            couponCode,
            userName,
            password,
            studentId,
            courseId: selectedCollege.course_id,
            collegeName: selectedCollege.university_name,
            counsellorId:
              JSON.parse(localStorage.getItem("agent"))?.counsellor_id ||
              counsellorId,
            counsellorName:
              JSON.parse(localStorage.getItem("agent"))?.counsellor_name ||
              counsellorName,
          });

          // Show success toast - pass message and success status
          showToast(
            response.message || "Credentials updated successfully",
            "success",
          );
        } catch (error) {
          console.error("Error updating credentials:", error);
          // Show error toast - error is already a string message
          showToast(error, "error");
          return; // Don't proceed with status update if creds update failed
        }
      }

      // Always call the main status update API
      await onUpdateStatus();
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Error updating status", "error");
    } finally {
      setInternalUpdatingStatus(false);
    }
  };

  // Reset form when modal closes
  const handleClose = () => {
    setCurrentStep(1);
    setFormID("");
    setCouponCode("");
    setUserName("");
    setPassword("");
    onClose();
  };

  // Set isCredsFound based on existing credentials check
  useEffect(() => {
    if (selectedCollege && studentData) {
      const hasExistingCreds = checkExistingCredentials(
        selectedCollege,
        studentData,
      );
      setIsCredsFound(hasExistingCreds);
    }
  }, [selectedCollege, studentData]);

  if (!selectedCollege) return null;

  const actualUpdatingStatus = updatingStatus || internalUpdatingStatus;

  const collegeType = getCollegeType(selectedCollege?.university_name || "");
  const hasExistingCreds = checkExistingCredentials(
    selectedCollege,
    studentData,
  );
  const isOnline = isOnlineCollege(selectedCollege?.university_name || "");

  // Determine if we can proceed with update
  const canUpdateStatus = () => {
    if (!selectedStatus) return false;
    if (shouldShowSteps() && currentStep === 2) {
      return validateFormFields();
    }
    return true;
  };

  // Get button text based on current state
  const getButtonText = () => {
    if (actualUpdatingStatus) {
      return shouldShowSteps() && currentStep === 2
        ? "Updating with Form..."
        : "Updating Status...";
    }
    return shouldShowSteps() && currentStep === 2
      ? "Update Status & Form"
      : "Update Status";
  };

  // Check if a status is actually selected (not empty or undefined)
  const isStatusSelected = () => {
    return (
      selectedStatus &&
      selectedStatus !== "" &&
      selectedStatus !== "Select Status"
    );
  };

  return (
    <Modal
      isOpen={showModal}
      onClose={handleClose}
      title={`${currentStep === 1 ? "Update Status" : "Form Details"} for ${selectedCollege.course_name}`}
      size="2xl"
      confirmText="" // Hide default confirm button
      cancelText="" // Hide default cancel button
    >
      <div className="space-y-6">
        {/* Show credential status info */}
        {hasExistingCreds && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">
                  Credentials already exist for this college. You can directly
                  update the status.
                </p>
              </div>
            </div>
          </div>
        )}

        {isOnline && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  This is an online college. No form credentials are required.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step indicator - only show if credentials not found and not online college */}
        {shouldShowSteps() && (
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep === 1
                    ? "bg-blue-600 text-white"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                1
              </div>
              <div className="w-16 h-1 bg-gray-200 mx-2">
                <div
                  className={`h-1 bg-blue-600 transition-all duration-300 ${
                    currentStep === 2 ? "w-full" : "w-0"
                  }`}
                ></div>
              </div>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep === 2
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                2
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 ? (
          <>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Current Status:{" "}
                <span className="font-normal text-gray-600">
                  {selectedCollege.status}
                </span>
              </label>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                New Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={actualUpdatingStatus}
              >
                <option value="">Select Status</option>
                {statusOptions.map((option, index) =>
                  option.type === "header" ? (
                    <optgroup key={index} label={option.label} />
                  ) : (
                    <option key={index} value={option.label}>
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Exam/Interview Date
                </label>
                <DatePicker
                  selected={examInterviewDate}
                  onChange={setExamInterviewDate}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholderText="Select date"
                  dateFormat="MMMM d, yyyy"
                  disabled={actualUpdatingStatus}
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Last Admission Date
                </label>
                <DatePicker
                  selected={lastAdmissionDate}
                  onChange={setLastAdmissionDate}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholderText="Select date"
                  dateFormat="MMMM d, yyyy"
                  disabled={actualUpdatingStatus}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Deposit Amount
              </label>
              <div className="flex">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="shadow appearance-none border rounded-l w-24 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={actualUpdatingStatus}
                >
                  {currencyOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="shadow appearance-none border border-l-0 rounded-r flex-1 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter amount"
                  min="0"
                  step="100"
                  disabled={actualUpdatingStatus}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Add any notes..."
                rows="3"
                disabled={actualUpdatingStatus}
              />
            </div>
          </>
        ) : (
          // Step 2: Form Details
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Form ID{collegeType === "amity" ? " *" : ""}
                </label>
                <input
                  type="text"
                  value={formID}
                  onChange={(e) => setFormID(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter Form ID"
                  disabled={actualUpdatingStatus}
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Coupon Code{collegeType === "amity" ? " *" : ""}
                </label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter Coupon Code"
                  disabled={actualUpdatingStatus}
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Password{collegeType === "amity" ? " *" : ""}
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter Password"
                  disabled={actualUpdatingStatus}
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Username
                  {["amity", "lpu", "chandigarh"].includes(collegeType)
                    ? " *"
                    : ""}
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed ${
                    userName && !validateUsernameFormat(userName, collegeType)
                      ? "border-red-500"
                      : ""
                  }`}
                  placeholder={getUsernamePlaceholder(collegeType)}
                  disabled={actualUpdatingStatus}
                />
                {userName && !validateUsernameFormat(userName, collegeType) && (
                  <p className="text-red-500 text-xs mt-1">
                    {getUsernameValidationMessage(collegeType)}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Custom Footer with Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={actualUpdatingStatus}
              className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            {/* Previous button - only show in step 2 */}
            {shouldShowSteps() && currentStep === 2 && (
              <button
                type="button"
                onClick={handlePreviousStep}
                disabled={actualUpdatingStatus}
                className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
            )}
          </div>
         
          <div className="flex items-center space-x-3">
            {shouldShowSteps() &&
              currentStep === 1 &&
              selectedStatus != "Active" && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={actualUpdatingStatus || !isStatusSelected()}
                  className={`text-white font-medium rounded text-sm px-5 py-2.5 text-center ${
                    actualUpdatingStatus || !isStatusSelected()
                      ? "bg-green-400 cursor-not-allowed opacity-70"
                      : "bg-green-600 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300"
                  }`}
                >
                  Next
                </button>
              )}

            {/* Update button - show when appropriate */}
            {(!shouldShowSteps() || currentStep === 2) && (
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={actualUpdatingStatus || !canUpdateStatus()}
                className={`text-white focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded text-sm px-5 py-2.5 text-center ${
                  actualUpdatingStatus || !canUpdateStatus()
                    ? "bg-blue-400 cursor-not-allowed opacity-70"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {actualUpdatingStatus ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block"></div>
                    {getButtonText()}
                  </>
                ) : (
                  getButtonText()
                )}
              </button>
            )}
          </div>
        </div>

        {actualUpdatingStatus && (
          <div className="flex items-center justify-center text-blue-600 pt-4">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
            <span className="text-sm">Updating status...</span>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StatusUpdateModal;
