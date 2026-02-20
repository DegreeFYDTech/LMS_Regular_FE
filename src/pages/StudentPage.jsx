import React, { useCallback, useRef } from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { showToast } from "../utils/toast";
import { getStudentById, updateStudentWindowOpen } from "../network/student";
import ProfileSidebar from "../components/ProfileSidebar";
import StudentPreferences from "../components/StudentPreferences";
import ActivityRemarkstabs from "../components/ActivityRemarksTabs";
import SuggestedColleges from "../components/SuggestedColleges";
import ShortlistedColleges from "../components/ShortlistedColleges";
import {
  MessageCircle,
  PhoneOff,
  Loader2,
  User,
  FileText,
  Heart,
  Settings,
  BookOpen,
  HeartOff,
  ChevronRight,
  Edit2,
  X,
  Move,
  Minimize2,
  Maximize2,
  Award,
} from "lucide-react";
import UnifiedCallModal from "../components/UnifiedCallModel";
import {
  addStudentToWishList,
  removeStudentToWishList,
  checkWishlistStatusById,
} from "../network/WishList";
import { HiDocumentReport } from "react-icons/hi";
import StudentFormPopup from "../components/StudentFormPopup";
import { useSelector } from "react-redux";
import { WhatsAppOutlined, DollarOutlined } from "@ant-design/icons";
import WatsaapChat from "../components/WatsaapChat";
import PaymentStatus from "../components/PaymentStatus";

const StudentPage = () => {
  const { studentId } = useParams();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [error, setError] = useState(null);
  const [suggestedColleges, setSuggestedColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [collegeError, setCollegeError] = useState(null);

  const userRole = useSelector((state) => state.auth.role);
  const userId = useSelector((state) => state.auth.userId);

  const [isDisconnectPopupOpen, setisDisconnectPopupOpen] = useState(false);
  const [isConnectedPopupOpen, setisConnectedPopupOpen] = useState(false);
  const [formPopupOpen, setisFormPopupOpen] = useState(false);
  const [isFormPreviewOpen, setIsFormPreviewOpen] = useState(true);
  const [openChatModal, setOpenChatModal] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const navigate = useNavigate();

  const updateStudentWindowStatus = async () => {
    console.log(userRole);
    if ((userRole === "l2" || userRole === "l3") && studentId) {
      try {
        await updateStudentWindowOpen(studentId);
        console.log("Student window status updated successfully");
      } catch (error) {
        console.error("Failed to update student window status:", error);
      }
    }
  };

  const getActiveTabFromUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    const tabFromUrl = searchParams.get("tab");
    if (userRole === "Analyser") {
      return "Tab1";
    }
    return tabFromUrl || "Tab1";
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromUrl());

  const tabConfig =
    userRole === "Analyser"
      ? [{ key: "Tab1", label: "Profile", icon: User }]
      : [
          { key: "Tab1", label: "Profile", icon: User },
          { key: "Tab2", label: "Preferences", icon: Settings },
          { key: "Tab3", label: "ShortList", icon: BookOpen },
        ];
  const [isAdmissionDone, setIsAdmissionDone] = useState(false);
  
  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (!studentId) {
        setError("Student ID not provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await getStudentById(studentId);

        const hasAdmissionStatus = response.student_remarks?.some(
          (remark) => remark.lead_status === "Admission",
        );
        console.log("Admission status:", hasAdmissionStatus);
        setIsAdmissionDone(hasAdmissionStatus);

        if (userRole !== "Analyser") {
          const wishListResponse = await checkWishlistStatusById(studentId);
          if (wishListResponse?.isShortList) {
            setIsInWishlist(true);
          } else {
            setIsInWishlist(false);
          }
        }

        if (response) {
          setStudent(response);

          console.log(userRole);
          if (userRole == "l2" || userRole == "l3") {
            await updateStudentWindowStatus();
          }
        } else {
          setError("No student data found");
        }
      } catch (error) {
        console.error("Error fetching student details:", error);
        setError("Failed to fetch student details");
        showToast("Failure", "Student Details Not Fetched");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentDetails();
  }, [studentId, userRole, userId]);

  const handleWishlistToggle = async () => {
    if (userRole === "Analyser") return;

    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await removeStudentToWishList(student.student_id);
        setIsInWishlist(false);
        showToast("Student removed from wishlist", "error");
      } else {
        await addStudentToWishList(student.student_id);
        setIsInWishlist(true);
        showToast("Student added to wishlist", "success");
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      showToast("Error", "Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  useEffect(() => {
    const tabFromUrl = getActiveTabFromUrl();
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [location.search, userRole]);

  const handleTabChange = (tabName) => {
    if (userRole === "Analyser" && tabName !== "Tab1") {
      return;
    }

    setActiveTab(tabName);
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("tab", tabName);
    navigate(`${location.pathname}?${searchParams.toString()}`, {
      replace: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="text-red-600 mb-2">
              <svg
                className="w-8 h-8 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Error Loading Student
            </h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="text-yellow-600 mb-2">
              <svg
                className="w-8 h-8 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8v.01M6 5v.01"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">
              Student Not Found
            </h3>
            <p className="text-yellow-700">
              No student data available for the provided ID.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isAdmissionDone && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative bg-white/90 backdrop-blur-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 text-8xl font-black rotate-[-30deg] opacity-20 select-none">
              ADMISSION
            </div>
          </div>
        </div>
      )}
      
      <div className="mx-auto p-4">
        {isAdmissionDone && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-30 p-2 rounded-full">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold">Admission Confirmed!</span>
                <span className="text-sm ml-2 opacity-90">This student has been admitted</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-semibold">
                ADMITTED
              </span>
            </div>
          </div>
        )}

        {tabConfig.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
            <nav className="flex">
              {tabConfig.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`flex-1 flex items-center justify-center space-x-3 py-5 px-4 font-semibold transition-all duration-200 relative ${
                      isActive
                        ? "text-blue-600 bg-gradient-to-b from-blue-50 to-white"
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-400"}`}
                    />
                    <span>{tab.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        <div className="space-y-6">
          {activeTab === "Tab1" && (
            <div className="space-y-6">
              <div
                className={`grid grid-cols-1 ${userRole !== "Analyser" ? "lg:grid-cols-2" : "lg:grid-cols-1"} gap-6`}
              >
                <ProfileSidebar initialStudent={student} />
                {userRole !== "Analyser" && (
                  <StudentPreferences
                    student={student}
                    setStudent={setStudent}
                    setActiveTab={setActiveTab}
                  />
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <ActivityRemarkstabs
                  studentId={student?.studentId}
                  student={student}
                />
              </div>
            </div>
          )}

          {activeTab === "Tab2" && userRole !== "Analyser" && (
            <div className="bg-white">
              <SuggestedColleges
                studentId={student.student_id}
                student={student}
                colleges={suggestedColleges}
                loading={collegesLoading}
                error={collegeError}
              />
            </div>
          )}

          {activeTab === "Tab3" && userRole !== "Analyser" && (
            <ShortlistedColleges
              studentId={student.student?.id}
              setActiveTab={setActiveTab}
              studentDetails={student}
            />
          )}
        </div>
      </div>

      {!formPopupOpen && isFormPreviewOpen && userRole !== "Analyser" && (
        <StudentFormPreview
          student={student}
          isOpen={isFormPreviewOpen}
          onOpenFullForm={() => setisFormPopupOpen(true)}
          onClose={() => setIsFormPreviewOpen(false)}
        />
      )}

      {userRole !== "Analyser" && (
        <FloatingActionButtons
          student={student}
          isInWishlist={isInWishlist}
          wishlistLoading={wishlistLoading}
          onWishlistToggle={handleWishlistToggle}
          onOpenConnectCall={() => setisConnectedPopupOpen(true)}
          onOpenDisconnectCall={() => setisDisconnectPopupOpen(true)}
          onOpenWhatsAppChat={() => setOpenChatModal(true)}
        />
      )}

      {formPopupOpen && userRole !== "Analyser" && (
        <StudentFormPopup
          studentId={studentId}
          isOpen={formPopupOpen}
          onClose={() => {
            setisFormPopupOpen(false);
            setIsFormPreviewOpen(true);

            const refreshStudentData = async () => {
              try {
                const freshData = await getStudentById(studentId);
                if (freshData) {
                  setStudent(freshData);
                }
              } catch (error) {
                console.error("Error refreshing student data:", error);
              }
            };
            refreshStudentData();
          }}
          onSubmit={async (data) => {
            console.log("Student form data:", data);
            showToast("Success", "Student information updated successfully");
          }}
        />
      )}
      {openChatModal && student && userRole !== "Analyser" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <WatsaapChat
              isOpen={openChatModal}
              onClose={() => setOpenChatModal(false)}
              student={student}
            />
          </div>
        </div>
      )}
      {userRole !== "Analyser" &&
        (isDisconnectPopupOpen || isConnectedPopupOpen) &&
        student && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <UnifiedCallModal
                isOpen={isDisconnectPopupOpen || isConnectedPopupOpen}
                onClose={() => {
                  if (isDisconnectPopupOpen) setisDisconnectPopupOpen(false);
                  if (isConnectedPopupOpen) setisConnectedPopupOpen(false);
                }}
                selectedStudent={student}
                isConnectedCall={isConnectedPopupOpen}
              />
            </div>
          </div>
        )}
    </div>
  );
};

const StudentFormPreview = ({ student, isOpen, onOpenFullForm, onClose }) => {
  const [position, setPosition] = useState({
    x: 20,
    y: window.innerHeight - 10,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zIndex, setZIndex] = useState(100);
  const [isMinimized, setIsMinimized] = useState(false);
  const windowRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPosition({
        x: 20,
        y: window.innerHeight - 120,
      });
    }
  }, [isOpen]);

  const handleMouseDown = (e) => {
    if (e.target.closest(".drag-handle")) {
      e.preventDefault();
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
      setZIndex(101);
    }
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        const maxX = window.innerWidth - 300;
        const maxY = window.innerHeight - 50;

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
    },
    [isDragging, dragOffset],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const bringToFront = () => {
    setZIndex((prev) => prev + 1);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={windowRef}
      className={`fixed ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"} transition-all  duration-300 ease-out shadow-2xl rounded-lg border border-blue-200 bg-white overflow-hidden ${isDragging ? "cursor-grabbing" : ""}`}
      style={{
        left: position.x,
        top: position.y,
        zIndex,
        width: isMinimized ? "200px" : "280px",
        height: isMinimized ? "40px" : "auto",
        transformOrigin: "center center",
      }}
      onMouseDown={bringToFront}
    >
      {isMinimized ? (
        <div
          className="drag-handle flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-move select-none hover:from-blue-600 hover:to-blue-700 transition-colors"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center space-x-2">
            <HiDocumentReport className="w-4 h-4" />
            <span className="text-sm font-medium">Student Form</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 hover:bg-blue-700 rounded transition-colors"
              title="Open"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-red-500 hover:bg-opacity-50 rounded transition-colors"
              title="Close"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className={`drag-handle flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-600 text-white cursor-move select-none ${isDragging ? "cursor-grabbing" : ""}`}
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center space-x-2">
              <Move className="w-3 h-3 opacity-80" />
              <HiDocumentReport className="w-4 h-4" />
              <h3 className="font-semibold text-sm">Student Form</h3>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={onOpenFullForm}
                className="p-1 hover:bg-blue-700 rounded transition-colors"
                title="Minimize"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
              <button
                onClick={onClose}
                className="p-1 hover:bg-red-500 hover:bg-opacity-50 rounded transition-colors"
                title="Close"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3"></div>
              <button
                onClick={onOpenFullForm}
                className="flex items-center space-x-1 bg-blue-600  w-full text-white rounded-4xl justify-center px-4 py-2 text-sm font-medium"
              >
                <span>Open Form</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const FloatingActionButtons = ({
  student,
  isInWishlist,
  wishlistLoading,
  onWishlistToggle,
  onOpenConnectCall,
  onOpenDisconnectCall,
  onOpenWhatsAppChat,
}) => {
  const buttons = [
    {
      id: "connect",
      icon: MessageCircle,
      label: "Connect",
      color: "bg-green-500 hover:bg-green-600",
      action: onOpenConnectCall,
      tooltip: "Start Connected Call",
    },
    {
      id: "disconnect",
      icon: PhoneOff,
      label: "Disconnect",
      color: "bg-red-500 hover:bg-red-600",
      action: onOpenDisconnectCall,
      tooltip: "Start Disconnected Call",
    },
    {
      id: "wishlist",
      icon: isInWishlist ? HeartOff : Heart,
      label: isInWishlist ? "Remove" : "Add",
      color: isInWishlist
        ? "bg-red-500 hover:bg-red-600"
        : "bg-pink-500 hover:bg-pink-600",
      action: onWishlistToggle,
      tooltip: isInWishlist ? "Remove from Wishlist" : "Add to Wishlist",
      loading: wishlistLoading,
    },
    {
      id: "whatsapp",
      icon: WhatsAppOutlined,
      label: "WhatsApp",
      color: "bg-green-500 hover:bg-green-600",
      action: onOpenWhatsAppChat,
      tooltip: "Open WhatsApp Chat",
    },
  ];

  return (
    <div className="fixed right-8 bottom-8 z-50">
      <div className="flex flex-col items-end space-y-3">
        {buttons.map((button) => (
          <div key={button.id} className="flex items-center space-x-2 group">
            <div className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg transform -translate-x-2">
              {button.tooltip}
            </div>
            <button
              onClick={button.action}
              disabled={button.loading}
              className={`${button.color} text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-110 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {button.loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <button.icon className="w-5 h-5" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentPage;