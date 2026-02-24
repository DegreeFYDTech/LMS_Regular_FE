import axios from "axios";
import { BASE_URL } from "../config/api";
import { handleError } from "../utils/handleError";

// Get all counsellors
export const getAllCounsellors = async (role = null) => {
  try {
    const res = await axios.get(`${BASE_URL}/counsellor/getAllCounsellors`, {
      withCredentials: true,
      params: { role },
    });
    return res.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};
// Add these functions to your counsellor.js network file

// Get detailed journey information for students including college and course names
export const getStudentJourneyDetails = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/StudentCourseStatusLogs/student-journey-details`, data);
    return response.data;
  } catch (error) {
    console.error('Error fetching student journey details:', error);
    throw error;
  }
};

// Replace L3 counsellor for a specific journey entry (student + course)
export const replaceL3CounsellorForSpecificJourney = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/StudentCourseStatusLogs/replace-l3-specific-journey`, data);
    return response.data;
  } catch (error) {
    console.error('Error replacing L3 counsellor for specific journey:', error);
    throw error;
  }
};
export const changeSupervisor = async (counsellorId, supervisorId) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/counsellor/change-supervisor`,
      {
        counsellor_id: counsellorId,
        supervisor_id: supervisorId,
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error changing supervisor:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const getAllSupervisors = async () => {
  try {
    const response = await axios.get(
      `${BASE_URL}/counsellor/getAllCounsellors?role=to`,
      {
        withCredentials: true,
      },
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching supervisors:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const deleteCounsellor = async (id) => {
  try {
    const res = await axios.delete(
      `${BASE_URL}/counsellor/deleteCounsellor/${id}`,
      {
        withCredentials: true,
      },
    );
    return res.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

// Update counsellor status
export const updateCounsellorStatus = async (id, status) => {
  try {
    const res = await axios.put(
      `${BASE_URL}/counsellor/updateCounsellorStatus/${id}`,
      { status },
      { withCredentials: true },
    );
    return res.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const makeCounsellorLogout = async (id) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/counsellor/logoutCounsellor/${id}`,
      { withCredentials: true },
    );
    return res.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

// Change password
export const changeCounsellorPassword = async (id, password) => {
  try {
    const res = await axios.put(
      `${BASE_URL}/counsellor/changeCounsellorPassword/${id}`,
      { password },
      { withCredentials: true },
    );
    return res.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

// Update preferred mode
export const updateCounsellorPreferredMode = async (id, preferredMode) => {
  try {
    const res = await axios.put(
      `${BASE_URL}/counsellor/updateCounsellorPreferredMode/${id}`,
      { preferredMode },
      { withCredentials: true },
    );
    return res.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const registerAgent = async (payload) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/counsellor/register`,
      {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        phoneNumber: payload?.phone_number,
        role: payload?.role,
        preferredMode: payload?.preferred_mode || payload?.preferredMode,
        teamOwnerId: payload?.team_owner_id || payload?.teamOwnerId,
      },
      { withCredentials: true },
    );
    return res.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const fetchAllCounsellors = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/counsellor/getAllCounsellors`, {
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const getCounsellorById = async (id) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/counsellor/getcounsellorByID/${id}`,
      { withCredentials: true },
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const assignCounsellorsToStudents = async (assignmentData) => {
  try {
    console.log('API call with data:', assignmentData);
    const response = await axios.put(
      `${BASE_URL}/counsellor/assignCounsellors`,
      assignmentData,
      { withCredentials: true }
    );
    console.log('API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in assignCounsellorsToStudents:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export const getAllCounsellorsonBreak = async (params = {}) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/counsellor/daily-counsellor-break-activities`,
      {
        withCredentials: true,
        params,
      },
    );
    return res.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};

export const getDistinctL3CounsellorsByStudentIds = async (data) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/StudentCourseStatusLogs/distinct-by-students`,
      data,
      { withCredentials: true },
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching distinct L3 counsellors:", error);
    handleError(error);
    throw error;
  }
};

export const replaceL3CounsellorForStudents = async (data) => {
  try {
    const res = await axios.post(
      `${BASE_URL}/StudentCourseStatusLogs/replace`,
      data,
      { withCredentials: true },
    );
    return res.data;
  } catch (error) {
    console.error("Error replacing L3 counsellor:", error);
    handleError(error);
    throw error;
  }
};
