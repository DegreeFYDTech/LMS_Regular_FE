import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Table,
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Button,
  Drawer,
  Tag,
  Avatar,
  Space,
  Tooltip,
  Badge,
  Typography,
  DatePicker,
  Select,
  Empty,
  message,
  Divider,
  Modal,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  StopOutlined,
  WifiOutlined,
  EyeOutlined,
  KeyOutlined,
  SettingOutlined,
  PoweroffOutlined,
  LogoutOutlined,
  UsergroupAddOutlined,
  HistoryOutlined,
  ReloadOutlined,
  PlusOutlined,
  ClearOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";

import {
  getAllCounsellors,
  updateCounsellorStatus,
  changeCounsellorPassword,
  updateCounsellorPreferredMode,
  makeCounsellorLogout,
  changeSupervisor,
  getAllSupervisors,
  registerAgent,
  toggleBlockCounsellor,
} from "../network/counsellor";

import UserDetailsModal from "../components/modals/UserDetailsModal";
import LogoutUserModal from "../components/modals/LogoutCounsellorModal";
import ChangePasswordModal from "../components/modals/ChangePasswordModal";
import DisableUserModal from "../components/modals/DisableUserModal";
import ChangeRoleModal from "../components/modals/ChangeRoleModal";
import PreferredModeModal from "../components/modals/PreferredModeModal";
import SupervisorModal from "../components/modals/SupervisorModal";
import AccessSettingsModal from "../components/modals/AccessSettingsModal";
import BulkAccessModal from "../components/modals/BulkAccessModal";
import Loader from "../common/Loader";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ROLE_COLORS = {
  to: "purple",
  admission_to: "magenta",
  l3: "blue",
  l2: "green",
  enrollment_counsellor: "cyan",
  Supervisor: "gold",
};

const STATUS_CONFIG = {
  active: { color: "success", label: "Active", tagColor: "success" },
  inactive: { color: "error", label: "Inactive", tagColor: "error" },
  suspended: { color: "warning", label: "Suspended", tagColor: "warning" },
};

const UserListing = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // Filter state (pending — applied on drawer close or search change)
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [supervisorFilter, setSupervisorFilter] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Track if any filter is active
  const hasActiveFilter = roleFilter || statusFilter || supervisorFilter || dateRange.length === 2 || searchQuery;

  // Modal visibility
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [showPreferredModeModal, setShowPreferredModeModal] = useState(false);

  // Selected data
  const [selectedUser, setSelectedUser] = useState(null);
  const [accessUser, setAccessUser] = useState(null);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAddingPartner, setIsAddingPartner] = useState(false);

  const storedUser = useSelector((state) => state.auth.user);
  const storedRole = useSelector((state) => state.auth.role);
  const isSupervisor = storedRole === "Supervisor";

  // Debounce search
  const searchTimer = useRef(null);

  const buildParams = useCallback(
    (page, limit) => {
      const params = { page, limit };
      if (storedUser?.role === "Supervisor") params.role = roleFilter || "all";
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter) params.status = statusFilter;
      if (supervisorFilter) params.supervisor_id = supervisorFilter;
      if (dateRange.length === 2) {
        params.start_date = dateRange[0].startOf("day").toISOString();
        params.end_date = dateRange[1].endOf("day").toISOString();
      }
      return params;
    },
    [storedUser?.role, roleFilter, searchQuery, statusFilter, supervisorFilter, dateRange]
  );

  const fetchData = useCallback(
    async (page = 1, limit = pageSize) => {
      setIsLoading(true);
      try {
        const params = buildParams(page, limit);
        const [counsellorsResponse, supervisorsData] = await Promise.all([
          getAllCounsellors(params),
          getAllSupervisors(),
        ]);

        const counsellors = counsellorsResponse.counsellors ?? counsellorsResponse;
        const totalCount = counsellorsResponse.total ?? counsellors.length;
        const supervisorsList =
          supervisorsData.counsellors || supervisorsData.data || supervisorsData;

        const supervisorMap = {};
        supervisorsList.forEach((sup) => {
          supervisorMap[sup.counsellor_id] = sup.counsellor_name;
        });

        const formatted = (Array.isArray(counsellors) ? counsellors : []).map((c) => ({
          ...c,
          key: c.counsellor_id,
          supervisor_name:
            c.supervisor_name ||
            (c.assigned_to ? supervisorMap[c.assigned_to] || "Unknown" : null),
        }));

        setUsers(formatted);
        setTotal(totalCount);
        setSupervisors(supervisorsList);
        setCurrentPage(page);
        setPageSize(limit);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [buildParams, pageSize]
  );

  // Initial load
  useEffect(() => {
    fetchData(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search refetch
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchData(1, pageSize);
    }, 400);
    return () => clearTimeout(searchTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Refetch when drawer filters are applied (via Apply button)
  const applyFilters = () => {
    setShowFilters(false);
    fetchData(1, pageSize);
  };

  const resetFilters = () => {
    setRoleFilter("");
    setStatusFilter("");
    setSupervisorFilter("");
    setDateRange([]);
  };

  // Stats computed from current page
  const stats = [
    {
      title: "Total (Page)",
      value: users.length,
      icon: <TeamOutlined className="text-blue-500" />,
      borderColor: "border-l-blue-500",
    },
    {
      title: "Active",
      value: users.filter((u) => u.status === "active").length,
      icon: <CheckCircleOutlined className="text-green-500" />,
      borderColor: "border-l-green-500",
    },
    {
      title: "Supervised",
      value: users.filter((u) => u.assigned_to).length,
      icon: <UserOutlined className="text-purple-500" />,
      borderColor: "border-l-purple-500",
    },
    {
      title: "Inactive",
      value: users.filter((u) => u.status === "inactive").length,
      icon: <StopOutlined className="text-red-500" />,
      borderColor: "border-l-red-500",
    },
    {
      title: "Remote",
      value: users.filter((u) => u.counsellor_preferred_mode === "Online").length,
      icon: <WifiOutlined className="text-indigo-500" />,
      borderColor: "border-l-indigo-500",
    },
    {
      title: "Total Records",
      value: total,
      icon: <PlusOutlined className="text-orange-500" />,
      borderColor: "border-l-orange-500",
    },
  ];

  // Action handlers
  const handleViewDetails = (user) => { setSelectedUser(user); setShowDetailsModal(true); };
  const handleLogoutUser = (user) => { setSelectedUser(user); setShowLogoutModal(true); };
  const handleChangePassword = (user) => {
    setSelectedUser(user);
    setShowChangePasswordModal(true);
    setNewPassword("");
    setConfirmPassword("");
  };
  const handleDisableUser = (user) => { setSelectedUser(user); setShowDisableModal(true); };
  const handleChangeSupervisor = (user) => {
    setSelectedUser(user);
    setSelectedSupervisorId(user.assigned_to || "");
    setShowSupervisorModal(true);
  };
  const handleAccessSettings = (user) => { setAccessUser(user); setShowAccessModal(true); };

  const confirmLogoutUser = async () => {
    try {
      await makeCounsellorLogout(selectedUser.counsellor_id);
      setShowLogoutModal(false);
      message.success("User logged out successfully!");
    } catch (err) {
      message.error(`Failed to logout user: ${err.message}`);
    }
  };

  const handleToggleBlock = (user) => {
    Modal.confirm({
      title: user.is_blocked ? "Unblock Agent" : "Block Agent",
      content: `Are you sure you want to ${user.is_blocked ? "unblock" : "block"} ${user.counsellor_name}?`,
      okText: "Yes",
      cancelText: "No",
      onOk: async () => {
        try {
          const res = await toggleBlockCounsellor(user.counsellor_id);
          setUsers((prev) =>
            prev.map((u) =>
              u.counsellor_id === user.counsellor_id ? { ...u, is_blocked: res.is_blocked } : u
            )
          );
          message.success(res.message);
        } catch (error) {
          message.error(`Failed to toggle block status: ${error.message}`);
        }
      },
    });
  };

  const confirmDisableUser = async () => {
    try {
      const newStatus = selectedUser.status === "inactive" ? "active" : "inactive";
      await updateCounsellorStatus(selectedUser.counsellor_id, newStatus);
      setUsers(users.map((u) =>
        u.counsellor_id === selectedUser.counsellor_id ? { ...u, status: newStatus } : u
      ));
      setShowDisableModal(false);
      message.success(`User ${newStatus === "active" ? "enabled" : "disabled"} successfully!`);
    } catch (err) {
      message.error(`Status update failed: ${err.message}`);
    }
  };

  const confirmChangePassword = async () => {
    try {
      await changeCounsellorPassword(selectedUser.counsellor_id, newPassword);
      setShowChangePasswordModal(false);
      message.success("Password changed successfully!");
    } catch (err) {
      message.error(`Failed to change password: ${err.message}`);
    }
  };

  const confirmChangeSupervisor = async (supervisorId) => {
    const finalId = supervisorId !== undefined ? supervisorId : selectedSupervisorId;
    try {
      await changeSupervisor(selectedUser.counsellor_id, finalId || null);
      const updatedName = finalId
        ? supervisors.find((s) => s.counsellor_id === finalId)?.counsellor_name
        : null;
      setUsers(users.map((u) =>
        u.counsellor_id === selectedUser.counsellor_id
          ? { ...u, assigned_to: finalId || null, supervisor_name: updatedName }
          : u
      ));
      setShowSupervisorModal(false);
      message.success("Supervisor updated successfully!");
    } catch (err) {
      message.error(`Failed to update supervisor: ${err.message}`);
    }
  };

  // const handleAddPartner = async (partnerData) => {
  //   setIsAddingPartner(true);
  //   try {
  //     const payload = {
  //       ...partnerData,
  //       team_owner_id: storedUser.counsellor_id,
  //       preferredMode: "Online",
  //       role: "l2",
  //       is_partner: true,
  //     };
  //     const response = await registerAgent(payload);
  //     if (response.counsellor) {
  //       setUsers((prev) => [{ ...response.counsellor, key: response.counsellor.counsellor_id }, ...prev]);
  //     }
  //     message.success("Partner added successfully!");
  //   } catch (err) {
  //     message.error(err.message || "Failed to add partner");
  //   } finally {
  //     setIsAddingPartner(false);
  //   }
  // };

  const columns = [
    {
      title: "Agent",
      key: "info",
      fixed: "left",
      width: 220,
      render: (_, record) => (
        <Space size="middle">
          <Avatar
            size={42}
            style={{ backgroundColor: "#1677ff", fontWeight: 700, fontSize: 16 }}
          >
            {record.counsellor_name?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div className="font-semibold text-gray-800 text-sm leading-tight">
              {record.counsellor_name}
            </div>
            <Text type="secondary" className="text-xs">
              {record.id_code || `#${record.counsellor_id}`}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "counsellor_email",
      key: "email",
      width: 220,
      render: (email) => (
        <Text copyable className="text-xs text-gray-600">
          {email}
        </Text>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 130,
      render: (role) => (
        <Tag
          color={ROLE_COLORS[role] || "default"}
          className="uppercase font-semibold text-xs rounded-full px-3"
        >
          {role}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status, record) => {
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;
        return (
          <Space direction="vertical" size={0}>
            <Badge
              status={cfg.color}
              text={
                <span className={`text-xs font-medium ${status === "active" ? "text-green-600" : status === "suspended" ? "text-yellow-600" : "text-red-500"}`}>
                  {cfg.label}
                </span>
              }
            />
            {record.is_blocked && (
              <Tag color="red" className="text-[10px] m-0 mt-1">Blocked</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Supervisor",
      key: "supervisor",
      width: 160,
      render: (_, record) =>
        record.role === "to" ? (
          <Tag color="magenta" icon={<UserOutlined />} className="text-xs">
            Team Owner
          </Tag>
        ) : record.supervisor_name ? (
          <Space size={4}>
            <Badge status="processing" />
            <span className="text-xs text-gray-600">{record.supervisor_name}</span>
          </Space>
        ) : (
          <Text type="secondary" className="text-xs italic">
            Not Assigned
          </Text>
        ),
    },
    {
      title: "Work Mode",
      dataIndex: "counsellor_preferred_mode",
      key: "mode",
      width: 110,
      render: (mode) => (
        <Tag
          icon={<WifiOutlined />}
          color={mode === "Online" ? "processing" : "default"}
          className="text-xs rounded-md"
        >
          {mode || "Regular"}
        </Tag>
      ),
    },
    {
      title: "Joined",
      dataIndex: "created_at",
      key: "created",
      width: 110,
      render: (date) => (
        <span className="text-xs text-gray-500">{dayjs(date).format("DD MMM YYYY")}</span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 200,
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="View Profile">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
              className="text-blue-400 hover:text-blue-600 hover:bg-blue-50"
            />
          </Tooltip>
          <Tooltip title="Change Password">
            <Button
              type="text"
              size="small"
              icon={<KeyOutlined />}
              onClick={() => handleChangePassword(record)}
              className="text-yellow-400 hover:text-yellow-600 hover:bg-yellow-50"
            />
          </Tooltip>
          {storedUser?.role === "Supervisor" && (
            <Tooltip title="Access Settings">
              <Button
                type="text"
                size="small"
                icon={<SettingOutlined />}
                onClick={() => handleAccessSettings(record)}
                className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50"
              />
            </Tooltip>
          )}
          {record.role !== "to" && (
            <Tooltip title="Reassign Supervisor">
              <Button
                type="text"
                size="small"
                icon={<TeamOutlined />}
                onClick={() => handleChangeSupervisor(record)}
                className="text-purple-400 hover:text-purple-600 hover:bg-purple-50"
              />
            </Tooltip>
          )}
          <Tooltip title={record.status === "active" ? "Deactivate" : "Activate"}>
            <Button
              type="text"
              size="small"
              icon={<PoweroffOutlined />}
              onClick={() => handleDisableUser(record)}
              className={record.status === "active" ? "text-red-400 hover:text-red-600 hover:bg-red-50" : "text-green-400 hover:text-green-600 hover:bg-green-50"}
            />
          </Tooltip>
          <Tooltip title="Force Logout">
            <Button
              type="text"
              size="small"
              icon={<LogoutOutlined />}
              onClick={() => handleLogoutUser(record)}
              className="text-orange-400 hover:text-orange-600 hover:bg-orange-50"
            />
          </Tooltip>
          {storedUser?.role === "Supervisor" && (
            <Tooltip title={record.is_blocked ? "Unblock Agent" : "Block Agent"}>
              <Button
                type="text"
                size="small"
                icon={record.is_blocked ? <UnlockOutlined /> : <LockOutlined />}
                onClick={() => handleToggleBlock(record)}
                className={record.is_blocked ? "text-green-400 hover:text-green-600 hover:bg-green-50" : "text-red-400 hover:text-red-600 hover:bg-red-50"}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  if (isLoading && users.length === 0) return <Loader />;

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Title level={3} className="m-0 text-gray-800">
            Agent Management
          </Title>
          <Text type="secondary" className="text-sm">
            Monitor and manage your team — {total} total agents
          </Text>
        </div>

        <Space wrap>
          <Input
            placeholder="Search by name or email..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            className="w-64 rounded-lg"
          />
          <Button
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(true)}
            type={hasActiveFilter ? "primary" : "default"}
            className="rounded-lg"
          >
            Filters
            {hasActiveFilter && (
              <Badge
                count=" "
                dot
                style={{ backgroundColor: "#fff", marginLeft: 4 }}
              />
            )}
          </Button>
          {isSupervisor && (
            <Button
              icon={<HistoryOutlined />}
              onClick={() => (window.location.href = "/login-attempts")}
              className="rounded-lg"
            >
              Log History
            </Button>
          )}
          {storedUser?.is_partner && (
            <Button
              type="primary"
              icon={<UsergroupAddOutlined />}
              onClick={() => setShowAddPartnerModal(true)}
              className="rounded-lg"
            >
              Add Partner
            </Button>
          )}
          <Tooltip title="Refresh">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchData(currentPage, pageSize)}
              loading={isLoading}
              className="rounded-lg"
            />
          </Tooltip>
        </Space>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        {stats.map((item, idx) => (
          <Col xs={12} sm={8} lg={4} key={idx}>
            <Card
              className={`rounded-xl border-0 border-l-4 ${item.borderColor} shadow-sm hover:shadow-md transition-shadow`}
              bodyStyle={{ padding: "16px 20px" }}
            >
              <Statistic
                title={<span className="text-xs text-gray-500 font-medium">{item.title}</span>}
                value={item.value}
                prefix={item.icon}
                valueStyle={{ color: "#1f2937", fontWeight: 700, fontSize: 22 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Table Card */}
      <Card
        className="rounded-xl border-0 shadow-sm"
        bodyStyle={{ padding: 0 }}
        title={
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-base font-semibold text-gray-700">Agent Roster</span>
            <Space>
              {storedUser?.role === "Supervisor" && (
                <Button
                  type="primary"
                  size="small"
                  disabled={selectedRowKeys.length === 0}
                  onClick={() => setShowBulkModal(true)}
                >
                  Bulk Access ({selectedRowKeys.length})
                </Button>
              )}
              <Text type="secondary" className="text-xs">
                {users.length} of {total} shown
              </Text>
            </Space>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          loading={isLoading}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys, rows) => {
              setSelectedRowKeys(keys);
              setSelectedUsers(rows);
            },
          }}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (tot, [start, end]) =>
              `${start}–${end} of ${tot} agents`,
            onChange: (page, size) => fetchData(page, size),
          }}
          scroll={{ x: 1300 }}
          size="middle"
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-gray-400">
                    {hasActiveFilter ? "No agents matched your filters" : "No agents found"}
                  </span>
                }
              />
            ),
          }}
          rowClassName="hover:bg-blue-50/30 transition-colors"
        />
      </Card>

      {/* Filters Drawer */}
      <Drawer
        title={
          <Space>
            <FilterOutlined className="text-blue-500" />
            <span className="font-semibold">Filter Agents</span>
          </Space>
        }
        placement="right"
        onClose={() => setShowFilters(false)}
        open={showFilters}
        width={360}
        footer={
          <Space className="w-full justify-between">
            <Button
              icon={<ClearOutlined />}
              onClick={resetFilters}
              disabled={!hasActiveFilter}
            >
              Reset All
            </Button>
            <Button type="primary" onClick={applyFilters} className="px-6">
              Apply Filters
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size={20} className="w-full">
          <div>
            <Text strong className="block mb-2 text-gray-700">
              Role
            </Text>
            <Select
              className="w-full"
              placeholder="All Roles"
              value={roleFilter || undefined}
              onChange={(v) => setRoleFilter(v || "")}
              allowClear
              size="large"
              options={[
                { label: "Level 2 (L2)", value: "l2" },
                { label: "Level 3 (L3)", value: "l3" },
              ]}
            />
          </div>

          <Divider className="my-0" />

          <div>
            <Text strong className="block mb-2 text-gray-700">
              Account Status
            </Text>
            <Select
              className="w-full"
              placeholder="All Statuses"
              value={statusFilter || undefined}
              onChange={(v) => setStatusFilter(v || "")}
              allowClear
              size="large"
              options={[
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
                { label: "Suspended", value: "suspended" },
              ]}
            />
          </div>

          <Divider className="my-0" />

          <div>
            <Text strong className="block mb-2 text-gray-700">
              Supervisor / Team Owner
            </Text>
            <Select
              className="w-full"
              placeholder="All Supervisors"
              value={supervisorFilter || undefined}
              onChange={(v) => setSupervisorFilter(v || "")}
              allowClear
              showSearch
              optionFilterProp="label"
              size="large"
              options={[
                { label: "— Unassigned —", value: "unassigned" },
                ...supervisors.map((s) => ({
                  label: s.counsellor_name,
                  value: s.counsellor_id,
                })),
              ]}
            />
          </div>

          <Divider className="my-0" />

          <div>
            <Text strong className="block mb-2 text-gray-700">
              Onboarding Date Range
            </Text>
            <RangePicker
              className="w-full"
              size="large"
              value={dateRange.length ? dateRange : undefined}
              onChange={(dates) => setDateRange(dates || [])}
              format="DD MMM YYYY"
            />
          </div>
        </Space>
      </Drawer>

      {/* Modals */}
      <UserDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        user={selectedUser}
        displayStatus={(u) =>
          u.status === "active" ? "Active" : u.status === "suspended" ? "Suspended" : "Inactive"
        }
      />

      <PreferredModeModal
        isOpen={showPreferredModeModal}
        onClose={() => setShowPreferredModeModal(false)}
        onConfirm={async () => {
          const newMode =
            selectedUser.counsellor_preferred_mode === "Online" ? "Regular" : "Online";
          await updateCounsellorPreferredMode(selectedUser.counsellor_id, newMode);
          fetchData(currentPage, pageSize);
          setShowPreferredModeModal(false);
          message.success(`Mode updated to ${newMode}`);
        }}
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
      />

      {/* <AddPartnerModal
        isOpen={showAddPartnerModal}
        onClose={() => setShowAddPartnerModal(false)}
        onSubmit={handleAddPartner}
        teamOwnerId={storedUser?.id}
        isLoading={isAddingPartner}
      /> */}

      <DisableUserModal
        isOpen={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onConfirm={confirmDisableUser}
        user={selectedUser}
      />

      <ChangeRoleModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onConfirm={() => {
          message.info("Role change pending in API");
          setShowRoleModal(false);
        }}
        user={selectedUser}
      />

      <SupervisorModal
        isOpen={showSupervisorModal}
        onClose={() => setShowSupervisorModal(false)}
        onConfirm={confirmChangeSupervisor}
        user={selectedUser}
        supervisors={supervisors}
        selectedSupervisorId={selectedSupervisorId}
        setSelectedSupervisorId={setSelectedSupervisorId}
        users={users}
      />

      <BulkAccessModal
        isOpen={showBulkModal}
        onClose={() => {
          setShowBulkModal(false);
          setSelectedRowKeys([]);
        }}
        users={selectedUsers}
      />

      <AccessSettingsModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        counsellor={accessUser}
      />
    </div>
  );
};

export default UserListing;
