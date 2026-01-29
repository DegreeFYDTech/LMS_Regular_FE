import axios from 'axios';
import { BASE_URL } from '../config/api';
import { handleError } from '../utils/handleError';

// Fetch all lead assignment rules for L3
export const fetchLeadAssignmentRulesL3 = async () => {
    try {
        const res = await axios.get(
            `${BASE_URL}/leadassignmentl3`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

// Create new lead assignment rule for L3
export const createLeadAssignmentRuleL3 = async (ruleData) => {
    try {
        const res = await axios.post(
            `${BASE_URL}/leadassignmentl3`,
            ruleData,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

// Update lead assignment rule for L3
export const updateLeadAssignmentRuleL3 = async (ruleId, ruleData) => {
    try {
        const res = await axios.put(
            `${BASE_URL}/leadassignmentl3/${ruleId}`,
            ruleData,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

// Delete lead assignment rule for L3
export const deleteLeadAssignmentRuleL3 = async (ruleId) => {
    try {
        const res = await axios.delete(
            `${BASE_URL}/leadassignmentl3/${ruleId}`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

// Toggle lead assignment rule status for L3
export const toggleLeadAssignmentRuleL3 = async (ruleId) => {
    try {
        const res = await axios.patch(
            `${BASE_URL}/leadassignmentl3/${ruleId}/toggle`,
            {},
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

// Fetch L3 agents
export const fetchL3Agents = async () => {
    try {
        const res = await axios.get(
            `${BASE_URL}/counsellor/getAllCounsellors?role=l3`,
            { withCredentials: true }
        );
        return res.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};
