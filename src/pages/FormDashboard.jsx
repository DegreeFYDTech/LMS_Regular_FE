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
  BankOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { BASE_URL } from "../config/api";
import { fetchFilterOptions } from "../network/filterOptions";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const { Title, Text } = Typography;

const FormDashboard = () => {
  const navigate = useNavigate();
  const userRole = useSelector((state) => state.auth.user?.role);

  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);

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

  // Table columns
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
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Open Lead">
            <Button
              type="text"
              icon={<UserOutlined style={{ color: "#3b82f6", fontSize: 16 }} />}
              size="small"
              className="hover:bg-blue-50"
              onClick={(e) => {
                e.stopPropagation();
                handleStudentClick(record.studentId);
              }}
            />
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

  // Enhanced Stat Card Component with gradients and icons
  const StatCard = ({ title, value, icon, gradient }) => (
    <Card className="hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-gray-200 rounded-2xl">
      <div className="flex items-center justify-between">
        <div>
          <Text
            className="text-white text-opacity-90 text-sm uppercase tracking-wider font-medium"
            style={{
              background: gradient,
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            {title}
          </Text>
          <div
            className="text-4xl font-bold mt-2 text-white"
            style={{
              background: gradient,
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            {value}
          </div>
        </div>
        <div className="p-3 rounded-full">
          {React.cloneElement(icon, {
            style: { color: gradient, fontSize: "28px" },
          })}
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
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="mb-8">
        <Title level={2} className="!mb-1 text-gray-800">
          Form Dashboard
        </Title>
        <Text type="secondary" className="text-lg">
          Track and manage all student forms
        </Text>
      </div>

      {/* Enhanced Stats Cards */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Students"
            value={stats.total}
            icon={<TeamOutlined />}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Fresh"
            value={stats.fresh}
            icon={<RiseOutlined />}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Admission"
            value={stats.admission}
            icon={<BookOutlined />}
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Enrollment"
            value={stats.enrollment}
            icon={<FileDoneOutlined />}
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
          />
        </Col>
      </Row>

      {/* Filters Section - All in one line always visible */}
      <Card className="mb-6 shadow-sm border-0" bodyStyle={{ padding: "20px" }}>
        <Row gutter={[16, 16]} align="middle">
          {/* Search Input */}
          <Col xs={24} md={6} lg={5}>
            <Input
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={handleSearch}
              prefix={<SearchOutlined className="text-gray-400" />}
              size="large"
              allowClear
            />
          </Col>

          {/* University Filter */}
          <Col xs={24} md={4} lg={4}>
            <Select
              mode="multiple"
              placeholder="University"
              value={selectedColleges}
              onChange={setSelectedColleges}
              className="w-full"
              options={universityOptions}
              maxTagCount="responsive"
              loading={loadingFilters}
              allowClear
              showSearch
              optionFilterProp="label"
              size="large"
              maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
            />
          </Col>

          {/* Course Filter */}
          <Col xs={24} md={4} lg={4}>
            <Select
              mode="multiple"
              placeholder="Course"
              value={selectedCourses}
              onChange={setSelectedCourses}
              className="w-full"
              options={courseOptions}
              maxTagCount="responsive"
              loading={loadingFilters}
              allowClear
              showSearch
              optionFilterProp="label"
              size="large"
              maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
            />
          </Col>

          {/* Clear All Button - After Course */}

          {/* Lead Sub Status Filter */}
          <Col xs={24} md={4} lg={4}>
            <Select
              mode="multiple"
              placeholder="Lead Status"
              value={selectedLeadSubStatus}
              onChange={setSelectedLeadSubStatus}
              className="w-full"
              options={leadSubStatusOptions}
              maxTagCount="responsive"
              allowClear
              showSearch
              optionFilterProp="label"
              size="large"
              maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
            />
          </Col>

          {/* Source Filter */}
          <Col xs={24} md={3} lg={3}>
            <Select
              mode="multiple"
              placeholder="Source"
              value={selectedSource}
              onChange={setSelectedSource}
              className="w-full"
              options={sourceOptions}
              maxTagCount="responsive"
              loading={loadingFilters}
              allowClear
              showSearch
              optionFilterProp="label"
              size="large"
              maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
            />
          </Col>

          {/* Refresh Button */}
          <Col xs={24} md={1} lg={2}>
            <Tooltip title="Refresh data">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
                size="large"
                className="w-full"
              />
            </Tooltip>
          </Col>
          <Col xs={24} md={2} lg={2}>
            <Tooltip title="Clear all filters">
              <Button
                icon={<ClearOutlined />}
                onClick={clearFilters}
                size="large"
                danger={hasActiveFilters}
                disabled={!hasActiveFilters}
                className="w-full"
              >
                Clear All
              </Button>
            </Tooltip>
          </Col>
        </Row>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Space size={[0, 8]} wrap>
              <Text type="secondary" className="text-sm mr-2">
                Active filters:
              </Text>
              {selectedColleges.map((college) => (
                <Tag
                  key={college}
                  closable
                  onClose={() =>
                    setSelectedColleges(
                      selectedColleges.filter((c) => c !== college),
                    )
                  }
                  className="bg-blue-50 border-blue-200 text-blue-700"
                >
                  {college}
                </Tag>
              ))}
              {selectedCourses.map((course) => (
                <Tag
                  key={course}
                  closable
                  onClose={() =>
                    setSelectedCourses(
                      selectedCourses.filter((c) => c !== course),
                    )
                  }
                  className="bg-green-50 border-green-200 text-green-700"
                >
                  {course}
                </Tag>
              ))}
              {selectedLeadSubStatus.map((status) => (
                <Tag
                  key={status}
                  closable
                  onClose={() =>
                    setSelectedLeadSubStatus(
                      selectedLeadSubStatus.filter((s) => s !== status),
                    )
                  }
                  className="bg-purple-50 border-purple-200 text-purple-700"
                >
                  {status}
                </Tag>
              ))}
              {selectedSource.map((source) => (
                <Tag
                  key={source}
                  closable
                  onClose={() =>
                    setSelectedSource(
                      selectedSource.filter((s) => s !== source),
                    )
                  }
                  className="bg-orange-50 border-orange-200 text-orange-700"
                >
                  {source}
                </Tag>
              ))}
            </Space>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card className="shadow-sm border-0" bodyStyle={{ padding: 0 }}>
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
