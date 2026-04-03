import {
  Calendar,
  ChevronDown,
  MapPin,
  BookOpen,
  Send,
  Clock,
  Check,
  Plus,
  Trash2,
  Mail,
  Phone,
  CheckCircle,
  User,
  AlertCircle,
  Info,
} from "lucide-react";
import { useState, useEffect } from "react";
import { BASE_URL } from "../config/api";
import { Button, DatePicker, Form, message, Modal, TimePicker } from "antd";
import dayjs from "dayjs";

// Technical Details Modal Component
const TechnicalDetailsModal = ({ isOpen, onClose, title, details }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-xs overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0  opacity-75" onClick={onClose}></div>
        </div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Technical Details - {title}
                </h3>
                <div className="mt-4">
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    {details ? (
                      <div className="space-y-4">
                        {/* Status Section */}

                        {/* Course Details */}
                        {details.course_name && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                              Course
                            </h4>
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <p className="text-sm font-medium">
                                {details.course_name}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* API Response */}
                        {details.response_from_api && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                              API Response
                            </h4>
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                                {JSON.stringify(
                                  details.response_from_api,
                                  null,
                                  2,
                                )}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Full Payload */}
                        {details.college_api_sent_payload && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                              Full Payload
                            </h4>
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                                {JSON.stringify(
                                  details.college_api_sent_payload,
                                  null,
                                  2,
                                )}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No technical details available
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CollegesTable = ({
  groupedColleges,
  expandedUniversities,
  onToggleUniversity,
  onOpenStatusModal,
  studentData,
  sendingToCollege,
  onSendRequest,
  onSendSecondaryContact,
}) => {
  const [studentSecondaryDetails, setStudentSecondaryDetails] = useState([]);
  const [newSecondaryContacts, setNewSecondaryContacts] = useState([]);
  const [primaryStatuses, setPrimaryStatuses] = useState({});
  const [technicalModal, setTechnicalModal] = useState({
    isOpen: false,
    title: "",
    details: null,
  });

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!studentData?.student_id) return;

      try {
        const response = await fetch(
          `${BASE_URL}/secondaryStudentInfo/${studentData.student_id}`,
        );
        const data = await response.json();

        if (data.data && data.data.student_info) {
          // Set secondary details with status
          setStudentSecondaryDetails(
            data.data.student_info.secondary_details || [],
          );

          // Set primary statuses
          setPrimaryStatuses(data.data.student_info.primary_statuses || {});
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
      }
    };

    fetchStudentData();
  }, [studentData?.student_id]);

  const handleTechnicalClick = (universityName, courses) => {
    // Find the course with technical issues
    const technicalCourse = courses.find(
      (course) =>
        course.college_api_sent_status === "Failed due to Technical Issues",
    );

    if (technicalCourse) {
      setTechnicalModal({
        isOpen: true,
        title: universityName,
        details: {
          status: technicalCourse.college_api_sent_status,
          reason:
            technicalCourse.college_api_sent_payload?.ExceptionMessage ||
            technicalCourse.response_from_api?.message ||
            "No reason provided",
          response_from_api: technicalCourse.response_from_api,
          college_api_sent_payload: technicalCourse.college_api_sent_payload,
          university_api: technicalCourse.university_api,
          course_name: technicalCourse.course_name,
          course_id: technicalCourse.course_id,
        },
      });
    }
  };

  const StatusBadge = ({
    status,
    onClick,
    showReason = false,
    reason = "",
  }) => {
    const getStatusStyle = (status) => {
      const styles = {
        Pending: "bg-amber-100 text-amber-800",
        Approved: "bg-emerald-100 text-emerald-800",
        Rejected: "bg-red-100 text-red-800",
        "Under Review": "bg-blue-100 text-blue-800",
        "Failed due to Technical Issues":
          "bg-amber-100 text-amber-800 cursor-pointer hover:bg-amber-200",
        Proceed: "bg-emerald-100 text-emerald-800",
        "Do not Proceed": "bg-red-100 text-red-800",
        "Do Not Proceed": "bg-red-100 text-red-800",
        "Field Missing": "bg-blue-100 text-blue-800",
        "Not Sent": "bg-gray-100 text-gray-800",
      };
      return styles[status] || "bg-gray-100 text-gray-800";
    };

    return (
      <div className="relative">
        <span
          onClick={onClick}
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusStyle(status)}`}
        >
          {status}
        </span>
        {showReason && reason && (
          <div className="absolute top-full left-0 mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[250px]">
            <p className="text-xs text-gray-600">{reason}</p>
          </div>
        )}
      </div>
    );
  };

  const addNewSecondaryRow = () => {
    setNewSecondaryContacts((prev) => [
      ...prev,
      { email: "", phone: "", sending: false },
    ]);
  };

  const updateNewSecondaryContact = (index, field, value) => {
    setNewSecondaryContacts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeNewSecondaryRow = (index) => {
    setNewSecondaryContacts((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const isValidContact = (contact) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    return (
      emailRegex.test(contact.email) &&
      phoneRegex.test(contact.phone.replace(/\D/g, ""))
    );
  };

  const handleSendSecondaryContact = async (
    universityName,
    email,
    phone,
    index,
    isNew = false,
  ) => {
    if (isNew) {
      const updatedContacts = [...newSecondaryContacts];
      updatedContacts[index] = { ...updatedContacts[index], sending: true };
      setNewSecondaryContacts(updatedContacts);
    }

    try {
      if (isNew) {
        const addResponse = await fetch(
          `${BASE_URL}/secondaryStudentInfo/${studentData.student_id}/secondary-details`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              secondary_details: [
                {
                  email,
                  phone,
                  sent_to_universities: [universityName],
                },
              ],
            }),
          },
        );

        if (!addResponse.ok) {
          throw new Error("Failed to add contact");
        }

        // Refresh student data
        const response = await fetch(
          `${BASE_URL}/secondaryStudentInfo/${studentData.student_id}`,
        );
        const data = await response.json();

        if (data.data && data.data.student_info) {
          setStudentSecondaryDetails(
            data.data.student_info.secondary_details || [],
          );
          setPrimaryStatuses(data.data.student_info.primary_statuses || {});
        }

        removeNewSecondaryRow(index);
      }

      if (onSendSecondaryContact) {
        await onSendSecondaryContact(universityName, email, phone);
      }

      // Refresh data after sending
      setTimeout(() => {
        fetch(`${BASE_URL}/secondaryStudentInfo/${studentData.student_id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.data && data.data.student_info) {
              setStudentSecondaryDetails(
                data.data.student_info.secondary_details || [],
              );
              setPrimaryStatuses(data.data.student_info.primary_statuses || {});
            }
          });
      }, 1000);
    } catch (error) {
      console.error("Error sending secondary contact:", error);
      if (isNew) {
        const updatedContacts = [...newSecondaryContacts];
        updatedContacts[index] = { ...updatedContacts[index], sending: false };
        setNewSecondaryContacts(updatedContacts);
      }
    }
  };

  // Get contacts sent to a specific university
  const getSentToUniversity = (universityName) => {
    return studentSecondaryDetails.filter((contact) =>
      contact.sent_to_universities?.includes(universityName),
    );
  };

  // Get contacts NOT sent to a specific university
  const getAvailableForUniversity = (universityName) => {
    return studentSecondaryDetails.filter(
      (contact) => !contact.sent_to_universities?.includes(universityName),
    );
  };

  const getContactStatus = (contact, universityName) => {
    if (
      !contact.status_by_university ||
      !contact.status_by_university[universityName]
    ) {
      return null;
    }
    return contact.status_by_university[universityName];
  };

  const hasSuccessfulPrimaryContact = (universityName) => {
    const primaryStatus = primaryStatuses[universityName];
    return primaryStatus?.status === "Proceed";
  };

  const hasSuccessfulSecondaryContact = (universityName) => {
    const sentContacts = getSentToUniversity(universityName);
    return sentContacts.some((contact) => {
      const status = getContactStatus(contact, universityName);
      return status?.last_status === "Proceed";
    });
  };

  const getUniversityStatus = (university) => {
    const universityApiStatus = getData(university.courses);
    const hasPrimarySuccess = hasSuccessfulPrimaryContact(
      university.universityName,
    );
    const hasSecondarySuccess = hasSuccessfulSecondaryContact(
      university.universityName,
    );

    if (universityApiStatus.status === "Proceed") {
      if (hasSecondarySuccess) {
        return {
          status: "Proceed",
          type: "secondary",
          label: "Secondary Proceed",
        };
      } else if (hasPrimarySuccess) {
        return { status: "Proceed", type: "primary", label: "Primary Proceed" };
      }
      // If API says Proceed but we don't know which contact, assume primary
      return { status: "Proceed", type: "primary", label: "Primary Proceed" };
    }

    return {
      status: universityApiStatus.status,
      type: "other",
      label: universityApiStatus.status,
      reason: universityApiStatus.reason,
      details: universityApiStatus.details,
    };
  };

  const needsSecondaryContacts = (university) => {
    const universityStatus = getData(university.courses);
    return [
      "Do Not Proceed",
      "Failed due to Technical Issues",
      "Field Missing",
    ].includes(universityStatus.status);
  };

  const shouldShowSecondarySection = (university) => {
    const sentContacts = getSentToUniversity(university.universityName);
    const needsSecondary = needsSecondaryContacts(university);
    const hasSecondarySuccess = hasSuccessfulSecondaryContact(
      university.universityName,
    );
    const hasAnySecondaryContacts = studentSecondaryDetails.length > 0;

    // Show if:
    // 1. University needs secondary contacts (primary failed)
    // 2. OR we have sent secondary contacts to this university
    // 3. OR secondary contact succeeded
    // 4. OR there are any secondary contacts available
    return (
      needsSecondary ||
      sentContacts.length > 0 ||
      hasSecondarySuccess ||
      hasAnySecondaryContacts
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };
  const [isOpenWalkin, setIsOpenWalkin] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  return (
    <>
      <TechnicalDetailsModal
        isOpen={technicalModal.isOpen}
        onClose={() =>
          setTechnicalModal({ isOpen: false, title: "", details: null })
        }
        title={technicalModal.title}
        details={technicalModal.details}
      />
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <span>Mark Walk-in</span>
          </div>
        }
        open={isOpenWalkin}
        onCancel={() => {
          setIsOpenWalkin(false);
          form.resetFields();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsOpenWalkin(false);
              form.resetFields();
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={async () => {
              try {
                const values = await form.validateFields();

                // Combine date and time
                const eventDateTime = dayjs(values.walkinDate)
                  .hour(values.walkinTime.hour())
                  .minute(values.walkinTime.minute())
                  .second(0)
                  .format("YYYY-MM-DD HH:mm:ss");

                setLoading(true);

                // API call
                const response = await fetch(
                  `${BASE_URL}/student/mark-walkin`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                      student_id: studentData?.student_id,
                      course_id: selectedCourse?.course_id,
                      event_time: eventDateTime,
                    }),
                  },
                );

                if (!response.ok) {
                  throw new Error("Failed to mark walkin");
                }

                const data = await response.json();
                message.success("Walk-in marked successfully!");

                // Call callback if provided
                if (onMarkWalkin) {
                  onMarkWalkin(data);
                }

                setIsOpenWalkin(false);
                form.resetFields();
              } catch (error) {
                if (error.errorFields) {
                  // Validation error
                  return;
                }
                message.error(error.message || "Something went wrong");
              } finally {
                setLoading(false);
              }
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            Mark Walk-in
          </Button>,
        ]}
        width={500}
      >
        <div className="py-4">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Course:</span>{" "}
              {selectedCourse?.course_name || "N/A"}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Student ID:</span>{" "}
              {studentData?.student_id || "N/A"}
            </p>
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{
              walkinDate: dayjs(),
              walkinTime: dayjs(),
            }}
          >
            <Form.Item
              label="Walk-in Date"
              name="walkinDate"
              rules={[
                { required: true, message: "Please select walk-in date" },
              ]}
            >
              <DatePicker
                className="w-full"
                format="YYYY-MM-DD"
                placeholder="Select date"
              />
            </Form.Item>

            <Form.Item
              label="Walk-in Time"
              name="walkinTime"
              rules={[
                { required: true, message: "Please select walk-in time" },
              ]}
            >
              <TimePicker
                className="w-full"
                format="HH:mm"
                placeholder="Select time"
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      <div className="space-y-6">
        {Object.values(groupedColleges).map((university) => {
          const statusDisplay = getUniversityStatus(university);
          const shouldShowSecondary = shouldShowSecondarySection(university);
          const sentContacts = getSentToUniversity(university.universityName);
          const availableContacts = getAvailableForUniversity(
            university.universityName,
          );
          const needsSecondary = needsSecondaryContacts(university);
          const hasSecondarySuccess = hasSuccessfulSecondaryContact(
            university.universityName,
          );
          const hasPrimarySuccess = hasSuccessfulPrimaryContact(
            university.universityName,
          );

          return (
            <div
              key={university.universityName}
              className="bg-white rounded-lg border border-gray-200"
            >
              {/* University Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => onToggleUniversity(university.universityName)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {university.universityName}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{university.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {(statusDisplay.status === "" ||
                    (statusDisplay.status === "Failed due to Technical Issues" &&
                      !university.universityName.toLowerCase().includes("chandigarh university")
                    )) &&
                    !university.universityName.includes("Amity University") ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendRequest(
                          e,
                          university.courses[0]?.university_name,
                        );
                      }}
                      disabled={
                        sendingToCollege[university.courses[0]?.universityName]
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {sendingToCollege[
                        university.courses[0]?.universityName
                      ] ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          Send Primary
                        </>
                      )}
                    </button>
                  ) : null}

                  {statusDisplay.status !== "" && (
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge
                        status={statusDisplay.label}
                        onClick={() => {
                          if (
                            statusDisplay.status ===
                            "Failed due to Technical Issues"
                          ) {
                            handleTechnicalClick(
                              university.universityName,
                              university.courses,
                            );
                          }
                        }}
                      />
                      {statusDisplay.reason &&
                        statusDisplay.status !==
                        "Failed due to Technical Issues" && (
                          <div className="text-xs text-red-600 mt-1">
                            {statusDisplay.reason}
                          </div>
                        )}
                      {statusDisplay.type === "secondary" && (
                        <span className="text-xs text-emerald-600 font-medium">
                          Via Secondary Contact
                        </span>
                      )}
                    </div>
                  )}
                  <span className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
                    <BookOpen className="w-3 h-3" />
                    {university.courseCount}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedUniversities[university.universityName]
                      ? "rotate-180"
                      : ""
                      }`}
                  />
                </div>
              </div>

              {/* Expanded Content */}
              {expandedUniversities[university.universityName] && (
                <div className="p-6 pt-0 space-y-6">
                  {/* Secondary Contacts Section */}
                  {shouldShowSecondary && (
                    <div
                      className={`border rounded-lg ${hasSecondarySuccess ? "bg-emerald-50 border-emerald-200" : needsSecondary ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}
                    >
                      <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2">
                          <User
                            className={`w-5 h-5 ${hasSecondarySuccess ? "text-emerald-600" : needsSecondary ? "text-amber-600" : "text-gray-600"}`}
                          />
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {hasSecondarySuccess
                                ? "Secondary Contacts (Successfully Sent)"
                                : needsSecondary
                                  ? "Secondary Contacts (Required)"
                                  : "Secondary Contacts"}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {hasSecondarySuccess
                                ? "Secondary contact was successfully sent and accepted"
                                : needsSecondary
                                  ? "Primary contact failed. Add and send secondary contacts to proceed."
                                  : "Add secondary contacts if needed"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addNewSecondaryRow();
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700"
                        >
                          <Plus className="w-4 h-4" />
                          Add Contact
                        </button>
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Primary Status Info */}
                        {hasPrimarySuccess && !hasSecondarySuccess && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-700">
                              <CheckCircle className="w-4 h-4" />
                              <span className="font-medium">
                                Primary contact succeeded
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              No secondary contacts needed
                            </div>
                          </div>
                        )}

                        {/* Sent Contacts */}
                        {sentContacts.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">
                              Contacts Sent to this University:
                            </h5>
                            <div className="space-y-3">
                              {sentContacts.map((contact, index) => {
                                const contactStatus = getContactStatus(
                                  contact,
                                  university.universityName,
                                );
                                const isSuccessful =
                                  contactStatus?.last_status === "Proceed";

                                return (
                                  <div
                                    key={index}
                                    className={`flex items-center justify-between p-4 rounded-lg ${isSuccessful ? "bg-emerald-100 border border-emerald-200" : "bg-white border border-gray-200"}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`p-2.5 rounded-lg ${isSuccessful ? "bg-emerald-200" : "bg-gray-100"}`}
                                      >
                                        {isSuccessful ? (
                                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                                        ) : (
                                          <User className="w-5 h-5 text-gray-400" />
                                        )}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <div className="font-medium">
                                            {contact.email}
                                          </div>
                                          {contactStatus && (
                                            <StatusBadge
                                              status={contactStatus.last_status}
                                            />
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-gray-600">
                                          <Phone className="w-3 h-3" />
                                          <span>{contact.phone}</span>
                                        </div>
                                        {contactStatus?.response_data
                                          ?.ExceptionMessage && (
                                            <div className="text-xs text-gray-500 mt-2">
                                              {
                                                contactStatus.response_data
                                                  .ExceptionMessage
                                              }
                                            </div>
                                          )}
                                      </div>
                                    </div>
                                    {!isSuccessful && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (onSendSecondaryContact) {
                                            onSendSecondaryContact(
                                              university.universityName,
                                              contact.email,
                                              contact.phone,
                                            );
                                          }
                                        }}
                                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                      >
                                        Resend
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Available Contacts */}
                        {availableContacts.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">
                              Available Contacts (Not sent to this university):
                            </h5>
                            <div className="space-y-3">
                              {availableContacts.map((contact, index) => (
                                <div
                                  key={`available-${index}`}
                                  className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gray-100 rounded-lg">
                                      <User className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                      <div className="font-medium">
                                        {contact.email}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1 text-gray-600">
                                        <Phone className="w-3 h-3" />
                                        <span>{contact.phone}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onSendSecondaryContact) {
                                        onSendSecondaryContact(
                                          university.universityName,
                                          contact.email,
                                          contact.phone,
                                        );
                                      }
                                    }}
                                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                                  >
                                    Send
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* New Contacts Form */}
                        {newSecondaryContacts.length > 0 && (
                          <div className="space-y-3">
                            <h5 className="text-sm font-medium text-gray-700">
                              Add New Contact:
                            </h5>
                            {newSecondaryContacts.map((contact, index) => (
                              <div
                                key={`new-${index}`}
                                className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Email Address
                                    </label>
                                    <div className="relative">
                                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                      <input
                                        type="email"
                                        value={contact.email}
                                        onChange={(e) =>
                                          updateNewSecondaryContact(
                                            index,
                                            "email",
                                            e.target.value,
                                          )
                                        }
                                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg"
                                        placeholder="parent@example.com"
                                        disabled={contact.sending}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Phone Number
                                    </label>
                                    <div className="relative">
                                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                      <input
                                        type="tel"
                                        value={contact.phone}
                                        onChange={(e) =>
                                          updateNewSecondaryContact(
                                            index,
                                            "phone",
                                            e.target.value,
                                          )
                                        }
                                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg"
                                        placeholder="9876543210"
                                        maxLength="10"
                                        disabled={contact.sending}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center mt-4">
                                  <span
                                    className={`text-sm px-3 py-1.5 rounded-lg ${isValidContact(contact) ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                                  >
                                    {contact.sending
                                      ? "Saving..."
                                      : isValidContact(contact)
                                        ? "Ready to save"
                                        : "Enter valid email and phone"}
                                  </span>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isValidContact(contact)) {
                                          handleSendSecondaryContact(
                                            university.universityName,
                                            contact.email,
                                            contact.phone,
                                            index,
                                            true,
                                          );
                                        }
                                      }}
                                      disabled={
                                        !isValidContact(contact) ||
                                        contact.sending
                                      }
                                      className={`px-4 py-2.5 text-sm font-medium rounded-lg ${isValidContact(contact) && !contact.sending ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-500"}`}
                                    >
                                      Save & Send
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeNewSecondaryRow(index);
                                      }}
                                      className="p-2.5 text-gray-400 hover:text-red-600"
                                      title="Remove"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Empty State */}
                        {sentContacts.length === 0 &&
                          availableContacts.length === 0 &&
                          newSecondaryContacts.length === 0 &&
                          studentSecondaryDetails.length === 0 && (
                            <div className="text-center py-8">
                              <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                              <p className="text-gray-600">
                                No secondary contacts added yet
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Add a contact to send to this university
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Courses Table */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h4 className="font-medium text-gray-900">
                        Courses ({university.courseCount})
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr className="border-b border-gray-200">
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                              Course Details
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                              Fees
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                              Duration
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {university.courses.map((college) => (
                            <tr
                              key={college.id || college.course_id}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-6 py-4">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {college.course_name}
                                  </div>
                                  <div className="text-gray-600 text-sm mt-1">
                                    {college.degree_name}
                                  </div>
                                  {college.specialization && (
                                    <div className="mt-2">
                                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                        {college.specialization}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">
                                  {formatCurrency(college.total_fees)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatCurrency(college.semester_fees)}/sem
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span>
                                    {college.duration || "3"}{" "}
                                    {college.duration_type || "Years"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-2">
                                  <StatusBadge
                                    status={college.latest_course_status}
                                    onClick={() => {
                                      if (
                                        college.college_api_sent_status ===
                                        "Failed due to Technical Issues"
                                      ) {
                                        handleTechnicalClick(
                                          university.universityName,
                                          [college],
                                        );
                                      }
                                    }}
                                  />
                                  <div className="text-sm">
                                    <span className="text-gray-600">
                                      Assigned To:{" "}
                                    </span>
                                    <span className="font-medium">
                                      {college.assigned_l3_counsellor?.name ||
                                        "Not Assigned"}
                                    </span>
                                  </div>
                                  {college.college_api_sent_status &&
                                    college.college_api_sent_status !==
                                    "Proceed" && (
                                      <div
                                        className={`text-xs mt-2 flex items-center gap-1 ${college.college_api_sent_status ===
                                          "Failed due to Technical Issues"
                                          ? "text-amber-600 cursor-pointer hover:text-amber-800"
                                          : "text-amber-600"
                                          }`}
                                        onClick={() => {
                                          if (
                                            college.college_api_sent_status ===
                                            "Failed due to Technical Issues"
                                          ) {
                                            handleTechnicalClick(
                                              university.universityName,
                                              [college],
                                            );
                                          }
                                        }}
                                      >
                                        <Info className="w-3 h-3" />
                                        API: {college.college_api_sent_status}
                                      </div>
                                    )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  className="border px-5 py-2 bg-blue-600 text-white rounded-lg"
                                  onClick={() => {
                                    setSelectedCourse(college);
                                    setIsOpenWalkin(true);
                                  }}
                                >
                                  Mark Walk In
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default CollegesTable;

function getData(courses) {
  if (!Array.isArray(courses) || courses.length === 0) return { status: "" };

  const courseWithFailedStatus = courses.find(
    (val) => val.college_api_sent_status === "Failed due to Technical Issues",
  );

  if (courseWithFailedStatus) {
    return {
      status: "Failed due to Technical Issues",
      reason:
        courseWithFailedStatus.college_api_sent_payload?.ExceptionMessage ||
        courseWithFailedStatus.response_from_api?.message ||
        "No reason provided",
      details: courseWithFailedStatus,
    };
  }

  const hasProceed = courses.some(
    (val) => val.college_api_sent_status === "Proceed",
  );
  if (hasProceed) return { status: "Proceed" };

  const hasDoNotProceed = courses.some(
    (val) =>
      val.college_api_sent_status === "Do not Proceed" ||
      val.college_api_sent_status === "Do Not Proceed",
  );
  if (hasDoNotProceed) return { status: "Do Not Proceed" };

  const hasFieldMissing = courses.some(
    (val) => val.college_api_sent_status === "Field Missing",
  );
  if (hasFieldMissing) return { status: "Field Missing" };

  const allNull = courses.every((val) => val.college_api_sent_status == null);
  if (allNull) return { status: "" };

  return { status: "Under Review" };
}
