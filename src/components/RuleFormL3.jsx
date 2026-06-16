import React from 'react';
import { Form, Input, Select, Divider, Typography, Row, Col } from 'antd';

const { Text } = Typography;

const RuleFormL3 = ({
    rule,
    options,
    submitting,
    isEditing,
    onRuleChange
}) => {
    const handleUniversityChange = (value) => {
        onRuleChange(prev => ({
            ...prev,
            university_name: value,
        }));
    };

    const handleCourseChange = (field, value) => {
        onRuleChange(prev => ({
            ...prev,
            course_conditions: {
                ...prev.course_conditions,
                [field]: value
            }
        }));
    };

    const handleSourceChange = (value) => {
        onRuleChange(prev => ({
            ...prev,
            source: value
        }));
    };

    const handleCounsellorChange = (value) => {
        onRuleChange(prev => ({
            ...prev,
            assigned_counsellor_ids: value
        }));
    };

    const handleL2CounsellorChange = (value) => {
        onRuleChange(prev => ({
            ...prev,
            l2_counsellor_ids: value
        }));
    };

    return (
        <Form layout="vertical">
            <Form.Item label={<Text strong>Rule Name</Text>} required>
                <Input
                    size="large"
                    value={rule?.custom_rule_name || ''}
                    onChange={(e) => onRuleChange(prev => ({ ...prev, custom_rule_name: e.target.value }))}
                    placeholder="e.g., L3 International Sales"
                />
            </Form.Item>

            <Divider orientation="left" style={{ margin: '32px 0 16px' }}>General Conditions</Divider>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item label="University">
                        <Select
                            mode="multiple"
                            style={{ width: '100%' }}
                            placeholder="Select Universities"
                            value={rule.university_name || []}
                            onChange={handleUniversityChange}
                            options={options.universities?.map(u => ({ label: u, value: u })) || []}
                            maxTagCount="responsive"
                            allowClear
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Source">
                        <Select
                            mode="multiple"
                            style={{ width: '100%' }}
                            placeholder="Select Sources"
                            value={rule.source || []}
                            onChange={handleSourceChange}
                            options={options.source?.map(s => ({ label: s, value: s })) || []}
                            maxTagCount="responsive"
                            allowClear
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="L2 Counsellor" extra="Only match students currently assigned to these L2 counsellors. Leave empty to match any.">
                        <Select
                            mode="multiple"
                            style={{ width: '100%' }}
                            placeholder="Select L2 Counsellors"
                            value={rule.l2_counsellor_ids || []}
                            onChange={handleL2CounsellorChange}
                            options={options.l2Counsellors?.map(c => ({ label: c.counsellor_name, value: c.counsellor_id })) || []}
                            maxTagCount="responsive"
                            allowClear
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Divider orientation="left" style={{ margin: '32px 0 16px' }}>Course Conditions</Divider>

            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <Form.Item label="Streams" style={{ marginBottom: 0 }}>
                        <Select
                            mode="multiple"
                            style={{ width: '100%' }}
                            placeholder="Select Streams"
                            value={rule.course_conditions?.stream || []}
                            onChange={(val) => handleCourseChange('stream', val)}
                            options={options.streams?.map(s => ({ label: s, value: s })) || []}
                            maxTagCount="responsive"
                            allowClear
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Degrees" style={{ marginBottom: 0 }}>
                        <Select
                            mode="multiple"
                            style={{ width: '100%' }}
                            placeholder="Select Degrees"
                            value={rule.course_conditions?.degree || []}
                            onChange={(val) => handleCourseChange('degree', val)}
                            options={options.degrees?.map(d => ({ label: d, value: d })) || []}
                            maxTagCount="responsive"
                            allowClear
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Specializations" style={{ marginBottom: 0 }}>
                        <Select
                            mode="multiple"
                            style={{ width: '100%' }}
                            placeholder="Select Specializations"
                            value={rule.course_conditions?.specialization || []}
                            onChange={(val) => handleCourseChange('specialization', val)}
                            options={options.specializations?.map(s => ({ label: s, value: s })) || []}
                            maxTagCount="responsive"
                            allowClear
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Levels" style={{ marginBottom: 0 }}>
                        <Select
                            mode="multiple"
                            style={{ width: '100%' }}
                            placeholder="Select Levels"
                            value={rule.course_conditions?.level || []}
                            onChange={(val) => handleCourseChange('level', val)}
                            options={options.levels?.map(l => ({ label: l, value: l })) || []}
                            maxTagCount="responsive"
                            allowClear
                        />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item label="Course Names" style={{ marginBottom: 0 }}>
                        <Select
                            mode="multiple"
                            style={{ width: '100%' }}
                            placeholder="Select Course Names"
                            value={rule.course_conditions?.courseName || []}
                            onChange={(val) => handleCourseChange('courseName', val)}
                            options={options.courses?.map(c => ({ label: c, value: c })) || []}
                            maxTagCount="responsive"
                            allowClear
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Divider orientation="left" style={{ margin: '32px 0 16px' }}>Assignment</Divider>

            <Form.Item label={<Text strong>Assign to L3 Agents</Text>} required extra="Leads matching these conditions will be distributed among selected L3 agents using round-robin.">
                <Select
                    mode="multiple"
                    size="large"
                    style={{ width: '100%' }}
                    placeholder="Select agent(s)"
                    value={rule.assigned_counsellor_ids || []}
                    onChange={handleCounsellorChange}
                    options={options.counsellors?.map(agent => ({ label: agent.counsellor_name, value: agent.counsellor_id })) || []}
                    maxTagCount="responsive"
                    allowClear
                />
            </Form.Item>
        </Form>
    );
};

export default RuleFormL3;
