import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  Mail,
  Save,
  MapPin,
  Home,
  Info
} from "lucide-react";
import Select from "react-select";
import { showToast } from "../utils/toast";
import { updateStudent } from "../network/student";
import statesData from '../data/cityandstatejson.json';
import { useSelector } from "react-redux";

const ProfileSidebar = ({ initialStudent }) => {
  const [student, setStudent] = useState(initialStudent);
  const [isEditing, setIsEditing] = useState(true);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [emailRestriction, setEmailRestriction] = useState({ restricted: false, message: '', source: '' });
  const userRole = useSelector((state) => state.auth.role);
  const [copyFeedback, setCopyFeedback] = useState({ show: false, message: '' });

  useEffect(() => {
    const checkEmailRestriction = () => {
      let source = null;
      if (student?.lead_activities?.length > 0) {
        const minActivity = student.lead_activities.reduce((min, curr) => {
          return !min || curr.id < min.id ? curr : min;
        }, null);
        source = minActivity?.source?.trim();
      }

      const oneTimeEditSources = ['IVR', 'WhatsApp', 'IVR ', 'Whatsapp'];
      
      if (oneTimeEditSources.includes(source)) {
        if (student?.is_edited) {
          setEmailRestriction({
            restricted: true,
            message: "Email can only be edited once for IVR/WhatsApp sources",
            source: source
          });
        } else {
          setEmailRestriction({ restricted: false, message: '', source: source });
        }
      } else {
        setEmailRestriction({ 
          restricted: true, 
          message: "Email cannot be edited for this source", 
          source: source || 'Unknown' 
        });
      }
    };

    checkEmailRestriction();
  }, [student]);

  const processStatesAndCities = () => {
    const states = statesData.map(state => ({
      value: state.name,
      label: state.name
    }));

    const cities = statesData.reduce((acc, state) => {
      const stateCities = state.cities.map(city => ({
        value: city,
        label: city
      }));
      return [...acc, ...stateCities];
    }, []);

    const uniqueCities = cities.filter((city, index, self) =>
      index === self.findIndex(c => c.value === city.value)
    );

    return { states, cities: uniqueCities };
  };

  const { states: stateOptions, cities: cityOptions } = processStatesAndCities();

  const showCopyFeedback = (message) => {
    setCopyFeedback({ show: true, message });
    setTimeout(() => {
      setCopyFeedback({ show: false, message: '' });
    }, 2000);
  };

  const handleCopyPrevention = (e, fieldName) => {
    e.preventDefault();
    showCopyFeedback(`${fieldName} copying is not allowed`);
  };

  const openWhatsApp = (phoneNumber, name) => {
    if (!phoneNumber) {
      showCopyFeedback('Phone number not available');
      return;
    }

    const formattedPhone = phoneNumber.replace(/\D/g, '');
    const message = `Hi ${name || 'there'}`;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: student?.student_name || "",
        whatsapp: student?.whatsapp || "",
        parents_number: student?.parents_number || "",
        student_secondary_email: student?.student_secondary_email || "",
        student_current_city: student?.student_current_city ? { value: student.student_current_city, label: student.student_current_city } : null,
        student_current_state: student?.student_current_state ? { value: student.student_current_state, label: student.student_current_state } : null,
        student_email: student?.student_email || "",
      });
    }
  }, [student, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "whatsapp" || name === "parents_number") {
      if (!/^\d{0,10}$/.test(value)) return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (selectedOption, { name }) => {
    setFormData((prev) => ({
      ...prev,
      [name]: selectedOption
    }));
  };

  const handleStudentUpdate = async () => {
    try {
      setLoading(true);

      const hasChanges = 
        formData.name !== student?.student_name ||
        formData.whatsapp !== student?.whatsapp ||
        formData.parents_number !== student?.parents_number ||
        formData.student_secondary_email !== student?.student_secondary_email ||
        formData.student_current_city?.value !== student?.student_current_city ||
        formData.student_current_state?.value !== student?.student_current_state ||
        formData.student_email !== student?.student_email;

      if (!hasChanges) {
        showToast("No changes to update", "info");
        setLoading(false);
        return;
      }

      const payload = {
        name: formData.name,
        whatsapp: formData.whatsapp,
        parents_number: formData.parents_number,
        student_secondary_email: formData.student_secondary_email,
        student_current_city: formData.student_current_city?.value || "",
        student_current_state: formData.student_current_state?.value || "",
        student_email: formData.student_email,
      };

      const response = await updateStudent(initialStudent.student_id, payload);

      if (response?.data?.message?.includes("one-time edit used")) {
        showToast("Email updated successfully (one-time edit used)", "success");
        setStudent(prev => ({
          ...prev,
          ...payload,
          student_current_city: payload.student_current_city,
          student_current_state: payload.student_current_state,
          is_edited: true,
          edited_by: response.data.student?.edited_by
        }));
      } else {
        showToast("Student updated successfully", "success");
        setStudent(prev => ({
          ...prev,
          ...payload,
          student_current_city: payload.student_current_city,
          student_current_state: payload.student_current_state
        }));
      }

    } catch (error) {
      const errorData = error.response?.data || error.data || error;
      
      if (error.response?.status === 409 && errorData?.error === "DUPLICATE_EMAIL") {
        showToast(errorData.message || "This email is already in use by another student", "error");
      } else if (error.response?.status === 403) {
        showToast(errorData?.message || "Email can only be edited once", "error");
        setEmailRestriction({
          restricted: true,
          message: errorData?.message,
          previouslyEditedBy: errorData?.previouslyEditedBy
        });
      } else {
        showToast(errorData?.message || "Error updating student", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
      minHeight: "42px",
      fontSize: "14px",
      borderRadius: "8px",
      backgroundColor: "#ffffff",
      "&:hover": {
        borderColor: "#d1d5db"
      }
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: "14px",
      padding: "10px 12px",
      backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#f3f4f6" : "#ffffff",
      color: state.isSelected ? "#ffffff" : "#374151",
      "&:hover": {
        backgroundColor: state.isSelected ? "#3b82f6" : "#f9fafb"
      }
    }),
    singleValue: (provided) => ({
      ...provided,
      fontSize: "14px",
      color: "#374151"
    }),
    placeholder: (provided) => ({
      ...provided,
      fontSize: "14px",
      color: "#9ca3af"
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "8px",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      border: "1px solid #e5e7eb"
    })
  };

  const WhatsAppSvg = ({ size = 16 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.52 3.48A11.91 11.91 0 0 0 2.05 17.55L1 23l5.6-1.47A11.93 11.93 0 0 0 20.52 3.48ZM12 21.06a9.06 9.06 0 0 1-4.62-1.26l-.33-.2-3.32.87.88-3.24-.22-.33A9.05 9.05 0 1 1 12 21.06Zm5.06-6.8c-.28-.14-1.64-.8-1.9-.9-.25-.1-.44-.14-.62.14-.18.28-.72.9-.88 1.08-.16.18-.32.2-.6.06-.28-.14-1.18-.44-2.24-1.4-.83-.74-1.4-1.66-1.56-1.94-.16-.28-.02-.44.12-.58.12-.12.28-.32.42-.48.14-.16.18-.28.28-.46.1-.18.04-.34-.02-.48-.06-.14-.62-1.5-.86-2.06-.22-.54-.46-.46-.62-.46h-.52c-.18 0-.46.06-.7.34-.24.28-.92.9-.92 2.2s.94 2.56 1.08 2.74c.14.18 1.84 2.8 4.46 3.92.62.26 1.1.42 1.48.54.62.2 1.18.18 1.62.1.5-.08 1.64-.66 1.88-1.3.24-.64.24-1.18.16-1.3-.08-.12-.26-.2-.54-.34Z" />
    </svg>
  );

  return (
    <>
      {copyFeedback.show && (
        <div className="fixed top-20 right-4 z-50 animate-fade-in-down">
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <Info size={18} />
            <span className="font-medium">{copyFeedback.message}</span>
          </div>
        </div>
      )}

     

      <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full border border-gray-100">
        <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-3">
          <div className="flex justify-between items-center">
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-black">
                    {student?.student_name || "No Name"}
                  </h2>
                  <p className="text-blue-500 text-xs font-medium">ID: {student?.student_id}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 flex items-center gap-3">
                <p className="text-xs text-black">Source :-</p>
                <p className="text-xs font-medium text-blue-500">
                  {(() => {
                    if (student?.lead_activities?.length > 0) {
                      const minActivity = student.lead_activities.reduce((min, curr) => {
                        return !min || curr.id < min.id ? curr : min;
                      }, null);
                      return minActivity?.source?.trim() || "No Source";
                    } else {
                      return "No Source";
                    }
                  })()}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 flex items-center gap-3">
                <p className="text-xs text-black">Campaign :-</p>
                <p className="text-xs font-medium text-blue-500">
                  {(() => {
                    if (student?.lead_activities?.length > 0) {
                      const minActivity = student.lead_activities.reduce((min, curr) => {
                        return !min || curr.id < min.id ? curr : min;
                      }, null);
                      return minActivity?.utm_campaign?.trim() || "No UTM";
                    } else {
                      return "No UTM";
                    }
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2 space-x-2">
                <div className="w-6 h-6 bg-blue-50 rounded-md flex items-center justify-center">
                  <User className="text-gray-600 w-4 h-4" />
                </div>
                <span className="text-xs">Student Name</span>
              </label>
              <div className="relative">
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white
                    text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    transition-all duration-200 hover:border-gray-400 text-xs"
                    placeholder="Enter student name"
                  />
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 text-sm">
                    {student?.student_name || "Not Provided"}
                  </div>
                )}
              </div>
            </div>

            <div className="group">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2 space-x-2">
                <div className="w-6 h-6 bg-green-50 rounded-md flex items-center justify-center">
                  <Phone className="text-gray-600 w-4 h-4" />
                </div>
                <span className="text-xs">Phone Number</span>
              </label>
              <div className="relative">
                <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 text-xs">
                  <div className="flex justify-between items-center">
                    <span>{student?.student_phone || "Not Provided"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="group">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2 space-x-2">
                <div className="w-6 h-6 bg-purple-50 rounded-md flex items-center justify-center">
                  <Mail className="text-gray-600 w-4 h-4" />
                </div>
                <span className="text-xs">Email</span>
              </label>
              <div className="relative">
                {isEditing && !emailRestriction.restricted ? (
                  <input
                    type="email"
                    name="student_email"
                    value={formData.student_email || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white
                    text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    transition-all duration-200 hover:border-gray-400 text-xs"
                    placeholder="Enter email"
                  />
                ) : (
                  <div 
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 text-xs cursor-not-allowed"
                    title={emailRestriction.message || "Email cannot be edited"}
                  >
                    {student?.student_email || "Not Provided"}
                    <span className="ml-2 text-gray-400 text-xs">(Locked)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="group">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2 space-x-2">
                <div className="w-6 h-6 bg-orange-50 rounded-md flex items-center justify-center">
                  <MapPin className="text-gray-600 w-4 h-4" />
                </div>
                <span className="text-xs">Current State</span>
              </label>
              <div className="relative">
                {isEditing ? (
                  <Select
                    name="student_current_state"
                    value={formData.student_current_state}
                    onChange={handleSelectChange}
                    options={stateOptions}
                    placeholder="Select current state..."
                    styles={selectStyles}
                    isClearable={true}
                  />
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-50 text-gray-800 text-sm">
                    {student?.student_current_state || "Not Provided"}
                  </div>
                )}
              </div>
            </div>

            <div className="group">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2 space-x-2">
                <div className="w-6 h-6 bg-red-50 rounded-md flex items-center justify-center">
                  <Home className="text-gray-600 w-4 h-4" />
                </div>
                <span className="text-xs">Current City</span>
              </label>
              <div className="relative">
                {isEditing ? (
                  <Select
                    name="student_current_city"
                    value={formData.student_current_city}
                    onChange={handleSelectChange}
                    options={cityOptions}
                    placeholder="Select current city..."
                    styles={selectStyles}
                    isClearable={true}
                  />
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-50 text-gray-800 text-sm">
                    {student?.student_current_city || "Not Provided"}
                  </div>
                )}
              </div>
            </div>

            <div className="group">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2 space-x-2">
                <div className="w-6 h-6 bg-green-50 rounded-md flex items-center justify-center">
                  <Phone className="text-gray-600 w-4 h-4" />
                </div>
                <span className="text-xs">WhatsApp Number</span>
              </label>
              <div className="relative">
                {isEditing ? (
                  <input
                    type="text"
                    name="whatsapp"
                    value={formData.whatsapp || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white
                    text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="Enter WhatsApp number"
                  />
                ) : (
                  <div
                    className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-50 text-gray-800 text-sm cursor-pointer"
                    onClick={() => userRole !== "Analyser" && openWhatsApp(student?.whatsapp, student?.student_name)}
                    onCopy={(e) => handleCopyPrevention(e, 'WhatsApp number')}
                    style={{
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span>{student?.whatsapp || "Not Provided"}</span>
                      {userRole !== "Analyser" && student?.whatsapp && (
                        <button
                          className="text-green-600 hover:text-green-800 ml-2"
                          title="Message on WhatsApp"
                        >
                          <WhatsAppSvg size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="group">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2 space-x-2">
                <div className="w-6 h-6 bg-yellow-50 rounded-md flex items-center justify-center">
                  <Phone className="text-gray-600 w-4 h-4" />
                </div>
                <span className="text-xs">Parent Phone Number</span>
              </label>
              <div className="relative">
                {isEditing ? (
                  <input
                    type="text"
                    name="parents_number"
                    value={formData.parents_number || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white
                    text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="Enter parent phone number"
                  />
                ) : (
                  <div
                    className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-50 text-gray-800 text-sm cursor-pointer"
                    onClick={() => userRole !== "Analyser" && openWhatsApp(student?.parents_number, `${student?.student_name}'s Parent`)}
                    onCopy={(e) => handleCopyPrevention(e, 'Parent phone number')}
                    style={{
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span>{student?.parents_number || "Not Provided"}</span>
                      {userRole !== "Analyser" && student?.parents_number && (
                        <button
                          className="text-green-600 hover:text-green-800 ml-2"
                          title="Message Parent on WhatsApp"
                        >
                          <WhatsAppSvg size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="group">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2 space-x-2">
                <div className="w-6 h-6 bg-indigo-50 rounded-md flex items-center justify-center">
                  <Mail className="text-gray-600 w-4 h-4" />
                </div>
                <span className="text-xs">Secondary Email</span>
              </label>
              <div className="relative">
                {isEditing ? (
                  <input
                    type="email"
                    name="student_secondary_email"
                    value={formData.student_secondary_email || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white
                    text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="Enter secondary email"
                  />
                ) : (
                  <div
                    className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-50 text-gray-800 text-sm"
                    onCopy={(e) => handleCopyPrevention(e, 'Secondary email')}
                    style={{
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  >
                    {student?.student_secondary_email || "Not Provided"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {isEditing && userRole !== "Analyser" && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleStudentUpdate}
                disabled={loading}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500 border text-blue-500 cursor-pointer rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Save className="w-5 h-5" />
                <span className="font-semibold">{loading ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfileSidebar;