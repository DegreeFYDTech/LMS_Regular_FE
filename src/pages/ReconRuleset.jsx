import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table,
  Card,
  Button,
  Modal,
  Input,
  Select,
  Tag,
  Tabs,
  Form,
  Space,
  Tooltip,
  Popconfirm,
  message,
  Row,
  Col,
  Badge,
  Drawer
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TableOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { BASE_URL } from '../config/api';
import { fetchLeadOptions } from '../network/leadassignmentl2';

const { TabPane } = Tabs;
const { Option } = Select;

const ReconRuleset = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form] = Form.useForm();
  
  const [options, setOptions] = useState({
    mode: ['Any'],
    source: ['Any'],
    utmCampaign: ['Any'],
    preferred_degree: ['Any'],
    preferred_specialization: ['Any'],
    preferred_level: ['Any', 'Undergraduate', 'Postgraduate', 'Doctorate', 'Diploma', 'Certificate'],
    current_profession: ['Any', 'Student', 'Working Professional', 'Business Owner', 'Homemaker', 'Other'],
    preferred_budget: ['Any', '0-5 Lakhs', '5-10 Lakhs', '10-20 Lakhs', '20+ Lakhs']
  });

  const [universityOptions, setUniversityOptions] = useState([]);
  const [dropdownData, setDropdownData] = useState({
    universities: [],
    degrees: [],
    specializations: [],
    cities: [],
    states: [],
    levels: []
  });

  // Load university dropdown data
  const loadUniversityData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/universitycourse/dropdown`);
      const data = response.data.data;
      
      setDropdownData({
        universities: data.universities || [],
        degrees: data.degrees || [],
        specializations: data.specializations || [],
        cities: data.cities || [],
        states: data.states || [],
        levels: data.levels || []
      });

      setOptions(prev => ({
        ...prev,
        preferred_degree: ['Any', ...(data.degrees || [])],
        preferred_specialization: ['Any', ...(data.specializations || [])],
        preferred_level: ['Any', ...(data.levels || []), 'Undergraduate', 'Postgraduate', 'Doctorate', 'Diploma', 'Certificate']
      }));

      setUniversityOptions(data.universities || []);
    } catch (error) {
      console.error('Error loading university data:', error);
      message.error('Failed to load university data');
    }
  };

  const loadLeadOptions = async () => {
    try {
      const data = await fetchLeadOptions();
      setOptions(prev => ({
        ...prev,
        mode: [...(data?.data.mode || []), 'Any'],
        source: [...(data?.data.source || []), 'Any'],
        utmCampaign: [...(data?.data.utm_campaign || data?.data?.campaign_name || []), 'Any']
      }));
    } catch (error) {
      console.error('Error loading lead options:', error);
    }
  };

  // Fetch rules
  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/leadassignmentrecon`);
      setRules(response.data.data || []);
    } catch (error) {
      message.error('Failed to fetch rules');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    loadUniversityData();
    loadLeadOptions();
  }, []);

  const handleOpenModal = (rule = null) => {
    setEditingRule(rule);
    if (rule) {
      form.setFieldsValue({
        custom_rule_name: rule.custom_rule_name,
        conditions: rule.conditions,
        assigned_university_names: rule.assigned_university_names,
        is_active: rule.is_active
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ is_active: true });
    }
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        conditions: cleanConditions(values.conditions),
        priority: editingRule?.priority || 0
      };

      if (editingRule) {
        await axios.put(
          `${BASE_URL}/leadassignmentrecon/${editingRule.lead_assignment_rule_recon_id}`,
          payload
        );
        message.success('Rule updated successfully');
      } else {
        await axios.post(`${BASE_URL}/leadassignmentrecon`, payload);
        message.success('Rule created successfully');
      }

      setModalVisible(false);
      fetchRules();
    } catch (error) {
      message.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const cleanConditions = (conditions) => {
    const cleaned = {};
    Object.entries(conditions || {}).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0 && !(value.length === 1 && value[0] === 'Any')) {
        cleaned[key] = value.filter(v => v !== 'Any');
      } else if (typeof value === 'string' && value.trim() && value !== 'Any') {
        cleaned[key] = value.trim();
      }
    });
    return cleaned;
  };

  const handleDelete = async (ruleId) => {
    try {
      await axios.delete(`${BASE_URL}/leadassignmentrecon/${ruleId}`);
      message.success('Rule deleted successfully');
      fetchRules();
    } catch (error) {
      message.error('Failed to delete rule');
    }
  };

  const handleToggleStatus = async (ruleId, currentStatus) => {
    try {
      await axios.patch(
        `${BASE_URL}/leadassignmentrecon/${ruleId}/toggle-status`,
        { is_active: !currentStatus }
      );
      message.success(`Rule ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchRules();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const renderConditionValue = (value) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value || '-';
  };

  // Table columns
  const columns = [
    {
      title: 'Rule Name',
      dataIndex: 'custom_rule_name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text || record.name}</div>
        </div>
      )
    },
    {
      title: 'Conditions',
      dataIndex: 'conditions',
      key: 'conditions',
      render: (conditions) => (
        <div className="max-w-xs">
          {Object.entries(conditions || {}).map(([key, value]) => (
            <div key={key} className="text-xs mb-1">
              <span className="font-medium">{key}:</span> {renderConditionValue(value)}
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'Universities',
      dataIndex: 'assigned_university_names',
      key: 'universities',
      render: (universities) => (
        <div className="flex flex-wrap gap-1">
          {universities?.slice(0, 2).map((uni, idx) => (
            <Tag key={idx} color="blue" className="text-xs">
              {uni}
            </Tag>
          ))}
          {universities?.length > 2 && (
            <Tag className="text-xs">+{universities.length - 2} more</Tag>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'status',
      render: (active) => (
        <Tag color={active ? "green" : "red"}>
          {active ? "Active" : "Inactive"}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="Delete this rule?"
            onConfirm={() => handleDelete(record.lead_assignment_rule_recon_id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const isMobile = window.innerWidth < 768;

  return (
    <div className="min-h-[80vh] bg-gray-50 p-4 md:p-6">
      <div className=" mx-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Recon Ruleset</h1>
            <p className="text-gray-600 text-sm md:text-base">Manage lead assignment rules for universities</p>
          </div>
          
          <div className="flex items-center justify-between md:justify-end gap-2">
            {isMobile ? (
              <Button
                icon={<MenuOutlined />}
                onClick={() => setDrawerVisible(true)}
              />
            ) : (
              <div className="flex items-center space-x-2 md:space-x-4">
                <div className="bg-white ">
                  <Tabs
                    activeKey={viewMode}
                    onChange={setViewMode}
                    size="small"
                    tabBarStyle={{ margin: 0 }}
                  >
                    <TabPane
                      tab={
                        <span>
                          <TableOutlined />
                          {!isMobile && <span className="ml-1">Table</span>}
                        </span>
                      }
                      key="table"
                    />
                    <TabPane
                      tab={
                        <span>
                          <AppstoreOutlined />
                          {!isMobile && <span className="ml-1">Cards</span>}
                        </span>
                      }
                      key="card"
                    />
                  </Tabs>
                </div>
                
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchRules}
                  loading={loading}
                />
              </div>
            )}
            
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
              className="md:ml-2"
            >
              {!isMobile && 'Create Rule'}
            </Button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <Drawer
          title="Menu"
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={250}
        >
          <div className="flex flex-col space-y-4">
            <div className="bg-white border rounded-lg overflow-hidden">
              <Tabs
                activeKey={viewMode}
                onChange={(key) => {
                  setViewMode(key);
                  setDrawerVisible(false);
                }}
                tabPosition="top"
                centered
              >
                <TabPane
                  tab={
                    <span className="flex items-center">
                      <TableOutlined />
                      <span className="ml-2">Table</span>
                    </span>
                  }
                  key="table"
                />
                <TabPane
                  tab={
                    <span className="flex items-center">
                      <AppstoreOutlined />
                      <span className="ml-2">Cards</span>
                    </span>
                  }
                  key="card"
                />
              </Tabs>
            </div>
            
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchRules();
                setDrawerVisible(false);
              }}
              loading={loading}
              block
            >
              Refresh
            </Button>
          </div>
        </Drawer>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : rules.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No rules found</h3>
              <p className="text-gray-500 mb-4">Create your first rule to get started</p>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenModal()}
              >
                Create First Rule
              </Button>
            </div>
          </Card>
        ) : viewMode === 'table' ? (
          <Card className="overflow-x-auto">
            <Table
              dataSource={rules}
              columns={columns}
              rowKey="lead_assignment_rule_recon_id"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                size: isMobile ? 'small' : 'default'
              }}
              size={isMobile ? "small" : "middle"}
              scroll={isMobile ? { x: 600 } : {}}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule) => (
              <Card
                key={rule.lead_assignment_rule_recon_id}
                className="hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 line-clamp-1">
                      {rule.custom_rule_name || rule.name}
                    </h3>
                  </div>
                  <Tag color={rule.is_active ? "green" : "red"} size={isMobile ? "small" : "default"}>
                    {rule.is_active ? "Active" : "Inactive"}
                  </Tag>
                </div>
                
                <div className="mb-3">
                  <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-1">Conditions:</h4>
                  <div className="max-h-24 overflow-y-auto">
                    {Object.entries(rule.conditions || {}).map(([key, value]) => (
                      <div key={key} className="text-xs text-gray-600 mb-1">
                        <span className="font-medium">{key}:</span> {renderConditionValue(value)}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mb-3">
                  <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-1">Universities:</h4>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {rule.assigned_university_names?.map((uni, idx) => (
                      <Tag key={idx} color="cyan" className="text-xs">
                        {uni}
                      </Tag>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center space-x-1">
                    <Badge count={rule.total_matched_leads || 0} size={isMobile ? "small" : "default"} />
                    <span className="text-xs text-gray-500">matches</span>
                  </div>
                  <div className="flex space-x-1">
                    <Tooltip title="Edit">
                      <Button
                        icon={<EditOutlined />}
                        size={isMobile ? "small" : "default"}
                        onClick={() => handleOpenModal(rule)}
                      />
                    </Tooltip>
                    <Tooltip title={rule.is_active ? "Deactivate" : "Activate"}>
                      <Button
                        size={isMobile ? "small" : "default"}
                        onClick={() => handleToggleStatus(rule.lead_assignment_rule_recon_id, rule.is_active)}
                        type={rule.is_active ? "default" : "primary"}
                      >
                        {rule.is_active ? "Off" : "On"}
                      </Button>
                    </Tooltip>
                    <Popconfirm
                      title="Delete this rule?"
                      onConfirm={() => handleDelete(rule.lead_assignment_rule_recon_id)}
                    >
                      <Tooltip title="Delete">
                        <Button
                          icon={<DeleteOutlined />}
                          size={isMobile ? "small" : "default"}
                          danger
                        />
                      </Tooltip>
                    </Popconfirm>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Modal
          title={editingRule ? "Edit Rule" : "Create New Rule"}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          width={isMobile ? "95%" : 800}
          footer={null}
          destroyOnClose
          className=" overflow-y-auto"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="modal-form"
          >
            {/* Rule Name and Universities in one line */}
            <Row gutter={isMobile ? 0 : 16}>
              <Col span={isMobile ? 24 : 12} className={isMobile ? "mb-4" : ""}>
                <Form.Item
                  label="Rule Name"
                  name="custom_rule_name"
                  rules={[{ required: true, message: 'Please enter rule name' }]}
                >
                  <Input placeholder="Enter rule name" size={isMobile ? "large" : "middle"} />
                </Form.Item>
              </Col>
              <Col span={isMobile ? 24 : 12}>
                <Form.Item
                  label="Assign Universities"
                  name="assigned_university_names"
                  rules={[{ required: true, message: 'Please assign universities' }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="Select universities"
                    allowClear
                    showSearch
                    size={isMobile ? "large" : "middle"}
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    maxTagCount={isMobile ? 1 : "responsive"}
                  >
                    {dropdownData.universities.map(uni => (
                      <Option key={uni} value={uni}>{uni}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <div className="mb-4">
              <h4 className="font-medium mb-3">Conditions</h4>
              
              <Row gutter={isMobile ? 0 : 16}>
                <Col span={isMobile ? 24 : 12} className={isMobile ? "mb-4" : ""}>
                  <Form.Item label="UTM Campaign" name={['conditions', 'utmCampaign']}>
                    <Select 
                      mode="multiple" 
                      placeholder="Select UTM campaigns"
                      size={isMobile ? "large" : "middle"}
                    >
                      {options.utmCampaign.map(opt => (
                        <Option key={opt} value={opt}>{opt}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={isMobile ? 24 : 12} className={isMobile ? "mb-4" : ""}>
                  <Form.Item label="Source" name={['conditions', 'source']}>
                    <Select 
                      mode="multiple" 
                      placeholder="Select sources"
                      size={isMobile ? "large" : "middle"}
                    >
                      {options.source.map(opt => (
                        <Option key={opt} value={opt}>{opt}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={isMobile ? 0 : 16}>
                <Col span={isMobile ? 24 : 12} className={isMobile ? "mb-4" : ""}>
                  <Form.Item label="Mode" name={['conditions', 'mode']}>
                    <Select 
                      mode="multiple" 
                      placeholder="Select modes"
                      size={isMobile ? "large" : "middle"}
                    >
                      {options.mode.map(opt => (
                        <Option key={opt} value={opt}>{opt}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={isMobile ? 24 : 12} className={isMobile ? "mb-4" : ""}>
                  <Form.Item label="Preferred Level" name={['conditions', 'preferred_level']}>
                    <Select 
                      mode="multiple" 
                      placeholder="Select levels"
                      size={isMobile ? "large" : "middle"}
                    >
                      {options.preferred_level.map(opt => (
                        <Option key={opt} value={opt}>{opt}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={isMobile ? 0 : 16}>
                <Col span={isMobile ? 24 : 12} className={isMobile ? "mb-4" : ""}>
                  <Form.Item label="Preferred Degree" name={['conditions', 'preferred_degree']}>
                    <Select 
                      mode="multiple" 
                      placeholder="Select degrees"
                      size={isMobile ? "large" : "middle"}
                    >
                      {dropdownData.degrees.map(degree => (
                        <Option key={degree} value={degree}>{degree}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={isMobile ? 24 : 12} className={isMobile ? "mb-4" : ""}>
                  <Form.Item label="Specialization" name={['conditions', 'preferred_specialization']}>
                    <Select 
                      mode="multiple" 
                      placeholder="Select specializations"
                      size={isMobile ? "large" : "middle"}
                    >
                      {dropdownData.specializations.map(spec => (
                        <Option key={spec} value={spec}>{spec}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={isMobile ? 0 : 16}>
                <Col span={isMobile ? 24 : 12} className={isMobile ? "mb-4" : ""}>
                  <Form.Item label="Preferred City" name={['conditions', 'preferred_city']}>
                    <Select 
                      placeholder="Select city"
                      size={isMobile ? "large" : "middle"}
                      showSearch
                    >
                      <Option value="Any">Any</Option>
                      {dropdownData.cities.map(city => (
                        <Option key={city} value={city}>{city}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={isMobile ? 24 : 12} className={isMobile ? "mb-4" : ""}>
                  <Form.Item label="Preferred State" name={['conditions', 'preferred_state']}>
                    <Select 
                      placeholder="Select state"
                      size={isMobile ? "large" : "middle"}
                      showSearch
                    >
                      <Option value="Any">Any</Option>
                      {dropdownData.states.map(state => (
                        <Option key={state} value={state}>{state}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={isMobile ? 0 : 16}>
                <Col span={isMobile ? 24 : 12} className={isMobile ? "mb-4" : ""}>
                  <Form.Item label="Current Profession" name={['conditions', 'current_profession']}>
                    <Select 
                      placeholder="Select profession"
                      size={isMobile ? "large" : "middle"}
                    >
                      {options.current_profession.map(opt => (
                        <Option key={opt} value={opt}>{opt}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={isMobile ? 24 : 12}>
                  <Form.Item label="Preferred Budget" name={['conditions', 'preferred_budget']}>
                    <Select 
                      placeholder="Select budget"
                      size={isMobile ? "large" : "middle"}
                    >
                      {options.preferred_budget.map(opt => (
                        <Option key={opt} value={opt}>{opt}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Form.Item className="mb-0">
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <Button 
                  onClick={() => setModalVisible(false)}
                  size={isMobile ? "large" : "middle"}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  size={isMobile ? "large" : "middle"}
                  className="w-full sm:w-auto"
                >
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default ReconRuleset;