import React, { useContext, useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { updateStudentStatus } from '../network/student';
import { fetchShortlistedColleges1 } from '../network/colleges';
import { useSelector } from 'react-redux';
import { LeadsContext } from '../context/LeadsContext';
import StudentFormPopup from '../components/StudentFormPopup';

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
    FiDollarSign // Added for fees icon
} from 'react-icons/fi';
import {
    HiOutlineAcademicCap,
    HiOutlineClipboardList
} from 'react-icons/hi';

const UnifiedCallModal = ({
    isOpen,
    onClose,
    selectedStudent,
    isConnectedCall = true,
    ...props
}) => {
    const { leads, setLeads } = useContext(LeadsContext)
    const [callOutcome, setCallOutcome] = useState('');
    const [disconnectReason, setDisconnectReason] = useState('');
    const [universities, setUniversities] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedUniversity, setSelectedUniversity] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [feesAmount, setFeesAmount] = useState(''); // Added state for fees
    const latestRemark = selectedStudent?.student_remarks?.reduce((latest, remark) => {
        return !latest || remark.remark_id > latest.remark_id ? remark : latest;
    }, null);

    const [leadStatus, setLeadStatus] = useState({
        funnel1: latestRemark?.lead_status || '',
        funnel2: latestRemark?.lead_sub_status || ''
    });

    const [enrollmentDocument, setEnrollmentDocument] = useState(null);
    const [callbackDate, setCallbackDate] = useState('');
    const [callbackTime, setCallbackTime] = useState(selectedStudent?.nextCallTime || '');
    const [messageText, setMessageText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCounselingFormPrompt, setShowCounselingFormPrompt] = useState(false);
    const [isFormPopupOpen, setIsFormPopupOpen] = useState(false);

    const agent = useSelector((state) => state.auth.user);
    const storedRole = localStorage.getItem('role');
    const activeRole = agent?.role || (storedRole !== "Supervisor" ? storedRole : null) || "l2";

    const statusOptions = [
        { type: "header", label: "Pre Form" },
        { type: "option", label: "Shortlisted" },
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

    // Check if selected status is under Admission
    const isAdmissionStatus = () => {
        const admissionStatuses = [
            "Registration done",
            "Semester fee paid",
            "Registration Done",
            "Semester Paid",
            "1st Year Fee Paid",
            "Full Fee Paid"
        ];
        return admissionStatuses.includes(selectedStatus);
    };

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

    const funnelConfig = {
        "Pre Application": [
            "Counselling Yet to be Done",
            "Initial Counseling Completed",
            "Ready to Pay",
        ],
        "Application": [
            "Form Filled_Degreefyd",
            "Form Filled_Partner website",
            "On Hold – Missing Docs",
        ],
        "Admission": ["Registration Done", "Semester Paid", "1st Year Fee Paid", "Full Fee Paid"],
        "NotInterested": [
            "Multiple Attempts made",
            "Invalid number / Wrong Number",
            "Language Barrier",
            "Not Enquired",
            "Already Enrolled_Partner",
            "First call Not Interested",
            "Not Eligible",
            "Dublicate_Same student exists",
            "Only_Regular course",
            "Only_Online course",
            "Course Not Available",
            "Next Year",
            "Budget issue",
            "Already Enrolled_NP",
            "Reason not shared",
            "Location issue",
        ],
        "Enrolled": ["Enrolled"]
    };

    const disconnectReasons = [
        { value: "Ringing no response", icon: FiPhone, color: "orange" },
        { value: "Switched off", icon: FiPhoneOff, color: "red" },
        { value: "Invalid Number", icon: FiAlertTriangle, color: "yellow" },
        { value: "Line Busy", icon: FiPhone, color: "blue" },
        { value: "Not Interested(CB not required)", icon: FiPhoneOff, color: "gray" },
    ];

    const needsCallback = isConnectedCall
        ? leadStatus.funnel1 && !["NotInterested"].includes(leadStatus.funnel1)
        : disconnectReason !== "Not Interested(CB not required)" &&
        leadStatus.funnel1 !== "NotInterested"

    useEffect(() => {
        const fetchColleges = async () => {
            if (activeRole === "l2" || activeRole === "to") return;

            try {
                let response = await fetchShortlistedColleges1(selectedStudent.student_id);
                const data = response.data;

                const uniqueUniversities = [...new Set(data.map(item => item.university_name))];
                const courseList = data.map(item => ({
                    id: item._id,
                    name: item.course_name,
                    specialization: item.specialization,
                    university_name: item.university_name,
                    course_id: item.course_id,
                    course_name: item.course_name
                }));

                setUniversities(uniqueUniversities);
                setCourses(courseList);
            } catch (error) {
            }
        };

        if (selectedStudent?.student_id) {
            fetchColleges();
        }
    }, [selectedStudent?.student_id, isConnectedCall, activeRole]);

    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
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

        return timeSlots.filter(slot => {
            const [slotHour, slotMinute] = slot.value.split(':').map(Number);

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
        return courses.filter(course => course.university_name === selectedUniversity);
    };

    const isFormValid = () => {
        const primaryField = isConnectedCall ? callOutcome : disconnectReason;
        const basicFieldsValid = primaryField &&
            leadStatus.funnel1 &&
            leadStatus.funnel1 !== "Fresh" &&
            leadStatus.funnel2 &&
            leadStatus.funnel2 !== "Untouched Lead" &&
            messageText.trim();

        const callbackFieldsValid = !needsCallback || (callbackDate && callbackTime);

        let courseFieldsValid = true;
        if (isConnectedCall && activeRole !== "l2" && activeRole !== "to") {
            courseFieldsValid = selectedUniversity &&
                selectedCourse &&
                selectedStatus;

            if (leadStatus.funnel1 === "Admission") {
                courseFieldsValid = courseFieldsValid && feesAmount && !isNaN(feesAmount) && Number(feesAmount) > 0;
            }
        }

        return basicFieldsValid && callbackFieldsValid && courseFieldsValid;
    };

    const handleSubmit = async () => {
        if (isSubmitting || !isFormValid()) return;

        if (!selectedStudent?.student_id) {
            alert('Student ID not found');
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

            const payload = {
                leadStatus: leadStatus.funnel1,
                leadSubStatus: leadStatus.funnel2,
                callingStatus: isConnectedCall ? "Connected" : "Not Connected",
                subCallingStatus: isConnectedCall ? callOutcome : disconnectReason,
                remark: messageText,
                ...(needsCallback && callbackDate && { callbackDate }),
                ...(needsCallback && callbackTime && { callbackTime }),
                ...(enrolledDocumentUrl && { enrolledDocumentUrl }),
                ...(leadStatus.funnel1 === "Admission" && feesAmount && { feesAmount: Number(feesAmount) }),
            };

            const result = await updateStudentStatus(selectedStudent.student_id, payload);
            if (result.success || result?.data?.success || result?.status) {
                const index = leads.findIndex(lead => lead.student_id === selectedStudent.student_id);
                const updatedDetails = result.student;

                if (index !== -1) {
                    const newLeads = [...leads];
                    const updatedLead = {
                        ...newLeads[index],
                        ...updatedDetails,
                        student_remarks: result.remark
                    };
                    newLeads.splice(index, 1);
                    newLeads.unshift(updatedLead);
                    setLeads(newLeads);
                }
                if (props.onSuccess) {
                    props.onSuccess(updatedDetails);
                    return; // Prevent default reload logic
                }
                if (isConnectedCall) {
                    console.log("hello")
                    setShowCounselingFormPrompt(true);

                } else {
                    const url = window.location.origin + window.location.pathname;
                    window.history.replaceState({}, document.title, url);
                    window.location.reload();
                }
            }
        } catch (error) {
            alert('Failed to update student status. Please try again.');
            setIsSubmitting(false);
        }
    };

    const getOutcomeColor = (outcome) => {
        switch (outcome) {
            case 'Hot': return 'border-red-500 bg-red-50 text-red-700';
            case 'Warm': return 'border-orange-500 bg-orange-50 text-orange-700';
            case 'Cold': return 'border-blue-500 bg-blue-50 text-blue-700';
            default: return 'border-gray-300 bg-white text-gray-700';
        }
    };

    const getReasonColor = (reason, color) => {
        if (disconnectReason === reason) {
            switch (color) {
                case 'red': return 'border-red-500 bg-red-50 text-red-700';
                case 'orange': return 'border-orange-500 bg-orange-50 text-orange-700';
                case 'yellow': return 'border-yellow-500 bg-yellow-50 text-yellow-700';
                case 'blue': return 'border-blue-500 bg-blue-50 text-blue-700';
                case 'gray': return 'border-gray-500 bg-gray-50 text-gray-700';
                default: return 'border-gray-300 bg-white text-gray-700';
            }
        }
        return 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300';
    };

    const handleUniversityChange = (university) => {
        setSelectedUniversity(university);
        setSelectedCourse(null);
        setSelectedStatus(null);
        setFeesAmount(''); // Reset fees when university changes
    };

    const handleLeadStatusChange = (selectedFunnel1) => {
        setLeadStatus({
            funnel1: selectedFunnel1,
            funnel2: "",
        });
        // Reset fees when lead status changes away from Admission
        if (selectedFunnel1 !== "Admission") {
            setFeesAmount('');
        }
        if (selectedFunnel1 === "NotInterested") {
            setCallbackDate('');
            setCallbackTime('');
        }
    };

    const handleDisconnectReasonChange = (reason) => {
        setDisconnectReason(reason);
        if (reason === "Not Interested(CB not required)") {
            setCallbackDate('');
            setCallbackTime('');
        }
    };

    const handleCounselingFormResponse = (filledForm) => {
        // Use localStorage to persist logs
        localStorage.setItem('lastCounselingResponse', JSON.stringify({
            filledForm,
            timestamp: new Date().toISOString()
        }));

        console.log("harsh - filledForm:", filledForm);
        setShowCounselingFormPrompt(false);

        if (filledForm) {
            console.log('YES clicked - reloading');
            const url = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, url);
            window.location.reload();
        } else {
            console.log('NO clicked - tiger');
            console.log('Setting isFormPopupOpen to true');
            setIsFormPopupOpen(true);

            // Check if state is actually being set
            setTimeout(() => {
                console.log('After timeout - isFormPopupOpen should be true');
            }, 100);
        }
    };

    const handleStudentFormClose = () => {
        setIsFormPopupOpen(false);
        const url = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, url);
        window.location.reload();
    };

    const modalTitle = isConnectedCall ? "Call Connected - Update Status" : "Call Not Connected - Update Status";
    const confirmColor = isConnectedCall ? "green" : "blue";
    const focusRingColor = isConnectedCall ? "focus:ring-green-500 focus:border-green-500" : "focus:ring-blue-500 focus:border-blue-500";

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                onConfirm={handleSubmit}
                title={modalTitle}
                confirmText={isSubmitting ? 'Submitting...' : (isFormValid() ? 'Submit' : 'Fill Required Fields')}
                cancelText="Cancel"
                confirmColor={confirmColor}
                size="5xl"
                confirmDisabled={!isFormValid() || isSubmitting}
            >
                <div className="space-y-4 p-2">
                    <div className="bg-white border-gray-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-4">
                            {isConnectedCall ? (
                                <>
                                    <FiTrendingUp className="w-5 h-5 text-gray-600" />
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        Call Outcome <span className="text-red-500">*</span>
                                    </h3>
                                </>
                            ) : (
                                <>
                                    <FiPhoneOff className="w-5 h-5 text-gray-600" />
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        Disconnect Reason <span className="text-red-500">*</span>
                                    </h3>
                                </>
                            )}
                        </div>

                        {isConnectedCall ? (
                            <div className="grid grid-cols-3 gap-3">
                                {["Hot", "Warm", "Cold"].map((outcome) => (
                                    <label
                                        key={outcome}
                                        className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${callOutcome === outcome
                                            ? getOutcomeColor(outcome) + ' shadow-md transform scale-105'
                                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="callOutcome"
                                            value={outcome}
                                            checked={callOutcome === outcome}
                                            onChange={() => setCallOutcome(outcome)}
                                            className="sr-only"
                                        />
                                        <span className="font-medium text-sm">{outcome}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                {disconnectReasons.map((reason) => {
                                    const IconComponent = reason.icon;
                                    return (
                                        <label
                                            key={reason.value}
                                            className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${disconnectReason === reason.value
                                                ? getReasonColor(reason.value, reason.color) + ' shadow-md transform scale-105'
                                                : getReasonColor(reason.value, reason.color)
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="disconnectReason"
                                                value={reason.value}
                                                checked={disconnectReason === reason.value}
                                                onChange={() => handleDisconnectReasonChange(reason.value)}
                                                className="sr-only"
                                            />
                                            <IconComponent className="w-4 h-4 flex-shrink-0" />
                                            <span className="text-sm font-medium">{reason.value}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <HiOutlineClipboardList className="w-5 h-5 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-800">Lead Status Information</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <FiUser className="w-4 h-4" />
                                    Lead Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className={`w-full border rounded-lg p-3 ${focusRingColor} transition-colors ${!leadStatus.funnel1 || leadStatus.funnel1 === "Fresh" ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    value={leadStatus.funnel1}
                                    onChange={(e) => handleLeadStatusChange(e.target.value)}
                                >
                                    <option value="">Select Lead Status</option>
                                    {Object.keys(funnelConfig).map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <FiCheckCircle className="w-4 h-4" />
                                    Lead Sub Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className={`w-full border rounded-lg p-3 ${focusRingColor} transition-colors disabled:bg-gray-100 ${(!leadStatus.funnel2 || leadStatus.funnel2 === "Untouched Lead") && leadStatus.funnel1 ? 'border-red-300' : 'border-gray-300'
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
                                        funnelConfig[leadStatus.funnel1]?.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
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
                                        className={`w-full p-3 border rounded-lg pr-12 ${focusRingColor} transition-colors ${!feesAmount || isNaN(feesAmount) || Number(feesAmount) <= 0 ? 'border-red-300' : 'border-gray-300'
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
                                    Upload Enrollment Document <span className="text-red-500">*</span>
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

                    {(activeRole == "l3" || activeRole == 'Supervisor') && (
                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <HiOutlineAcademicCap className="w-5 h-5 text-gray-600" />
                                <h3 className="text-lg font-semibold text-gray-800">Course & College Information</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        Colleges <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className={`w-full p-3 border rounded-lg ${focusRingColor} transition-colors ${!selectedUniversity ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        value={selectedUniversity || ''}
                                        onChange={(e) => handleUniversityChange(e.target.value)}
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
                                        className={`w-full p-3 border rounded-lg ${focusRingColor} transition-colors disabled:bg-gray-100 ${!selectedCourse && selectedUniversity ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        value={selectedCourse || ''}
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                        disabled={!selectedUniversity}
                                    >
                                        <option value="">
                                            {!selectedUniversity ? "First select a college" : "Select a course"}
                                        </option>
                                        {getFilteredCourses().map((course) => (
                                            <option key={course.id} value={course.course_id}>
                                                {course.name} - {course.specialization}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <FiAlertCircle className="w-4 h-4" />
                                        College Course Status <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={selectedStatus || ''}
                                        onChange={(e) => {
                                            setSelectedStatus(e.target.value);
                                        }}
                                        className={`w-full border rounded-lg py-3 px-3 text-gray-700 ${focusRingColor} transition-colors ${!selectedStatus ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Select Status</option>
                                        {statusOptions.map((option, index) =>
                                            option.type === "header" ? (
                                                <optgroup
                                                    key={index}
                                                    label={option.label}
                                                    style={{
                                                        backgroundColor: "#FEF3C7",
                                                        color: "#9A3412",
                                                        fontWeight: "bold",
                                                    }}
                                                ></optgroup>
                                            ) : (
                                                <option key={index} value={option.label}>
                                                    {option.label}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            </div>


                        </div>
                    )}

                    {needsCallback && (
                        <div className="border border-gray-200 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <FiCalendar className="w-5 h-5 text-black" />
                                <h3 className="text-lg font-semibold text-black">Schedule Callback</h3>
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
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${needsCallback && !callbackDate ? 'border-red-300' : 'border-gray-300'
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
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed bg-white shadow-sm ${needsCallback && !callbackTime && callbackDate ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        disabled={!callbackDate || isSubmitting}
                                    >
                                        <option value="">
                                            {!callbackDate ? "First select a date" : "Select time slot"}
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
                                Call Summary & Remarks <span className="text-red-500">*</span>
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
                            className={`w-full border rounded-lg p-4 min-h-32 ${focusRingColor} transition-colors resize-vertical ${!messageText.trim() ? 'border-red-300' : 'border-gray-300'
                                }`}
                            maxLength={50000}
                        />
                        <div className="text-xs text-gray-500 mt-2">
                            {messageText.length}/50000 characters
                        </div>
                    </div>
                </div>
            </Modal>
            {console.log(showCounselingFormPrompt)}
            {showCounselingFormPrompt && (
                <Modal
                    isOpen={showCounselingFormPrompt}
                    onClose={() => {
                        console.log("Modal onClose called");
                        setShowCounselingFormPrompt(false);
                        setIsFormPopupOpen(true)
                        // Don't reload here - let the button handlers decide
                    }}
                    title="Counseling Form"
                    confirmText="Yes, I filled it"
                    cancelText="No, fill now"
                    onConfirm={() => {
                        console.log("Yes button clicked");
                        handleCounselingFormResponse(true);
                    }}
                    onCancel={() => {
                        console.log("No button clicked");
                        handleCounselingFormResponse(false);
                    }}
                    confirmColor="green"
                    size="md"
                >
                    <div className="p-6 text-center">
                        {console.log(showCounselingFormPrompt)
                        }                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <FiCheckCircleIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Did you submit the counseling form?
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Please confirm if you have completed and submitted the counseling form for this student.
                        </p>
                    </div>
                </Modal>
            )}
            {console.log(isFormPopupOpen)}
            {isFormPopupOpen && (
                <StudentFormPopup
                    studentId={selectedStudent?.student_id}
                    isOpen={isFormPopupOpen}
                    onClose={handleStudentFormClose}
                    onSubmit={async (data) => {
                    }}
                />
            )}
        </>
    );
};

export default UnifiedCallModal;