import React, { useState, useMemo, useEffect } from "react";
import { Search, Filter, X, Calendar, UserCheck, UserMinus, UserPlus, Users, Wifi, Eye, Key, Settings, Power, LogOut, UserCog } from "lucide-react";

import {
  getAllCounsellors,
  deleteCounsellor,
  updateCounsellorStatus,
  changeCounsellorPassword,
  updateCounsellorPreferredMode,
  makeCounsellorLogout,
  changeSupervisor,
  getAllSupervisors,
} from "../network/counsellor";
// Import the modal components
import UserDetailsModal from "../components/modals/UserDetailsModal";
import LogoutUserModal from "../components/modals/LogoutCounsellorModal";
import ChangePasswordModal from "../components/modals/ChangePasswordModal";
import DisableUserModal from "../components/modals/DisableUserModal";
import ChangeRoleModal from "../components/modals/ChangeRoleModal";
import PreferredModeModal from "../components/modals/PreferredModeModal";
import SupervisorModal from "../components/modals/SupervisorModal";
import Loader from "../common/Loader";

const UserListing = () => {
  // State to store users from API
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [roleFilter, setRoleFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [supervisorFilter, setSupervisorFilter] = useState('');

  // State for supervisors
  const [supervisors, setSupervisors] = useState([]);

  // State for modals and selected user
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [showPreferredModeModal, setShowPreferredModeModal] = useState(false);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");

  const toggleShowPassword = () => setShowPassword(prev => !prev);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  // Fetch counsellors data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch counsellors and supervisors in parallel
        const [counsellorsResponse, supervisorsData] = await Promise.all([
          getAllCounsellors(),
          getAllSupervisors()
        ]);
        console.log(supervisorsData);
        const counsellors = counsellorsResponse.counsellors || counsellorsResponse.data || counsellorsResponse;
        let supervisorsList = supervisorsData.counsellors || supervisorsData.data || supervisorsData;

        supervisorsList = supervisorsList.filter(sup => sup.role === "to" || sup.role === "to_l3");

        // Create supervisor map for quick lookup
        const supervisorMap = {};
        supervisorsList.forEach(sup => {
          supervisorMap[sup.counsellor_id] = sup.counsellor_name;
        });

        // Add supervisor_name to each counsellor
        const formattedCounsellors = counsellors.map(counsellor => ({
          ...counsellor,
          supervisor_name: counsellor.assigned_to ? supervisorMap[counsellor.assigned_to] || null : null
        }));

        setUsers(formattedCounsellors);
        setSupervisors(supervisorsList);
        setError(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTogglePreferredMode = (user) => {
    setSelectedUser(user);
    setShowPreferredModeModal(true);
  };

  // Confirm toggle preferred mode
  const confirmTogglePreferredMode = async () => {
    try {
      const newPreferredMode = selectedUser.counsellor_preferred_mode === "Online" ? "Regular" : "Online";
      await updateCounsellorPreferredMode(selectedUser.counsellor_id, newPreferredMode);

      setUsers(users.map((user) =>
        user.counsellor_id === selectedUser.counsellor_id
          ? { ...user, counsellor_preferred_mode: newPreferredMode }
          : user
      ));
      setShowPreferredModeModal(false);
      alert(`Preferred mode updated to ${newPreferredMode} successfully!`);
    } catch (error) {
      console.error("Error updating preferred mode:", error);
      alert(`Failed to update preferred mode: ${error.message}`);
    }
  };

  // Handler for view details
  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  // Handler for delete user
  const handleLogoutUser = (user) => {
    setSelectedUser(user);
    setShowLogoutModal(true);
  };

  // Handler for change password
  const handleChangePassword = (user, e) => {
    e.stopPropagation();
    setSelectedUser(user);
    setShowChangePasswordModal(true);
    setNewPassword("");
    setConfirmPassword("");
  };

  // Handler for disable/enable user
  const handleDisableUser = (user) => {
    setSelectedUser(user);
    setShowDisableModal(true);
  };

  // Handler for change supervisor
  const handleChangeSupervisor = (user) => {
    setSelectedUser(user);
    setSelectedSupervisorId(user.assigned_to || "");
    setShowSupervisorModal(true);
  };

  const confirmLogoutUser = async () => {
    try {
      await makeCounsellorLogout(selectedUser.counsellor_id);
      setShowLogoutModal(false);
      alert("User logged out successfully!");
    } catch (error) {
      console.error("Error logging out user:", error);
      alert(`Failed to logout user: ${error.message}`);
    }
  };

  // Confirm disable/enable user
  const confirmDisableUser = async () => {
    try {
      const newStatus = selectedUser.status === "inactive" ? "active" : "inactive";
      await updateCounsellorStatus(selectedUser.counsellor_id, newStatus);

      setUsers(users.map((user) =>
        user.counsellor_id === selectedUser.counsellor_id ? { ...user, status: newStatus } : user
      ));
      setShowDisableModal(false);
      alert(`User ${newStatus === "active" ? "enabled" : "disabled"} successfully!`);
    } catch (error) {
      console.error("Error updating user status:", error);
      alert(`Failed to update user status: ${error.message}`);
    }
  };

  // Confirm change password
  const confirmChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    try {
      await changeCounsellorPassword(selectedUser.counsellor_id, newPassword);
      setShowChangePasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
      alert("Password changed successfully!");
    } catch (error) {
      console.error("Error changing password:", error);
      alert(`Failed to change password: ${error.message}`);
    }
  };

  // Confirm change role
  const confirmChangeRole = async () => {
    try {
      alert("Role change functionality needs to be implemented in the API");
      setShowRoleModal(false);
    } catch (error) {
      console.error("Error updating role:", error);
      alert(`Failed to update role: ${error.message}`);
    }
  };


const confirmChangeSupervisor = async (supervisorId) => {
  try {
    // Use the passed supervisorId instead of selectedSupervisorId state
    await changeSupervisor(selectedUser.counsellor_id, supervisorId || null);

    // Update local state
    const updatedSupervisorName = supervisorId
      ? supervisors.find(s => s.counsellor_id === supervisorId)?.counsellor_name
      : null;

    setUsers(users.map((user) =>
      user.counsellor_id === selectedUser.counsellor_id
        ? {
            ...user,
            assigned_to: supervisorId || null,
            supervisor_name: updatedSupervisorName
          }
        : user
    ));
    setShowSupervisorModal(false);
    alert("Supervisor updated successfully!");
  } catch (error) {
    console.error("Error changing supervisor:", error);
    alert(`Failed to change supervisor: ${error.message}`);
  }
};

  const dashboardStats = useMemo(() => {
    if (!users) return {};

    return {
      totalAgents: users.length,
      activeAgents: users.filter(u => u.status === 'active').length,
      inactiveAgents: users.filter(u => u.status === 'inactive').length,
      onlineAgents: users.filter(u => u.counsellor_preferred_mode === 'Online').length,
      offlineAgents: users.filter(u => u.counsellor_preferred_mode !== 'Online').length,
      supervisedAgents: users.filter(u => u.assigned_to).length,
      unassignedAgents: users.filter(u => !u.assigned_to && u.role !== 'to').length,
    };
  }, [users]);

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter((user) => {
      const searchMatch =
        !searchQuery ||
        user.counsellor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.counsellor_email?.toLowerCase().includes(searchQuery.toLowerCase());

      const roleMatch = !roleFilter || user.role === roleFilter;
      const statusMatch = !statusFilter || user.status === statusFilter;

      const supervisorMatch = !supervisorFilter ||
        (supervisorFilter === "unassigned" && !user.assigned_to) ||
        user.assigned_to === supervisorFilter;

      const userCreatedAt = user.created_at ? new Date(user.created_at) : null;
      const matchStartDate =
        !startDate || !userCreatedAt || userCreatedAt >= new Date(startDate);
      const matchEndDate =
        !endDate || !userCreatedAt || userCreatedAt <= new Date(endDate);

      return searchMatch && roleMatch && matchStartDate && matchEndDate && statusMatch && supervisorMatch;
    });
  }, [users, roleFilter, startDate, endDate, searchQuery, statusFilter, supervisorFilter]);

  // Get unique roles for dropdown
  const uniqueRoles = useMemo(() => {
    if (!users) return [];
    return [...new Set(users.map((user) => user.role).filter(Boolean))];
  }, [users]);

  // Reset all filters
  const resetFilters = () => {
    setRoleFilter("");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    setStatusFilter("");
    setSupervisorFilter("");
  };

  // Format status for display
  const displayStatus = (user) => {
    if (user.status === "suspended") return "Suspended";
    return user.status === "inactive" ? "Disabled" : "Active";
  };

  // Loading state
  if (isLoading) {
    return <Loader />;
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeFiltersCount = [roleFilter, startDate, endDate, statusFilter, supervisorFilter].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your team members and their permissions</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
              />
            </div>
            {/* Filters Button */}
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors relative"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-6 gap-6">
          {/* Total Agents */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Agents</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{dashboardStats.totalAgents || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Active Agents */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Agents</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{dashboardStats.activeAgents || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Supervised Agents */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Supervised</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{dashboardStats.supervisedAgents || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <UserCog className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Inactive Agents */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive Agents</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{dashboardStats.inactiveAgents || 0}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <UserMinus className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* Online Agents */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Online Mode</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{dashboardStats.onlineAgents || 0}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <Wifi className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Unassigned Agents */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unassigned</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{dashboardStats.unassignedAgents || 0}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <UserPlus className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-6 py-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                      No users found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr key={user.counsellor_id} className="hover:bg-gray-50">
                      {/* Name with Avatar */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {user.counsellor_name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{user.counsellor_name}</div>
                            <div className="text-xs text-gray-500">ID: {user.id_code || `${user.counsellor_id}`}</div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.counsellor_email}
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'to' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'l3' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'l2' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {user.role?.toUpperCase() || 'N/A'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'inactive' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {displayStatus(user)}
                        </span>
                      </td>

                      {/* Supervisor */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.role === 'to' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Supervisor
                          </span>
                        ) : user.supervisor_name ? (
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-2">
                              <UserCog className="h-4 w-4" />
                            </div>
                            <span className="text-sm text-gray-900">{user.supervisor_name}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Not Assigned
                          </span>
                        )}
                      </td>

                      {/* Mode */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.counsellor_preferred_mode === 'Online'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}>
                          <Wifi className={`mr-1 h-3 w-3 ${user.counsellor_preferred_mode === 'Online' ? 'text-indigo-600' : 'text-gray-500'}`} />
                          {user.counsellor_preferred_mode || 'Regular'}
                        </span>
                      </td>

                      {/* Session */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {user.status === 'active' ? 'Active' : 'Logged Out'}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleViewDetails(user)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleChangePassword(user, e)}
                            className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all duration-200"
                            title="Change Password"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleTogglePreferredMode(user)}
                            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                            title="Change Mode"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          {user.role !== 'to' && (
                            <button
                              onClick={() => handleChangeSupervisor(user)}
                              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                              title="Change Supervisor"
                            >
                              <UserCog className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDisableUser(user)}
                            className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200"
                            title="Disable/Enable User"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleLogoutUser(user)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Logout User"
                          >
                            <LogOut className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Sidebar Drawer for Filters */}
      {showFilters && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-xs bg-opacity-50 transition-opacity"
            onClick={() => setShowFilters(false)}
          ></div>

          {/* Drawer */}
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
              <div>
                <h2 className="text-lg font-semibold text-white">Filter Users</h2>
                <p className="text-sm text-white mt-1">Refine your search results</p>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-blue-500 rounded-full"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Role Filter */}
              <div>
                <div className="flex items-center mb-4">
                  <UserCheck className="h-4 w-4 text-gray-500 mr-2" />
                  <label className="text-sm font-medium text-gray-900">Filter by Role</label>
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full border border-blue-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
                >
                  <option value="">All Roles</option>
                  {uniqueRoles.map((role) => (
                    <option key={role} value={role}>
                      {role?.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <div className="flex items-center mb-4">
                  <Users className="h-4 w-4 text-gray-500 mr-2" />
                  <label className="text-sm font-medium text-gray-900">Filter by Status</label>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={statusFilter === "active"}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={statusFilter === "inactive"}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-700">Inactive</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="suspended"
                      checked={statusFilter === "suspended"}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-700">Suspended</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value=""
                      checked={statusFilter === ""}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-700">All Status</span>
                  </label>
                </div>
              </div>

              {/* Supervisor Filter */}
              <div>
                <div className="flex items-center mb-4">
                  <UserCog className="h-4 w-4 text-gray-500 mr-2" />
                  <label className="text-sm font-medium text-gray-900">Filter by Supervisor</label>
                </div>
                <select
                  value={supervisorFilter}
                  onChange={(e) => setSupervisorFilter(e.target.value)}
                  className="w-full border border-blue-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
                >
                  <option value="">All Supervisors</option>
                  {supervisors.map((sup) => (
                    <option key={sup.counsellor_id} value={sup.counsellor_id}>
                      {sup.counsellor_name}
                    </option>
                  ))}
                  <option value="unassigned">Unassigned</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <div className="flex items-center mb-4">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <label className="text-sm font-medium text-gray-900">Date Range</label>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="mm/dd/yyyy"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="mm/dd/yyyy"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-white">
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={resetFilters}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                >
                  Clear All Filters
                </button>
                <span className="text-sm text-gray-500">
                  {activeFiltersCount} filter(s) active
                </span>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Apply Filters ({filteredUsers.length} results)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Modals */}
      <UserDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        user={selectedUser}
        displayStatus={displayStatus}
      />

      <PreferredModeModal
        isOpen={showPreferredModeModal}
        onClose={() => setShowPreferredModeModal(false)}
        onConfirm={confirmTogglePreferredMode}
        user={selectedUser}
      />

      <LogoutUserModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogoutUser}
        user={selectedUser}
      />

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onConfirm={confirmChangePassword}
        user={selectedUser}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        showPassword={showPassword}
        toggleShowPassword={toggleShowPassword}
        handleKeyDown={handleKeyDown}
      />

      <DisableUserModal
        isOpen={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onConfirm={confirmDisableUser}
        user={selectedUser}
      />

      <ChangeRoleModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onConfirm={confirmChangeRole}
        user={selectedUser}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
      />

      <SupervisorModal
        isOpen={showSupervisorModal}
        onClose={() => setShowSupervisorModal(false)}
        onConfirm={confirmChangeSupervisor}
        user={selectedUser}
        supervisors={supervisors}
        users={users}
        selectedSupervisorId={selectedSupervisorId}
        setSelectedSupervisorId={setSelectedSupervisorId}
        loading={false} // Add loading state if needed
      />
    </div>
  );
};

export default UserListing;