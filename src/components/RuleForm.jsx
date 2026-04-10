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
      // Reset score_value when type changes to avoid validation issues
      score_value: value === 'percentage' ? 0 : 0
    }));
  };

  const handleScoreValueChange = (value) => {
    onRuleChange(prev => ({
      ...prev,
      score_value: value
    }));
  };

  const fieldDisplayNames = {
    utmCampaign: 'UTM Campaign',
    first_source_url: 'Domain URLs',
    source: 'Source',
    mode: 'Mode',
    preferred_budget: 'Budget Range (₹)',
    current_profession: 'Current Profession',
    preferred_level: 'Preferred Level',
    preferred_degree: 'Preferred Degree',
    preferred_specialization: 'Preferred Specialization',
    preferred_city: 'Preferred City',
    preferred_state: 'Preferred State'
  };

  const fieldGroups = [
    { title: 'Source & Campaign', fields: ['first_source_url', 'utmCampaign', 'source', 'mode'] },
    { title: 'Location Preferences', fields: ['preferred_state', 'preferred_city'] },
    { title: 'Education Background', fields: ['preferred_degree', 'preferred_specialization', 'preferred_level'] },
    { title: 'Others', fields: ['preferred_budget', 'current_profession'] }
  ];

  // Get current score type and value with defaults
  const currentScoreType = rule?.score_type || 'numeric';
  const currentScoreValue = rule?.score_value !== undefined ? rule.score_value : 0;

  // Validation rules for score value
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
      <Form.Item label={<Text strong>Rule Name</Text>} required>
        <Input
          size="large"
          value={rule?.custom_rule_name || ''}
          onChange={(e) => onRuleChange(prev => ({ ...prev, custom_rule_name: e.target.value }))}
          placeholder="e.g., High Budget Bachelors"
        />
      </Form.Item>

      <Divider orientation="left" style={{ margin: '32px 0 16px' }}>Scoring Configuration</Divider>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <Form.Item label={<Text strong>Score Type</Text>} required>
          <Radio.Group 
            value={currentScoreType} 
            onChange={(e) => handleScoreTypeChange(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="numeric">
              Numeric Score
            </Radio.Button>
            <Radio.Button value="percentage">
              Percentage Score
            </Radio.Button>
          </Radio.Group>
          <div style={{ marginTop: '8px' }}>
            {currentScoreType === 'percentage' ? (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Percentage scores are capped at 100% and work well for relative scoring
              </Text>
            ) : (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Numeric scores can be positive (boost) or negative (penalty) from -100 to 500
              </Text>
            )}
          </div>
        </Form.Item>

        <Form.Item label={<Text strong>Score Value</Text>} required>
          <InputNumber
            style={{ width: '100%' }}
            size="large"
            value={currentScoreValue}
            onChange={handleScoreValueChange}
            {...scoreValueProps}
          />
          <div style={{ marginTop: '8px' }}>
            {currentScoreType === 'percentage' ? (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Range: 0% to 100%
              </Text>
            ) : (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Range: -100 (penalty) to 500 (high priority)
              </Text>
            )}
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