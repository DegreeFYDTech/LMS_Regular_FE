import React from 'react';
import { Form, Input, Select, Divider, Typography, Space, InputNumber, Radio } from 'antd';

const { Text } = Typography;
const { TextArea } = Input;

const RuleForm = ({
  rule,
  options,
  submitting,
  isEditing,
  onRuleChange
}) => {
  const handleConditionChange = (field, value) => {
    onRuleChange(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [field]: value
      }
    }));
  };

  const handleCounsellorChange = (value) => {
    onRuleChange(prev => ({
      ...prev,
      assigned_counsellor_ids: value
    }));
  };

  const handleScoreTypeChange = (value) => {
    onRuleChange(prev => ({
      ...prev,
      score_type: value,
      score_value: value === 'percentage' ? 0 : 0
    }));
  };

  const handleScoreValueChange = (value) => {
    onRuleChange(prev => ({
      ...prev,
      score_value: value
    }));
  };

  const handleDailyIterationLimitChange = (value) => {
    onRuleChange(prev => ({
      ...prev,
      daily_iteration_limit: value || 0
    }));
  };

  const handleTotalIterationLimitChange = (value) => {
    onRuleChange(prev => ({
      ...prev,
      total_iteration_limit: value || 0
    }));
  };

  const fieldDisplayNames = {
    preferred_university: 'University',
    preferred_degree: 'Degree',
    preferred_specialization: 'Specialization',
    preferred_stream: 'Stream',
    preferred_city: 'City',
    preferred_state: 'State'
  };

  const fieldGroups = [
    { title: 'Academic Criteria', fields: ['preferred_university', 'preferred_degree', 'preferred_specialization', 'preferred_stream'] },
    { title: 'Location Criteria', fields: ['preferred_city', 'preferred_state'] }
  ];

  const currentScoreType = rule?.score_type || 'numeric';
  const currentScoreValue = rule?.score_value !== undefined ? rule.score_value : 0;

  const getScoreValueProps = () => {
    if (currentScoreType === 'percentage') {
      return {
        min: 0,
        max: 100,
        placeholder: 'Enter percentage (0-100)',
        formatter: (value) => `${value}%`,
        parser: (value) => value.replace('%', ''),
      };
    } else {
      return {
        min: -100,
        max: 500,
        placeholder: 'Enter score (-100 to 500)',
      };
    }
  };

  const scoreValueProps = getScoreValueProps();

  return (
    <Form layout="vertical">
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <Form.Item label={<Text strong>Rule Name</Text>} required>
          <Input
            size="large"
            value={rule?.custom_rule_name || ''}
            onChange={(e) => onRuleChange(prev => ({ ...prev, custom_rule_name: e.target.value }))}
            placeholder="e.g., High Budget Bachelors"
          />
        </Form.Item>
        <Form.Item label={<Text strong>Priority</Text>} tooltip="Higher number means higher priority for lead assignment">
          <InputNumber
            size="large"
            style={{ width: '100%' }}
            min={0}
            value={rule?.priority || 0}
            onChange={(val) => onRuleChange(prev => ({ ...prev, priority: val || 0 }))}
          />
        </Form.Item>
      </div>

      <Divider orientation="left" style={{ margin: '32px 0 16px' }}>Scoring Configuration</Divider>

   

      <Divider orientation="left" style={{ margin: '32px 0 16px' }}>Iteration Limits</Divider>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <Form.Item 
          label={<Text strong>Daily Iteration Limit</Text>} 
          tooltip="Maximum number of times this rule can assign leads per day (0 = unlimited)"
        >
          <InputNumber
            style={{ width: '100%' }}
            size="large"
            min={0}
            value={rule?.daily_iteration_limit || 0}
            onChange={handleDailyIterationLimitChange}
            placeholder="Enter daily limit"
          />
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {rule?.daily_iteration_limit === 0 ? 'Unlimited' : `${rule?.daily_iteration_limit} assignments per day`}
            </Text>
          </div>
        </Form.Item>

        <Form.Item 
          label={<Text strong>Total Iteration Limit</Text>} 
          tooltip="Maximum total number of times this rule can assign leads overall (0 = unlimited)"
        >
          <InputNumber
            style={{ width: '100%' }}
            size="large"
            min={0}
            value={rule?.total_iteration_limit || 0}
            onChange={handleTotalIterationLimitChange}
            placeholder="Enter total limit"
          />
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {rule?.total_iteration_limit === 0 ? 'Unlimited' : `${rule?.total_iteration_limit} total assignments`}
            </Text>
          </div>
        </Form.Item>
      </div>

      <Divider orientation="left" style={{ margin: '32px 0 16px' }}>Filter Conditions</Divider>

      {fieldGroups.map((group, groupIndex) => (
        <div key={groupIndex} style={{ marginBottom: '24px' }}>
          <Text type="secondary" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>{group.title}</Text>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {group.fields.map(field => (
              <Form.Item key={field} label={fieldDisplayNames[field] || field} style={{ marginBottom: 0 }}>
                {field === 'first_source_url' ? (
                  <TextArea
                    value={rule.conditions?.[field] || ''}
                    onChange={(e) => handleConditionChange(field, e.target.value)}
                    placeholder="example.com&#10;test.com"
                    rows={3}
                  />
                ) : (
                  <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder={`Select ${fieldDisplayNames[field] || field}`}
                    value={rule.conditions?.[field] || []}
                    onChange={(val) => handleConditionChange(field, val)}
                    options={options[field]?.map(opt => ({ label: opt, value: opt })) || []}
                    maxTagCount="responsive"
                    allowClear
                  />
                )}
              </Form.Item>
            ))}
          </div>
        </div>
      ))}

      <Divider orientation="left" style={{ margin: '32px 0 16px' }}>Assignment</Divider>

      <Form.Item label={<Text strong>Assign to L2 Agents</Text>} required extra="Leads matching these conditions will be distributed among selected agents using round-robin.">
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

export default RuleForm;