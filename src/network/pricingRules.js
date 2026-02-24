import axios from 'axios';
import { BASE_URL } from '../config/api';

const getPricingRules = async (params = {}) => {
    try {
        const response = await axios.get(`${BASE_URL}/pricing-rules`, {
            params,
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const getPricingRuleById = async (id) => {
    try {
        const response = await axios.get(`${BASE_URL}/pricing-rules/${id}`, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const createPricingRule = async (data) => {
    try {
        const response = await axios.post(`${BASE_URL}/pricing-rules`, data, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const updatePricingRule = async (id, data) => {
    try {
        const response = await axios.put(`${BASE_URL}/pricing-rules/${id}`, data, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const deletePricingRule = async (id) => {
    try {
        const response = await axios.delete(`${BASE_URL}/pricing-rules/${id}`, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export { getPricingRules, getPricingRuleById, createPricingRule, updatePricingRule, deletePricingRule };
