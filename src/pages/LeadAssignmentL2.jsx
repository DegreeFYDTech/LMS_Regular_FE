import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Button,
  Space,
  Card,
  Statistic,
  Row,
  Col,
  Radio,
  Modal as AntModal,
  message,
  notification
} from 'antd';
import {
  TableOutlined,
  AppstoreOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  StopOutlined,
  SettingOutlined,
  FilterOutlined,
  UserOutlined
} from '@ant-design/icons';
import {
  fetchLeadAssignmentRules,
  createLeadAssignmentRule,
  updateLeadAssignmentRule,
  deleteLeadAssignmentRule,
  toggleLeadAssignmentRule,
  fetchL2Agents,
  fetchLeadOptions,
} from '../network/leadassignmentl2';
import RuleForm from '../components/RuleForm';
import RuleTable from '../components/RuleTable';
import RuleCards from '../components/RuleCards';
import Loader from '../common/Loader';
import axios from 'axios';
import { BASE_URL } from '../config/api';

const { Content, Header } = Layout;
const { Title, Text } = Typography;

const LeadAssignmentRules = () => {
  const [rules, setRules] = useState([]);
  const [editingRule, setEditingRule] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [newRule, setNewRule] = useState({
    conditions: {
      utmCampaign: [],
      first_source_url: '',
      source: [],
      mode: [],
      preferred_budget: [],
      current_profession: [],
      preferred_level: [],
      preferred_degree: [],
      preferred_specialization: [],
      preferred_city: [],
      preferred_state: []
    },
    assigned_counsellor_ids: [],
    is_active: true,
    custom_rule_name: ''
  });
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [options, setOptions] = useState({
    utmCampaign: ['Any'],
    first_source_url: ['Any'],
    source: ['Any'],
    mode: ['Any'],
    preferred_budget: ['Any', '0-50000', '50000-70000', '70000-100000', '100000-150000', '150000-200000', '200000-999999999'],
    current_profession: ['Any', 'Working Professional', 'Government Exam Prep', 'Looking for Job', 'Skill Course', 'Business Owner', 'Other'],
    preferred_level: ['Any', 'Diploma', 'Undergraduate', 'Postgraduate', 'Doctorate'],
    preferred_degree: ['Any'],
    preferred_specialization: ['Any'],
    preferred_city: ['Any'],
    preferred_state: ["Any"],
    counsellors: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRules(),
        loadAgents(),
        loadLeadOptions(),
        loadFilterOptions()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async () => {
    try {
      const response = await fetchLeadAssignmentRules();
      if (response.success) {
        setRules(response.data || []);
      }
    } catch (error) {
      console.error('Error loading rules:', error);
    }
  };

  const loadAgents = async () => {
    try {
      const data = await fetchL2Agents();
      setAgents(data);
      setOptions(prev => ({ ...prev, counsellors: [...data] }));
    } catch (error) {
      console.error('Error loading agents:', error);
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

  const loadFilterOptions = async () => {
    try {
      const data = await axios.get(`${BASE_URL}/universitycourse/dropdown`);
      const degrees = data.data.data.degrees || [];
      const specializations = data.data.data.specializations || [];

      setOptions(prev => ({
        ...prev,
        preferred_degree: ['Any', ...degrees],
        preferred_specialization: ['Any', ...specializations]
      }));
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const processFirstSourceUrl = (value) => {
    if (typeof value === 'string') {
      return value.split('\n').map(url => url.trim()).filter(url => url.length > 0);
    }
    return Array.isArray(value) ? value : [];
  };

  const prepareRulePayload = (rule) => {
    const transformedCounsellors = rule.assigned_counsellor_ids.map(counsellor => {
      if (typeof counsellor === 'string') return counsellor;
      return counsellor.counsellor_id || counsellor._id;
    });

    const processedConditions = { ...rule.conditions };
    if (processedConditions.first_source_url) {
      processedConditions.first_source_url = processFirstSourceUrl(processedConditions.first_source_url);
    }

    const payload = {
      ...rule,
      assigned_counsellor_ids: transformedCounsellors,
      conditions: processedConditions
    };

    const allowedFields = [
      'utmCampaign', 'first_source_url', 'source', 'mode', 'preferred_budget',
      'current_profession', 'preferred_level', 'preferred_degree',
      'preferred_specialization', 'preferred_city', 'preferred_state'
    ];

    Object.keys(payload.conditions).forEach(key => {
      if (!allowedFields.includes(key)) {
        delete payload.conditions[key];
      } else if (Array.isArray(payload.conditions[key]) && payload.conditions[key].length === 0) {
        delete payload.conditions[key];
      }
    });

    return payload;
  };

  const handleAddRule = async () => {
    if (newRule.assigned_counsellor_ids.length === 0) {
      message.warning('Please select at least one counsellor');
      return;
    }

    setSubmitting(true);
    try {
      const payload = prepareRulePayload(newRule);
      const response = await createLeadAssignmentRule(payload);
      if (response.success) {
        await loadRules();
        resetNewRule();
        setShowFormModal(false);
        notification.success({ message: 'Rule created successfully!' });
      }
    } catch (error) {
      message.error('Error creating rule: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRule = async () => {
    if (editingRule.assigned_counsellor_ids.length === 0) {
      message.warning('Please select at least one counsellor');
      return;
    }

    setSubmitting(true);
    try {
      const payload = prepareRulePayload(editingRule);
      const response = await updateLeadAssignmentRule(editingRule.lead_assignment_rule_l2_id, payload);
      if (response.success) {
        await loadRules();
        setEditingRule(null);
        setShowFormModal(false);
        notification.success({ message: 'Rule updated successfully!' });
      }
    } catch (error) {
      message.error('Error updating rule: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    AntModal.confirm({
      title: 'Are you sure you want to delete this rule?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          const response = await deleteLeadAssignmentRule(ruleId);
          if (response.success) {
            await loadRules();
            message.success('Rule deleted successfully!');
          }
        } catch (error) {
          message.error('Error deleting rule: ' + error.message);
        }
      }
    });
  };

  const handleToggleRule = async (ruleId) => {
    try {
      const response = await toggleLeadAssignmentRule(ruleId);
      if (response.success) {
        await loadRules();
        message.success('Rule status toggled');
      }
    } catch (error) {
      message.error('Error toggling rule status: ' + error.message);
    }
  };

  const handleDuplicateRule = (rule) => {
    const duplicatedRule = {
      conditions: { ...rule.conditions },
      assigned_counsellor_ids: rule.assigned_counsellor_ids ? [...rule.assigned_counsellor_ids] : [],
      is_active: true,
      custom_rule_name: rule.custom_rule_name + ' (Copy)'
    };
    setNewRule(duplicatedRule);
    setEditingRule(null);
    setShowFormModal(true);
  };

  const handleEditRule = (rule) => {
    const editRule = {
      ...rule,
      conditions: {
        ...rule.conditions,
        first_source_url: Array.isArray(rule.conditions.first_source_url)
          ? rule.conditions.first_source_url.join('\n')
          : rule.conditions.first_source_url || '',
      }
    };
    setEditingRule(editRule);
    setShowFormModal(true);
  };

  const resetNewRule = () => {
    setNewRule({
      conditions: {
        utmCampaign: [],
        first_source_url: '',
        source: [],
        mode: [],
        preferred_budget: [],
        current_profession: [],
        preferred_level: [],
        preferred_degree: [],
        preferred_specialization: [],
        preferred_city: [],
        preferred_state: []
      },
      assigned_counsellor_ids: [],
      is_active: true,
      custom_rule_name: ''
    });
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Loader /></div>;

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Page Header */}
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <Title level={2} style={{ margin: 0 }}>L2 Lead Assignment</Title>
              <Text type="secondary">Manage automated lead distribution rules for L2 agents</Text>
            </div>
            <Space>
              <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} buttonStyle="solid">
                <Radio.Button value="table"><TableOutlined /> Table</Radio.Button>
                <Radio.Button value="cards"><AppstoreOutlined /> Cards</Radio.Button>
              </Radio.Group>
              <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => { resetNewRule(); setEditingRule(null); setShowFormModal(true); }}>
                New Rule
              </Button>
            </Space>
          </div>

          {/* Stats Bar */}
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={6}>
              <Card bordered={false} className="shadow-sm">
                <Statistic title="Total Rules" value={rules.length} prefix={<SettingOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} className="shadow-sm">
                <Statistic title="Active" value={rules.filter(r => r.is_active).length} valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} className="shadow-sm">
                <Statistic title="Inactive" value={rules.filter(r => !r.is_active).length} valueStyle={{ color: '#cf1322' }} prefix={<StopOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} className="shadow-sm">
                <Statistic title="Agents" value={agents.length} prefix={<UserOutlined />} />
              </Card>
            </Col>
          </Row>

          {/* Rules Display */}
          <Card bordered={false} bodyStyle={{ padding: 0 }} className="shadow-sm overflow-hidden">
            {viewMode === 'table' ? (
              <RuleTable rules={rules} onEditRule={handleEditRule} onDeleteRule={handleDeleteRule} onToggleRule={handleToggleRule} onDuplicateRule={handleDuplicateRule} />
            ) : (
              <RuleCards rules={rules} onEditRule={handleEditRule} onDeleteRule={handleDeleteRule} onToggleRule={handleToggleRule} onDuplicateRule={handleDuplicateRule} />
            )}
          </Card>
        </div>
      </Content>

      <AntModal
        title={editingRule ? "Edit Assignment Rule" : "Create New Rule"}
        open={showFormModal}
        onCancel={() => setShowFormModal(false)}
        width={1000}
        footer={[
          <Button key="back" onClick={() => setShowFormModal(false)}>Cancel</Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={editingRule ? handleUpdateRule : handleAddRule}>
            {editingRule ? "Update Rule" : "Create Rule"}
          </Button>,
        ]}
        centered
        styles={{
          body: {
            height: '80vh',
            overflowY: 'auto',
            padding: '20px 24px'
          }
        }}
      >
        <RuleForm rule={editingRule || newRule} options={options} submitting={submitting} isEditing={!!editingRule} onRuleChange={editingRule ? setEditingRule : setNewRule} />
      </AntModal>
    </Layout>
  );
};

export default LeadAssignmentRules;