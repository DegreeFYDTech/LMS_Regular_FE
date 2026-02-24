import axios from 'axios';
import { BASE_URL } from '../config/api';

const getCoupons = async (params = {}) => {
    try {
        const response = await axios.get(`${BASE_URL}/coupons`, {
            params,
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const getCouponById = async (id) => {
    try {
        const response = await axios.get(`${BASE_URL}/coupons/${id}`, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const createCoupon = async (data) => {
    try {
        const response = await axios.post(`${BASE_URL}/coupons`, data, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const updateCoupon = async (id, data) => {
    try {
        const response = await axios.put(`${BASE_URL}/coupons/${id}`, data, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const deleteCoupon = async (id) => {
    try {
        const response = await axios.delete(`${BASE_URL}/coupons/${id}`, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export { getCoupons, getCouponById, createCoupon, updateCoupon, deleteCoupon };
