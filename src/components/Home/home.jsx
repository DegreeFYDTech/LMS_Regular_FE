
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../../config/api';
import Sidebar from '../SideBar';
import { useSelector } from 'react-redux';
import { fetchAllCounsellors } from '../../network/counsellor';
import StatsComponent from '../StatsComponent';
import { useLeadsData } from '../hooks/useLeadsData';
import { useFilters } from '../hooks/useFilters';
import useURLSync from '../hooks/useURLSync';
import Header from './Header';
import LeadsTable from './LeadsTable';
import ModalsContainer from './ModalsContainer';
import StreamlinedFilters from '../AdvanceFilters';
import AdvancedFilter from '../AdvanceFilters';
import { secureCache } from '../../utils/cache';
import { cleanQueryParams } from '../../utils/cleanParams'
const HomePage = memo(() => {
  const { searchParams, parseFiltersFromURL, updateURL } = useURLSync();
  const navigate = useNavigate();
  const [callbackType, setCallbackType] = useState("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentPage, setCurrentPage] = useState(1);
  const [agents, setAgents] = useState([]);
  const [agent, setAgent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("agent")) || {};
    } catch {
      return {};
    }
  });

  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isDisconnectPopupOpen, setIsDisconnectPopupOpen] = useState(false);
  const [isConnectedPopupOpen, setIsConnectedPopupOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openChatModal, setOpenChatModel] = useState(false);
  const [isAssignedtoL2, setIsAssignedtoL2] = useState(false);
  const [isAssignedtoL3, setIsAssignedtoL3] = useState(false);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState([]);

  const roletosend = useSelector((state) => state.auth.user);
  const storedRole = useSelector((state) => state.auth.role);

  const activeRole = useMemo(() => {
    return agent?.role || (storedRole !== "Supervisor" ? storedRole : null) || "l2";
  }, [agent?.role, storedRole]);
  const [leadsPerPage, setLeadsPerPage] = useState(10); // Default to 10

  const { leads, loading, totalLeads, totalPages, overallStats, fetchLeads } = useLeadsData(roletosend);
  const { filters, getTabAutoFilters, updateFilters, clearFilters } = useFilters(activeRole, roletosend, agent);
  useEffect(() => {
    const urlFilters = parseFiltersFromURL();
    const pageFromURL = urlFilters.page || 1;
    const limitFromURL = urlFilters.limit || 10;

    updateFilters(urlFilters);
    setCurrentPage(Number(pageFromURL)); 
    setLeadsPerPage(Number(limitFromURL)); 
    
    // Sync advanced filters if present in URL
    if (urlFilters.advancedFilters) {
      setAdvancedFilters(urlFilters.advancedFilters);
    }

    const autoFilters = getTabAutoFilters(activeTab);
    const combinedFilters = {
      ...autoFilters,
      ...urlFilters,
      page: Number(pageFromURL), // Convert to number
      limit: Number(limitFromURL) // Convert to number
    };

    fetchLeads(combinedFilters, pageFromURL, true);
    updateURL(combinedFilters, true);
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetchAllCounsellors();
      setAgents(response || []);
    } catch (error) {
      console.error("Error fetching agents:", error);
    }
  }, []);

  useEffect(() => {
    if (storedRole === "Supervisor" || storedRole === "to" || storedRole === "to_l3") {
      fetchAgents();
    }
  }, [storedRole, fetchAgents]);

  const handleTabChange = useCallback((tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setCurrentPage(1);
    setLeadsPerPage(10); // Reset to default limit

    // If you added setCurrentTab to useFilters, call it here
    // setCurrentTab(tab); // Uncomment if you want to track tab in useFilters

    const autoFilters = getTabAutoFilters(tab);
    const filtersWithPagination = {
      ...autoFilters,
      selectedagent: filters.selectedagent || autoFilters.selectedagent,
      page: 1,
      limit: 10 // Default limit
    };
    updateFilters(filtersWithPagination);
    fetchLeads(filtersWithPagination, 1, true);
    updateURL(filtersWithPagination, true);
  }, [activeTab, getTabAutoFilters, updateFilters, fetchLeads, updateURL]);

  const handleFilterChange = useCallback((key, value, previousFilters) => {
    const newFilters = key === 'bulk' ?
      {
        ...value,
        data: value.data || filters.data || activeRole,
        selectedagent: value.selectedagent || filters.selectedagent,
        page: 1,
        limit: leadsPerPage
      } :
      {
        ...previousFilters,
        [key]: value,
        data: filters.data || activeRole,
        page: 1, // Reset to page 1 on filter change
        limit: leadsPerPage // Keep current limit
      };

    updateFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters);
    fetchLeads(newFilters, 1, true);
  }, [filters, activeRole, leadsPerPage, updateFilters, updateURL, fetchLeads]);

  const handleApplyFilters = useCallback((newFilters) => {
    const filtersWithDataAndPagination = {
      ...newFilters,
      data: newFilters.data || filters.data || activeRole,
      page: 1, // Reset to page 1 when applying filters
      limit: leadsPerPage // Keep current limit
    };

    updateFilters(filtersWithDataAndPagination);
    setCurrentPage(1);
    updateURL(filtersWithDataAndPagination, true);
    fetchLeads(filtersWithDataAndPagination, 1, true);
  }, [filters, activeRole, leadsPerPage, updateFilters, updateURL, fetchLeads]);

  const handleClearFilters = useCallback(() => {
    const clearedFilters = clearFilters(activeTab);
    const filtersWithPagination = {
      ...clearedFilters,
      selectedagent: filters.selectedagent,
      page: 1,
      limit: leadsPerPage // Keep current limit
    };

    setCurrentPage(1);
    updateURL(filtersWithPagination, true);
    fetchLeads(filtersWithPagination, 1, true);
  }, [clearFilters, activeTab, leadsPerPage, updateURL, fetchLeads]);

  const handleApplyAdvancedFilters = useCallback((filtersArray) => {
    setAdvancedFilters(filtersArray);
    const updatedFilters = {
      ...filters,
      advancedFilters: filtersArray,
      page: 1
    };
    updateFilters(updatedFilters);
    setCurrentPage(1);
    updateURL(updatedFilters, true);
    fetchLeads(updatedFilters, 1, true);
  }, [filters, updateFilters, updateURL, fetchLeads]);

  const handleClearAdvancedFilters = useCallback(() => {
    setAdvancedFilters([]);
    const updatedFilters = {
      ...filters,
      advancedFilters: [],
      page: 1
    };
    updateFilters(updatedFilters);
    setCurrentPage(1);
    updateURL(updatedFilters, true);
    fetchLeads(updatedFilters, 1, true);
  }, [filters, updateFilters, updateURL, fetchLeads]);

  const handleAgentClick = useCallback((selectedAgent) => {
    try {
      localStorage.setItem("agent", JSON.stringify(selectedAgent));
      setAgent(selectedAgent);

      const updatedFilters = {
        ...filters,
        selectedagent: selectedAgent.counsellor_id,
        data: selectedAgent.role || activeRole,
        page: 1, // Reset to page 1
        limit: leadsPerPage // Keep current limit
      };

      updateFilters(updatedFilters);
      setCurrentPage(1);
      updateURL(updatedFilters, true);
      fetchLeads(updatedFilters, 1, true);

      secureCache.clear();
    } catch (error) {
      console.error("Error updating agent:", error);
    }
  }, [activeRole, leadsPerPage, updateFilters, updateURL, fetchLeads, filters]);

  const handleRoleSwitch = useCallback(() => {
    const newRole = activeRole === "l3" ? "l2" : "l3";
    const updatedAgent = { ...agent, role: newRole };

    try {
      localStorage.setItem("agent", JSON.stringify(updatedAgent));
      setAgent(updatedAgent);

      const updatedFilters = {
        ...filters,
        data: newRole,
        selectedagent: updatedAgent.counsellor_id || agent.counsellor_id || roletosend?.counsellor_id || agent?.id,
        page: 1, // Reset to page 1
        limit: leadsPerPage // Keep current limit
      };

      updateFilters(updatedFilters);
      setCurrentPage(1);
      updateURL(updatedFilters, true);
      fetchLeads(updatedFilters, 1, true);

      secureCache.clear();
    } catch (error) {
      console.error("Error switching roles:", error);
    }
  }, [activeRole, agent, filters, leadsPerPage, roletosend, updateFilters, updateURL, fetchLeads]);
  const handlePageChange = useCallback((newPage) => {
    if (newPage === currentPage) return;

    setCurrentPage(newPage);
    const updatedFilters = {
      ...filters,
      page: newPage,
      limit: leadsPerPage
    };
    updateURL(updatedFilters);
    fetchLeads(updatedFilters, newPage, true);
  }, [currentPage, filters, leadsPerPage, updateURL, fetchLeads]);

  const handleLimitChange = useCallback((newLimit) => {
    setCurrentPage(1);
    setLeadsPerPage(newLimit);
    const updatedFilters = {
      ...filters,
      limit: newLimit,
      page: 1
    };
    updateURL(updatedFilters, true);
    fetchLeads(updatedFilters, 1, true);
  }, [filters, updateURL, fetchLeads]);

  const handleExportLeads = useCallback(async () => {
    try {
      const autoFilters = getTabAutoFilters(activeTab);
      const allFilters = {
        ...autoFilters,
        ...filters,
        data: filters.data || autoFilters.data || activeRole
      };

      let lastLogged = 0;
      const response = await axios.get(`${BASE_URL}/student/export`, {
        params: { ...allFilters, export: true },
        responseType: 'blob',
        paramsSerializer: cleanQueryParams,
        withCredentials: true,
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );

          if (percentCompleted !== lastLogged) {
            lastLogged = percentCompleted;
          }
        }
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leads_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting leads:", error);
    }
  }, [activeTab, filters, activeRole, getTabAutoFilters]);

  // Modal handlers
  const modalHandlers = useMemo(() => ({
    handleConnect: (student) => {
      setIsConnectedPopupOpen(true);
      setSelectedStudent(student);
    },
    handleDisconnect: (student) => {
      setIsDisconnectPopupOpen(true);
      setSelectedStudent(student);
    },
    handleAssignedtoL2: (student) => {
      setSelectedStudent(student);
      setIsAssignedtoL2(true);
    },
    handleAssignedtoL3: (student) => {
      setSelectedStudent(student);
      setIsAssignedtoL3(true);
    },
    handleWhatsApp: (leadData) => {
      setSelectedStudent(leadData);
      setOpenChatModel(true);
    },
    handleAddLeadSuccess: () => {
      setIsAddLeadModalOpen(false);
      fetchLeads(filters, currentPage, true);
    }
  }), [filters, currentPage, fetchLeads]);

  return (
    <div className="flex bg-gray-50">
      <Sidebar
        setSidebarCollapsed={setSidebarCollapsed}
        sidebarCollapsed={sidebarCollapsed}
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        agents={agents}
        selectedAgent={agent}
        handleAgentClick={handleAgentClick}
        navigate={navigate}
        setIsAddLeadModalOpen={setIsAddLeadModalOpen}
      />

      <div className="flex-1 flex flex-col overflow-x-hidden">
        <main className="p-6 bg-white">
          <Header
            activeTab={activeTab}
            storedRole={storedRole}
            activeRole={activeRole}
            onAddLead={() => setIsAddLeadModalOpen(true)}
            onExport={handleExportLeads}
            onRoleSwitch={handleRoleSwitch}
            onOpenAdvancedFilter={() => setIsAdvancedFilterOpen(true)}
          />

          {activeTab === "dashboard" && (
            <StatsComponent
              overallStats={overallStats}
              filters={filters}
              activeRole={activeRole}
              onFilterChange={handleFilterChange}
            />
          )}

          <div className="mb-6">
            <StreamlinedFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
              loading={loading}
              activeTab={activeTab}
            />
          </div>

          <LeadsTable
            loading={loading}
            leads={leads}
            activeRole={activeRole}
            activeTab={activeTab}
            totalPages={totalPages}
            currentPage={currentPage}
            leadsPerPage={leadsPerPage}
            totalLeads={totalLeads}
            filters={filters}
            onPageChange={handlePageChange}
            onConnect={modalHandlers.handleConnect}
            onDisconnect={modalHandlers.handleDisconnect}
            onWhatsApp={modalHandlers.handleWhatsApp}
            onAssignedtoL2={modalHandlers.handleAssignedtoL2}
            onAssignedtoL3={modalHandlers.handleAssignedtoL3}
            handleFilterChange={handleFilterChange}
            setCallbackType={setCallbackType}
            callbackType={callbackType}
            onLimitChange={handleLimitChange} // Add this line

          />

          <ModalsContainer
            isAddLeadModalOpen={isAddLeadModalOpen}
            isDisconnectPopupOpen={isDisconnectPopupOpen}
            isConnectedPopupOpen={isConnectedPopupOpen}
            isAssignedtoL2={isAssignedtoL2}
            isAssignedtoL3={isAssignedtoL3}
            openChatModal={openChatModal}
            selectedStudent={selectedStudent}
            agentId={agent?.counsellor_id}
            onCloseAddLead={() => setIsAddLeadModalOpen(false)}
            onAddLeadSuccess={modalHandlers.handleAddLeadSuccess}
            onCloseDisconnect={() => setIsDisconnectPopupOpen(false)}
            onCloseConnected={() => setIsConnectedPopupOpen(false)}
            onCloseAssignedL2={() => setIsAssignedtoL2(false)}
            onCloseAssignedL3={() => setIsAssignedtoL3(false)}
            onCloseWhatsApp={() => setOpenChatModel(false)}
          />

          <AdvancedFilter 
            isOpen={isAdvancedFilterOpen}
            onClose={() => setIsAdvancedFilterOpen(false)}
            onApply={handleApplyAdvancedFilters}
            onClear={handleClearAdvancedFilters}
            initialFilters={advancedFilters}
          />
        </main>
      </div>
    </div>
  );
});


export default HomePage;