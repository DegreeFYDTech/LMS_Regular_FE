import { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../config/api';
import { secureCache } from '../../utils/cache';
import { useSelector } from 'react-redux';
import debounce from 'lodash/debounce';

const stableStringify = (obj) => JSON.stringify(sortObject(obj));

function sortObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sortObject);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((acc, key) => {
      acc[key] = sortObject(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

export const useLeadsData = (selectedAgent = null) => {  // Change parameter name
  const { user } = useSelector((state) => state.auth);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [overallStats, setOverallStats] = useState(null);
  const [leadsPerPage, setLeadsPerPage] = useState(10);

  const abortControllerRef = useRef(null);
  const lastFetchParamsRef = useRef(null);

  const _fetchLeads = useCallback(async (allFilters, page = 1, force = false, customLimit = null) => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const currentLimit = customLimit || leadsPerPage;

      if (customLimit && customLimit !== leadsPerPage) {
        setLeadsPerPage(customLimit);
      }

      const cleanFilters = Object.entries(allFilters).reduce((acc, [key, value]) => {
        if (value && value !== "" && value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            const filteredArray = value.filter(item => item !== "" && item !== null && item !== undefined);
            if (filteredArray.length > 0) {
              acc[key] = filteredArray;
            }
          } else {
            acc[key] = value;
          }
        }
        return acc;
      }, {});

      const params = {
        page,
        limit: currentLimit,
        ...cleanFilters,
      };

      // CRITICAL FIX: Don't auto-override filters from the component
      // The component should control selectedagent and data through filters
      // Only auto-set for L2/L3 viewing their own leads
      if ((user?.role === 'l2' || user?.role === 'l3') && !cleanFilters.selectedagent) {
        // If no selectedagent in filters and user is L2/L3, use their own ID
        params.selectedagent = user?.id;
        params.data = user?.role;
      }
      
      console.log("API Params being sent:", params); // Add this log

      const cacheKey = stableStringify({
        filters: cleanFilters,
        page,
        limit: currentLimit,
        endpoint: '/student',
        role: selectedAgent?.role || user?.role,
        agent: selectedAgent?.counsellor_id || user?.id
      });

      if (!force && cacheKey === lastFetchParamsRef.current) {
        return;
      }

      const cachedData = secureCache.get(cacheKey);
      // if (cachedData) {
      //   setLeads(cachedData.data);
      //   setTotalLeads(cachedData.pagination.totalRecords);
      //   setTotalPages(cachedData.pagination.totalPages);
      //   setOverallStats(cachedData.overallStats);
      //   setLoading(false);
      //   return;
      // }

      lastFetchParamsRef.current = cacheKey;
      abortControllerRef.current = new AbortController();
      setLoading(true);

      const response = await axios.get(`${BASE_URL}/student`, {
        params,
        signal: abortControllerRef.current.signal,
        withCredentials: true,
        paramsSerializer: {
          serialize: (paramsToSerialize) => {
            console.log("Serializing params:", paramsToSerialize); // Log params
            const searchParams = new URLSearchParams();
            Object.entries(paramsToSerialize).forEach(([key, value]) => {
              if (value !== null && value !== undefined) {
                if (Array.isArray(value)) {
                  searchParams.set(key, value.join(','));
                } else {
                  searchParams.set(key, String(value));
                }
              }
            });
            return searchParams.toString();
          }
        }
      });

      if (response.data.success) {
        secureCache.set(cacheKey, response.data);
        setLeads(response.data.data);
        setTotalLeads(response.data.pagination.totalRecords);
        setTotalPages(response.data.pagination.totalPages);
        setOverallStats(response.data.overallStats);
        setLoading(false);
      }
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error("Error fetching leads:", error);
        setLoading(false);
      }
    }

  }, [selectedAgent, leadsPerPage, user]); // Add selectedAgent to dependencies

  const fetchLeads = useRef(debounce(_fetchLeads, 800)).current;

  return {
    leads,
    loading,
    totalLeads,
    totalPages,
    overallStats,
    fetchLeads,
    leadsPerPage,
    setLeadsPerPage
  };
};