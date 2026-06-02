import React, { useState, useEffect } from 'react';
import { BarChart2, Filter, Layout, Columns } from 'lucide-react';
import FilterPanel from '../components/ReportAnalysis/FilterPanel';
import DashboardHeader from '../components/MainReport/DashboardHeader';
import DataTable from '../components/ReportAnalysis/DataTable';
import ErrorDisplay from '../components/ReportAnalysis/ErrorDisplay';
import { downloadAnalysisReport, getAnalysisReport } from '../network/remarks';
import { downloadRemarksReport, getRecordsForAnalysis } from '../network/courseStudentStatus';
import { downloadCollegeCredsForReport, getCollegeCredsForReport } from '../network/credential';
import { getCollegeApiResponseForReport, getRecordsForAnalysis1, getRecordsForAnalysis1Download, downloadCollegeApiStatus } from '../network/collegeApiSentStatus';
import { fetchFilterOptions } from '../network/filterOptions';
import axios from 'axios';
import LeadStatusPivotTable from '../components/ReportAnalysis/LeadStatusPivotTable';
import { BASE_URL } from '../config/api';
import RemarksAnalysisPanel from '../components/ReportAnalysis/RemarksAnalysisPanel';
import { useSelector } from 'react-redux';
import Tracker4 from '../components/ReportAnalysis/Tracker4';

const ReportAnalysis = ({ forcedTab = null, leadSubTabProp = null, setLeadSubTabProp = null }) => {
  const storedRole = useSelector((state) => state.auth.role);
  const [activeTab, setActiveTab] = useState(forcedTab || 'lead');
  const [leadSubTab, setLeadSubTab] = useState(leadSubTabProp || (storedRole === "Analyser" ? 'campaign' : 'api'));

  useEffect(() => {
    if (forcedTab) setActiveTab(forcedTab);
  }, [forcedTab]);

  useEffect(() => {
    if (leadSubTabProp) setLeadSubTab(leadSubTabProp);
  }, [leadSubTabProp]);

  const handleSetLeadSubTab = (val) => {
    setLeadSubTab(val);
    if (setLeadSubTabProp) setLeadSubTabProp(val);
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [connectedCallsData, setConnectedCallsData] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [showDetailedColumns, setShowDetailedColumns] = useState(false);
  const [toDate, setToDate] = useState('');
  const [statsFilter, setStatsFilter] = useState({
    admission: 'default',
    application: 'default',
    lead: 'default'
  });
  const [filters, setFilters] = useState({
    source: [],
    sourceUrl: [],
    utmCampaign: [],
    counsellorId: [],
    counsellorNames: [],
    dateRange: null,
    counsellorStatus: '',
    formType: '',
  });
  const [pivotFilters, setPivotFilters] = useState({
    colleges: [],
    supervisors: [],
    counsellors: [],
    counsellorStatus: []
  });

  const handlePivotFilterChange = (filterType, value) => {
    setPivotFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [admissionData, setAdmissionData] = useState({ stats: [], data: [], totalRecords: 0, totalPages: 0 });
  const [applicationData, setApplicationData] = useState({ stats: [], data: [], totalRecords: 0, totalPages: 0 });
  const [leadData, setLeadData] = useState({ stats: [], data: [], totalRecords: 0, totalPages: 0 });
  const [remarksData, setRemarksData] = useState({ data: [], totalRecords: 0 });
  const [remarksFilters, setRemarksFilters] = useState({
    mode: '',
    role: 'L1',
    source: '',
    campaign: '',
    counsellorName: '',
    counsellors: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOptions, setFilterOptions] = useState({
    source: [],
    sourceUrl: [],
    utmCampaign: [],
    mode: [],
    callingStatus: [],
    leadStatus: [],
    counsellors: [],
  });

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleSort = (fieldKey) => {
    if (sortField === fieldKey) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(fieldKey);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const getDateParams = () => {
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);
    return params.toString();
  };

  const getStatsParams = () => {
    const currentFilter = statsFilter[activeTab];
    const params = new URLSearchParams();
    if (currentFilter === 'roleL2') {
      params.append('roleL2', 'true');
    } else if (currentFilter === 'roleL3') {
      params.append('roleL3', 'true');
    }
    return params.toString();
  };

  const getSortingParams = () => {
    const params = new URLSearchParams();
    if (sortField) {
      params.append('sortBy', sortField);
      params.append('sortOrder', sortOrder);
    }
    return params.toString();
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'admission': return admissionData;
      case 'application': return applicationData;
      case 'lead': return leadData;
      case 'remarks': return remarksData;
      default: return { stats: [], data: [], totalRecords: 0, totalPages: 0 };
    }
  };

  const getChartData = () => {
    const currentData = getCurrentData();

    if (activeTab === 'remarks') {
      const agentData = currentData.data.reduce((acc, item) => {
        const existing = acc.find(a => a.name === item.counsellorName);
        if (existing) {
          existing.value += item.totalRemarks;
        } else {
          acc.push({
            name: item.counsellorName,
            value: item.totalRemarks,
            percentage: ((item.totalRemarks / currentData.data.reduce((sum, d) => sum + d.totalRemarks, 0)) * 100).toFixed(1) + '%'
          });
        }
        return acc;
      }, []);

      const totalValue = agentData.reduce((sum, item) => sum + item.value, 0);
      return agentData.map(item => ({
        ...item,
        percentage: ((item.value / totalValue) * 100).toFixed(1) + '%'
      }));
    }

    if (activeTab === 'lead' && leadSubTab !== 'api') {
      return currentData.stats.map(stat => ({
        name: stat.name,
        value: stat.value,
        percentage: stat.percentage,
        lead_count: stat.lead_count,
        attempted: stat.attempted,
        admission: stat.admission,
        leadToForm: stat.leadToForm,
        formToAdmission: stat.formToAdmission,
        leadToAdmission: stat.leadToAdmission
      }));
    }

    return currentData.stats.map(stat => ({
      name: stat.status || stat.collegeName || stat.counsellor || stat.label,
      value: stat.count,
      percentage: stat.percentage
    }));
  };

  const getStatsFilterOptions = () => {
    const options = {
      admission: [
        { value: 'default', label: 'By Status' },
        { value: 'roleL2', label: 'By L2 Counsellor' },
        { value: 'roleL3', label: 'By L3 Counsellor' }
      ],
      application: [
        { value: 'default', label: 'By College' },
        { value: 'roleL2', label: 'By L2 Counsellor' },
        { value: 'roleL3', label: 'By L3 Counsellor' }
      ],
      lead: [
        { value: 'default', label: 'By API Status' },
        { value: 'roleL2', label: 'By L2 Counsellor' },
        { value: 'roleL3', label: 'By L3 Counsellor' }
      ],
      remarks: [
        { value: 'default', label: 'By API Status' },
        { value: 'roleL2', label: 'By L2 Counsellor' },
        { value: 'roleL3', label: 'By L3 Counsellor' }
      ]
    };
    return options[activeTab] || [];
  };

  const handleStatsFilterChange = (value) => {
    setStatsFilter(prev => ({
      ...prev,
      [activeTab]: value
    }));
  };

  const fetchConnectedCallsData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);

      if (remarksFilters.counsellors && remarksFilters.counsellors.length > 0) {
        params.append('counsellors', remarksFilters.counsellors.join(','));
      }

      const response = await axios.get(
        `${BASE_URL}/remark/connected-calls?${params.toString()}`,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setConnectedCallsData(response.data.data);
      } else {
        setError("Failed to fetch connected calls data");
      }

    } catch (error) {
      setError(
        "Error fetching connected calls data: " +
        (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  function mergeRemarksAndConnected(agentData, connectedCallsData) {
    return agentData.map(agent => {
      const connectedEntry = connectedCallsData.find(cc => cc.counsellorName === agent.name);
      const connected = connectedEntry ? (connectedEntry.totalConnectedCalls || 0) : 0;
      const percentage = agent.value === 0 ? 0 : Math.round((connected / agent.value) * 100);
      return {
        ...agent,
        totalRemarks: agent.value,
        supervisorName: agent.supervisorName,
        connectedRemarks: connected,
        percentage,
      };
    });
  }

  const fetchRemarksData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      if (remarksFilters.mode) params.append('mode', remarksFilters.mode);
      if (remarksFilters.role) params.append('role', remarksFilters.role);
      if (remarksFilters.source) params.append('source', remarksFilters.source);
      if (remarksFilters.campaign) params.append('campaign', remarksFilters.campaign);
      if (remarksFilters.counsellors) params.append('counsellors', remarksFilters.counsellors);
      if (remarksFilters.counsellorName) params.append('counsellorName', remarksFilters.counsellorName);
      if (sortField) {
        params.append('sortBy', sortField);
        params.append('sortOrder', sortOrder);
      }
      const response = await getAnalysisReport(params);
      if (response.success) {
        const flattenedData = response.data.map(agent => ({
          counsellorName: agent.counsellorName,
          supervisorName: agent.supervisorName,
          date: `${fromDate} to ${toDate}`,
          totalRemarks: agent.totalRemarks,
          timeSlots: agent.timeSlots || {}
        }));
        setRemarksData({
          data: flattenedData,
          totalRecords: flattenedData.length
        });
      } else {
        setError('Failed to fetch remarks data');
      }
    } catch (err) {
      setError('Error fetching remarks data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmissionData = async (page = 1) => {
    try {
      setLoading(true);
      const dateParams = getDateParams();
      const statsParams = getStatsParams();
      const sortingParams = getSortingParams();
      const allParams = [dateParams, statsParams, sortingParams].filter(Boolean).join('&');
      const response = await getRecordsForAnalysis(page, pageSize, allParams);
      if (response.success) {
        let processedStats = [];
        if (statsFilter.admission === 'roleL2' && response.counsellorStats?.l2) {
          processedStats = response.counsellorStats.l2.map(stat => ({
            status: stat.counsellor,
            count: stat.count,
            percentage: stat.percentage
          }));
        } else if (statsFilter.admission === 'roleL3' && response.counsellorStats?.l3) {
          processedStats = response.counsellorStats.l3.map(stat => ({
            status: stat.counsellor,
            count: stat.count,
            percentage: stat.percentage
          }));
        } else {
          processedStats = response.stats || [];
        }
        setAdmissionData({
          stats: processedStats,
          data: response.data || [],
          totalRecords: response.totalRecords || 0,
          totalPages: response.totalPages || 0
        });
      } else {
        setError('Failed to fetch admission data');
      }
    } catch (err) {
      setError('Error fetching admission data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationData = async (page = 1) => {
    try {
      setLoading(true);
      const dateParams = getDateParams();
      const statsParams = getStatsParams();
      const sortingParams = getSortingParams();
      const allParams = [dateParams, statsParams, sortingParams].filter(Boolean).join('&');
      const response = await getCollegeCredsForReport(page, pageSize, allParams);
      if (response.success) {
        setApplicationData({
          stats: response.stats || [],
          data: response.data || [],
          totalRecords: response.totalRecords || 0,
          totalPages: response.totalPages || 0
        });
      } else {
        setError('Failed to fetch application data');
      }
    } catch (err) {
      setError('Error fetching application data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadData = async (page = 1, extrafilter = {}) => {
    try {
      function newFilters() {
        const params = {};
        if (filters.source.length > 0) params.source = filters.source;
        if (filters.sourceUrl?.length > 0) params.source_url = filters.sourceUrl.join(",");
        if (filters.utmCampaign.length > 0) params.utm_campaign = filters.utmCampaign;
        if (filters.counsellorId.length > 0) params.counsellor_id = filters.counsellorId;
        if (filters.counsellorStatus) params.counsellor_status = filters.counsellorStatus;
        if (filters.dateRange?.length === 2) {
          params.created_at_start = filters.dateRange[0].format("YYYY-MM-DD");
          params.created_at_end = filters.dateRange[1].format("YYYY-MM-DD");
        }
        if (filters.formType) params.form_type = filters.formType;
        return params;
      }

      const newparams = newFilters();
      setLoading(true);
      const dateParams = getDateParams();
      const statsParams = getStatsParams();
      let apiEndpoint = getCollegeApiResponseForReport;
      let params = [dateParams, statsParams].filter(Boolean).join('&');

      if (leadSubTab !== 'api') {
        apiEndpoint = getRecordsForAnalysis1;
        params = new URLSearchParams({
          type: leadSubTab,
          page,
          limit: pageSize,
          ...(fromDate && { from: fromDate }),
          ...(toDate && { to: toDate }),
          ...(sortField && { sortBy: sortField }),
          ...(sortField && { sortOrder: sortOrder }),
          ...extrafilter,
          ...newparams,
        }).toString();
      } else {
        if (sortField) {
          params += (params ? '&' : '') + `sortBy=${sortField}&sortOrder=${sortOrder}`;
        }
      }

      const response = await apiEndpoint(page, pageSize, params);
      if (response.success) {
        let statsData = [];
        if (leadSubTab !== 'api') {
          statsData = response.data.map(item => ({
            name: item.group_by || 'Overall',
            value: item.formFilled,
            percentage: item.leadToForm ? `${item.leadToForm}%` : '0%',
            lead_count: item.lead_count,
            attempted: item.attempted,
            admission: item.admission,
            leadToForm: item.leadToForm,
            formToAdmission: item.formToAdmission,
            leadToAdmission: item.leadToAdmission
          }));
        } else {
          statsData = response.stats || [];
        }
        setLeadData({
          stats: statsData,
          data: response.data || [],
          totalRecords: response.totalRecords || 0,
          totalPages: response.totalPages || 0
        });
      } else {
        setError('Failed to fetch lead data');
      }
    } catch (err) {
      setError('Error fetching lead data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'lead' && leadSubTab === 'api') {
      fetchPivotData();
    }
  }, [pivotFilters.colleges, pivotFilters.supervisors, pivotFilters.counsellors]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setError(null);
    setShowFilters(false);
    const actions = {
      admission: () => fetchAdmissionData(1),
      application: () => fetchApplicationData(1),
      lead: () => fetchLeadData(1),
      remarks: () => {
        fetchRemarksData();
        fetchConnectedCallsData();
      }
    };
    actions[activeTab]?.();

    if (activeTab === 'lead' && leadSubTab === 'api') {
      fetchPivotData();
    }
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setStatsFilter({
      admission: 'default',
      application: 'default',
      lead: 'default'
    });
    setSortField('');
    setSortOrder('asc');
    setCurrentPage(1);
    setError(null);
    setShowFilters(false);
    setRemarksFilters({
      mode: '',
      role: 'L1',
      source: '',
      campaign: '',
      counsellorName: '',
      counsellors: []
    });
    setPivotData([]);
    setPivotFilters({
      colleges: [],
      supervisors: [],
      counsellors: []
    });

    const actions = {
      admission: () => fetchAdmissionData(1),
      application: () => fetchApplicationData(1),
      lead: () => fetchLeadData(1),
      remarks: () => {
        fetchRemarksData();
        fetchConnectedCallsData();
      }
    };
    actions[activeTab]?.();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const actions = {
      admission: () => fetchAdmissionData(page),
      application: () => fetchApplicationData(page),
      lead: () => fetchLeadData(page)
    };
    actions[activeTab]?.();
  };

  function handleLeadSubfilter(extraQuery) {
    fetchLeadData(1, extraQuery);
  }

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value || '').replace(/"/g, '""')}"`;
      }).join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      let fileName = '';
      let dataToExport = [];

      const dateParams = getDateParams();
      const statsParams = getStatsParams();
      const allParams = [dateParams, statsParams].filter(Boolean).join('&');
      console.log(allParams)
      // Handle API tab export
      if (activeTab === "lead" && leadSubTab === "api") {
        fileName = 'sent-status.csv';
        const response = await downloadCollegeApiStatus(allParams);
        console.log(response)
        // Check if response has data to export
        if (response && response.success && response.data) {
          console.log("res", response.data)
          dataToExport = response.data;
        } else {
          setError('No API status data to export');
          return;
        }
      } else if (activeTab === 'lead') {
        // Handle other lead subtabs
        fileName = 'lead_data.csv';
        const response = await handleLeadDownload(allParams, leadSubTab, showDetailedColumns);

        if (response && response.success && response.data) {
          dataToExport = response.data;
        } else {
          setError('No data to export');
          return;
        }
      } else {
        // Handle other tabs (admission, application, remarks)
        const exports = {
          admission: async () => {
            fileName = 'admission_data.csv';
            const response = await downloadRemarksReport(allParams);
            return response?.data || response;
          },
          application: async () => {
            fileName = 'application_data.csv';
            const response = await downloadCollegeCredsForReport(allParams);
            return response?.data || response;
          },
          remarks: async () => {
            fileName = 'remark_data.csv';
            const response = await downloadAnalysisReport(allParams);
            return response?.data || response;
          }
        };

        const response = await exports[activeTab]?.();
        if (!response) {
          setError('No data to export');
          return;
        }

        if (Array.isArray(response)) {
          dataToExport = response;
        } else if (response.data && Array.isArray(response.data)) {
          dataToExport = response.data;
        } else if (response.success && response.data) {
          dataToExport = response.data;
        }
      }

      // Check if we have data to export
      if (!Array.isArray(dataToExport) || dataToExport.length === 0) {
        setError('No data available to export');
        return;
      }

      // Convert to CSV and download
      const csvContent = convertToCSV(dataToExport);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      setError('Error exporting data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  async function handleLeadDownload(allParams, leadSubTab, showDetailedColumns) {
    const existingParams = allParams ? new URLSearchParams(allParams) : new URLSearchParams();
    existingParams.append("showDetailedColumns", showDetailedColumns)
    existingParams.append('type', leadSubTab);

    if (!existingParams.has('from') && fromDate) {
      existingParams.append('from', fromDate);
    }
    if (!existingParams.has('to') && toDate) {
      existingParams.append('to', toDate);
    }

    if (filters.source.length > 0) {
      existingParams.append('source', filters.source.join(','));
    }

    if (filters.sourceUrl?.length > 0) {
      existingParams.append('source_url', filters.sourceUrl.join(','));
    }

    if (filters.utmCampaign.length > 0) {
      existingParams.append('utm_campaign', filters.utmCampaign.join(','));
    }

    if (filters.counsellorId.length > 0) {
      existingParams.append('counsellor_id', filters.counsellorId.join(','));
    }
    if (filters.counsellorStatus) {
      existingParams.append('counsellor_status', filters.counsellorStatus);
    }
    if (filters.dateRange?.length === 2) {
      existingParams.append('created_at_start', filters.dateRange[0].format("YYYY-MM-DD"));
      existingParams.append('created_at_end', filters.dateRange[1].format("YYYY-MM-DD"));
    }

    const queryString = existingParams.toString();
    return await getRecordsForAnalysis1Download(queryString);
  }

  useEffect(() => {
    if (sortField) {
      const actions = {
        admission: () => fetchAdmissionData(currentPage),
        application: () => fetchApplicationData(currentPage),
        lead: () => fetchLeadData(currentPage),
        remarks: () => {
          fetchRemarksData();
          fetchConnectedCallsData();
        }
      };
      actions[activeTab]?.();
    }
  }, [sortField, sortOrder]);

  const [pivotData, setPivotData] = useState([]);
  const [pivotLoading, setPivotLoading] = useState(false);

  const fetchPivotData = async () => {
    try {
      setPivotLoading(true);

      const params = new URLSearchParams();

      if (filters.dateRange?.[0]) {
        params.append('from', filters.dateRange[0].format("YYYY-MM-DD"));
      } else if (fromDate) {
        params.append('from', fromDate);
      }

      if (filters.dateRange?.[1]) {
        params.append('to', filters.dateRange[1].format("YYYY-MM-DD"));
      } else if (toDate) {
        params.append('to', toDate);
      }

      if (pivotFilters.counsellors && pivotFilters.counsellors.length > 0) {
        params.append('counsellors', pivotFilters.counsellors.join(','));
      }

      if (pivotFilters.supervisors && pivotFilters.supervisors.length > 0) {
        params.append('supervisors', pivotFilters.supervisors.join(','));
      }

      if (pivotFilters.colleges && pivotFilters.colleges.length > 0) {
        params.append('colleges', pivotFilters.colleges.join(','));
      }
      if (pivotFilters.counsellorStatus) {
        params.append('counsellor_status', pivotFilters.counsellorStatus);
      }
      if (filters.formType) {
        params.append('form_type', filters.formType);
      }
      const response = await axios.get(
        `${BASE_URL}/studentcoursestatus/lead-status-report?${params.toString()}`
      );

      if (response.data.success) {
        setPivotData(response.data.data);
      }
    } catch (err) {
      setError('Error fetching pivot table data: ' + err.message);
    } finally {
      setPivotLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    setError(null);
    setSortField('');
    setSortOrder('asc');
    const actions = {
      admission: () => fetchAdmissionData(1),
      application: () => fetchApplicationData(1),
      lead: () => fetchLeadData(1),
      remarks: () => {
        fetchRemarksData();
        fetchConnectedCallsData();
      }
    };
    actions[activeTab]?.();

    if (activeTab === 'lead' && leadSubTab === 'api') {
      fetchPivotData();
    }
  }, [activeTab, fromDate, toDate, statsFilter, remarksFilters, pageSize, leadSubTab, filters.dateRange]);

  useEffect(() => {
    const fetchFilterOptionsFn = async () => {
      try {
        setLoading(true);
        const { data } = await fetchFilterOptions();
        setFilterOptions({
          source: data.source || [],
          sourceUrl: data.first_source_url || [],
          utmCampaign: data.utmCampaign || data?.utm_campaign || data?.campaign_name || [],
          mode: data.mode || [],
          callingStatus: data.callingStatus || data?.calling_status || [],
          leadStatus: data.leadStatus || data?.lead_status || []
        });
      } catch (err) {
        setFilterOptions({
          source: ['Website', 'Social Media', 'Referral'],
          utmCampaign: ['Summer2023', 'Fall2023', 'Winter2023'],
          mode: ['Call', 'Email', 'WhatsApp'],
          callingStatus: ['Connected', 'Not Connected', 'Busy'],
          leadStatus: ['New', 'Follow-up', 'Converted']
        });
      } finally {
        setLoading(false);
      }
    };
    fetchFilterOptionsFn();
  }, []);

  return (
    <div className="p-2 md:p-4 animate-in fade-in duration-500">
      <div className="mx-auto">
        <DashboardHeader
          title={forcedTab === 'remarks' ? "Remarks Analysis Panel" : "Lead Intelligence Dashboard"}
          actions={
            <>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all font-bold text-xs shadow-sm shadow-slate-100 border ${showFilters ? 'bg-blue-500 text-white border-blue-600' : 'bg-blue-600 text-white border-slate-200 hover:border-blue-300'}`}
              >
                <Filter size={14} />
                {showFilters ? 'HIDE FILTERS' : 'FILTERS'}
              </button>

              {activeTab === "lead" && leadSubTab !== "api" && <button
                onClick={() => setShowDetailedColumns(!showDetailedColumns)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all font-bold text-xs shadow-sm shadow-slate-100 border ${showFilters ? 'bg-blue-500 text-white border-blue-600' : 'bg-blue-600 text-white border-slate-200 hover:border-blue-300'}`}
              >
                <Columns size={14} />
                {showDetailedColumns ? 'SIMPLE VIEW' : 'DETAILED VIEW'}
              </button>}

              <button
                onClick={handleExport}
                className={`flex items-center gap-2 px-4 py-3 cursor-pointer rounded-xl  transition-all font-bold text-xs shadow-sm shadow-slate-100 border ${showFilters ? 'bg-blue-500 text-white border-blue-600' : 'bg-blue-600 text-white border-slate-200 hover:border-blue-300'}`}
              >
                <Layout size={14} />
                DOWNLOAD
              </button>
            </>
          }
        />

        <ErrorDisplay error={error} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <DataTable
            activeTab={activeTab}
            leadSubTab={leadSubTab}
            loading={loading}
            currentData={getCurrentData()}
            currentPage={currentPage}
            totalPages={getCurrentData().totalPages}
            pageSize={pageSize}
            handleExport={handleExport}
            handlePageChange={handlePageChange}
            handlePageSizeChange={handlePageSizeChange}
            sortField={sortField}
            sortOrder={sortOrder}
            handleSort={handleSort}
            showDetailedColumns={showDetailedColumns}
            setShowDetailedColumns={setShowDetailedColumns}
          />

          {activeTab === 'lead' && leadSubTab === 'api' && (
            <LeadStatusPivotTable
              data={pivotData}
              fromDate={filters.dateRange?.[0]?.format('YYYY-MM-DD') || fromDate || ''}
              toDate={filters.dateRange?.[1]?.format('YYYY-MM-DD') || toDate || ''}
              selectedColleges={pivotFilters.colleges}
              selectedSupervisors={pivotFilters.supervisors}
              selectedCounsellors={pivotFilters.counsellors}
              onFilterChange={handlePivotFilterChange}
              loading={pivotLoading}
            />
          )}
         
          {activeTab === 'remarks' && (
            <RemarksAnalysisPanel
              chartData={mergeRemarksAndConnected(getChartData(), connectedCallsData)}
              tableData={connectedCallsData}
              remarksTableData={remarksData.data}
            />
          )}
        </div>

        <FilterPanel
          activeTab={activeTab}
          fromDate={fromDate}
          toDate={toDate}
          statsFilter={statsFilter}
          remarksFilters={remarksFilters}
          filterOptions={filterOptions}
          setFromDate={setFromDate}
          setToDate={setToDate}
          handleStatsFilterChange={handleStatsFilterChange}
          setRemarksFilters={setRemarksFilters}
          handleApplyFilters={handleApplyFilters}
          handleResetFilters={handleResetFilters}
          getStatsFilterOptions={getStatsFilterOptions}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          leadFilters={filters}
          setLeadFilters={setFilters}
          handleLeadSubfilter={handleLeadSubfilter}
          pivotFilters={pivotFilters}
          setPivotFilters={setPivotFilters}
          pivotData={pivotData}
          leadSubTab={leadSubTab}
        />
      </div>
    </div>
  );
};

export default ReportAnalysis;