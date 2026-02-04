import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AddDirectStudent } from "../network/student";
import { fetchFilterOptions } from "../network/filterOptions";
import { useSelector } from "react-redux";
import { Select, Modal, Button, Form, Input, Alert, Spin } from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CloseOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { BASE_URL } from "../config/api";

const { Option } = Select;

const AddLeadModal = ({ isOpen, onClose, onSuccess, agentID, defaultMode }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sourceOptions, setSourceOptions] = useState([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [degreeOptions, setDegreeOptions] = useState([]);
  const [loadingDegrees, setLoadingDegrees] = useState(false);
  const [selectedSource, setSelectedSource] = useState("student_ref");

  const navigate = useNavigate();
  const roletosend = useSelector((state) => state.auth.user);

  const isAgentMissing = roletosend?.id.includes("SUP") && !agentID;

  // Check if user is L1 or L2 role (lowercase)
  const isL1OrL2 =
    roletosend?.role?.toLowerCase() === "l1" ||
    roletosend?.role?.toLowerCase() === "l2";

  // Determine source options based on role
  const sourceTypeOptions =
    roletosend?.role === "Supervisor"
      ? ["counsellor_ref", "student_ref", "other"]
      : ["student_ref"];

  // Check if there's only one source option
  const hasSingleSource = sourceTypeOptions.length === 1;

  useEffect(() => {
    console.log("User role:", roletosend?.role, "Is L1/L2:", isL1OrL2);
  }, [roletosend, isL1OrL2]);

  useEffect(() => {
    // Set default source when there's only one option
    if (hasSingleSource && sourceTypeOptions[0]) {
      setSelectedSource(sourceTypeOptions[0]);
      form.setFieldsValue({
        source: sourceTypeOptions[0],
      });
    }
  }, [hasSingleSource, sourceTypeOptions, form]);

  useEffect(() => {
    const fetchSources = async () => {
      if (selectedSource === "other") {
        setLoadingSources(true);
        try {
          const response = await fetchFilterOptions();
          setSourceOptions(response.data.source || []);
        } catch (error) {
          console.error("Error fetching source options:", error);
          setError("Failed to load source options");
        } finally {
          setLoadingSources(false);
        }
      }
    };

    fetchSources();
  }, [selectedSource]);

  // SINGLE useEffect for fetching degree options
  useEffect(() => {
    const fetchDegreeOptions = async () => {
      if (!isAgentMissing && isOpen) {
        setLoadingDegrees(true);
        try {
          const response = await fetch(`${BASE_URL}/universitycourse/dropdown`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log("Degree options fetched:", data.data?.degrees || []);
            setDegreeOptions(data.data?.degrees || []);
          } else {
            console.error("Failed to fetch degree options, status:", response.status);
            setDegreeOptions([]);
          }
        } catch (error) {
          console.error("Error fetching degree options:", error);
          setDegreeOptions([]);
        } finally {
          setLoadingDegrees(false);
        }
      }
    };

    fetchDegreeOptions();
  }, [isL1OrL2, isOpen]);

  const handleSourceChange = (value) => {
    setSelectedSource(value);
    // Clear dependent fields when source changes
    form.setFieldsValue({
      referenceValue: "",
      selectedOtherSource: "",
    });
  };

  const resetForm = () => {
    form.resetFields();
    setSelectedSource(hasSingleSource ? sourceTypeOptions[0] : "student_ref");
    setError("");
    // Set default source again after reset
    if (hasSingleSource && sourceTypeOptions[0]) {
      form.setFieldsValue({
        source: sourceTypeOptions[0],
      });
    }
  };

  const handleSubmit = async (values) => {
    if (isAgentMissing) return;

    setLoading(true);
    setError("");

    try {
      // Prepare payload matching the API expectations
      const payload = {
        name: values.name,
        email: values.email,
        phoneNumber: values.phoneNumber,
        counselloridFe:
          JSON.parse(localStorage.getItem("agent"))?.counsellor_id ||
          (roletosend?.role !== "Supervisor" && roletosend?.id),
      };

      // Get the actual source value
      const actualSource = values.source || selectedSource;
      
      // Handle different source types
      if (actualSource === "student_ref") {
        payload.source = actualSource;
        payload.referenceFrom = values.referenceValue || "";
      } else if (actualSource === "other") {
        payload.source = values.selectedOtherSource;
        payload.referenceFrom = "other";
      } else {
        // counsellor_ref
        payload.source = actualSource;
      }

      // DEBUG: Check all form values
      console.log("=== DEBUG FORM VALUES ===");
      console.log("All form values:", values);
      console.log("preferred_degree value:", values.preferred_degree);
      console.log("Type of preferred_degree:", typeof values.preferred_degree);
      console.log("Is L1/L2:", isL1OrL2);
      console.log("=========================");
      
      // Add preferred_degree for L1/L2 roles
      if (isL1OrL2) {
        // Check if preferred_degree exists and has values
        if (values.preferred_degree && Array.isArray(values.preferred_degree) && values.preferred_degree.length > 0) {
          payload.preferred_degree = values.preferred_degree;
          console.log("Adding preferred_degree to payload:", values.preferred_degree);
        } else {
          console.log("No preferred_degree selected or empty array");
        }
      }

      console.log("Submitting payload:", payload);

      // Use the new API function
      const response = await AddDirectStudent(payload);

      setLoading(false);

      if (response.data?.success) {
        onSuccess(response.data);
        onClose();
        resetForm();

        if (response.data?.data?.studentId) {
          navigate(`/student/${response.data.data.studentId}`);
        }
      } else {
        throw new Error(response.data?.message || "Failed to add lead");
      }
    } catch (err) {
      setLoading(false);
      const errorMessage =
        err.response?.data?.message ||
        err.data?.message ||
        err.message ||
        "Failed to add lead";
      setError(errorMessage);
      console.error("Error adding lead:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      title={
        <div className="flex items-center text-xl font-semibold">
          <UserOutlined className="mr-2" />
          Add New Lead
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      onOk={() => form.submit()}
      footer={null}
      width={600}
      closeIcon={<CloseOutlined />}
      centered
      afterClose={resetForm}
    >
      <p className="text-gray-600 mb-6">
        Enter the details of the new lead below.
      </p>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          className="mb-4"
          closable
          onClose={() => setError("")}
        />
      )}

      {isAgentMissing && (
        <Alert
          message="Please select an agent first before adding a lead."
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          source: hasSingleSource ? sourceTypeOptions[0] : selectedSource,
          preferred_degree: [], // Initialize as empty array
        }}
        // Add form name to ensure proper registration
        name="addLeadForm"
      >
        <div className="grid grid-cols-2 gap-4 ">
          <Form.Item
            label="Full Name"
            name="name"
            rules={[{ required: true, message: "Please enter full name" }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="John Doe"
              disabled={isAgentMissing}
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Phone"
            name="phoneNumber"
            rules={[
              { required: true, message: "Please enter phone number" },
              {
                pattern: /^\d{10}$/,
                message: "Phone number must be exactly 10 digits",
              },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="10-digit phone number"
              maxLength={10}
              disabled={isAgentMissing}
              size="large"
            />
          </Form.Item>
        </div>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please enter email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
          className="mb-4"
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="john.doe@example.com"
            disabled={isAgentMissing}
            size="large"
          />
        </Form.Item>

        {/* Preferred Degree Field for L1/L2 roles */}
        {!isAgentMissing && (
          <Form.Item
            label="Preferred Degree(s)"
            name="preferred_degree"
            className="mb-4"
            extra={!loadingDegrees && degreeOptions.length === 0 && (
              <span className="text-yellow-600 text-sm">
                No degree options available. Please check the API connection.
              </span>
            )}
            // Ensure proper form field registration
            getValueFromEvent={(value) => {
              console.log("getValueFromEvent called with:", value);
              return value || [];
            }}
          >
            {loadingDegrees ? (
              <div className="flex items-center justify-center p-4 border border-gray-300 rounded">
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                />
                <span className="ml-2 text-gray-500">Loading degrees...</span>
              </div>
            ) : (
              <Select
                mode="multiple"
                placeholder={
                  degreeOptions.length === 0 
                    ? "No degrees available" 
                    : "Select preferred degree(s)"
                }
                disabled={isAgentMissing || degreeOptions.length === 0}
                size="large"
                style={{ width: "100%" }}
                maxTagCount="responsive"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                allowClear
                notFoundContent={
                  <div className="p-2 text-center text-gray-500">
                    No degrees found
                  </div>
                }
                onChange={(value) => {
                  console.log("Select onChange called with:", value);
                  form.setFieldsValue({ preferred_degree: value || [] });
                }}
              >
                {degreeOptions.map((degree) => (
                  <Option key={degree} value={degree}>
                    {degree}
                  </Option>
                ))}
              </Select>
            )}
            <div className="mt-2 text-sm text-gray-500">
              {!loadingDegrees && degreeOptions.length > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  {degreeOptions.length} degree options available
                </div>
              )}
            </div>
          </Form.Item>
        )}

        <Form.Item
          label="Source"
          name="source"
          className="mb-4"
          getValueProps={(value) => ({
            value: value
              ? value.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
              : "",
          })}
        >
          {hasSingleSource ? (
            <Input
              disabled
              size="large"
              className="bg-gray-50"
            />
          ) : (
            <Select
              onChange={handleSourceChange}
              disabled={isAgentMissing}
              size="large"
            >
              {sourceTypeOptions.map((source) => (
                <Option key={source} value={source}>
                  {source
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </Option>
              ))}
            </Select>
          )}
        </Form.Item>

        {/* Additional input for student_ref */}
        {selectedSource === "student_ref" && (
          <Form.Item
            label="Student ID"
            name="referenceValue"
            rules={[{ required: true, message: "Please enter student ID" }]}
            className="mb-4"
          >
            <Input
              placeholder="Enter student ID (e.g., STD-12345678)"
              disabled={isAgentMissing}
              size="large"
            />
          </Form.Item>
        )}

        {/* Additional dropdown for other source */}
        {selectedSource === "other" && (
          <Form.Item
            label="Select Source"
            name="selectedOtherSource"
            rules={[{ required: true, message: "Please select a source" }]}
            className="mb-4"
          >
            {loadingSources ? (
              <div className="flex items-center justify-center p-4 border border-gray-300 rounded">
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                />
                <span className="ml-2 text-gray-500">Loading sources...</span>
              </div>
            ) : (
              <Select
                placeholder="Select a source"
                disabled={isAgentMissing}
                size="large"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                <Option value="">Select a source</Option>
                {sourceOptions.map((source) => (
                  <Option key={source} value={source}>
                    {source}
                  </Option>
                ))}
              </Select>
            )}
          </Form.Item>
        )}

        <Form.Item className="mb-0">
          <div className="flex justify-end space-x-3">
            <Button onClick={onClose} size="large">
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              disabled={isAgentMissing}
            >
              {isAgentMissing ? "Select Agent First" : "Add Lead"}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddLeadModal;