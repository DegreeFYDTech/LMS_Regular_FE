import axios from "axios";
import { BASE_URL } from "../config/api";
export const loginCounsellor = async (email, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/counsellor/login`, {
      email,
      password,
    }, { withCredentials: true });
    return response.data;
  } catch (error) {
    // Don't wrap in new Error - throw the original error to preserve structure
    throw error;
  }
};

export const supervisorLogin = async (email, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/supervisor/login`, {
      email,
      password,
    }, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const analyserLogin = async (email, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/analyser/login`, {
      email,
      password,
    }, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logoutCounsellor = async () => {
  try {
    const response = await axios.post(
      `${BASE_URL}/counsellor/logout`,
      {},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logoutSupervisor = async () => {
  try {
    const response = await axios.post(
      `${BASE_URL}/supervisor/logout`,
      {},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logoutAnalyser = async () => {
  try {
    const response = await axios.post(
      `${BASE_URL}/analyser/logout`,
      {},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserDetails = async (role) => {
  try {
    const transformedRole = (role === 'l2' || role === 'l3' || role === 'to'|| role==='to_l3') ? 'counsellor' : role.toLowerCase();
    const response = await axios.get(
      `${BASE_URL}/${transformedRole}/getUserDetails`,
      { withCredentials: true }
    );  

    return response.data;
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw new Error("Session expired or user not found");
  }
};