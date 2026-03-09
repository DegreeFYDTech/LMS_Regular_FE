import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Select,
  Table,
  Input,
  Button,
  Tag,
  Space,
  Typography,
  Tooltip,
  message,
  Empty,
  Badge,
  Spin,
  Drawer,
  Divider,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  RiseOutlined,
  BookOutlined,
  FileDoneOutlined,
  FilterOutlined,
  ClearOutlined,
  PhoneFilled,
  WhatsAppOutlined,
  BankOutlined,
  ReadOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { BASE_URL } from "../config/api";
import { fetchFilterOptions } from "../network/filterOptions";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const FormDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    fresh: 0,
    admission: 0,
    enrollment: 0,
  });
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Filter options states
  const [universityOptions, setUniversityOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [leadSubStatusOptions, setLeadSubStatusOptions] = useState([]);
  const [sourceOptions, setSourceOptions] = useState([]);

  // Filter states
  const [selectedColleges, setSelectedColleges] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedLeadSubStatus, setSelectedLeadSubStatus] = useState([]);
  const [selectedSource, setSelectedSource] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Fetch filter options on component mount
  useEffect(() => {
    const fetchAllFilterOptions = async () => {
      setLoadingFilters(true);
      try {
        // Fetch university/course options
        const degreeResponse = await fetch(
          `${BASE_URL}/universitycourse/dropdown`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (degreeResponse.ok) {
          const data = await degreeResponse.json();

          // Transform university options
          const universities = (data.data?.universities || []).map((uni) => ({
            value: uni,
            label: uni,
          }));

          // Transform course options
          const courses = (data.data?.courses || []).map((course) => ({
            value: course,
            label: course,
          }));

          setUniversityOptions(universities);
          setCourseOptions(courses);
        }

        // Fetch source options
        const sourceResponse = await fetchFilterOptions();
        const sources = (sourceResponse.data?.source || []).map((src) => ({
          value: src,
          label: src,
        }));
        setSourceOptions(sources);

        // Lead sub status options
        setLeadSubStatusOptions([
          { value: "Interested", label: "Interested" },
          { value: "Not Interested", label: "Not Interested" },
          { value: "Follow-up", label: "Follow-up" },
          { value: "Converted", label: "Converted" },
          { value: "Callback Later", label: "Callback Later" },
          { value: "Wrong Number", label: "Wrong Number" },
          { value: "Not Reachable", label: "Not Reachable" },
          { value: "Already Enrolled", label: "Already Enrolled" },
          { value: "Not Eligible", label: "Not Eligible" },
        ]);
      } catch (error) {
        console.error("Error fetching filter options:", error);
        message.error("Failed to load filter options");
      } finally {
        setLoadingFilters(false);
      }
    };

    fetchAllFilterOptions();
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch data
  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        ...(selectedColleges.length > 0 && {
          college: selectedColleges.join(","),
        }),
        ...(selectedCourses.length > 0 && {
          course: selectedCourses.join(","),
        }),
        ...(selectedLeadSubStatus.length > 0 && {
          leadSubStatus: selectedLeadSubStatus.join(","),
        }),
        ...(selectedSource.length > 0 && { source: selectedSource.join(",") }),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      };

      const response = await axios.get(
        `${BASE_URL}/StudentCourseStatusLogs/get-forms-data`,
        { params },
      );

      if (response.data.success) {
        setStats(response.data.data.stats);
        setStudents(response.data.data.students);
        setPagination({
          current: response.data.data.pagination.currentPage,
          pageSize: response.data.data.pagination.itemsPerPage,
          total: response.data.data.pagination.totalItems,
        });
      }
    } catch (error) {
      message.error(
        "Failed to fetch data: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, pagination.pageSize);
  }, [
    selectedColleges,
    selectedCourses,
    selectedLeadSubStatus,
    selectedSource,
    debouncedSearchTerm,
  ]);

  const handleTableChange = (pagination) => {
    fetchData(pagination.current, pagination.pageSize);
  };

  const handleRefresh = () => {
    fetchData(pagination.current, pagination.pageSize);
    message.success("Data refreshed successfully");
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const applyFilters = () => {
    setFilterDrawerOpen(false);
    fetchData(1, pagination.pageSize);
    message.success("Filters applied");
  };

  const clearFilters = () => {
    setSelectedColleges([]);
    setSelectedCourses([]);
    setSelectedLeadSubStatus([]);
    setSelectedSource([]);
    setSearchTerm("");
    message.success("Filters cleared");
  };

  const getStatusColor = (status) => {
    const colors = {
      Admission: "green",
      Enrollment: "purple",
      Fresh: "blue",
      Interested: "cyan",
      "Not Interested": "default",
      "Follow-up": "orange",
      Converted: "success",
      "Callback Later": "gold",
      "Wrong Number": "red",
      "Not Reachable": "red",
      "Already Enrolled": "purple",
      "Not Eligible": "orange",
    };
    return colors[status] || "default";
  };

  const handleStudentClick = (studentId) => {
    navigate(`/student/${studentId}`);
  };

  // Table columns - Only first 2 columns fixed
  const columns = [
    {
      title: "Created At",
      key: "createdAt",
      width: 200,
      render: (_, record) => (
        <div className="flex items-center gap-2 cursor-pointer group">
          <span className="font-medium font-mono">
            {new Date(record.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
      ),
    },
    {
      title: "Student ID",
      key: "studentId",
      width: 150,
      render: (_, record) => (
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => handleStudentClick(record.studentId)}
        >
          <UserOutlined className="text-blue-500 group-hover:text-blue-600" />
          <span className="text-blue-600 group-hover:text-blue-800 font-medium font-mono">
            {record.studentId}
          </span>
        </div>
      ),
    },
    {
      title: "Student Name",
      key: "studentName",
      width: 200,
      // No fixed property - will scroll
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <div>
            <div className="font-semibold text-gray-900">
              {record.student?.studentName || "N/A"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Email",
      key: "email",
      width: 220,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <MailOutlined className="text-gray-400" />
          <Tooltip title={record.student?.studentEmail}>
            <span className="truncate max-w-[160px]">
              {record.student?.studentEmail || "--"}
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: "Phone",
      key: "phone",
      width: 160,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <PhoneOutlined className="text-gray-400" />
          <span>{record.student?.studentPhone || "--"}</span>
        </div>
      ),
    },
    {
      title: "University",
      key: "university",
      width: 250,
      render: (_, record) => (
        <div className="flex items-start gap-2">
          <BankOutlined className="text-gray-400 mt-1" />
          <div className="flex flex-col">
            <span className="font-medium">
              {record.universityCourse?.universityName || "--"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Course",
      key: "course",
      width: 350,
      render: (_, record) => (
        <div className="flex items-start gap-2">
          <ReadOutlined className="text-gray-400 mt-1" />
          <div className="flex flex-col">
            <span className="font-medium">
              {record.universityCourse?.courseName || "--"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Lead Status",
      key: "leadStatus",
      width: 150,
      render: (_, record) => {
        const status = record.latestRemark?.leadStatus || "Fresh";
        return (
          <Tag color={getStatusColor(status)} className="px-3 py-1">
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Lead Sub Status",
      key: "leadSubStatus",
      width: 200,
      render: (_, record) => {
        const subStatus = record.latestRemark?.leadSubStatus;
        return subStatus ? (
          <Tag color="purple" className="px-3 py-1">
            {subStatus}
          </Tag>
        ) : (
          <span className="text-gray-400">--</span>
        );
      },
    },
    {
      title: "L2 Counsellor",
      key: "l2Counsellor",
      width: 160,
      render: (_, record) => {
        const counsellorName =
          record.l2CounsellorName || record.student?.l2Counsellor?.name;
        return counsellorName ? (
          <div className="flex items-center gap-1">
            <UserOutlined className="text-gray-400 text-xs" />
            <span className="text-gray-700">{counsellorName}</span>
          </div>
        ) : (
          <span className="text-gray-400">--</span>
        );
      },
    },
    {
      title: "L3 Counsellor",
      key: "l3Counsellor",
      width: 160,
      render: (_, record) => {
        const counsellorName =
          record.l3CounsellorName || record.student?.l3Counsellor?.name;
        return counsellorName ? (
          <div className="flex items-center gap-1">
            <UserOutlined className="text-gray-400 text-xs" />
            <span className="text-gray-700">{counsellorName}</span>
          </div>
        ) : (
          <span className="text-gray-400">--</span>
        );
      },
    },
    {
      title: "Source",
      key: "source",
      width: 120,
      render: (_, record) => (
        <Tag color="geekblue" className="px-3 py-1">
          {record.firstLeadActivity?.source || "Unknown"}
        </Tag>
      ),
    },
    {
      title: "Campaign",
      key: "campaign",
      width: 180,
      render: (_, record) => (
        <Tooltip title={record.firstLeadActivity?.utmCampaign}>
          <span className="truncate max-w-[150px] block">
            {record.firstLeadActivity?.utmCampaign || "--"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right", // Actions column fixed on right
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Call">
            <Button
              type="text"
              icon={<PhoneFilled style={{ color: "#16a34a", fontSize: 16 }} />}
              size="small"
              className="hover:bg-green-50"
            />
          </Tooltip>
          <Tooltip title="Missed Call">
            <Button
              type="text"
              icon={
                <PhoneOutlined style={{ color: "#dc2626", fontSize: 16 }} />
              }
              size="small"
              className="hover:bg-red-50"
            />
          </Tooltip>
          <Tooltip title="WhatsApp">
            <Badge
              count={record.student?.unreadMessages}
              size="small"
              offset={[-5, 5]}
            >
              <Button
                type="text"
                icon={<WhatsAppOutlined style={{ fontSize: 16 }} />}
                size="small"
                className="hover:bg-green-50"
              />
            </Badge>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const dataSource = useMemo(() => {
    return students.map((student) => ({
      ...student,
      key: student.studentId,
    }));
  }, [students]);

  const StatCard = ({ title, value, icon, color }) => (
    <Card
      className="hover:shadow-lg transition-all duration-300"
      bodyStyle={{ padding: "20px" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <Text type="secondary" className="text-sm uppercase tracking-wider">
            {title}
          </Text>
          <div className="text-3xl font-bold mt-2" style={{ color }}>
            {value}
          </div>
        </div>
        <div
          className="p-3 rounded-full"
          style={{ backgroundColor: `${color}20` }}
        >
          {React.cloneElement(icon, { style: { color, fontSize: "24px" } })}
        </div>
      </div>
    </Card>
  );

  const hasActiveFilters =
    selectedColleges.length > 0 ||
    selectedCourses.length > 0 ||
    selectedLeadSubStatus.length > 0 ||
    selectedSource.length > 0;

  const activeFilterCount = [
    ...selectedColleges,
    ...selectedCourses,
    ...selectedLeadSubStatus,
    ...selectedSource,
  ].length;

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Stats Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Students"
            value={stats.total}
            icon={<TeamOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Fresh"
            value={stats.fresh}
            icon={<RiseOutlined />}
            color="#52c41a"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Admission"
            value={stats.admission}
            icon={<BookOutlined />}
            color="#faad14"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Enrollment"
            value={stats.enrollment}
            icon={<FileDoneOutlined />}
            color="#722ed1"
          />
        </Col>
      </Row>

      {/* Search Bar and Filter Button */}
      <div className="mb-6 flex gap-3">
        <Input
          placeholder="Search by name, email, phone..."
          value={searchTerm}
          onChange={handleSearch}
          prefix={<SearchOutlined className="text-gray-400" />}
          className="flex-1"
          size="large"
          allowClear
        />
        <Badge count={activeFilterCount} offset={[-5, 5]}>
          <Button
            type="primary"
            icon={<FilterOutlined />}
            onClick={() => setFilterDrawerOpen(true)}
            size="large"
            className="bg-blue-600"
          >
            Filters
          </Button>
        </Badge>
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={loading}
          size="large"
        >
          Refresh
        </Button>
      </div>

      {/* Filter Drawer */}
      <Drawer
        title={
          <div className="flex justify-between items-center">
            <span>Filters</span>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setFilterDrawerOpen(false)}
            />
          </div>
        }
        placement="right"
        onClose={() => setFilterDrawerOpen(false)}
        open={filterDrawerOpen}
        width={400}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={clearFilters}>Clear All</Button>
            <Button
              type="primary"
              onClick={applyFilters}
              className="bg-blue-600"
            >
              Apply Filters
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {loadingFilters && (
            <div className="text-center py-4">
              <Spin />
              <p className="text-gray-500 mt-2">Loading filters...</p>
            </div>
          )}

          <div>
            <Text strong className="text-gray-700">
              University
            </Text>
            <Select
              mode="multiple"
              placeholder="Select universities"
              value={selectedColleges}
              onChange={setSelectedColleges}
              className="w-full mt-1"
              options={universityOptions}
              maxTagCount="responsive"
              loading={loadingFilters}
              allowClear
              showSearch
              optionFilterProp="label"
              size="large"
            />
          </div>

          <Divider className="my-3" />

          <div>
            <Text strong className="text-gray-700">
              Course
            </Text>
            <Select
              mode="multiple"
              placeholder="Select courses"
              value={selectedCourses}
              onChange={setSelectedCourses}
              className="w-full mt-1"
              options={courseOptions}
              maxTagCount="responsive"
              loading={loadingFilters}
              allowClear
              showSearch
              optionFilterProp="label"
              size="large"
            />
          </div>

          <Divider className="my-3" />

          <div>
            <Text strong className="text-gray-700">
              Lead Sub Status
            </Text>
            <Select
              mode="multiple"
              placeholder="Select sub status"
              value={selectedLeadSubStatus}
              onChange={setSelectedLeadSubStatus}
              className="w-full mt-1"
              options={leadSubStatusOptions}
              maxTagCount="responsive"
              allowClear
              showSearch
              optionFilterProp="label"
              size="large"
            />
          </div>

          <Divider className="my-3" />

          <div>
            <Text strong className="text-gray-700">
              Source
            </Text>
            <Select
              mode="multiple"
              placeholder="Select sources"
              value={selectedSource}
              onChange={setSelectedSource}
              className="w-full mt-1"
              options={sourceOptions}
              maxTagCount="responsive"
              loading={loadingFilters}
              allowClear
              showSearch
              optionFilterProp="label"
              size="large"
            />
          </div>
        </div>
      </Drawer>

      {/* Table */}
      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="studentId"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} items`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 2000 }}
          rowClassName="hover:bg-gray-50 cursor-pointer"
          onRow={(record) => ({
            onClick: (e) => {
              // Only trigger if not clicking on action buttons
              if (!e.target.closest(".ant-btn")) {
                handleStudentClick(record.studentId);
              }
            },
          })}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No data found"
              />
            ),
          }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default FormDashboard;