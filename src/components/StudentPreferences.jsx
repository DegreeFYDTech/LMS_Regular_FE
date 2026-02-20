import React, { useState, useEffect } from "react";
import Select from "react-select";
import {
  BookOpen,
  DollarSign,
  GraduationCap,
  MapPin,
  Save,
  Settings,
  Target,
} from "lucide-react";
import { showToast } from "../utils/toast";
import { updateStudent } from "../network/student";
import statesData from "../data/cityandstatejson.json";
import axios from "axios";
import { BASE_URL } from "../config/api";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
const StudentPreferences = ({ student, setStudent, setActiveTab }) => {
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(false);
  const selectedRole = useSelector((state) => state.auth.role);
  // Process states and cities data
  const processStatesAndCities = () => {
    const states = statesData.map((state) => ({
      value: state.name,
      label: state.name,
    }));

    const cities = statesData.reduce((acc, state) => {
      const stateCities = state.cities.map((city) => ({
        value: city,
        label: city,
      }));
      return [...acc, ...stateCities];
    }, []);

    // Remove duplicates from cities (in case a city appears in multiple states)
    const uniqueCities = cities.filter(
      (city, index, self) =>
        index === self.findIndex((c) => c.value === city.value),
    );

    return { states, cities: uniqueCities };
  };

  const { states: stateOptions, cities: cityOptions } =
    processStatesAndCities();

  const [dropdownData, setDropdownData] = useState({
    streams: [],
    degrees: [],
    specializations: [],
    levels: [],
    cities: [],
    states: [],
    studyModes: [],
  });
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${BASE_URL}/universitycourse/dropdown`,
        );
        const formattedData = {
          streams: response.data.data.streams.map((item) => ({
            value: item,
            label: item,
          })),
          degrees: response.data.data.degrees.map((item) => ({
            value: item,
            label: item,
          })),
          specializations: response.data.data.specializations.map((item) => ({
            value: item,
            label: item,
          })),
          levels: response.data.data.levels.map((item) => ({
            value: item,
            label: item,
          })),
          cities: response.data.data.cities.map((item) => ({
            value: item,
            label: item,
          })),
          states: response.data.data.states.map((item) => ({
            value: item,
            label: item,
          })),
          studyModes: response.data.data.studyModes.map((item) => ({
            value: item,
            label: item,
          })),
        };

        setDropdownData(formattedData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        setLoading(false);
      }
    };

    fetchDropdownData();
  }, []);

  useEffect(() => {
    // Initialize preferences with current student data
    if (student) {
      const formatArrayToOptions = (arr) => {
        if (!arr) return [];
        const formattedArr = Array.isArray(arr) ? arr : [arr];
        return formattedArr.map((item) => ({ value: item, label: item }));
      };

      setPreferences({
        preferredStream: formatArrayToOptions(student.preferred_stream),
        preferredDegree: formatArrayToOptions(student.preferred_degree),
        preferredLevel: formatArrayToOptions(student.preferred_level),
        preferredSpecialization: formatArrayToOptions(
          student.preferred_specialization
            ? student.preferred_specialization
            : [],
        ),
        preferredBudget: student.preferredBudget || "",
        preferredState: formatArrayToOptions(student.preferred_state),
        preferredCity: formatArrayToOptions(student.preferred_city),
        mode: student.mode
          ? { value: student.mode, label: student.mode }
          : null,
      });
    }
  }, [student]);

  const handleMultiSelectChange = (selectedOptions, { name }) => {
    setPreferences((prev) => ({
      ...prev,
      [name]: selectedOptions || [],
    }));
  };

  const handleSingleSelectChange = (selectedOption, { name }) => {
    setPreferences((prev) => ({
      ...prev,
      [name]: selectedOption,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const navigate = useNavigate();
  const handleUpdate = async () => {
    try {
      setLoading(true);

      const getValues = (options) =>
        options?.map((option) => option.value) || [];

      const updatedData = {
        preferredStream: getValues(preferences.preferredStream),
        preferredDegree: getValues(preferences.preferredDegree),
        preferredLevel: getValues(preferences.preferredLevel),
        preferredSpecialization: getValues(preferences.preferredSpecialization),
        preferredBudget: preferences.preferredBudget || 0,
        preferredState: getValues(preferences.preferredState),
        preferredCity: getValues(preferences.preferredCity),
        mode: preferences.mode?.value || "Regular",
      };
      const responseData = await updateStudent(student.student_id, updatedData);
      setStudent(responseData?.student);
      showToast("Profile Updated", "success");
      // setActiveTab('Tab2')
      navigate(`/student/${student.student_id}?tab=Tab2`);
    } catch (error) {
      showToast("Error Updating Profile", "error");
    } finally {
      setLoading(false);
    }
  };

  // Custom styles for react-select
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      borderColor: "#e2e8f0",
      boxShadow: "none",
      "&:hover": {
        borderColor: "#cbd5e0",
      },
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "#edf2f7",
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "#4a5568",
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "#718096",
      "&:hover": {
        backgroundColor: "#e2e8f0",
        color: "#2d3748",
      },
    }),
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full border border-gray-100">
      {/* Header with profile image and name */}
      <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-3">
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black">
                  Student Preferences
                </h2>
                <p className="text-xs font-medium text-blue-500">
                  {student?.mode || "No Mode"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            {/* <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1">
              <p className="text-xs text-blue-100">Mode</p>
              <p className="text-sm font-medium text-white">{student?.mode || "No Mode"}</p>
            </div> */}
            <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 flex items-center gap-3">
              <p className="text-xs text-black">Counsellor :-</p>
              <p className="text-xs font-medium text-blue-500">
                {student?.assigned_counsellor_id
                  ? student.assignedCounsellor?.counsellor_name
                  : " No Counselor Assigned"}
              </p>
            </div>
            {selectedRole == "l3" && (
              <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 flex items-center gap-3">
                <p className="text-xs text-black">Counsellor (L3) :-</p>
                <p className="text-xs font-medium text-blue-500">
                  {student?.assigned_counsellor_l3_id
                    ? student.assignedCounsellorL3?.counsellor_name
                    : "No Counselor Assigned"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stream */}
          <div className="group">
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2 space-x-2">
              <div className="w-6 h-6 bg-purple-50 rounded-md flex items-center justify-center">
                <BookOpen className="text-gray-600 w-4 h-4" />
              </div>
              <span className="text-xs">Stream</span>
            </label>
            <Select
              isMulti
              name="preferredStream"
              value={preferences.preferredStream}
              onChange={handleMultiSelectChange}
              options={dropdownData.streams}
              placeholder="Select streams..."
              styles={selectStyles}
              isClearable={true}
            />
          </div>

          {/* Level */}
          <div className="group">
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2 space-x-2">
              <div className="w-6 h-6 bg-green-50 rounded-md flex items-center justify-center">
                <GraduationCap className="text-gray-600 w-4 h-4" />
              </div>
              <span className="text-xs">Level</span>
            </label>
            <Select
              isMulti
              name="preferredLevel"
              value={preferences.preferredLevel}
              onChange={handleMultiSelectChange}
              options={dropdownData.levels}
              placeholder="Select levels..."
              styles={selectStyles}
              isClearable={true}
            />
          </div>

          {/* Degree */}
          <div className="group">
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2 space-x-2">
              <div className="w-6 h-6 bg-blue-50 rounded-md flex items-center justify-center">
                <GraduationCap className="text-gray-600 w-4 h-4" />
              </div>
              <span className="text-xs">Degree</span>
            </label>
            <Select
              isMulti
              name="preferredDegree"
              value={preferences.preferredDegree}
              onChange={handleMultiSelectChange}
              options={dropdownData.degrees}
              placeholder="Select degrees..."
              styles={selectStyles}
              isClearable={true}
            />
          </div>

          {/* Specialization */}
          <div className="group">
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2 space-x-2">
              <div className="w-6 h-6 bg-indigo-50 rounded-md flex items-center justify-center">
                <Target className="text-gray-600 w-4 h-4" />
              </div>
              <span className="text-xs">Specialization</span>
            </label>
            <Select
              isMulti
              name="preferredSpecialization"
              value={preferences.preferredSpecialization}
              onChange={handleMultiSelectChange}
              options={dropdownData.specializations}
              placeholder="Select specializations..."
              styles={selectStyles}
              isClearable={true}
            />
          </div>

          {/* Study Mode - Single select */}
          <div className="group">
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2 space-x-2">
              <div className="w-6 h-6 bg-orange-50 rounded-md flex items-center justify-center">
                <Settings className="text-gray-600 w-4 h-4" />
              </div>
              <span className="text-xs">Study Mode</span>
            </label>
            <Select
              name="mode"
              value={preferences.mode}
              onChange={handleSingleSelectChange}
              options={dropdownData.studyModes}
              placeholder="Select study mode..."
              styles={selectStyles}
              isClearable={true}
            />
          </div>

          {/* Budget */}
          <div className="group">
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2 space-x-2">
              <div className="w-6 h-6 bg-yellow-50 rounded-md flex items-center justify-center">
                <DollarSign className="text-gray-600 w-4 h-4" />
              </div>
              <span className="text-xs">Preferred Budget</span>
            </label>
            <input
              type="number"
              name="preferredBudget"
              value={preferences.preferredBudget}
              onChange={handleInputChange}
              placeholder="Enter budget..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* State */}
          <div className="group">
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2 space-x-2">
              <div className="w-6 h-6 bg-red-50 rounded-md flex items-center justify-center">
                <MapPin className="text-gray-600 w-4 h-4" />
              </div>
              <span className="text-xs">Preferred State</span>
            </label>
            <Select
              isMulti
              name="preferredState"
              value={preferences.preferredState}
              onChange={handleMultiSelectChange}
              options={dropdownData.states}
              placeholder="Select states..."
              styles={selectStyles}
              isClearable={true}
            />
          </div>

          {/* City */}
          <div className="group">
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2 space-x-2">
              <div className="w-6 h-6 bg-teal-50 rounded-md flex items-center justify-center">
                <MapPin className="text-gray-600 w-4 h-4" />
              </div>
              <span className="text-xs">Preferred City</span>
            </label>
            <Select
              isMulti
              name="preferredCity"
              value={preferences.preferredCity}
              onChange={handleMultiSelectChange}
              options={dropdownData.cities}
              placeholder="Select cities..."
              styles={selectStyles}
              isClearable={true}
            />
          </div>
        </div>

        {/* Save button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500 border text-blue-500  cursor-pointer rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Save className="w-5 h-5" />
            <span className="font-semibold">
              {loading ? "Updating..." : "Update Preferences"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentPreferences;
