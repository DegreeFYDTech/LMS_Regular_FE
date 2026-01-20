import axios from "axios";
import { BASE_URL } from "../config/api";

export const getCollegeApiResponseForReport = async (page, pageSize, allParams) => {
  try {
    const response = await axios.get(`${BASE_URL}/collegeapisentStatus/getCollegeApiResponseForReport?page=${page}&limit=${pageSize}${allParams ? '&' + allParams : ''}`, {
      withCredentials: true, 
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching remarks:", error);
    throw error;
  }
}

export const downloadCollegeApiStatus = async (allParams) => {
  console.log(allParams)
  try {
    const response = await axios.get(`${BASE_URL}/collegeapisentStatus/downloadCollegeApiResponseForReport${allParams ? '?' + allParams : ''}`, {
      withCredentials: true,
    });
    return response.data
  } catch (error) {
    return error
  }
}

// In your network file (e.g., network/collegeApiSentStatus.js)
export const getRecordsForAnalysis1 = async (page, limit, queryParams = '') => {
  try {
    const response = await axios.get(
      `${BASE_URL}/studentcoursestatus/getrecords/form-filled?${queryParams}`,
      {
        params: { page, limit },
        withCredentials: true
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// In collegeApiSentStatus.js 
export const getRecordsForAnalysis1Download = async (queryString) => {
  try {
    console.log('Making download request with queryString:', queryString);
    
    const response = await axios.get(
      `${BASE_URL}/studentcoursestatus/getrecords/form-filled/download?${queryString}`,
      {
        params: { page:1, limit:100 },
        withCredentials: true
      }
    );
    
    console.log('Download response received:', {
      status: response.status,
      data: response.data
    });
    
    return response.data; // Return the JSON data, not the full response object
    
  } catch (error) {
    console.error('Download error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

