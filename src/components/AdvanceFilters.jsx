import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { debounce } from "lodash";

// Ant Design imports
import {
  Card,
  Button,
  Input,
  Space,
  Drawer,
  Tag,
  Badge,
  Row,
  Col,
  Form,
  Select,
  Typography,
  ConfigProvider,
  Checkbox,
  Radio,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  CloseOutlined,
  ClearOutlined,
  CheckOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

import { fetchFilterOptions } from "../network/filterOptions";
import { SlidersHorizontal, Trash } from "lucide-react";

const { Option } = Select;
const { Text } = Typography;
const { Group: RadioGroup } = Radio;

// Main StreamlinedFilters component
const StreamlinedFilters = ({
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  loading = false,
  activeTab,
}) => {
  const [form] = Form.useForm();
  const authUser = useSelector((state) => state.auth.user);
  const [localFilters, setLocalFilters] = useState(filters || {});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filterOptionsState, setFilterOptionsState] = useState({
    mode: [],
    source: [],
    sub_lead_status: [],
    lead_status: [],
    calling_status: [],
    calling_sub_status: [],
    campaign_name: [],
  });

  const roleToSend = (() => {
    try {
      const agent = JSON.parse(localStorage.getItem("agent") || "{}");
      return agent?.role || authUser?.role;
    } catch (error) {
      console.error("Error parsing agent from localStorage:", error);
      return authUser?.role;
    }
  })();

  // Sync localFilters with props filters when they change
  useEffect(() => {
    setLocalFilters(filters || {});
    form.setFieldsValue(filters || {});
  }, [filters, form]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const { data } = await fetchFilterOptions();
        setFilterOptionsState({
          mode: data.mode || [],
          source: data.source || [],
          sub_lead_status: data.sub_lead_status || [],
          lead_status: data.lead_status || [],
          calling_status: data.calling_status || [],
          calling_sub_status: data.calling_sub_status || [],
          campaign_name: data.campaign_name || [],
        });
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };
    fetchOptions();
  }, []);

  // Handle local filter changes
  const debouncedFilterChange = useCallback(
    debounce((key, value, updatedFilters) => {
      onFilterChange(key, value, updatedFilters);
    }, 500),
    [],
  );

  const handleLocalFilterChange = (key, value) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
    form.setFieldsValue({ [key]: value });
    debouncedFilterChange(key, value, updatedFilters);
  };

  // Apply filters
  const handleApplyFilters = () => {
    const values = form.getFieldsValue();
    const filtersToApply = { ...localFilters, ...values };
    onApplyFilters(filtersToApply);
    setIsDrawerOpen(false);
  };

  // Get tab-specific filters that should be preserved
  const getTabSpecificFilters = () => {
    const tabSpecificFilters = {};

    // Always preserve these base filters
    if (localFilters.data) tabSpecificFilters.data = localFilters.data;
    if (localFilters.selectedagent)
      tabSpecificFilters.selectedagent = localFilters.selectedagent;

    // Add tab-specific filters
    switch (activeTab) {
      case "callback":
        if (localFilters.callback)
          tabSpecificFilters.callback = localFilters.callback;
        break;
      case "wishlist":
        if (localFilters.wishlist)
          tabSpecificFilters.wishlist = localFilters.wishlist;
        break;
      default:
        break;
    }

    return tabSpecificFilters;
  };

  // Clear all filters but preserve tab-specific ones
  const handleClearFilters = () => {
    // Get tab-specific filters to preserve
    const tabSpecificFilters = getTabSpecificFilters();

    // Create cleared filters with preserved tab-specific filters
    const clearedFilters = {
      ...tabSpecificFilters,
      sortBy: "createdAt",
      sortOrder: "desc",
    };

    setLocalFilters(clearedFilters);
    form.setFieldsValue(clearedFilters);
    onClearFilters();
  };

  // Count active filters based on activeTab
  const getActiveFiltersCount = () => {
    const tabSpecificKeys = [
      "data",
      "selectedagent",
      "freshLeads",
      "callback",
      "wishlist",
      "sortBy",
      "sortOrder",
    ];

    if (activeTab === "fresh") {
      // Only count user-applied filters for Fresh tab (exclude tab-specific filters)
      const userAppliedFilters = [
        "createdAt_start",
        "createdAt_end",
        "source",
        "searchTerm",
      ];
      return Object.entries(localFilters).filter(
        ([key, value]) =>
          userAppliedFilters.includes(key) &&
          value &&
          value !== "" &&
          (Array.isArray(value) ? value.length > 0 : true),
      ).length;
    } else {
      // Count all filters except tab-specific ones for Dashboard and Callback tabs
      return Object.entries(localFilters).filter(
        ([key, value]) =>
          !tabSpecificKeys.includes(key) &&
          value &&
          value !== "" &&
          (Array.isArray(value) ? value.length > 0 : true),
      ).length;
    }
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Handle HTML date input change
  const handleDateInputChange = (key, e) => {
    const value = e.target.value;
    handleLocalFilterChange(key, value);
  };

  // Render HTML date input component
  const renderDateInput = (key, placeholder) => {
    const value = localFilters[key] || "";

    return (
      <div style={{ width: "100%" }}>
        <input
          type="date"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleDateInputChange(key, e)}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #d9d9d9",
            borderRadius: "6px",
            fontSize: "14px",
            height: "32px",
            boxSizing: "border-box",
          }}
        />
      </div>
    );
  };

  // Render filters based on activeTab
  const renderFilters = () => {
    if (activeTab === "fresh") {
      return (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <div style={{ marginBottom: "8px" }}>
              <Text strong>Added On Date Range</Text>
            </div>
            <div
              style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}
            >
              <Form.Item style={{ flex: 1, marginBottom: 0 }}>
                {renderDateInput("createdAt_start", "Start Date")}
              </Form.Item>
              <div style={{ lineHeight: "32px", color: "#666" }}>to</div>
              <Form.Item style={{ flex: 1, marginBottom: 0 }}>
                {renderDateInput("createdAt_end", "End Date")}
              </Form.Item>
            </div>
          </Col>

          <Col span={24}>
            <Form.Item label="Source">
              <Select
                mode="multiple"
                placeholder="Select Source"
                value={localFilters.source}
                onChange={(value) => handleLocalFilterChange("source", value)}
                allowClear
                style={{ width: "100%" }}
              >
                {filterOptionsState.source.map((option) => (
                  <Option key={option} value={option}>
                    {option}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      );
    } else {
      return (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <div style={{ marginBottom: "8px" }}>
              <Text strong>Added On Date Range</Text>
            </div>
            <div
              style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}
            >
              <Form.Item style={{ flex: 1, marginBottom: 0 }}>
                {renderDateInput("createdAt_start", "Start Date")}
              </Form.Item>
              <div style={{ lineHeight: "32px", color: "#666" }}>to</div>
              <Form.Item style={{ flex: 1, marginBottom: 0 }}>
                {renderDateInput("createdAt_end", "End Date")}
              </Form.Item>
            </div>
          </Col>

          {activeTab === "callback" && (
            <Col span={24}>
              <div style={{ marginBottom: "8px" }}>
                <Text
                  strong
                >{`Callback Date Range (${roleToSend === "l3" ? "L3" : "L2"})`}</Text>
              </div>
              {roleToSend === "l3" ? (
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "flex-start",
                  }}
                >
                  <Form.Item style={{ flex: 1, marginBottom: 0 }}>
                    {renderDateInput("nextCallDateL3_start", "Start Date")}
                  </Form.Item>
                  <div style={{ lineHeight: "32px", color: "#666" }}>to</div>
                  <Form.Item style={{ flex: 1, marginBottom: 0 }}>
                    {renderDateInput("nextCallDateL3_end", "End Date")}
                  </Form.Item>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "flex-start",
                  }}
                >
                  <Form.Item style={{ flex: 1, marginBottom: 0 }}>
                    {renderDateInput("nextCallDate_start", "Start Date")}
                  </Form.Item>
                  <div style={{ lineHeight: "32px", color: "#666" }}>to</div>
                  <Form.Item style={{ flex: 1, marginBottom: 0 }}>
                    {renderDateInput("nextCallDate_end", "End Date")}
                  </Form.Item>
                </div>
              )}
            </Col>
          )}

          <Col span={24}>
            <Form.Item label="Source">
              <Select
                mode="multiple"
                placeholder="Select Source"
                value={localFilters.source}
                onChange={(value) => handleLocalFilterChange("source", value)}
                allowClear
                style={{ width: "100%" }}
              >
                {filterOptionsState.source.map((option) => (
                  <Option key={option} value={option}>
                    {option}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Lead Status">
              <Select
                mode="multiple"
                placeholder="Select Lead Status"
                value={localFilters.lead_status}
                onChange={(value) =>
                  handleLocalFilterChange("lead_status", value)
                }
                allowClear
                style={{ width: "100%" }}
              >
                {filterOptionsState.lead_status.map((option) => (
                  <Option key={option} value={option}>
                    {option}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Lead Sub Status">
              <Select
                mode="multiple"
                placeholder="Select Lead Sub Status"
                value={localFilters.sub_lead_status}
                onChange={(value) =>
                  handleLocalFilterChange("sub_lead_status", value)
                }
                allowClear
                style={{ width: "100%" }}
              >
                {filterOptionsState.sub_lead_status.map((option) => (
                  <Option key={option} value={option}>
                    {option}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Calling Status">
              <Select
                mode="multiple"
                placeholder="Select Calling Status"
                value={localFilters.calling_status}
                onChange={(value) =>
                  handleLocalFilterChange("calling_status", value)
                }
                allowClear
                style={{ width: "100%" }}
              >
                {filterOptionsState.calling_status.map((option) => (
                  <Option key={option} value={option}>
                    {option}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Sub Calling Status">
              <Select
                mode="multiple"
                placeholder="Select Sub Calling Status"
                value={localFilters.calling_sub_status}
                onChange={(value) =>
                  handleLocalFilterChange("calling_sub_status", value)
                }
                allowClear
                style={{ width: "100%" }}
              >
                {filterOptionsState.calling_sub_status.map((option) => (
                  <Option key={option} value={option}>
                    {option}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Campaign Name">
              <Select
                mode="multiple"
                placeholder="Select Campaign Name"
                value={localFilters.campaign_name}
                onChange={(value) =>
                  handleLocalFilterChange("campaign_name", value)
                }
                allowClear
                style={{ width: "100%" }}
              >
                {filterOptionsState.campaign_name.map((option) => (
                  <Option key={option} value={option}>
                    {option}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Lead Reactive">
              <RadioGroup
                value={localFilters.lead_reactive}
                onChange={(e) =>
                  handleLocalFilterChange("lead_reactive", e.target.value)
                }
              >
                <Radio value="true">Yes</Radio>
                <Radio value="false">No</Radio>
              </RadioGroup>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Connection Status">
              <RadioGroup
                value={localFilters.isconnectedyet}
                onChange={(e) =>
                  handleLocalFilterChange("isconnectedyet", e.target.value)
                }
              >
                <Radio value="Connected">Connected</Radio>
                <Radio value="Not Connected">Not Connected</Radio>
              </RadioGroup>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Unread Messages">
              <RadioGroup
                value={localFilters.number_of_unread_messages}
                onChange={(e) =>
                  handleLocalFilterChange(
                    "number_of_unread_messages",
                    e.target.value,
                  )
                }
              >
                <Radio value="true">Yes</Radio>
                <Radio value="false">No</Radio>
              </RadioGroup>
            </Form.Item>
          </Col>
          {
            <Col span={24}>
              <Form.Item label="Is Reassigned">
                <RadioGroup
                  value={localFilters.isReassignedYet}
                  onChange={(e) =>
                    handleLocalFilterChange("isReassignedYet", e.target.value)
                  }
                >
                  <Radio value="true">Yes</Radio>
                  <Radio value="false">No</Radio>
                </RadioGroup>
              </Form.Item>
            </Col>
          }
        </Row>
      );
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1890ff",
          borderRadius: 6,
        },
      }}
    >
      <div className="mb-6">
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name, email, phone or lead ID..."
              className="w-full pl-5 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm text-gray-700 placeholder-gray-400"
              value={localFilters.searchTerm || ""}
              onChange={(e) =>
                handleLocalFilterChange("searchTerm", e.target.value)
              }
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="relative flex items-center px-6 py-2 cursor-pointer bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            <SlidersHorizontal size={18} className="mr-2 text-blue-600" />
            <span className="text-gray-700">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Clear Filters Button */}
          <button
            onClick={handleClearFilters}
            disabled={loading}
            className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg cursor-pointer hover:bg-red-700 disabled:opacity-50 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            {loading ? (
              <Trash size={18} className="mr-2 animate-spin" />
            ) : (
              <Trash size={18} className="mr-2" />
            )}
            Clear All
          </button>
        </div>
      </div>

      {/* Filter Drawer */}
      <Drawer
        title={
          <Space>
            <FilterOutlined />
            <Text strong>Filter Options</Text>
            {activeFiltersCount > 0 && (
              <Tag color="blue">{activeFiltersCount} active</Tag>
            )}
          </Space>
        }
        placement="right"
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        width={500}
        destroyOnClose={false}
        extra={
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => setIsDrawerOpen(false)}
          />
        }
        footer={
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearFilters}
              disabled={loading}
              size="large"
            >
              Clear All
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleApplyFilters}
              loading={loading}
              size="large"
            >
              Apply Filters
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          size="middle"
          initialValues={localFilters}
        >
          {renderFilters()}
        </Form>
      </Drawer>
    </ConfigProvider>
  );
};

export default StreamlinedFilters;
