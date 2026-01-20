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

  const StatusBadge = ({ status }) => {
    const getStatusStyle = (status) => {
      const styles = {
        Pending: "bg-amber-100 text-amber-800",
        Approved: "bg-emerald-100 text-emerald-800",
        Rejected: "bg-red-100 text-red-800",
        "Under Review": "bg-blue-100 text-blue-800",
        "Failed due to Technical Issues": "bg-amber-100 text-amber-800",
        Proceed: "bg-emerald-100 text-emerald-800",
        "Do not Proceed": "bg-red-100 text-red-800",
        "Do Not Proceed": "bg-red-100 text-red-800",
        "Field Missing": "bg-blue-100 text-blue-800",
        "Not Sent": "bg-gray-100 text-gray-800",
      };
      return styles[status] || "bg-gray-100 text-gray-800";
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusStyle(status)}`}
      >
        {status}
      </span>
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

  // Get status for a specific contact and university
  const getContactStatus = (contact, universityName) => {
    if (
      !contact.status_by_university ||
      !contact.status_by_university[universityName]
    ) {
      return null;
    }
    return contact.status_by_university[universityName];
  };

  // Check if PRIMARY contact succeeded for this university
  const hasSuccessfulPrimaryContact = (universityName) => {
    const primaryStatus = primaryStatuses[universityName];
    return primaryStatus?.status === "Proceed";
  };

  // Check if ANY secondary contact succeeded for this university
  const hasSuccessfulSecondaryContact = (universityName) => {
    const sentContacts = getSentToUniversity(universityName);
    return sentContacts.some((contact) => {
      const status = getContactStatus(contact, universityName);
      return status?.last_status === "Proceed";
    });
  };

  // Determine university status based on API responses
  const getUniversityStatus = (university) => {
    const universityApiStatus = getData(university.courses);
    const hasPrimarySuccess = hasSuccessfulPrimaryContact(
      university.universityName,
    );
    const hasSecondarySuccess = hasSuccessfulSecondaryContact(
      university.universityName,
    );

    if (universityApiStatus === "Proceed") {
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
      status: universityApiStatus,
      type: "other",
      label: universityApiStatus,
    };
  };

  // Check if primary contact failed and needs secondary
  const needsSecondaryContacts = (university) => {
    const universityStatus = getData(university.courses);
    return [
      "Do Not Proceed",
      "Failed due to Technical Issues",
      "Field Missing",
    ].includes(universityStatus);
  };

  // Check if we should show secondary section
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
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
                {statusDisplay.status === "" &&
                !university.universityName.includes("Amity University") ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendRequest(e, university.courses[0]?.university_name);
                    }}
                    disabled={
                      sendingToCollege[university.courses[0]?.universityName]
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sendingToCollege[university.courses[0]?.universityName] ? (
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
                ) : (
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={statusDisplay.label} />
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
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedUniversities[university.universityName] ? "rotate-180" : ""}`}
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
                          <tr key={college._id} className="hover:bg-gray-50">
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
                              <StatusBadge
                                status={college.latest_course_status}
                              />
                              {college.college_api_sent_status &&
                                college.college_api_sent_status !==
                                  "Proceed" && (
                                  <div className="text-xs text-amber-600 mt-2">
                                    API: {college.college_api_sent_status}
                                  </div>
                                )}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => onOpenStatusModal(college)}
                                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg"
                              >
                                Update Status
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
  );
};

export default CollegesTable;

// Helper function to determine university status based on courses
function getData(courses) {
  if (!Array.isArray(courses) || courses.length === 0) return "";

  const hasProceed = courses.some(
    (val) => val.college_api_sent_status === "Proceed",
  );
  const hasDoNotProceed = courses.some(
    (val) =>
      val.college_api_sent_status === "Do not Proceed" ||
      val.college_api_sent_status === "Do Not Proceed",
  );
  const hasFailed = courses.some(
    (val) => val.college_api_sent_status === "Failed due to Technical Issues",
  );
  const hasFieldMissing = courses.some(
    (val) => val.college_api_sent_status === "Field Missing",
  );
  const allNull = courses.every((val) => val.college_api_sent_status == null);

  if (hasProceed) return "Proceed";
  if (hasDoNotProceed) return "Do Not Proceed";
  if (hasFailed) return "Failed due to Technical Issues";
  if (hasFieldMissing) return "Field Missing";
  if (allNull) return "";

  return "Under Review";
}
