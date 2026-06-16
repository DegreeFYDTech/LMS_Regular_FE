import React, { useState, useEffect } from 'react';
import {
    fetchLeadAssignmentRulesL3,
    createLeadAssignmentRuleL3,
    updateLeadAssignmentRuleL3,
    deleteLeadAssignmentRuleL3,
    toggleLeadAssignmentRuleL3,
    fetchL3Agents,
    fetchL2Agents,
} from '../network/leadassignmentl3';
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
import RuleFormL3 from '../components/RuleFormL3';
import RuleTable from '../components/RuleTable';
import RuleCards from '../components/RuleCards';
import Loader from '../common/Loader';
import axios from 'axios';
import { BASE_URL } from '../config/api';

const { Content } = Layout;
const { Title, Text } = Typography;

const LeadAssignmentL3 = () => {
    const [rules, setRules] = useState([]);
    const [editingRule, setEditingRule] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [viewMode, setViewMode] = useState('table');
    const [newRule, setNewRule] = useState({
        university_name: [],
        course_conditions: {
            stream: [],
            degree: [],
            specialization: [],
            level: [],
            courseName: []
        },
        source: [],
        assigned_counsellor_ids: [],
        l2_counsellor_ids: [],
        is_active: true,
        custom_rule_name: ''
    });
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [options, setOptions] = useState({
        universities: [],
        streams: [],
        degrees: [],
        specializations: [],
        levels: [],
        courses: [],
        source: [],
        counsellors: [],
        l2Counsellors: []
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
                loadL2Agents(),
                loadInitialDropdownData(),
                fetchSources()
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
            const response = await fetchLeadAssignmentRulesL3();
            setRules(response || []);
        } catch (error) {
            console.error('Error loading rules:', error);
        }
    };

    const loadAgents = async () => {
        try {
            const data = await fetchL3Agents();
            setAgents(data);
            setOptions(prev => ({ ...prev, counsellors: [...data] }));
        } catch (error) {
            console.error('Error loading agents:', error);
        }
    };

    const loadL2Agents = async () => {
        try {
            const data = await fetchL2Agents();
            setOptions(prev => ({ ...prev, l2Counsellors: [...data] }));
        } catch (error) {
            console.error('Error loading L2 agents:', error);
        }
    };

    const fetchSources = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/filterOption`, {
                withCredentials: true
            });
            setOptions(prev => ({ ...prev, source: response?.data?.data?.source || [] }));
        } catch (err) {
            console.log("Error fetching sources:", err);
        }
    };

    const loadInitialDropdownData = async () => {
        try {
            const response = await fetch(`${BASE_URL}/universitycourse/dropdown`);
            const Jsondata = await response.json();
            if (Jsondata.success) {
                setOptions(prev => ({
                    ...prev,
                    universities: Jsondata.data.universities || Jsondata.data.university_name || [],
                    streams: Jsondata.data.streams || [],
                    degrees: Jsondata.data.degrees || [],
                    specializations: Jsondata.data.specializations || [],
                    levels: Jsondata.data.levels || [],
                    courses: Jsondata.data.courses || []
                }));
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    };

    const handleAddRule = async () => {
        if (newRule.assigned_counsellor_ids.length === 0) {
            message.warning('Please select at least one counsellor');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...newRule,
                custom_rule_name: newRule.custom_rule_name.trim()
            };
            const response = await createLeadAssignmentRuleL3(payload);
            if (response) {
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
            const payload = {
                ...editingRule,
                custom_rule_name: editingRule.custom_rule_name.trim()
            };
            const response = await updateLeadAssignmentRuleL3(editingRule.l3_assignment_rulesets_id, payload);
            if (response) {
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
            content: 'L3 mapping for this rule will be removed.',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    const response = await deleteLeadAssignmentRuleL3(ruleId);
                    if (response) {
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
            const response = await toggleLeadAssignmentRuleL3(ruleId);
            if (response) {
                await loadRules();
                message.success('Rule status updated');
            }
        } catch (error) {
            message.error('Error toggling rule status: ' + error.message);
        }
    };

    const handleDuplicateRule = (rule) => {
        const duplicatedRule = {
            university_name: Array.isArray(rule.university_name) ? [...rule.university_name] : [],
            course_conditions: {
                stream: Array.isArray(rule.course_conditions?.stream) ? [...rule.course_conditions.stream] : [],
                degree: Array.isArray(rule.course_conditions?.degree) ? [...rule.course_conditions.degree] : [],
                specialization: Array.isArray(rule.course_conditions?.specialization) ? [...rule.course_conditions.specialization] : [],
                level: Array.isArray(rule.course_conditions?.level) ? [...rule.course_conditions.level] : [],
                courseName: Array.isArray(rule.course_conditions?.courseName) ? [...rule.course_conditions.courseName] : []
            },
            source: Array.isArray(rule.source) ? [...rule.source] : [],
            assigned_counsellor_ids: rule.assigned_counsellor_ids ? [...rule.assigned_counsellor_ids] : [],
            l2_counsellor_ids: Array.isArray(rule.l2_counsellor_ids) ? [...rule.l2_counsellor_ids] : [],
            is_active: true,
            custom_rule_name: (rule.custom_rule_name || 'Rule') + ' (Copy)'
        };
        setNewRule(duplicatedRule);
        setEditingRule(null);
        setShowFormModal(true);
    };

    const handleEditRule = (rule) => {
        const editRule = {
            ...rule,
            assigned_counsellor_ids: rule.assigned_counsellor_ids?.map(agent => typeof agent === 'object' ? agent.counsellor_id : agent) || []
        };
        setEditingRule(editRule);
        setShowFormModal(true);
    };

    const resetNewRule = () => {
        setNewRule({
            university_name: [],
            course_conditions: {
                stream: [],
                degree: [],
                specialization: [],
                level: [],
                courseName: []
            },
            source: [],
            assigned_counsellor_ids: [],
            l2_counsellor_ids: [],
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
                            <Title level={2} style={{ margin: 0 }}>L3 Lead Assignment</Title>
                            <Text type="secondary">Manage automated lead distribution rules for L3 agents</Text>
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
                            <RuleTable rules={rules} onEditRule={handleEditRule} onDeleteRule={handleDeleteRule} onToggleRule={handleToggleRule} onDuplicateRule={handleDuplicateRule} idKey="l3_assignment_rulesets_id" type="l3" />
                        ) : (
                            <RuleCards rules={rules} onEditRule={handleEditRule} onDeleteRule={handleDeleteRule} onToggleRule={handleToggleRule} onDuplicateRule={handleDuplicateRule} idKey="l3_assignment_rulesets_id" type="l3" />
                        )}
                    </Card>
                </div>
            </Content>

            <AntModal
                title={editingRule ? "Edit L3 Assignment Rule" : "Create New L3 Rule"}
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
                <RuleFormL3 rule={editingRule || newRule} options={options} submitting={submitting} isEditing={!!editingRule} onRuleChange={editingRule ? setEditingRule : setNewRule} />
            </AntModal>
        </Layout>
    );
};

export default LeadAssignmentL3;