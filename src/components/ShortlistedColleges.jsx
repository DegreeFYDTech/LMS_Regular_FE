import React, { useState, useEffect } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { fetchShortlistedColleges1 } from "../network/colleges";
import { BASE_URL } from "../config/api";
import axios from "axios";
import { getStudentById } from "../network/student";
import { useParams } from "react-router-dom";
import Loader from "../common/Loader";
import { updatetheCourseStatusLog } from "../network/courseStudentStatus";
import StatusUpdateModal from "../components/CourseStatusUpdateModal";
import CollegesTable from "../components/CollegesTable";

const ShortlistedColleges = ({ setActiveTab }) => {
  const { studentId } = useParams();
  const [shortlistedColleges, setShortlistedColleges] = useState([]);
  const [studentData, setStudentData] = useState(null);
  const [studentSecondaryDetails, setStudentSecondaryDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStatus, setActiveStatus] = useState("All");
  const [expandedUniversities, setExpandedUniversities] = useState({});
  const [sendingToCollege, setSendingToCollege] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [examInterviewDate, setExamInterviewDate] = useState(null);
  const [lastAdmissionDate, setLastAdmissionDate] = useState(null);
  const [notes, setNotes] = useState("");
  const [depositAmount, setDepositAmount] = useState(0);
  const [currency, setCurrency] = useState("INR");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedUniversityForSecondary, setSelectedUniversityForSecondary] = useState(null);
  const [secondaryDetails, setSecondaryDetails] = useState([{ email: "", phone: "" }]);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await getStudentById(studentId);
        setStudentData(response);
        await fetchSecondaryDetails();
      } catch (error) {
        console.error("Error fetching student data:", error);
      }
    };
    fetchStudentData();
  }, [studentId]);

  const fetchSecondaryDetails = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/secondaryStudentInfo/${studentId}`, {
        withCredentials: true
      });
      const secondaryDetails = response.data.data?.student_info?.secondary_details || [];
      setStudentSecondaryDetails(secondaryDetails);
    } catch (error) {
      console.error("Error fetching secondary details:", error);
      setStudentSecondaryDetails([]);
    }
  };

  useEffect(() => {
    const loadShortlistedColleges = async () => {
      try {
        setLoading(true);
        const response = await fetchShortlistedColleges1(studentId);

        if (response?.data) {
          setShortlistedColleges(response.data);

          const universities = {};
          response.data.forEach((college) => {
            universities[college.universityName] = true;
          });
          setExpandedUniversities(universities);
        } else {
          setError("Failed to fetch shortlisted colleges");
        }
      } catch (err) {
        console.error("Error fetching shortlisted colleges:", err);
        setError("Error fetching shortlisted colleges");
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      loadShortlistedColleges();
    }
  }, [studentId]);

  const refreshStudentData = async () => {
    try {
      const response = await getStudentById(studentId);
      setStudentData(response);
    } catch (error) {
      console.error('Error refreshing student data:', error);
    }
  };

  const openSecondaryModal = (university) => {
    setSelectedUniversityForSecondary(university);

    if (studentSecondaryDetails.length > 0) {
      setSecondaryDetails([...studentSecondaryDetails]);
    } else {
      setSecondaryDetails([{ email: "", phone: "" }]);
    }

  };

  const closeSecondaryModal = () => {
    setSelectedUniversityForSecondary(null);
    setSecondaryDetails([{ email: "", phone: "" }]);
  };





  const addSecondaryContact = async (email, phone, universityName) => {
    try {
      await axios.post(
        `${BASE_URL}/secondaryStudentInfo/${studentId}/secondary`,
        {
          secondary_details: [{
            email: email.trim(),
            phone: phone.replace(/\D/g, ''),
            added_at: new Date().toISOString(),
            sent_to_universities: [universityName]
          }]
        },
        { withCredentials: true }
      );

      // Refresh secondary details
      await fetchSecondaryDetails();
      return true;
    } catch (error) {
      console.error('Error adding secondary contact:', error);
      return false;
    }
  };

  const sendSecondaryContact = async (universityName, email, phone) => {
    try {
      await axios.post(
        `${BASE_URL}/StudentCourseStatusLogs/sentStatustoCollege`,
        {
          collegeName: universityName,
          studentId: studentId,
          studentEmail: email,
          studentPhone: phone,
          isPrimary: false
        },
        { withCredentials: true }
      );

      alert(`Secondary contact sent to ${universityName} successfully!`);
      return true;
    } catch (error) {
      console.error('Error sending secondary contact:', error);
      alert(`Failed to send contact to ${universityName}`);
      return false;
    }
  };

  const removeSecondaryContact = async (email) => {
    try {
      await axios.delete(`${BASE_URL}/student-info/${studentId}/secondary/${email}`, {
        withCredentials: true
      });

      await fetchSecondaryDetails();
      return true;
    } catch (error) {
      console.error('Error removing secondary contact:', error);
      return false;
    }
  };


  const handleSendReq = async (e, collegeName) => {
  // Prevent if already sending
  if (sendingToCollege[collegeName]) {
    return;
  }
  
  setSendingToCollege(prev => ({ ...prev, [collegeName]: true }));

  try {
    await axios.post(`${BASE_URL}/StudentCourseStatusLogs/sentStatustoCollege`, {
      collegeName,
      studentId: studentId
    }, { withCredentials: true });

    await refreshStudentData();
    setActiveTab("Tab3");
    localStorage.setItem('activeTab', 'Tab3');
    alert("Request sent to college successfully!");
    
    // Keep button disabled for 4 seconds even after success
    // This prevents multiple clicks before page reload
    setTimeout(() => {
      setSendingToCollege(prev => ({ ...prev, [collegeName]: false }));
    }, 4000);
    
    window.location.reload();
  } catch (error) {
    console.error('Error sending request:', error);
    alert('Failed to send request to college. Please try again.');
    setSendingToCollege(prev => ({ ...prev, [collegeName]: false }));
  }
};

  const openStatusModal = (college) => {
    setSelectedCollege(college);
    setSelectedStatus(college.status || college.status_text);
    setExamInterviewDate(
      college.examInterviewDate
        ? new Date(college.examInterviewDate)
        : college.exam_interview_date
          ? new Date(college.exam_interview_date)
          : null
    );
    setLastAdmissionDate(
      college.lastAdmissionDate
        ? new Date(college.lastAdmissionDate)
        : college.last_admission_date
          ? new Date(college.last_admission_date)
          : null
    );
    setNotes(college.statusNotes || college.status_notes || "");
    setDepositAmount(college.depositAmount ?? college.deposit_amount ?? 0);
    setCurrency(college.currency || college.currency_type || "INR");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCollege(null);
    setSelectedStatus("");
    setExamInterviewDate(null);
    setLastAdmissionDate(null);
    setNotes("");
    setDepositAmount(0);
    setCurrency("INR");
  };

  const updateCollegeStatus = async () => {
    if (!selectedCollege) {
      alert("Missing required information");
      return;
    }

    setUpdatingStatus(true);

    try {
      await updatetheCourseStatusLog(
        selectedCollege,
        selectedStatus,
        studentId,
        notes,
        examInterviewDate,
        lastAdmissionDate,
        Number(depositAmount)
      );

      setShortlistedColleges(prev =>
        prev.map(college =>
          college.course_id === selectedCollege.course_id
            ? {
              ...college,
              status: selectedStatus,
              statusNotes: notes,
              examInterviewDate,
              lastAdmissionDate,
              depositAmount: Number(depositAmount),
              currency
            }
            : college
        )
      );

      alert("Status updated successfully!");
      closeModal();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const toggleUniversity = (universityName) => {
    setExpandedUniversities(prev => ({
      ...prev,
      [universityName]: !prev[universityName],
    }));
  };

  const getUniqueStatuses = () => {
    const statuses = shortlistedColleges.map(college => college.status);
    return ["All", ...new Set(statuses)];
  };

  const getFilteredColleges = () => {
    return activeStatus === "All"
      ? shortlistedColleges
      : shortlistedColleges.filter(college => college.status === activeStatus);
  };

  const getGroupedColleges = () => {
    const filteredColleges = getFilteredColleges();
    const grouped = {};
    filteredColleges.forEach((college) => {
      if (!grouped[college.university_name]) {
        grouped[college.university_name] = {
          universityName: college.university_name,
          location: `${college.university_city}, ${college.university_state}`,
          courses: [],
          courseCount: 0,
          college_api_sent_status: college.college_api_sent_status || "",
          api_present: college?.university_api?.id
        };
      }
      grouped[college.university_name].courses.push(college);
      grouped[college.university_name].courseCount += 1;
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-10 mx-auto max-w-2xl">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }
  if (shortlistedColleges.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-100 text-blue-700 px-6 py-10 rounded-lg text-center max-w-3xl mx-auto my-10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto mb-4 text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-xl font-semibold mb-2">No Colleges Shortlisted Yet</h3>
        <p>Start exploring colleges and add them to your shortlist to see them here.</p>
      </div>
    );
  }

  const groupedColleges = getGroupedColleges();

  return (
    <div className="mx-auto px-6">
      <div className=" px-6 py-3">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center">
          <div className=" lg:mb-0 flex gap-5">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Shortlisted Colleges
            </h1>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {shortlistedColleges.length} colleges
              </span>

              {studentSecondaryDetails.length > 0 && (
                <>
                  <span className="text-gray-500">•</span>
                  <span className="text-sm text-green-600 font-medium">
                    {studentSecondaryDetails.length} secondary contacts saved
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {getUniqueStatuses().map((status) => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeStatus === status
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <CollegesTable
        groupedColleges={groupedColleges}
        expandedUniversities={expandedUniversities}
        onToggleUniversity={toggleUniversity}
        onOpenStatusModal={openStatusModal}
        studentData={studentData}
        sendingToCollege={sendingToCollege}
        onSendRequest={handleSendReq}
        studentSecondaryDetails={studentSecondaryDetails}
        onAddSecondaryContact={addSecondaryContact}
        onSendSecondaryContact={sendSecondaryContact}
        onRemoveSecondaryContact={removeSecondaryContact}
        onOpenSecondaryModal={openSecondaryModal} 
      />

      <StatusUpdateModal
        showModal={showModal}
        selectedCollege={selectedCollege}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        examInterviewDate={examInterviewDate}
        setExamInterviewDate={setExamInterviewDate}
        lastAdmissionDate={lastAdmissionDate}
        setLastAdmissionDate={setLastAdmissionDate}
        notes={notes}
        setNotes={setNotes}
        depositAmount={depositAmount}
        setDepositAmount={setDepositAmount}
        currency={currency}
        setCurrency={setCurrency}
        updatingStatus={updatingStatus}
        onUpdateStatus={updateCollegeStatus}
        onClose={closeModal}
        studentData={studentData}
      />

    </div>
  );
};

export default ShortlistedColleges;