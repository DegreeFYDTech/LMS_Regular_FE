import React, { useContext, useEffect, useState } from "react";
import Modal from "../common/Modal";
import { updateStudentStatus } from "../network/student";
import { fetchShortlistedColleges1 } from "../network/colleges";
import { updateCollegeSentStatusCreds } from "../network/credential";
import { useSelector } from "react-redux";
import { LeadsContext } from "../context/LeadsContext";
import StudentFormPopup from "../components/StudentFormPopup";
import {
  FiPhone,
  FiPhoneOff,
  FiUser,
  FiCalendar,
  FiClock,
  FiMessageSquare,
  FiBook,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiPaperclip,
  FiCheckCircle as FiCheckCircleIcon,
  FiDollarSign,
} from "react-icons/fi";
import { HiOutlineAcademicCap, HiOutlineClipboardList } from "react-icons/hi";

const UnifiedCallModal = ({
  isOpen,
  onClose,
  selectedStudent,
  isConnectedCall = true,
  showCourseSelection = true,
  preselectedUniversity = null,
  preselectedCourse = null,
  onCourseSelected,
  ...props
}) => {
  const { leads, setLeads } = useContext(LeadsContext);
  const [callOutcome, setCallOutcome] = useState("Warm");
  const [disconnectReason, setDisconnectReason] = useState("");
  const [universities, setUniversities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState(
    preselectedUniversity,
  );
  const [selectedCourse, setSelectedCourse] = useState(preselectedCourse);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);
  const [feesAmount, setFeesAmount] = useState("");
  const [showDisposeModal, setShowDisposeModal] = useState(false);
  const [selectedRowForDispose, setSelectedRowForDispose] = useState(null);

  // Credential form state
  const [formID, setFormID] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [isCredsFound, setIsCredsFound] = useState(false);
  const [isUpdatingCreds, setIsUpdatingCreds] = useState(false);
  const [showCredentialFields, setShowCredentialFields] = useState(false);

  // Get latest remark
  const latestRemark = selectedStudent?.student_remarks?.reduce(
    (latest, remark) => {
      return !latest || remark.remark_id > latest.remark_id ? remark : latest;
    },
    null,
  );

  // Initialize lead status with latest remark values
  const [leadStatus, setLeadStatus] = useState({
    funnel1: latestRemark?.lead_status || "",
    funnel2: latestRemark?.lead_sub_status || "",
  });

  const [enrollmentDocument, setEnrollmentDocument] = useState(null);
  const [callbackDate, setCallbackDate] = useState("");
  const [callbackTime, setCallbackTime] = useState(
    selectedStudent?.nextCallTime || "",
  );
  const [messageText, setMessageText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCounselingFormPrompt, setShowCounselingFormPrompt] =
    useState(false);
  const [isFormPopupOpen, setIsFormPopupOpen] = useState(false);

  const agent = useSelector((state) => state.auth.user);
  const storedRole = localStorage.getItem("role");
  const activeRole =
    agent?.role || (storedRole !== "Supervisor" ? storedRole : null) || "l2";

  // Check if it's an online college
  const isOnlineCollege = (collegeName) => {
    const onlineColleges = ["Online", "Distance", "E-Learning"];
    return onlineColleges.some((keyword) =>
      collegeName?.toLowerCase().includes(keyword.toLowerCase()),
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
    const name = collegeName?.toLowerCase() || "";
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

  // Validate credential form fields based on college type
  const validateCredentialForm = () => {
    const collegeType = getCollegeType(selectedUniversity || "");

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

  // Check if credential fields should be shown for L2 users
  const shouldShowCredentialFields = () => {
    if (activeRole !== "l2") return false;

    // Show for Application status or Pre Application with Walkin marked
    const showForAppOrPre =
      leadStatus.funnel1 === "Application" ||
      (leadStatus.funnel1 === "Pre Application" &&
        leadStatus.funnel2 === "Walkin marked");

    if (!showForAppOrPre) return false;
    if (!selectedUniversity || !selectedCourse) return false;

    const hasExistingCreds = checkExistingCredentials(
      { course_id: selectedCourse, university_name: selectedUniversity },
      selectedStudent,
    );
    const isOnline = isOnlineCollege(selectedUniversity);

    return !hasExistingCreds && !isOnline;
  };

  // Reset credential fields when college/course changes
  useEffect(() => {
    if (selectedUniversity && selectedCourse && selectedStudent) {
      const hasExistingCreds = checkExistingCredentials(
        { course_id: selectedCourse, university_name: selectedUniversity },
        selectedStudent,
      );
      setIsCredsFound(hasExistingCreds);

      // Reset credential fields when selection changes
      setFormID("");
      setCouponCode("");
      setUserName("");
      setPassword("");
    }
  }, [selectedUniversity, selectedCourse, selectedStudent]);

  // Define colors at the top level
  const modalTitle =
    showCourseSelection && activeRole === "l3"
      ? "Select Course & College"
      : isConnectedCall
        ? "Call Connected - Update Status"
        : "Call Not Connected - Update Status";

  const confirmColor =
    showCourseSelection && activeRole === "l3"
      ? "blue"
      : isConnectedCall
        ? "green"
        : "blue";

  const focusRingColor = isConnectedCall
    ? "focus:ring-green-500 focus:border-green-500"
    : "focus:ring-blue-500 focus:border-blue-500";

  const timeSlots = [
    { value: "09:00", label: "9:00 AM - 9:30 AM" },
    { value: "09:30", label: "9:30 AM - 10:00 AM" },
    { value: "10:00", label: "10:00 AM - 10:30 AM" },
    { value: "10:30", label: "10:30 AM - 11:00 AM" },
    { value: "11:00", label: "11:00 AM - 11:30 AM" },
    { value: "11:30", label: "11:30 AM - 12:00 PM" },
    { value: "12:00", label: "12:00 PM - 12:30 PM" },
    { value: "12:30", label: "12:30 PM - 1:00 PM" },
    { value: "13:00", label: "1:00 PM - 1:30 PM" },
    { value: "13:30", label: "1:30 PM - 2:00 PM" },
    { value: "14:00", label: "2:00 PM - 2:30 PM" },
    { value: "14:30", label: "2:30 PM - 3:00 PM" },
    { value: "15:00", label: "3:00 PM - 3:30 PM" },
    { value: "15:30", label: "3:30 PM - 4:00 PM" },
    { value: "16:00", label: "4:00 PM - 4:30 PM" },
    { value: "16:30", label: "4:30 PM - 5:00 PM" },
    { value: "17:00", label: "5:00 PM - 5:30 PM" },
    { value: "17:30", label: "5:30 PM - 6:00 PM" },
    { value: "18:00", label: "6:00 PM - 6:30 PM" },
    { value: "18:30", label: "6:30 PM - 7:00 PM" },
    { value: "19:00", label: "7:00 PM - 7:30 PM" },
    { value: "19:30", label: "7:30 PM - 8:00 PM" },
    { value: "20:30", label: "8:31 PM - 9:00 PM" },
  ];

  const needsAdmissionNI =
    agent?.role === "l3" ||
    selectedStudent?.student_remarks?.[0]?.lead_status === "Application" ||
    selectedStudent?.student_remarks?.[0]?.lead_status === "Admission" ||
    selectedStudent?.student_remarks?.[0]?.lead_status === "Enrolled";

  const funnelConfig = {
    "Pre Application": [
      "Counselling Yet to be Done",
      "Initial Counseling Completed",
      "Ready to Pay",
      "Walkin marked",
    ],
    Application: [
      "Form Filled_Degreefyd",
      "Form Submitted – Portal Pending",
      "Form Submitted – Completed",
      "Walkin Completed",
      "Exam Interview Pending",
      "Offer Letter/Results Pending",
      "Offer Letter/Results Released",
    ],
    Admission:
      selectedStudent?.student_remarks?.[0]?.lead_sub_status ===
        "Registration Done" ||
      selectedStudent?.student_remarks?.[0]?.lead_sub_status === "Semester Paid"
        ? [
            "Registration Done",
            "Partially Paid",
            "Semester Paid",
            "Enrollment in Process",
          ]
        : ["Registration Done", "Partially Paid", "Semester Paid"],
    NotInterested: needsAdmissionNI
      ? ["NI - College Reject", "NI - Student Denied"]
      : [
          "Multiple Attempts made",
          "Invalid number / Wrong Number",
          "Language Barrier",
          "Not Enquired",
          "Already Enrolled_Partner",
          "First call Not Interested",
          "Not Eligible",
          "Dublicate_Same student exists",
          "Only_Online course",
          "Course Not Available",
          "Next Year",
          "Budget issue",
          "Already Enrolled_NP",
          "Reason not shared",
          "Location issue",
        ],
    Enrolled: ["Enrolled"],
  };

  const isFunnelAllowed = (funnel) => {
    const currentFunnel = latestRemark?.lead_status;

    // Role-based restrictions
    if (activeRole === "l2") {
      // L2 cannot select Admission or Enrolled
      if (funnel === "Admission" || funnel === "Enrolled") {
        return false;
      }

      // If current status is Application, disable Pre Application
      if (currentFunnel === "Application" && funnel === "Pre Application") {
        return false;
      }

      // If current status is Pre Application, allow all except Admission/Enrolled
      return true;
    }

    if (activeRole === "l3") {
      // L3 cannot select Pre Application or Application
      if (funnel === "Pre Application" || funnel === "Application") {
        return false;
      }
      return true;
    }

    // For other roles, apply funnel flow logic
    if (!currentFunnel) {
      return funnel !== "Admission" && funnel !== "Enrolled";
    }

    if (currentFunnel === "Application") {
      return funnel !== "Pre Application";
    }

    if (currentFunnel === "Admission") {
      return funnel !== "Pre Application" && funnel !== "Application";
    }

    if (currentFunnel === "Enrolled") {
      return funnel === "Enrolled";
    }

    return true;
  };

  const disconnectReasons = [
    { value: "Ringing no response", icon: FiPhone, color: "orange" },
    { value: "Switched off", icon: FiPhoneOff, color: "red" },
    { value: "Invalid Number", icon: FiAlertTriangle, color: "yellow" },
    { value: "Line Busy", icon: FiPhone, color: "blue" },
    {
      value: "Not Interested(CB not required)",
      icon: FiPhoneOff,
      color: "gray",
    },
  ];

  const needsCallback = isConnectedCall
    ? leadStatus.funnel1 && !["NotInterested"].includes(leadStatus.funnel1)
    : disconnectReason !== "Not Interested(CB not required)" &&
      leadStatus.funnel1 !== "NotInterested";

  useEffect(() => {
    const fetchColleges = async () => {
      if (activeRole === "to") return;

      try {
        const isApplicationOrPre =
          leadStatus.funnel1 === "Application" ||
          leadStatus.funnel1 === "Pre Application";
        let response = await fetchShortlistedColleges1(
          selectedStudent.student_id,
          isApplicationOrPre,
        );
        const data = response.data;

        const uniqueUniversities = [
          ...new Set(data.map((item) => item.university_name)),
        ];
        const courseList = data.map((item) => ({
          id: item._id,
          name: item.course_name,
          specialization: item.specialization,
          university_name: item.university_name,
          course_id: item.course_id,
          course_name: item.course_name,
        }));

        setUniversities(uniqueUniversities);
        setCourses(courseList);

        // If we have preselected values, find the course details
        if (preselectedUniversity && preselectedCourse) {
          const courseDetail = courseList.find(
            (c) => c.course_id === preselectedCourse,
          );
          setSelectedCourseDetails(courseDetail);
        }
      } catch (error) {}
    };

    if (selectedStudent?.student_id) {
      fetchColleges();
    }
  }, [
    selectedStudent?.student_id,
    isConnectedCall,
    activeRole,
    leadStatus.funnel1,
    preselectedUniversity,
    preselectedCourse,
  ]);

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getAvailableTimeSlots = () => {
    const isToday = callbackDate === getTodayDate();

    if (!isToday) {
      return timeSlots;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return timeSlots.filter((slot) => {
      const [slotHour, slotMinute] = slot.value.split(":").map(Number);

      if (slotHour > currentHour) {
        return true;
      }

      if (slotHour === currentHour) {
        return slotMinute > currentMinute;
      }

      return false;
    });
  };

  const getFilteredCourses = () => {
    if (!selectedUniversity) {
      return [];
    }
    return courses.filter(
      (course) => course.university_name === selectedUniversity,
    );
  };

  const isFormValid = () => {
    // For L3 course selection mode, no validation needed as we're just showing table
    if (showCourseSelection && activeRole === "l3") {
      return true;
    }

    const primaryField = isConnectedCall ? true : disconnectReason;
    const basicFieldsValid =
      primaryField &&
      leadStatus.funnel1 &&
      leadStatus.funnel2 &&
      messageText.trim();

    const callbackFieldsValid =
      !needsCallback || (callbackDate && callbackTime);

    let courseFieldsValid = true;
    if (isConnectedCall && activeRole !== "to") {
      const needsCollegeInfo =
        activeRole === "l2"
          ? leadStatus.funnel1 === "Application" ||
            (leadStatus.funnel1 === "Pre Application" &&
              leadStatus.funnel2 === "Walkin marked")
          : true;
      if (needsCollegeInfo && leadStatus.funnel1 !== "NotInterested") {
        courseFieldsValid = selectedUniversity && selectedCourse;

        // If credential fields are required, validate them too
        if (shouldShowCredentialFields()) {
          courseFieldsValid = courseFieldsValid && validateCredentialForm();
        }

        if (leadStatus.funnel1 === "Admission") {
          courseFieldsValid =
            courseFieldsValid &&
            feesAmount &&
            !isNaN(feesAmount) &&
            Number(feesAmount) > 0;
        }
      }
    }

    return basicFieldsValid && callbackFieldsValid && courseFieldsValid;
  };

  const handleDispose = (course) => {
    setSelectedRowForDispose(course);
    setSelectedUniversity(course.university_name);
    setSelectedCourse(course.course_id);
    setSelectedCourseDetails(course);
    setShowDisposeModal(true);
  };

  const handleSubmit = async () => {
    if (isSubmitting || isUpdatingCreds) return;

    if (!selectedStudent?.student_id) {
      alert("Student ID not found");
      return;
    }

    // If in course selection mode, don't submit (table view)
    if (showCourseSelection && activeRole === "l3") {
      return;
    }

    setIsSubmitting(true);

    try {
      let enrolledDocumentUrl = null;

      if (leadStatus.funnel1 === "Enrolled" && enrollmentDocument) {
        const toBase64 = (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
          });

        enrolledDocumentUrl = await toBase64(enrollmentDocument);
      }

      // Save credentials first if needed
      if (shouldShowCredentialFields() && validateCredentialForm()) {
        setIsUpdatingCreds(true);

        try {
          const counsellorId = agent?.counsellor_id || agent?.id;
          const counsellorName = agent?.name;

          await updateCollegeSentStatusCreds({
            formID,
            couponCode,
            userName,
            password,
            studentId: selectedStudent.student_id,
            courseId: selectedCourse,
            collegeName: selectedUniversity,
            counsellorId,
            counsellorName,
          });
        } catch (error) {
          console.error("Error updating credentials:", error);
          alert(error || "Failed to update credentials. Please try again.");
          setIsSubmitting(false);
          setIsUpdatingCreds(false);
          return;
        }
      }

      // Then update status
      const payload = {
        leadStatus: leadStatus.funnel1,
        leadSubStatus: leadStatus.funnel2,
        callingStatus: isConnectedCall ? "Connected" : "Not Connected",
        subCallingStatus: isConnectedCall ? callOutcome : disconnectReason,
        remark: messageText,
        ...(needsCallback && callbackDate && { callbackDate }),
        ...(needsCallback && callbackTime && { callbackTime }),
        ...(enrolledDocumentUrl && { enrolledDocumentUrl }),
        ...(leadStatus.funnel1 === "Admission" &&
          feesAmount && { feesAmount: Number(feesAmount) }),
        ...((activeRole === "l3" ||
          activeRole === "Supervisor" ||
          activeRole === "to" ||
          (activeRole === "l2" &&
            (leadStatus.funnel1 === "Application" ||
              (leadStatus.funnel1 === "Pre Application" &&
                leadStatus.funnel2 === "Walkin marked")))) && {
          selectedUniversity: selectedUniversity,
          selectedCourse: selectedCourse,
          collegeCourseStatus: leadStatus.funnel2,
        }),
      };

      const result = await updateStudentStatus(
        selectedStudent.student_id,
        payload,
      );

      if (result.success || result?.data?.success || result?.status) {
        const index = leads.findIndex(
          (lead) => lead.student_id === selectedStudent.student_id,
        );
        const updatedDetails = result.student;

        if (index !== -1) {
          const newLeads = [...leads];
          const updatedLead = {
            ...newLeads[index],
            ...updatedDetails,
            student_remarks: result.remark,
          };
          newLeads.splice(index, 1);
          newLeads.unshift(updatedLead);
          setLeads(newLeads);
        }
        if (props.onSuccess) {
          props.onSuccess(updatedDetails);
          return;
        }
        if (isConnectedCall) {
          setShowCounselingFormPrompt(true);
        } else {
          const url = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, url);
          // window.location.reload();
        }
      }
    } catch (error) {
      alert("Failed to update student status. Please try again.");
      setIsSubmitting(false);
    } finally {
      setIsUpdatingCreds(false);
    }
  };

  const getOutcomeColor = (outcome) => {
    switch (outcome) {
      case "Hot":
        return "border-red-500 bg-red-50 text-red-700";
      case "Warm":
        return "border-orange-500 bg-orange-50 text-orange-700";
      case "Cold":
        return "border-blue-500 bg-blue-50 text-blue-700";
      default:
        return "border-gray-300 bg-white text-gray-700";
    }
  };

  const getReasonColor = (reason, color) => {
    if (disconnectReason === reason) {
      switch (color) {
        case "red":
          return "border-red-500 bg-red-50 text-red-700";
        case "orange":
          return "border-orange-500 bg-orange-50 text-orange-700";
        case "yellow":
          return "border-yellow-500 bg-yellow-50 text-yellow-700";
        case "blue":
          return "border-blue-500 bg-blue-50 text-blue-700";
        case "gray":
          return "border-gray-500 bg-gray-50 text-gray-700";
        default:
          return "border-gray-300 bg-white text-gray-700";
      }
    }
    return "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300";
  };

  const handleUniversityChange = (university) => {
    setSelectedUniversity(university);
    setSelectedCourse(null);
    setSelectedCourseDetails(null);
    setFeesAmount("");
    // Reset credential fields when college changes
    setFormID("");
    setCouponCode("");
    setUserName("");
    setPassword("");
  };

  const handleCourseChange = (courseId) => {
    setSelectedCourse(courseId);
    const courseDetail = courses.find((c) => c.course_id === courseId);
    setSelectedCourseDetails(courseDetail);
    // Reset credential fields when course changes
    setFormID("");
    setCouponCode("");
    setUserName("");
    setPassword("");
  };

  const handleLeadStatusChange = (selectedFunnel1) => {
    setLeadStatus({
      funnel1: selectedFunnel1,
      funnel2: "",
    });

    if (selectedFunnel1 !== "Admission") {
      setFeesAmount("");
    }

    if (selectedFunnel1 === "NotInterested") {
      setCallbackDate("");
      setCallbackTime("");
    }

    // Reset credential fields when lead status changes
    setFormID("");
    setCouponCode("");
    setUserName("");
    setPassword("");
  };

  const handleDisconnectReasonChange = (reason) => {
    setDisconnectReason(reason);
    if (reason === "Not Interested(CB not required)") {
      setCallbackDate("");
      setCallbackTime("");
    }
  };

  const handleCounselingFormResponse = (filledForm) => {
    localStorage.setItem(
      "lastCounselingResponse",
      JSON.stringify({
        filledForm,
        timestamp: new Date().toISOString(),
      }),
    );

    setShowCounselingFormPrompt(false);

    if (filledForm) {
      const url = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, url);
      // window.location.reload();
    } else {
      setIsFormPopupOpen(true);
    }
  };

  const handleStudentFormClose = () => {
    setIsFormPopupOpen(false);
    const url = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, url);
    // window.location.reload();
  };

  const confirmText =
    showCourseSelection && activeRole === "l3"
      ? "Close"
      : isSubmitting || isUpdatingCreds
        ? "Submitting..."
        : isFormValid()
          ? "Submit"
          : "Fill Required Fields";

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

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={
          showCourseSelection && activeRole === "l3" ? onClose : handleSubmit
        }
        title={modalTitle}
        confirmText={confirmText}
        cancelText="Cancel"
        confirmColor={confirmColor}
        size={showCourseSelection && activeRole === "l3" ? "5xl" : "5xl"}
        confirmDisabled={
          (!showCourseSelection || activeRole !== "l3") &&
          (!isFormValid() || isSubmitting || isUpdatingCreds)
        }
      >
        <div className="space-y-4 p-2">
          {/* Course Selection Mode for L3 - Table View */}
          {showCourseSelection && activeRole === "l3" ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineAcademicCap className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Available Courses & Colleges
                </h3>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        S.No
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        University
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Course Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Specialization
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courses.length > 0 ? (
                      courses.map((course, index) => (
                        <tr key={course.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {course.university_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {course.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {course.specialization || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleDispose(course)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              Dispose
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-8 text-center text-sm text-gray-500"
                        >
                          No courses available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Regular Call Modal Content */
            <>
              {!isConnectedCall && (
                <div className="bg-white border-gray-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <FiPhoneOff className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      Disconnect Reason <span className="text-red-500">*</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {disconnectReasons.map((reason) => {
                      const IconComponent = reason.icon;
                      return (
                        <label
                          key={reason.value}
                          className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                            disconnectReason === reason.value
                              ? getReasonColor(reason.value, reason.color) +
                                " shadow-md transform scale-105"
                              : getReasonColor(reason.value, reason.color)
                          }`}
                        >
                          <input
                            type="radio"
                            name="disconnectReason"
                            value={reason.value}
                            checked={disconnectReason === reason.value}
                            onChange={() =>
                              handleDisconnectReasonChange(reason.value)
                            }
                            className="sr-only"
                          />
                          <IconComponent className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-medium">
                            {reason.value}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <HiOutlineClipboardList className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Lead Status Information
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FiUser className="w-4 h-4" />
                      Lead Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`w-full border rounded-lg p-3 ${focusRingColor} transition-colors ${
                        !leadStatus.funnel1 || leadStatus.funnel1 === "Fresh"
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      value={leadStatus.funnel1}
                      onChange={(e) => handleLeadStatusChange(e.target.value)}
                    >
                      <option value="">Select Lead Status</option>
                      {Object.keys(funnelConfig)
                        .filter((status) => {
                          if (
                            activeRole === "l2" &&
                            (status === "Admission" || status === "Enrolled")
                          ) {
                            return false;
                          }
                          if (
                            activeRole === "l3" &&
                            (status === "Pre Application" ||
                              status === "Application")
                          ) {
                            return false;
                          }
                          return isFunnelAllowed(status);
                        })
                        .map((status) => {
                          const isAllowed = isFunnelAllowed(status);
                          return (
                            <option
                              key={status}
                              value={status}
                              disabled={!isAllowed}
                              className={
                                !isAllowed ? "bg-gray-100 text-gray-400" : ""
                              }
                              style={
                                !isAllowed
                                  ? {
                                      backgroundColor: "#f3f4f6",
                                      color: "#9ca3af",
                                    }
                                  : {}
                              }
                            >
                              {status}
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FiCheckCircle className="w-4 h-4" />
                      Lead Sub Status <span className="text-red-500">*</span>
                    </label>

                    <select
                      className={`w-full border rounded-lg p-3 ${focusRingColor} transition-colors disabled:bg-gray-100 ${
                        (!leadStatus.funnel2 ||
                          leadStatus.funnel2 === "Untouched Lead") &&
                        leadStatus.funnel1
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      value={leadStatus.funnel2}
                      onChange={(e) =>
                        setLeadStatus((prev) => ({
                          ...prev,
                          funnel2: e.target.value,
                        }))
                      }
                      disabled={!leadStatus.funnel1}
                    >
                      <option value="">Select Sub Status</option>
                      {leadStatus.funnel1 &&
                        funnelConfig[leadStatus.funnel1]?.map((status) => {
                          const isDisabled = status === "Form Filled_Degreefyd";
                          return (
                            <option
                              key={status}
                              value={status}
                              disabled={isDisabled}
                              className={
                                isDisabled ? "bg-gray-100 text-gray-400" : ""
                              }
                            >
                              {status}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                </div>
                {leadStatus.funnel1 === "Admission" && (
                  <div className="mt-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      ₹ Amount deposited <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={feesAmount}
                        onChange={(e) => setFeesAmount(e.target.value)}
                        placeholder="Amount deposited"
                        min="0"
                        step="1"
                        className={`w-full p-3 border rounded-lg pr-12 ${focusRingColor} transition-colors ${
                          !feesAmount ||
                          isNaN(feesAmount) ||
                          Number(feesAmount) <= 0
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500">INR</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Please enter the fees amount in Indian Rupees (INR)
                    </p>
                  </div>
                )}
                {leadStatus.funnel1 === "Enrolled" && (
                  <div className="mt-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FiPaperclip className="w-4 h-4" />
                      Upload Enrollment Document{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => setEnrollmentDocument(e.target.files[0])}
                      className="w-full border rounded-lg p-3 border-gray-300"
                    />
                  </div>
                )}
              </div>

              {/* Course & College Information with Integrated Credential Fields */}
              {((leadStatus.funnel1 === "Pre Application" &&
                leadStatus.funnel2 === "Walkin marked") ||
                leadStatus.funnel1 === "Application" ||
                leadStatus.funnel1 === "Admission" ||
                leadStatus.funnel1 === "Enrolled") &&
                (activeRole === "l2"
                  ? leadStatus.funnel1 === "Application" ||
                    (leadStatus.funnel1 === "Pre Application" &&
                      leadStatus.funnel2 === "Walkin marked")
                  : true) &&
                leadStatus.funnel1 !== "NotInterested" &&
                !preselectedUniversity && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <HiOutlineAcademicCap className="w-5 h-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-800">
                        Course & College Information
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          Colleges <span className="text-red-500">*</span>
                        </label>
                        <select
                          className={`w-full p-3 border rounded-lg ${focusRingColor} transition-colors ${
                            !selectedUniversity
                              ? "border-red-300"
                              : "border-gray-300"
                          }`}
                          value={selectedUniversity || ""}
                          onChange={(e) =>
                            handleUniversityChange(e.target.value)
                          }
                        >
                          <option value="">Select a college</option>
                          {universities.map((uni, index) => (
                            <option key={index} value={uni}>
                              {uni}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <FiBook className="w-4 h-4" />
                          Courses <span className="text-red-500">*</span>
                        </label>
                        <select
                          className={`w-full p-3 border rounded-lg ${focusRingColor} transition-colors disabled:bg-gray-100 ${
                            !selectedCourse && selectedUniversity
                              ? "border-red-300"
                              : "border-gray-300"
                          }`}
                          value={selectedCourse || ""}
                          onChange={(e) => handleCourseChange(e.target.value)}
                          disabled={!selectedUniversity}
                        >
                          <option value="">
                            {!selectedUniversity
                              ? "First select a college"
                              : "Select a course"}
                          </option>
                          {getFilteredCourses().map((course) => (
                            <option key={course.id} value={course.course_id}>
                              {course.name} - {course.specialization}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {activeRole === "l2" &&
                      selectedUniversity &&
                      selectedCourse &&
                      leadStatus.funnel1 === "Application" && (
                        <div className="mt-4 border-t pt-4">
                          {isCredsFound ? (
                            <div className="bg-green-50 border border-green-200 rounded-md p-3">
                              <p className="text-sm text-green-800 flex items-center">
                                <FiCheckCircle className="mr-2" />✓ Credentials
                                already exist for this college. You can directly
                                update the status.
                              </p>
                            </div>
                          ) : isOnlineCollege(selectedUniversity) ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                              <p className="text-sm text-blue-800 flex items-center">
                                <FiAlertCircle className="mr-2" />ℹ This is an
                                online college. No form credentials are
                                required.
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                                <p className="text-sm text-yellow-800 flex items-center">
                                  <FiAlertTriangle className="mr-2" />⚠
                                  First-time form submission. Please fill in the
                                  form credentials below.
                                </p>
                              </div>

                              {/* Credential Fields - Inline */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Form ID
                                    {getCollegeType(selectedUniversity) ===
                                    "amity"
                                      ? " *"
                                      : ""}
                                  </label>
                                  <input
                                    type="text"
                                    value={formID}
                                    onChange={(e) => setFormID(e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter Form ID"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Coupon Code
                                    {getCollegeType(selectedUniversity) ===
                                    "amity"
                                      ? " *"
                                      : ""}
                                  </label>
                                  <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) =>
                                      setCouponCode(e.target.value)
                                    }
                                    className="w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter Coupon Code"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                    {getCollegeType(selectedUniversity) ===
                                    "amity"
                                      ? " *"
                                      : ""}
                                  </label>
                                  <input
                                    type="text"
                                    value={password}
                                    onChange={(e) =>
                                      setPassword(e.target.value)
                                    }
                                    className="w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter Password"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Username
                                    {["amity", "lpu", "chandigarh"].includes(
                                      getCollegeType(selectedUniversity),
                                    )
                                      ? " *"
                                      : ""}
                                  </label>
                                  <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) =>
                                      setUserName(e.target.value)
                                    }
                                    className={`w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                                      userName &&
                                      !validateUsernameFormat(
                                        userName,
                                        getCollegeType(selectedUniversity),
                                      )
                                        ? "border-red-500"
                                        : ""
                                    }`}
                                    placeholder={getUsernamePlaceholder(
                                      getCollegeType(selectedUniversity),
                                    )}
                                  />
                                  {userName &&
                                    !validateUsernameFormat(
                                      userName,
                                      getCollegeType(selectedUniversity),
                                    ) && (
                                      <p className="text-red-500 text-xs mt-1">
                                        {getUsernameValidationMessage(
                                          getCollegeType(selectedUniversity),
                                        )}
                                      </p>
                                    )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                  </div>
                )}

              {needsCallback && (
                <div className="border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <FiCalendar className="w-5 h-5 text-black" />
                    <h3 className="text-lg font-semibold text-black">
                      Schedule Callback
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FiCalendar className="w-4 h-4" />
                        Callback Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={callbackDate}
                        onChange={(e) => setCallbackDate(e.target.value)}
                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                          needsCallback && !callbackDate
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Callback Time <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={callbackTime}
                        onChange={(e) => setCallbackTime(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed bg-white shadow-sm ${
                          needsCallback && !callbackTime && callbackDate
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        disabled={!callbackDate || isSubmitting}
                      >
                        <option value="">
                          {!callbackDate
                            ? "First select a date"
                            : "Select time slot"}
                        </option>
                        {getAvailableTimeSlots().map((slot) => (
                          <option key={slot.value} value={slot.value}>
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FiMessageSquare className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Call Summary & Remarks{" "}
                    <span className="text-red-500">*</span>
                  </h3>
                </div>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={
                    isConnectedCall
                      ? "Provide detailed summary of the conversation, student's response, next steps, etc..."
                      : "Provide detailed summary of the call attempt, reason for disconnect, and any relevant notes..."
                  }
                  className={`w-full border rounded-lg p-4 min-h-32 ${focusRingColor} transition-colors resize-vertical ${
                    !messageText.trim() ? "border-red-300" : "border-gray-300"
                  }`}
                  maxLength={50000}
                />
                <div className="text-xs text-gray-500 mt-2">
                  {messageText.length}/50000 characters
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Second Modal for L3 after Dispose */}
      {showDisposeModal && selectedRowForDispose && (
        <UnifiedCallModal
          isOpen={showDisposeModal}
          onClose={() => {
            setShowDisposeModal(false);
            setSelectedRowForDispose(null);
          }}
          selectedStudent={selectedStudent}
          isConnectedCall={isConnectedCall}
          showCourseSelection={false}
          preselectedUniversity={selectedRowForDispose.university_name}
          preselectedCourse={selectedRowForDispose.course_id}
          onSuccess={props.onSuccess}
        />
      )}

      {showCounselingFormPrompt && (
        <Modal
          isOpen={showCounselingFormPrompt}
          onClose={() => {
            setShowCounselingFormPrompt(false);
            setIsFormPopupOpen(true);
          }}
          title="Counseling Form"
          confirmText="Yes, I filled it"
          cancelText="No, fill now"
          onConfirm={() => {
            handleCounselingFormResponse(true);
          }}
          onCancel={() => {
            handleCounselingFormResponse(false);
          }}
          confirmColor="green"
          size="md"
        >
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <FiCheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Did you submit the counseling form?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Please confirm if you have completed and submitted the counseling
              form for this student.
            </p>
          </div>
        </Modal>
      )}
      {isFormPopupOpen && (
        <StudentFormPopup
          studentId={selectedStudent?.student_id}
          isOpen={isFormPopupOpen}
          onClose={handleStudentFormClose}
          onSubmit={async (data) => {}}
        />
      )}
    </>
  );
};

export default UnifiedCallModal;
