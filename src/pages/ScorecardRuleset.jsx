import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Button,
  Space,
  Card,
  Statistic,
  Row,
  Col,
  Modal,
  message,
  Table,
  Tag,
  Switch,
  InputNumber,
  Select,
  Form,
  Input,
  Divider,
  Tooltip,
  Drawer,
  Descriptions,
  Progress,
  Alert,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  StopOutlined,
  SettingOutlined,
  MessageOutlined,
  PhoneOutlined,
  SaveOutlined,
  ClockCircleOutlined,
  CalculatorOutlined,
  PercentageOutlined,
  NumberOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { BASE_URL } from "../config/api";
import { fetchLeadOptions } from "../network/leadassignmentl2";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const ScorecardRuleset = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [scoreDrawerVisible, setScoreDrawerVisible] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [scoreForm] = Form.useForm();

  const [options, setOptions] = useState({
    sources: [],
    campaigns: [],
  });

  useEffect(() => {
    loadRules();
    loadLeadOptions();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/scorecard/rules`);
      if (response.data.success) {
        setRules(response.data.data || []);
      }
    } catch (error) {
      message.error("Failed to load rules");
    } finally {
      setLoading(false);
    }
  };

  const loadLeadOptions = async () => {
    try {
      const data = await fetchLeadOptions();
      setOptions({
        sources: [...(data?.data.source || []), "Any"],
        campaigns: [...(data?.data.utm_campaign || data?.data?.campaign_name || []), "Any"],
      });
    } catch (error) {
      console.error("Error loading lead options:", error);
      // Fallback options
      setOptions({
        sources: ["Google", "Facebook", "Instagram", "LinkedIn", "Twitter", "Direct", "Referral", "Any"],
        campaigns: ["Summer Campaign", "Winter Campaign", "Festival Campaign", "Weekend Campaign", "Any"],
      });
    }
  };

  const handleSaveRule = async (values) => {
    setSubmitting(true);
    try {
      const sources = values.sources?.filter(s => s !== "Any") || [];
      const campaigns = values.campaigns?.filter(c => c !== "Any") || [];
      
      const payload = {
        rule_name: values.rule_name,
        sources: sources,
        source_urls: values.source_urls || [],
        campaigns: campaigns,
        score_type: values.score_type,
        score_value: values.score_value || 0,
        per_remark_score: values.per_remark_score || 0,
        not_connected_score: values.not_connected_score || 0,
        daily_limit_score: values.daily_limit_score || 0,
      };

      if (editingRule) {
        await axios.put(`${BASE_URL}/scorecard/rules/${editingRule.id}`, payload);
        message.success("Rule updated");
      } else {
        await axios.post(`${BASE_URL}/scorecard/rules`, payload);
        message.success("Rule created");
      }
      
      setModalVisible(false);
      form.resetFields();
      setEditingRule(null);
      loadRules();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to save rule");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRule = (rule) => {
    Modal.confirm({
      title: "Delete Rule",
      content: `Delete "${rule.rule_name}"?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await axios.delete(`${BASE_URL}/scorecard/rules/${rule.id}`);
          message.success("Rule deleted");
          loadRules();
        } catch (error) {
          message.error("Failed to delete rule");
        }
      },
    });
  };

  const handleToggleRule = async (rule) => {
    try {
      await axios.patch(`${BASE_URL}/scorecard/rules/${rule.id}/toggle`);
      message.success(`Rule ${rule.is_active ? "deactivated" : "activated"}`);
      loadRules();
    } catch (error) {
      message.error("Failed to toggle rule");
    }
  };

  const handleDuplicateRule = (rule) => {
    setEditingRule(null);
    form.setFieldsValue({
      rule_name: `${rule.rule_name} (Copy)`,
      sources: rule.sources || [],
      source_urls: rule.source_urls || [],
      campaigns: rule.campaigns || [],
      score_type: rule.score_type,
      score_value: rule.score_value,
      per_remark_score: rule.per_remark_score,
      not_connected_score: rule.not_connected_score,
      daily_limit_score: rule.daily_limit_score,
    });
    setModalVisible(true);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    form.setFieldsValue({
      rule_name: rule.rule_name,
      sources: rule.sources || [],
      source_urls: rule.source_urls || [],
      campaigns: rule.campaigns || [],
      score_type: rule.score_type,
      score_value: rule.score_value,
      per_remark_score: rule.per_remark_score,
      not_connected_score: rule.not_connected_score,
      daily_limit_score: rule.daily_limit_score,
    });
    setModalVisible(true);
  };

  const handleCalculateScore = async (values) => {
    setCalculating(true);
    try {
      const response = await axios.post(`${BASE_URL}/scorecard/calculate-score`, {
        studentId: values.student_id,
        source: values.source,
        campaign: values.campaign,
        source_url: values.source_url,
        remarksCount: values.remarks_count || 0,
        isConnected: values.is_connected,
      });
      
      if (response.data.success) {
        setScoreResult(response.data.data);
      }
    } catch (error) {
      message.error("Failed to calculate score");
    } finally {
      setCalculating(false);
    }
  };

  const columns = [
    {
      title: "Rule Name",
      dataIndex: "rule_name",
      key: "rule_name",
      width: 200,
    },
    {
      title: "Filters",
      key: "filters",
      width: 250,
      render: (_, record) => (
        <Space size={4} wrap>
          {record.sources?.slice(0, 2).map(s => <Tag key={s} color="blue">{s}</Tag>)}
          {record.source_urls?.slice(0, 1).map(u => <Tag key={u} color="cyan">{u}</Tag>)}
          {record.campaigns?.slice(0, 1).map(c => <Tag key={c} color="green">{c}</Tag>)}
          {(record.sources?.length > 2 || record.source_urls?.length > 1 || record.campaigns?.length > 1) && (
            <Tag>+{Math.max(0, (record.sources?.length || 0) - 2) + 
                Math.max(0, (record.source_urls?.length || 0) - 1) + 
                Math.max(0, (record.campaigns?.length || 0) - 1)}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Main Score",
      key: "main_score",
      width: 120,
      render: (_, record) => (
        <Tag color="geekblue">
          {record.score_type === "percentage" ? (
            <><PercentageOutlined /> {record.score_value}%</>
          ) : (
            <><NumberOutlined /> {record.score_value}</>
          )}
        </Tag>
      ),
    },
    {
      title: "Per Remark",
      dataIndex: "per_remark_score",
      key: "per_remark_score",
      width: 100,
      render: (val) => <Tag color="orange">{val > 0 ? `-${val}` : val} %</Tag>,
    },
    {
      title: "Not Connected",
      dataIndex: "not_connected_score",
      key: "not_connected_score",
      width: 120,
      render: (val) => <Tag color="red">{val > 0 ? `-${val}` : val} %</Tag>,
    },
    {
      title: "Daily Limit",
      dataIndex: "daily_limit_score",
      key: "daily_limit_score",
      width: 100,
      render: (val) => val > 0 ? <Tag color="purple">-{val} %</Tag> : <Tag>No limit</Tag>,
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      width: 80,
      render: (is_active, record) => (
        <Switch checked={is_active} onChange={() => handleToggleRule(record)} size="small" />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditRule(record)} />
          </Tooltip>
          <Tooltip title="Duplicate">
            <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => handleDuplicateRule(record)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteRule(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const activeRules = rules.filter(r => r.is_active).length;

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <Content style={{ padding: 24 }}>
        <div style={{ maxWidth: 1600, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <Title level={2} style={{ margin: 0 }}>Scorecard Ruleset</Title>
              <Text type="secondary">Define scoring rules for lead qualification</Text>
            </div>
            <Space>
            
              <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                setEditingRule(null);
                form.resetFields();
                setModalVisible(true);
              }}>
                Add Rule
              </Button>
            </Space>
          </div>

          {/* Stats */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card><Statistic title="Total Rules" value={rules.length} prefix={<SettingOutlined />} /></Card>
            </Col>
            <Col span={8}>
              <Card><Statistic title="Active Rules" value={activeRules} valueStyle={{ color: "#3f8600" }} prefix={<CheckCircleOutlined />} /></Card>
            </Col>
            <Col span={8}>
              <Card><Statistic title="Inactive Rules" value={rules.length - activeRules} valueStyle={{ color: "#cf1322" }} prefix={<StopOutlined />} /></Card>
            </Col>
          </Row>

          {/* Rules Table */}
          <Card>
            <Table columns={columns} dataSource={rules} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
          </Card>
        </div>
      </Content>

      {/* Score Calculator Drawer */}
      <Drawer
        title="Calculate Lead Score"
        placement="right"
        width={500}
        open={scoreDrawerVisible}
        onClose={() => setScoreDrawerVisible(false)}
      >
        <Form form={scoreForm} layout="vertical" onFinish={handleCalculateScore}>
          <Alert message="Base Score: 100 points" description="Points will be added/subtracted based on active rules" type="info" showIcon style={{ marginBottom: 16 }} />

          <Form.Item name="student_id" label="Student ID (Optional)">
            <Input placeholder="e.g., STD-12345" />
          </Form.Item>

          <Form.Item name="source" label="Source">
            <Select placeholder="Select source" allowClear showSearch>
              {options.sources.map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Form.Item>

          <Form.Item name="campaign" label="Campaign">
            <Select placeholder="Select campaign" allowClear showSearch>
              {options.campaigns.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </Form.Item>

          <Form.Item name="source_url" label="Source URL">
            <Input placeholder="e.g., example.com/landing-page" />
          </Form.Item>

          <Form.Item name="remarks_count" label="Number of Remarks" initialValue={0}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="is_connected" label="Call Connected?" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={calculating} block icon={<CalculatorOutlined />}>
              Calculate Score
            </Button>
          </Form.Item>
        </Form>

        {scoreResult && (
          <div style={{ marginTop: 24 }}>
            <Divider>Score Result</Divider>
            <Card>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <Progress type="circle" percent={scoreResult.percentage} />
                <div style={{ marginTop: 8 }}>
                  <Tag color={scoreResult.rating === "Excellent" ? "green" : scoreResult.rating === "Good" ? "blue" : "orange"}>
                    {scoreResult.rating}
                  </Tag>
                </div>
              </div>

              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Base Score">{scoreResult.base_score} points</Descriptions.Item>
                <Descriptions.Item label="Total Adjustment">
                  <Tag color={scoreResult.total_adjustment >= 0 ? "green" : "red"}>
                    {scoreResult.total_adjustment >= 0 ? `+${scoreResult.total_adjustment}` : scoreResult.total_adjustment}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Final Score">
                  <Tag color="green"><strong>{scoreResult.final_score} points</strong></Tag>
                </Descriptions.Item>
              </Descriptions>

              {scoreResult.applied_rules?.length > 0 && (
                <>
                  <Divider>Applied Rules</Divider>
                  {scoreResult.applied_rules.map((rule, index) => (
                    <Card key={index} size="small" style={{ marginBottom: 8 }}>
                      <Text strong>{rule.rule_name}</Text>
                      <div style={{ marginTop: 8 }}>
                        <Space wrap>
                          <Tag>Main: {rule.main_score}</Tag>
                          {rule.remark_score !== 0 && <Tag color="orange">Remarks: {rule.remark_score}</Tag>}
                          {rule.not_connected_score !== 0 && <Tag color="red">Not Connected: {rule.not_connected_score}</Tag>}
                          <Tag color="blue">Total: {rule.total_rule_score}</Tag>
                        </Space>
                      </div>
                    </Card>
                  ))}
                </>
              )}
            </Card>
          </div>
        )}
      </Drawer>

      {/* Add/Edit Rule Modal */}
      <Modal
        title={editingRule ? "Edit Rule" : "Add New Rule"}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); setEditingRule(null); }}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>Cancel</Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={() => form.submit()} icon={<SaveOutlined />}>
            {editingRule ? "Update" : "Create"}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveRule}>
          <Form.Item name="rule_name" label="Rule Name" rules={[{ required: true }]}>
            <Input placeholder="e.g., High Value Lead Rule" size="large" />
          </Form.Item>

          <Divider>Filter Conditions</Divider>

          <Form.Item name="sources" label="Sources">
            <Select 
              mode="multiple" 
              placeholder="Select sources" 
              options={options.sources.map(s => ({ label: s, value: s }))} 
              allowClear 
              showSearch
            />
          </Form.Item>

          <Form.Item name="source_urls" label="Source URLs">
            <Select 
              mode="tags" 
              placeholder="Type URL and press Enter" 
              tokenSeparators={[","]} 
              allowClear
            />
          </Form.Item>

          <Form.Item name="campaigns" label="Campaigns">
            <Select 
              mode="multiple" 
              placeholder="Select campaigns" 
              options={options.campaigns.map(c => ({ label: c, value: c }))} 
              allowClear 
              showSearch
            />
          </Form.Item>

          <Divider>Main Score Configuration</Divider>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="score_type" label="Score Type" initialValue="integer">
                <Select>
                  <Option value="integer">Integer Score</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="score_value" label="Score Value" tooltip="Integer: any number, Percentage: 0-100">
                <InputNumber style={{ width: "100%" }} placeholder="e.g., 10 or -5" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Action-Based Scoring</Divider>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="per_remark_score" label="Per Remark %" initialValue={0}>
                <InputNumber style={{ width: "100%" }} placeholder="e.g., -5" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="not_connected_score" label="Not Connected %" initialValue={0}>
                <InputNumber style={{ width: "100%" }} placeholder="e.g., -10" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="daily_limit_score" label="Daily Limit %" initialValue={0} tooltip="0 = no limit">
                <InputNumber style={{ width: "100%" }} min={0} placeholder="e.g., 50" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ScorecardRuleset;