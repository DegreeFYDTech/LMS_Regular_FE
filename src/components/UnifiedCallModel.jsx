import React, { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, message } from "antd";
import { updateStudentStatus } from "../network/student";
import { fetchShortlistedColleges1 } from "../network/colleges";
import { updateCollegeSentStatusCreds } from "../network/credential";
import { useSelector } from "react-redux";
import { LeadsContext } from "../context/LeadsContext";
import StudentFormPopup from "../components/StudentFormPopup";

import {
  FiCheckCircle,
  FiPaperclip,
  FiZap,
  FiAlertCircle,
} from "react-icons/fi";

const UnifiedCallModal = ({
  isOpen,
  onClose,
  selectedStudent,
  isConnectedCall = true,
  showCourseSelection = true,
  preselectedUniversity = null,
  precourse_id = null,
  onCourseSelected,
  isDirectFollowUp = false,
  initialStep = null,
  ...props
}) => {
  const navigate = useNavigate();
  const { leads, setLeads } = useContext(LeadsContext);
  const [universities, setUniversities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [course_id, setcourse_id] = useState(null);
  const [course_idDetails, setcourse_idDetails] = useState(null);
  const [feesAmount, setFeesAmount] = useState("");

  const [formID, setFormID] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [isCredsFound, setIsCredsFound] = useState(false);
  const [isUpdatingCreds, setIsUpdatingCreds] = useState(false);
  const [credError, setCredError] = useState("");
  const [isCredSubmitting, setIsCredSubmitting] = useState(false);

  const [leadStatus, setLeadStatus] = useState({
    funnel1: "",
    funnel2: "",
  });

  const [callbackDate, setCallbackDate] = useState(null);
  const [callbackTime, setCallbackTime] = useState(null);
  const [eventDate, setEventDate] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCounselingFormPrompt, setShowCounselingFormPrompt] =
    useState(false);
  const [isFormPopupOpen, setIsFormPopupOpen] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [isICCDone, setIsICCDone] = useState(false);
  const [isAppDone, setIsAppDone] = useState(false);
  const [isAdmissionDone, setIsAdmissionDone] = useState(false);
  const [isNotInterestedDone, setIsNotInterestedDone] = useState(false);
  const [isEnrDone, setIsEnrDone] = useState(false);
  const [isAppStepSelectedFromProgress, setIsAppStepSelectedFromProgress] =
    useState(false);

  const agent = useSelector((state) => state.auth.user);
  const storedRole = localStorage.getItem("role");
  const activeRole =
    agent?.role || (storedRole !== "Supervisor" ? storedRole : null) || "l2";
  const isSupervisor =
    agent?.role === "Supervisor" || storedRole === "Supervisor";

  const isL2 = activeRole === "l2";
  const isL3 = activeRole === "l3" || activeRole === "to_l3";
  const isTO = activeRole === "to" || activeRole === "to_l3";

  // Get existing course_id from selectedStudent
  const existingCourseId = selectedStudent?.course_id || null;
  const existingUniversity = selectedStudent?.university_name || null;
  const currentStudentStatus = selectedStudent?.current_student_status || "";
  const coursecount = selectedStudent?.course_count || 1;
  const existingCourseSubStatus = selectedStudent?.course_sub_status || "";
  // Time slot generation function with time ranges
  const generateTimeSlots = useCallback(() => {
    const slots = [];
    const now = dayjs();
    const selectedDate = callbackDate;

    // If no date selected, return empty array
    if (!selectedDate) return slots;

    // Check if selected date is today
    const isToday = selectedDate.isSame(now, "day");

    // Get current time for today's date
    const currentHour = now.hour();
    const currentMinute = now.minute();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const bufferTime = 15; // 15 minutes buffer - only show slots at least 15 mins from now

    // Generate all possible slots from 9:00 to 20:30
    for (let hour = 9; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip if it's after 8:30 PM (20:30)
        if (hour === 20 && minute === 30) {
          // This is the last slot (20:30 - 21:00)
          const slotTimeInMinutes = hour * 60 + minute;

          // If it's today and the slot time is before or equal to current time + buffer, skip it
          if (
            isToday &&
            slotTimeInMinutes <= currentTimeInMinutes + bufferTime
          ) {
            continue;
          }

          const startTime = "20:30";
          const endTime = "21:00";
          const display = `${startTime} - ${endTime}`;
          slots.push({
            display,
            value: startTime,
            startHour: hour,
            startMinute: minute,
            endHour: 21,
            endMinute: 0,
          });
          break;
        }

        // Skip if it's past 8:30 PM
        if (hour === 20 && minute > 30) break;
        if (hour > 20) break;

        const slotTimeInMinutes = hour * 60 + minute;

        // If it's today and the slot time is before or equal to current time + buffer, skip it
        if (isToday && slotTimeInMinutes <= currentTimeInMinutes + bufferTime) {
          continue;
        }

        // Calculate end time for the slot
        let endHour = hour;
        let endMinute = minute + 30;

        // Handle end time overflow to next hour
        if (endMinute >= 60) {
          endHour = hour + 1;
          endMinute = endMinute - 60;
        }

        const startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
        const display = `${startTime} - ${endTime}`;

        slots.push({
          display,
          value: startTime,
          startHour: hour,
          startMinute: minute,
          endHour,
          endMinute,
        });
      }
    }

    return slots;
  }, [callbackDate]);
  const l2Steps = [
    {
      id: "preapp",
      label: "Pre Application",
      funnel: "Pre Application",
      leadSubStatus: "Counselling Yet to be Done",
    },
    {
      id: "icc",
      label: "Initial Counselling Completed",
      funnel: "Initial Counselling Completed",
      leadSubStatus: "Initial Counselling Completed",
    },
    {
      id: "app",
      label: "Application",
      funnel: "Application",
      leadSubStatus: "Form Submitted – Portal Pending",
    },
  ];

  const l3Steps = [
    {
      id: "app",
      label: "Application",
      funnel: "Application",
      leadSubStatus: "Form Submitted – Completed",
    },
    {
      id: "adm",
      label: "Admission",
      funnel: "Admission",
      leadSubStatus: "Admission",
    },
    {
      id: "enr",
      label: "Enrolled",
      funnel: "Enrolled",
      leadSubStatus: "Enrolled",
    },
  ];

  const getAvailableSteps = () => {
    if (isSupervisor)
      return [
        ...l2Steps,
        {
          id: "adm",
          label: "Admission",
          funnel: "Admission",
          leadSubStatus: "Admission",
        },
        {
          id: "enr",
          label: "Enrolled",
          funnel: "Enrolled",
          leadSubStatus: "Enrolled",
        },
      ];
    if (isL3) return l3Steps;
    return l2Steps;
  };

  const statusOrder = {
    NotInterested: 0,
    "Pre Application": 1,
    Fresh: 1,
    "Initial Counseling Completed": 2,
    "Initial Counselling Completed": 2,
    Application: 3,
    Admission: 4,
    "Welcome Call Pending": 5,
    "Document In Process": 6,
    Enrolled: 7,
  };

  const [selectedAction, setSelectedAction] = useState(
    isConnectedCall ? "Connected" : "Not Connected",
  );

  const modalTitle =
    showCourseSelection && activeRole === "l3"
      ? "Select Course & College"
      : selectedAction === "Connected"
        ? "Call Connected - Update Status"
        : "Call Not Connected - Update Status";

  const isOnlineCollege = (collegeName) =>
    ["Online", "Distance", "E-Learning"].some((kw) =>
      collegeName?.toLowerCase().includes(kw.toLowerCase()),
    );

  const getCollegeType = (cn) => {
    const n = cn?.toLowerCase() || "";
    if (n.includes("amity")) return "amity";
    if (n.includes("lovely") || n.includes("lpu")) return "lpu";
    if (n.includes("chandigarh")) return "chandigarh";
    return "regular";
  };

  const getUsernamePlaceholder = () => {
    const ct = getCollegeType(selectedUniversity || "");
    if (ct === "amity" || ct === "chandigarh")
      return "Enter 10-digit Mobile Number";
    if (ct === "lpu") return "Enter Email Address";
    return "Enter Username / Email";
  };

  const validateUsernameFormat = (v, ct) => {
    if (!v) return true;
    if (ct === "amity" || ct === "chandigarh") return /^\d{10}$/.test(v);
    if (ct === "lpu") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    return true;
  };

  // Fixed: Remove setCredError from this function to prevent infinite loop
  const checkCredentialValidation = useCallback(() => {
    const ct = getCollegeType(selectedUniversity || "");

    if (userName) {
      if (ct === "amity" || ct === "chandigarh") {
        if (!/^\d{10}$/.test(userName)) {
          return "Please enter a valid 10-digit mobile number";
        }
      }
      if (ct === "lpu") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userName)) {
          return "Please enter a valid email address";
        }
      }
    }

    return "";
  }, [userName, selectedUniversity]);

  const validateCredentialForm = useCallback(() => {
    const error = checkCredentialValidation();
    if (error) {
      return false;
    }
    return true;
  }, [checkCredentialValidation]);

  const shouldShowCredentialFields = () => {
    if (isNotInterestedDone) return false;

    if (activeRole !== "l2" || !selectedUniversity || !course_id) return false;
    const show =
      leadStatus.funnel1 === "Application" ||
      isAppDone ||
      (leadStatus.funnel1.includes("Initial Counsel") &&
        leadStatus.funnel2 === "Walkin marked");
    if (!show) return false;
    return !isOnlineCollege(selectedUniversity);
  };

  const canSelectStatus = (ts) => {
    if (currentStudentStatus === "NotInterested") return true;
    const co = statusOrder[currentStudentStatus] || 0;
    const to = statusOrder[ts] || 0;
    return to >= co || ts === "NotInterested";
  };

  const isStatusDisabled = (s) =>
    isSupervisor
      ? false
      : currentStudentStatus === "NotInterested" ||
        currentStudentStatus === "Fresh"
        ? false
        : isNotInterestedDone
          ? s !== "NotInterested"
          : selectedAction === "Connected"
            ? !canSelectStatus(s)
            : false;

  useEffect(() => {
    if (isOpen && selectedStudent && !initialLoadDone) {
      let f1 = selectedStudent?.current_student_status || "Pre Application";
      let f2 =
        selectedStudent?.student_remarks?.[0]?.leadSubStatus ||
        "Counselling Yet to be Done";

      // Auto-select application sub-status from existing course_sub_status
      if (f1 === "Application" && existingCourseSubStatus) {
        f2 = existingCourseSubStatus;
      }

      if (f1 === "Fresh" || f1 === "NotInterested") {
        f1 = "Pre Application";
        f2 = "Counselling Yet to be Done";
      }
      setLeadStatus({ funnel1: f1, funnel2: f2 });

      const s = selectedStudent?.current_student_status || "";
      setIsICCDone(s.includes("Initial Counsel"));
      setIsAppDone(s === "Application");
      setIsAdmissionDone(s === "Admission");
      setIsEnrDone(s === "Enrolled");
      setIsNotInterestedDone(s === "NotInterested");

      if (existingCourseId) {
        setSelectedUniversity(existingUniversity);
        setcourse_id(existingCourseId);
      } else {
        setSelectedUniversity(preselectedUniversity);
        setcourse_id(precourse_id);
      }

      setIsAppStepSelectedFromProgress(false);
      setInitialLoadDone(true);
      if (isConnectedCall) setSelectedAction("Connected");
    }
  }, [
    isOpen,
    selectedStudent,
    isConnectedCall,
    existingCourseId,
    existingUniversity,
    preselectedUniversity,
    precourse_id,
    initialLoadDone,
    existingCourseSubStatus,
  ]);

  useEffect(() => {
    if (course_id && selectedStudent?.collegeCredentials) {
      const cred = selectedStudent.collegeCredentials.find(
        (c) => String(c.course_id) === String(course_id),
      );
      if (cred) {
        setUserName(cred.userName || cred.username || "");
        setPassword(cred.password || "");
        setFormID(cred.formID || "");
        setCouponCode(cred.couponCode || "");
        setIsCredsFound(true);
        setCredError("");
      } else {
        setUserName("");
        setPassword("");
        setFormID("");
        setCouponCode("");
        setIsCredsFound(false);
        setCredError("");
      }
    }
  }, [course_id, selectedStudent]);

  useEffect(() => {
    const fetchColleges = async () => {
      if (!selectedStudent?.student_id) return;
      try {
        const fetchAll =
          (leadStatus.funnel1 === "Admission" || isAdmissionDone) &&
          !isAppStepSelectedFromProgress;
        const res = await fetchShortlistedColleges1(
          selectedStudent.student_id,
          fetchAll,
        );
        const data = res.data;
        setUniversities([...new Set(data.map((i) => i.university_name))]);
        setCourses(
          data.map((i) => ({
            id: i._id,
            name: i.course_name,
            specialization: i.specialization,
            university_name: i.university_name,
            course_id: i.course_id,
          })),
        );
      } catch (e) {
        console.error(e);
      }
    };
    if (leadStatus.funnel1 || isAppDone || isAdmissionDone || isICCDone)
      fetchColleges();
  }, [
    selectedStudent,
    leadStatus.funnel1,
    isAppDone,
    isAdmissionDone,
    isICCDone,
    isAppStepSelectedFromProgress,
  ]);

  const getEffectiveFunnel1 = () => {
    return leadStatus.funnel1;
  };

  const Label = ({ children, required = false }) => (
    <label className="block text-sm font-medium text-gray-600 mb-1">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );

  const handleUniversityChange = (e) => {
    setSelectedUniversity(e.target.value);
    setcourse_id(null);
    setcourse_idDetails(null);
    setFeesAmount("");
    setCredError("");
  };

  const handleCourseChange = (e) => {
    const id = e.target.value;
    setcourse_id(id);
    setcourse_idDetails(courses.find((c) => c.course_id === id));
    setCredError("");
  };

  const handleLeadStatusChange = (f1, f2 = "") => {
    if (isStatusDisabled(f1) && !isSupervisor) {
      message.warning(`Cannot select ${f1}`);
      return;
    }
    let sub =
      f2 ||
      (f1 === "Pre Application"
        ? "Counselling Yet to be Done"
        : f1.includes("Initial Counsel")
          ? f1
          : f1 === "Application"
            ? existingCourseSubStatus || "Form Filled_Degreefyd"
            : "Admission Done");
    setLeadStatus({ funnel1: f1, funnel2: sub });
    if (f1 !== "Admission") setFeesAmount("");
  };

  const [isDisabledCheckState, setIsDisabledCheckState] = useState(false);

  const handleICCToggle = (e) => {
    const checked = e.target.checked;
    resetToggles();
    setIsICCDone(checked);
    if (checked) setSelectedAction("Connected");
  };

  const handleAppToggle = (e) => {
    const checked = e.target.checked;
    resetToggles();
    setIsAppDone(checked);
    setIsAppStepSelectedFromProgress(checked);
    if (checked) setSelectedAction("Connected");
  };

  const handleAdmissionToggle = (e) => {
    const checked = e.target.checked;
    resetToggles();
    setIsAdmissionDone(checked);
    if (checked) {
      setSelectedAction("Connected");
      if (Number(coursecount) > 1) setIsAppStepSelectedFromProgress(true);
    } else {
      setIsAppDone(true);
      setIsAppStepSelectedFromProgress(false);
    }
  };

  const handleEnrToggle = (e) => {
    const checked = e.target.checked;
    resetToggles();
    setIsEnrDone(checked);
    if (checked) setSelectedAction("Connected");
  };

  const handleNotInterestedToggle = (e) => {
    const checked = e.target.checked;
    resetToggles1();
    setIsNotInterestedDone(checked);
    if (checked) {
      setSelectedAction("");
      setLeadStatus((prev) => ({ ...prev, funnel2: "" }));
    }
  };

  const resetToggles = () => {
    setIsICCDone(false);
    setIsDisabledCheckState(!isDisabledCheckState);
    setIsAppDone(false);
    setIsAdmissionDone(false);
    setIsEnrDone(false);
    setIsNotInterestedDone(false);
  };

  const resetToggles1 = () => {
    setIsICCDone(false);
    setIsAppDone(false);
    setIsAdmissionDone(false);
    setIsEnrDone(false);
    setIsNotInterestedDone(false);
  };

  const handleStepClick = (s) => {
    resetToggles();
    if (s === "Initial Counselling Completed") {
      setIsICCDone(true);
      handleLeadStatusChange(s);
      setSelectedAction("Connected");
    } else if (s === "Application") {
      setIsAppDone(true);
      handleLeadStatusChange(s);
      setSelectedAction("Connected");
      setIsAppStepSelectedFromProgress(true);
    } else if (s === "Admission") {
      setIsAdmissionDone(true);
      handleLeadStatusChange(s);
      setSelectedAction("Connected");
      setIsAppStepSelectedFromProgress(true);
    } else if (s === "Enrolled") {
      setIsEnrDone(true);
      handleLeadStatusChange(s);
      setSelectedAction("Connected");
    } else {
      handleLeadStatusChange(s);
      setSelectedAction("Connected");
    }
  };

  const needsCourseSelection = () => {
    if (isNotInterestedDone && coursecount <= 1) return false;
    if (isICCDone && coursecount <= 1) return false;

    const f = isEnrDone
      ? "Enrolled"
      : isAdmissionDone
        ? "Admission"
        : isAppDone
          ? "Application"
          : leadStatus.funnel1;

    if (isAppStepSelectedFromProgress || (isAdmissionDone && !existingCourseId))
      return true;

    if (existingCourseId) {
      if (f === "Admission" || f === "Application") return coursecount > 1;
      return false;
    }
    return f === "Application" || f === "Admission";
  };

  const isFormIncomplete = () => {
    if (
      isSubmitting ||
      isUpdatingCreds ||
      !selectedAction ||
      !messageText?.trim()
    )
      return true;

    if (isNotInterestedDone) {
      if (!leadStatus.funnel2) return true;
      return false;
    }

    if (selectedAction === "Not Connected") {
      if (!callbackDate || !callbackTime) return true;
      return false;
    }

    if (selectedAction === "Connected") {
      if (!callbackDate || !callbackTime) return true;
      const f = isEnrDone
        ? "Enrolled"
        : isAdmissionDone
          ? "Admission"
          : isAppDone
            ? "Application"
            : leadStatus.funnel1;
      if (
        f === "Admission" &&
        (isL3 || isSupervisor) &&
        (!feesAmount || Number(feesAmount) <= 0)
      )
        return true;
      if (
        !isTO &&
        needsCourseSelection() &&
        (!selectedUniversity || !course_id)
      )
        return true;

      // Fixed: Call validateCredentialForm without setState
      if (shouldShowCredentialFields() && !validateCredentialForm())
        return true;
      if (isAppDone && !leadStatus.funnel2) return true;

      if (
        isAppDone &&
        leadStatus.funnel2 === "Exam/Interview Scheduled" &&
        !eventDate
      ) {
        return true;
      }
    }
    return false;
  };

  const handleSubmit = async () => {
    if (isFormIncomplete()) return;
    setIsSubmitting(true);
    setCredError("");

    try {
      const f = isNotInterestedDone
        ? "NotInterested"
        : isEnrDone
          ? "Enrolled"
          : isAdmissionDone
            ? "Admission"
            : isAppDone
              ? "Application"
              : isICCDone
                ? "Initial Counselling Completed"
                : leadStatus.funnel1;
      const payload = {
        remark: messageText,
        leadStatus: f,
        leadSubStatus: leadStatus.funnel2,
        callingStatus:
          selectedAction === "Connected" ? "Connected" : "Not Connected",
      };
      if (callbackDate)
        payload.callbackDate = callbackDate.format("YYYY-MM-DD");
      if (callbackTime) payload.callbackTime = callbackTime;

      if (
        isAppDone &&
        leadStatus.funnel2 === "Exam/Interview Scheduled" &&
        eventDate
      ) {
        payload.event_time = eventDate.format("YYYY-MM-DD");
      }

      const cid = course_id || existingCourseId;
      console.log(cid, "cid");
      if (cid) {
        payload.selectedCourse = cid;
        payload.course_status = f;
      }
      if (f === "Admission" && feesAmount && (isL3 || isSupervisor))
        payload.feesAmount = Number(feesAmount);

      if (
        shouldShowCredentialFields() &&
        validateCredentialForm() &&
        !isCredsFound
      ) {
        setIsUpdatingCreds(true);
        setIsCredSubmitting(true);
        try {
          await updateCollegeSentStatusCreds({
            formID,
            couponCode,
            userName,
            password,
            studentId: selectedStudent.student_id,
            courseId: cid,
            collegeName: selectedUniversity,
            counsellorId: agent?.id,
            counsellorName: agent?.name,
          });
        } catch (credError) {
          console.error("Credential update error:", credError);
          // Extract error message from response
          let errorMsg = "Failed to save credentials. Please try again.";

          if (credError?.response?.data?.message) {
            errorMsg = credError.response.data.message;
          } else if (credError?.message) {
            errorMsg = credError.message;
          }

          setCredError(errorMsg);
          message.error(errorMsg);
          setIsUpdatingCreds(false);
          setIsCredSubmitting(false);
          setIsSubmitting(false);
          return;
        }
        setIsCredSubmitting(false);
      }

      const res = await updateStudentStatus(
        selectedStudent.student_id,
        payload,
      );
      if (res.success) {
        const i = leads.findIndex(
          (l) => l.student_id === selectedStudent.student_id,
        );
        if (i !== -1) {
          const nl = [...leads];
          nl[i] = { ...nl[i], ...res.student, student_remarks: res.remark };
          setLeads(nl);
        }
        message.success("Status updated successfully!");
        if (selectedAction === "Connected") setShowCounselingFormPrompt(true);
        else {
          onClose();
          const activeTab = localStorage.getItem("l2_active_tab") || "fresh";
          if (activeTab === "fresh") {
            navigate("/?page=1&limit=10&freshLeads=Fresh&data=l2");
          } else {
            navigate("/?page=1&limit=10&callback=combined&data=l2");
          }
        }
      } else {
        message.error(res.message || "Failed to update status");
      }
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.message || "Failed to update status");
    } finally {
      setIsSubmitting(false);
      setIsUpdatingCreds(false);
    }
  };

  // Update error message when username changes
  useEffect(() => {
    const error = checkCredentialValidation();
    setCredError(error);
  }, [userName, selectedUniversity, checkCredentialValidation]);

  return (
    <>
      <Modal
        open={isOpen}
        onCancel={onClose}
        title={
          <div className="flex items-center gap-4 py-3 border-b mb-4">
            <div
              className={`w-1.5 h-8 rounded-full ${selectedAction === "Connected" ? "bg-emerald-500" : "bg-orange-500"}`}
            />
            <span className="text-xl font-extrabold text-slate-800 tracking-tight">
              {modalTitle}
            </span>
          </div>
        }
        footer={
          <div className="flex items-center justify-end p-6 border-t gap-4 bg-slate-50/50 rounded-b-2xl">
            <button
              onClick={handleSubmit}
              disabled={isFormIncomplete()}
              className="px-14 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 text-white font-bold rounded-xl transition-all duration-200 translate-y-0 active:translate-y-0.5"
            >
              {isSubmitting || isCredSubmitting
                ? "Updating..."
                : "Update Status"}
            </button>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        }
        width="80%"
        centered
        maskClosable={false}
        bodyStyle={{ height: "72vh", overflow: "hidden", padding: "0" }}
        className="unified-call-modal"
      >
        <div className="flex h-full bg-white">
          {/* Sidebar Section */}
          <div className="w-1/4 bg-slate-50 border-r border-slate-100 p-7 space-y-6">
            <div className="flex flex-col gap-1 mb-2">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                Core Actions
              </h2>
              <div className="h-0.5 w-8 bg-blue-500 rounded-full" />
            </div>

            <div className="space-y-3.5">
              {[
                {
                  id: "icc",
                  label: "ICC Done",
                  checked: isICCDone,
                  handler: handleICCToggle,
                  color: "blue",
                  hidden:
                    leadStatus.funnel1 !== "Pre Application" ||
                    (!isL2 && !isTO && !isSupervisor),
                },
                {
                  id: "app",
                  label: "App Done",
                  checked: isAppDone,
                  handler: handleAppToggle,
                  color: "indigo",
                  hidden: !(
                    (leadStatus.funnel1 == "Initial Counselling Completed" ||
                      leadStatus.funnel1 == "Pre Application" ||
                      leadStatus.funnel1 == "Fresh") &&
                    (agent.role === "to" || agent.role === "l2" || isSupervisor)
                  ),
                },
                {
                  id: "adm",
                  label: "Admission Done",
                  checked: isAdmissionDone,
                  handler: handleAdmissionToggle,
                  color: "emerald",
                  hidden:
                    (leadStatus.funnel1 !== "Application" && !isSupervisor) ||
                    (!isL3 && !isSupervisor),
                },
                {
                  id: "enr",
                  label: "Enrolled",
                  checked: isEnrDone,
                  handler: handleEnrToggle,
                  color: "violet",
                  hidden:
                    (leadStatus.funnel1 !== "Admission" && !isSupervisor) ||
                    (!isL3 && !isSupervisor),
                },
                {
                  id: "ni",
                  label: "Not Interested",
                  checked: isNotInterestedDone,
                  handler: handleNotInterestedToggle,
                  color: "rose",
                  hidden: false,
                },
              ].map(
                (a) =>
                  !a.hidden && (
                    <button
                      key={a.id}
                      onClick={() =>
                        a.handler({ target: { checked: !a.checked } })
                      }
                      className={`w-full group relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 font-semibold text-left ${a.checked
                        ? `bg-white border-${a.color}-500 text-${a.color}-600  `
                        : "bg-white border-white hover:border-slate-200 text-slate-500 hover:text-slate-600"
                        }`}
                    >
                      <div
                        className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-transform duration-300 ${a.checked ? `bg-${a.color}-500 ` : "border-slate-200 "}`}
                      >
                        {a.checked && (
                          <FiCheckCircle className="text-white w-4 h-4" />
                        )}
                      </div>
                      <span className="flex-1 text-sm">{a.label}</span>
                    </button>
                  ),
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <div className="px-10 py-8 overflow-y-auto flex-1">
              {/* Visual Funnel */}
              <div className="flex mb-10 gap-2 px-1">
                {getAvailableSteps().map((step, i) => {
                  const allSteps = [
                    "Pre Application",
                    "Initial Counselling Completed",
                    "Application",
                    "Admission",
                    "Enrolled",
                  ];
                  const fullIndex = allSteps.indexOf(step.funnel);
                  const currentStatusIndex = allSteps.indexOf(
                    getEffectiveFunnel1(),
                  );
                  const isCompleted = fullIndex < currentStatusIndex;
                  const isCurrent = fullIndex === currentStatusIndex;
                  const isClickable =
                    step.funnel === "Application" &&
                    currentStudentStatus === "Application" &&
                    agent.role !== "l3" &&
                    agent !== "to_l3";

                  return (
                    <div
                      key={step.id}
                      onClick={
                        isClickable
                          ? () => handleStepClick(step.funnel)
                          : undefined
                      }
                      className={`flex-1 h-12 flex items-center justify-center text-[11px] font-black uppercase tracking-wider transition-all duration-500 relative ${isClickable ? "cursor-pointer" : "cursor-default"}
                        ${isCurrent ? "bg-slate-800 text-white translate-y-[-2px]" : isCompleted ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                      style={{
                        clipPath:
                          "polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%, 10% 50%)",
                      }}
                    >
                      {step.label}
                    </div>
                  );
                })}
              </div>

              {/* Form Content */}
              <div className="max-w-4xl mx-auto space-y-5 pb-12 px-2">
                {needsCourseSelection() && (
                  <div className="p-7 bg-blue-50/40 rounded-3xl border border-blue-100/50 grid grid-cols-2 gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] scale-[4]">
                      <FiPaperclip className="w-12 h-12" />
                    </div>
                    <div>
                      <Label required={!isTO}>Target University</Label>
                      <select
                        value={selectedUniversity || ""}
                        onChange={handleUniversityChange}
                        className="w-full p-3.5 bg-white border border-blue-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700"
                      >
                        <option value="">Select University</option>
                        {universities.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label required={!isTO}>Intended Course</Label>
                      <select
                        value={course_id || ""}
                        onChange={handleCourseChange}
                        disabled={!selectedUniversity}
                        className="w-full p-3.5 bg-white border border-blue-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-700 disabled:opacity-50"
                      >
                        <option value="">
                          {selectedUniversity
                            ? "Select Course"
                            : "Choose University First"}
                        </option>
                        {courses
                          .filter(
                            (c) => c.university_name === selectedUniversity,
                          )
                          .map((c) => (
                            <option key={c.course_id} value={c.course_id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}

                {isAppDone && (
                  <div className="p-6 bg-indigo-50/40 rounded-3xl border border-indigo-100/50 space-y-4">
                    <div>
                      <Label required>Application Sub-Status</Label>
                      <select
                        value={leadStatus.funnel2 || ""}
                        onChange={(e) =>
                          setLeadStatus((p) => ({
                            ...p,
                            funnel2: e.target.value,
                          }))
                        }
                        className="w-full p-3.5 bg-white border border-indigo-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold text-slate-700"
                      >
                        <option value="">Select Sub-Status</option>
                        {[
                          "Form Submitted – Portal Pending",
                          "Form Submitted – Completed",
                          "Walkin Completed",
                          "Exam/Interview Scheduled",
                          "Offer Letter/Results Pending",
                          "Offer Letter/Results Released",
                          "Ready For Admission",
                        ].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    {leadStatus.funnel2 === "Exam/Interview Scheduled" && (
                      <div>
                        <Label required>Exam/Interview Date</Label>
                        <input
                          type="date"
                          value={
                            eventDate ? eventDate.format("YYYY-MM-DD") : ""
                          }
                          onChange={(e) =>
                            setEventDate(
                              e.target.value ? dayjs(e.target.value) : null,
                            )
                          }
                          min={dayjs().format("YYYY-MM-DD")}
                          className="w-full p-3.5 bg-white border border-indigo-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold text-slate-700"
                        />
                      </div>
                    )}
                  </div>
                )}

                {isAdmissionDone &&
                  (isL3 || isSupervisor || agent.role == "to_l3") && (
                    <div className="p-7 bg-emerald-50/40 rounded-3xl border border-emerald-100/50 grid grid-cols-2 gap-8">
                      <div>
                        <Label>Fee Category</Label>
                        <select
                          value={leadStatus.funnel2 || ""}
                          onChange={(e) =>
                            setLeadStatus((p) => ({
                              ...p,
                              funnel2: e.target.value,
                            }))
                          }
                          className="w-full p-3.5 bg-white border border-emerald-100 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-slate-700"
                        >
                          <option value="">Select Status</option>
                          {[
                            "Partially Paid",
                            "Semester Paid",
                            "Admission Blocked",
                          ].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label required>Amount Received (INR)</Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-black">
                            ₹
                          </span>
                          <input
                            type="number"
                            value={feesAmount}
                            onChange={(e) => setFeesAmount(e.target.value)}
                            className="w-full p-3.5 pl-10 bg-white border border-emerald-100 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-slate-700"
                            placeholder="0,000"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                {/* Remarks - Unified Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <Label required>Disposition Remarks</Label>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${messageText.length > 0 ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400"}`}
                    >
                      {messageText.length} Characters
                    </span>
                  </div>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={3}
                    placeholder="Enter key discussion points and student requirements here..."
                    className="w-full p-6 bg-slate-50/50 border-2 border-slate-100 rounded-3xl outline-none focus:bg-white focus:border-blue-400 transition-all duration-300 text-slate-700 font-medium placeholder:text-slate-300 "
                  />
                </div>

                {/* Call Outcome Toggles */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                    Call Connection Status
                  </h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setSelectedAction("Connected")}
                      className={`flex-1 group flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 font-bold ${selectedAction === "Connected"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                        }`}
                    >
                      Connected
                    </button>
                    <button
                      onClick={() => setSelectedAction("Not Connected")}
                      className={`flex-1 group flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 font-bold ${selectedAction === "Not Connected"
                        ? "bg-slate-800 border-slate-800 text-white"
                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                        }`}
                    >
                      Not Connected
                    </button>
                  </div>
                </div>

                {/* University Credentials - Restoration */}
                {shouldShowCredentialFields() && !isCredsFound && (
                  <div className="py-2 rounded-3xl space-y-6 border-t border-slate-100">
                    <div className="flex items-center gap-3 text-amber-700 font-black text-[10px] uppercase tracking-widest">
                      <FiZap className="w-4 h-4" />
                      Application Details Required
                    </div>

                    {credError && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                        <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{credError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                      <>
                        <div>
                          <Label>Form ID</Label>
                          <input
                            value={formID}
                            onChange={(e) => setFormID(e.target.value)}
                            placeholder="Enter Form ID (optional)"
                            className="w-full p-3 bg-white border border-black-100 rounded-xl outline-none focus:border-black-400 font-medium"
                          />
                        </div>
                        <div>
                          <Label>Coupon Code</Label>
                          <input
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            placeholder="Enter Coupon Code (optional)"
                            className="w-full p-3 bg-white border border-black-100 rounded-xl outline-none focus:border-black-400 font-medium"
                          />
                        </div>
                      </>

                      <div>
                        <Label>Username / Email</Label>
                        <input
                          value={userName}
                          onChange={(e) => {
                            setUserName(e.target.value);
                          }}
                          placeholder={getUsernamePlaceholder()}
                          className={`w-full p-3 bg-white border rounded-xl outline-none font-medium transition-all ${userName &&
                            !validateUsernameFormat(
                              userName,
                              getCollegeType(selectedUniversity),
                            )
                            ? "border-red-500 bg-red-50 focus:border-red-600"
                            : "border-black-100 focus:border-black-400"
                            }`}
                        />
                      </div>
                      <div>
                        <Label>Password</Label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter Password (optional)"
                          className="w-full p-3 bg-white border border-black-100 rounded-xl outline-none focus:border-black-400 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedAction && (
                  <div className="pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    {isNotInterestedDone ? (
                      <div className="max-w-md">
                        <Label required>Not Interested Primary Reason</Label>
                        <select
                          value={leadStatus.funnel2 || ""}
                          onChange={(e) =>
                            setLeadStatus((p) => ({
                              ...p,
                              funnel2: e.target.value,
                            }))
                          }
                          className="w-full p-3.5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-rose-400 transition-all font-bold text-slate-700"
                        >
                          <option value="">Select Reason</option>
                          {[
                            "Multiple Attempts made",
                            "Invalid number / Wrong Number",
                            "Language Barrier",
                            "Already Enrolled_Partner",
                            "Already Enrolled_NP",
                            "First call Not Interested",
                            "Not Eligible",
                            "Duplicate_Same student exists",
                            "Only_Online course",
                            "Only_Amity Regular course",
                            "Only_LPU/CU Regular course",
                            "Course Not Available",
                            "Reason Not Shared",
                            "Not Enquired",
                            "Next Year",
                            "Budget issue",
                            "Location issue",
                          ].map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <Label required>Next Follow-up Date</Label>
                          <input
                            type="date"
                            value={
                              callbackDate
                                ? callbackDate.format("YYYY-MM-DD")
                                : ""
                            }
                            onChange={(e) =>
                              setCallbackDate(
                                e.target.value ? dayjs(e.target.value) : null,
                              )
                            }
                            min={dayjs().format("YYYY-MM-DD")}
                            className="w-full p-3.5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-400 transition-all font-semibold text-slate-600"
                          />
                        </div>
                        <div>
                          <Label required>Preferred Time Slot</Label>
                          <select
                            value={callbackTime || ""}
                            onChange={(e) => setCallbackTime(e.target.value)}
                            disabled={!callbackDate}
                            className={`w-full p-3.5 bg-white border-2 rounded-2xl outline-none transition-all font-semibold ${!callbackDate
                              ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                              : "border-slate-100 focus:border-blue-400 text-slate-600"
                              }`}
                          >
                            <option value="">
                              {callbackDate
                                ? "Select Time Slot"
                                : "Please select date first"}
                            </option>
                            {callbackDate &&
                              generateTimeSlots().map((s) => (
                                <option key={s.value} value={s.value}>
                                  {s.display}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {showCounselingFormPrompt && (
        <Modal
          open={showCounselingFormPrompt}
          onCancel={() => setIsFormPopupOpen(true)}
          title={
            <span className="font-black text-slate-800">
              Final Verification
            </span>
          }
          centered
          footer={[
            <button
              key="n"
              onClick={() => setIsFormPopupOpen(true)}
              className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl mr-3"
            >
              No, Fill Now
            </button>,
            <button
              key="y"
              onClick={() => {
                onClose();
                const activeTab = localStorage.getItem("l2_active_tab") || "fresh";
                if (activeTab === "fresh") {
                  navigate("/?page=1&limit=10&freshLeads=Fresh&data=l2");
                } else {
                  navigate("/?page=1&limit=10&callback=combined&data=l2");
                }
              }}
              className="px-8 py-2 bg-emerald-600 text-white font-bold rounded-xl"
            >
              Yes, Submitted
            </button>,
          ]}
        >
          <div className="py-6 text-slate-600 font-medium">
            Have you completed and submitted the counseling form for this
            session?
          </div>
        </Modal>
      )}
      {isFormPopupOpen && (
        <StudentFormPopup
          studentId={selectedStudent?.student_id}
          isOpen={isFormPopupOpen}
          onClose={() => {
            setIsFormPopupOpen(false);
            const activeTab = localStorage.getItem("l2_active_tab") || "fresh";
            if (activeTab === "fresh") {
              navigate("/?page=1&limit=10&freshLeads=Fresh&data=l2");
            } else {
              navigate("/?page=1&limit=10&callback=combined&data=l2");
            }
          }}
        />
      )}
    </>
  );
};

export default UnifiedCallModal;
