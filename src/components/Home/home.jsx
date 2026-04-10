import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../config/api";
import Sidebar from "../SideBar";
import { useSelector } from "react-redux";
import { fetchAllCounsellors } from "../../network/counsellor";
import StatsComponent from "../StatsComponent";
import StreamlinedFilters from "../AdvanceFilters";
import { useLeadsData } from "../hooks/useLeadsData";
import { useFilters } from "../hooks/useFilters";
import useURLSync from "../hooks/useURLSync";
import Header from "./Header";
import LeadsTable from "./LeadsTable";
import ModalsContainer from "./ModalsContainer";
import { secureCache } from "../../utils/cache";
import { cleanQueryParams } from "../../utils/cleanParams";
import { Phone, Clock, X, RefreshCw, LayoutGrid } from "lucide-react";

const HomePage = memo(() => {
  const { searchParams, parseFiltersFromURL, updateURL } = useURLSync();
  const navigate = useNavigate();
  const [callbackType, setCallbackType] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem("l2_active_tab");
    return savedTab || "fresh";
  });
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
  
  // L2 specific state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const roletosend = useSelector((state) => state.auth.user);
  const storedRole = useSelector((state) => state.auth.role);

  const activeRole = useMemo(() => {
    return (
      agent?.role || (storedRole !== "Supervisor" ? storedRole : null) || "l2"
    );
  }, [agent?.role, storedRole]);
  const [leadsPerPage, setLeadsPerPage] = useState(10);

  const { leads, loading, totalLeads, totalPages, overallStats, fetchLeads } =
    useLeadsData(roletosend);
  const { filters, getTabAutoFilters, updateFilters, clearFilters } =
    useFilters(activeRole, roletosend, agent);

  useEffect(() => {
    if (storedRole === "l2") {
      localStorage.setItem("l2_active_tab", activeTab);
    }
  }, [activeTab, storedRole]);

  useEffect(() => {
    const urlFilters = parseFiltersFromURL();
    const pageFromURL = urlFilters.page || 1;
    const limitFromURL = urlFilters.limit || 10;

    updateFilters(urlFilters);
    setCurrentPage(Number(pageFromURL));
    setLeadsPerPage(Number(limitFromURL));

    const autoFilters = getTabAutoFilters(activeTab);
    const combinedFilters = {
      ...autoFilters,
      ...urlFilters,
      page: Number(pageFromURL),
      limit: Number(limitFromURL),
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
    if (
      storedRole === "Supervisor" ||
      storedRole === "to" ||
      storedRole === "to_l3"
    ) {
      fetchAgents();
    }
  }, [storedRole, fetchAgents]);

  const handleTabChange = useCallback(
    (tab) => {
      if (tab === activeTab) return;
      setActiveTab(tab);
      setCurrentPage(1);
      setLeadsPerPage(10);

      const autoFilters = getTabAutoFilters(tab);
      const filtersWithPagination = {
        ...autoFilters,
        selectedagent: filters.selectedagent || autoFilters.selectedagent,
        page: 1,
        limit: 10,
      };
      updateFilters(filtersWithPagination);
      fetchLeads(filtersWithPagination, 1, true);
      updateURL(filtersWithPagination, true);
      
      setIsViewModalOpen(false);
    },
    [activeTab, getTabAutoFilters, updateFilters, fetchLeads, updateURL],
  );

  const handleFilterChange = useCallback(
    (key, value, previousFilters) => {
      const newFilters =
        key === "bulk"
          ? {
              ...value,
              data: value.data || filters.data || activeRole,
              selectedagent: value.selectedagent || filters.selectedagent,
              page: 1,
              limit: leadsPerPage,
            }
          : {
              ...previousFilters,
              [key]: value,
              data: filters.data || activeRole,
              page: 1,
              limit: leadsPerPage,
            };

      updateFilters(newFilters);
      setCurrentPage(1);
      updateURL(newFilters);
      fetchLeads(newFilters, 1, true);
    },
    [filters, activeRole, leadsPerPage, updateFilters, updateURL, fetchLeads],
  );

  const handleApplyFilters = useCallback(
    (newFilters) => {
      const filtersWithDataAndPagination = {
        ...newFilters,
        data: newFilters.data || filters.data || activeRole,
        page: 1,
        limit: leadsPerPage,
      };

      updateFilters(filtersWithDataAndPagination);
      setCurrentPage(1);
      updateURL(filtersWithDataAndPagination, true);
      fetchLeads(filtersWithDataAndPagination, 1, true);
    },
    [filters, activeRole, leadsPerPage, updateFilters, updateURL, fetchLeads],
  );

  const handleClearFilters = useCallback(() => {
    const clearedFilters = clearFilters(activeTab);
    const filtersWithPagination = {
      ...clearedFilters,
      selectedagent: filters.selectedagent,
      page: 1,
      limit: leadsPerPage,
    };

    setCurrentPage(1);
    updateURL(filtersWithPagination, true);
    fetchLeads(filtersWithPagination, 1, true);
  }, [clearFilters, activeTab, leadsPerPage, updateURL, fetchLeads]);

  const handleAgentClick = useCallback(
    (selectedAgent) => {
      try {
        localStorage.setItem("agent", JSON.stringify(selectedAgent));
        setAgent(selectedAgent);

        const updatedFilters = {
          ...filters,
          selectedagent: selectedAgent.counsellor_id,
          data: selectedAgent.role || activeRole,
          page: 1,
          limit: leadsPerPage,
        };

        updateFilters(updatedFilters);
        setCurrentPage(1);
        updateURL(updatedFilters, true);
        fetchLeads(updatedFilters, 1, true);

        secureCache.clear();
      } catch (error) {
        console.error("Error updating agent:", error);
      }
    },
    [activeRole, leadsPerPage, updateFilters, updateURL, fetchLeads, filters],
  );

  const handleRoleSwitch = useCallback(() => {
    const newRole = activeRole === "l3" ? "l2" : "l3";
    const updatedAgent = { ...agent, role: newRole };

    try {
      localStorage.setItem("agent", JSON.stringify(updatedAgent));
      setAgent(updatedAgent);

      const updatedFilters = {
        ...filters,
        data: newRole,
        selectedagent:
          updatedAgent.counsellor_id ||
          agent.counsellor_id ||
          roletosend?.counsellor_id ||
          agent?.id,
        page: 1,
        limit: leadsPerPage,
      };

      updateFilters(updatedFilters);
      setCurrentPage(1);
      updateURL(updatedFilters, true);
      fetchLeads(updatedFilters, 1, true);

      secureCache.clear();
    } catch (error) {
      console.error("Error switching roles:", error);
    }
  }, [
    activeRole,
    agent,
    filters,
    leadsPerPage,
    roletosend,
    updateFilters,
    updateURL,
    fetchLeads,
  ]);
  
  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage === currentPage) return;

      setCurrentPage(newPage);
      const updatedFilters = {
        ...filters,
        page: newPage,
        limit: leadsPerPage,
      };
      updateURL(updatedFilters);
      fetchLeads(updatedFilters, newPage, true);
    },
    [currentPage, filters, leadsPerPage, updateURL, fetchLeads],
  );

  const handleLimitChange = useCallback(
    (newLimit) => {
      setCurrentPage(1);
      setLeadsPerPage(newLimit);
      const updatedFilters = {
        ...filters,
        limit: newLimit,
        page: 1,
      };
      updateURL(updatedFilters, true);
      fetchLeads(updatedFilters, 1, true);
    },
    [filters, updateURL, fetchLeads],
  );

  const handleExportLeads = useCallback(async () => {
    try {
      const autoFilters = getTabAutoFilters(activeTab);
      const allFilters = {
        ...autoFilters,
        ...filters,
        data: filters.data || autoFilters.data || activeRole,
      };

      let lastLogged = 0;
      const response = await axios.get(`${BASE_URL}/student/export`, {
        params: { ...allFilters, export: true },
        responseType: "blob",
        paramsSerializer: cleanQueryParams,
        withCredentials: true,
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1),
          );

          if (percentCompleted !== lastLogged) {
            lastLogged = percentCompleted;
          }
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `leads_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting leads:", error);
    }
  }, [activeTab, filters, activeRole, getTabAutoFilters]);

  const modalHandlers = useMemo(
    () => ({
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
      },
    }),
    [filters, currentPage, fetchLeads],
  );

  const showSidebar = storedRole !== "l2";

  return (
    <div className="flex bg-gray-50">
      {showSidebar && (
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
      )}

      <div className="flex-1 flex flex-col overflow-x-hidden">
        <main className="p-6 bg-white">
          <Header
            activeTab={activeTab}
            storedRole={storedRole}
            activeRole={activeRole}
            onAddLead={() => setIsAddLeadModalOpen(true)}
            onExport={handleExportLeads}
            onRoleSwitch={handleRoleSwitch}
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
            onLimitChange={handleLimitChange}
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
        </main>
      </div>

      {/* Beautiful Floating Button for L2 Role */}
      {storedRole === "l2" && (
        <>
          <button
            onClick={() => setIsViewModalOpen(true)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="fixed bottom-8 right-8 group z-50 transition-all duration-300"
          >
            <div className={`
              relative flex items-center gap-3 px-5 py-3 rounded-full shadow-lg transition-all duration-300
              ${isHovered 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl scale-105' 
                : 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-md'
              }
            `}>
              {/* Pulse animation ring */}
              <div className={`
                absolute inset-0 rounded-full transition-opacity duration-300
                ${isHovered ? 'animate-ping opacity-20' : 'opacity-0'}
              `} style={{ backgroundColor: 'rgba(59, 130, 246, 0.5)' }} />
              
              {/* Icon */}
              <LayoutGrid size={20} className="text-white" />
              
              {/* Text */}
              <span className="text-white font-medium text-sm">
                {activeTab === "fresh" ? "Fresh Leads" : "Callbacks"}
              </span>
              
              {/* Chevron indicator */}
              <svg 
                className={`w-4 h-4 text-white transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* View Selection Modal */}
          {isViewModalOpen && (
            <>
              <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300 z-40"
                onClick={() => setIsViewModalOpen(false)}
              />
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-[30rem] max-w-full animate-in fade-in zoom-in duration-200">
                  {/* Header */}
                  <div className="px-6 pt-6 pb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Switch View</h2>
                        <p className="text-sm text-gray-500 mt-1">Choose what you want to work on</p>
                      </div>
                      <button
                        onClick={() => setIsViewModalOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X size={20} className="text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="px-6 pb-6 space-y-3">
                    {/* Fresh Leads Option */}
                    <button
                      onClick={() => handleTabChange("fresh")}
                      className={`group w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                        activeTab === "fresh"
                          ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50"
                          : "border-gray-100 hover:border-blue-500 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl transition-colors duration-200 flex items-center justify-center ${
                          activeTab === "fresh"
                            ? "bg-blue-500"
                            : "bg-blue-100 group-hover:bg-blue-500"
                        }`}>
                          <Phone size={22} className={`transition-colors duration-200 ${
                            activeTab === "fresh"
                              ? "text-white"
                              : "text-blue-600 group-hover:text-white"
                          }`} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`font-semibold ${
                            activeTab === "fresh" ? "text-blue-700" : "text-gray-900 group-hover:text-blue-700"
                          }`}>Fresh Leads</p>
                          <p className="text-sm text-gray-500 mt-0.5">Get new leads from dialer pool</p>
                        </div>
                        {activeTab === "fresh" && (
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {activeTab !== "fresh" && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Callbacks Option */}
                    <button
                      onClick={() => handleTabChange("callback")}
                      className={`group w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                        activeTab === "callback"
                          ? "border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50"
                          : "border-gray-100 hover:border-emerald-500 bg-white hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl transition-colors duration-200 flex items-center justify-center ${
                          activeTab === "callback"
                            ? "bg-emerald-500"
                            : "bg-emerald-100 group-hover:bg-emerald-500"
                        }`}>
                          <Clock size={22} className={`transition-colors duration-200 ${
                            activeTab === "callback"
                              ? "text-white"
                              : "text-emerald-600 group-hover:text-white"
                          }`} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`font-semibold ${
                            activeTab === "callback" ? "text-emerald-700" : "text-gray-900 group-hover:text-emerald-700"
                          }`}>My Callbacks</p>
                          <p className="text-sm text-gray-500 mt-0.5">Your converted leads & follow-ups</p>
                        </div>
                        {activeTab === "callback" && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {activeTab !== "callback" && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400 text-center">
                      Current view: <span className="font-medium text-gray-600">
                        {activeTab === "fresh" ? "Fresh Leads" : "My Callbacks"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
});

export default HomePage;