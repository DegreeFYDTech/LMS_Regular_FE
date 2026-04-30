import React from 'react';
import { Form, Input, Select, Divider, Typography, Space, AutoComplete, Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;

const RuleForm = ({
  rule,
  options,
  questionSchema = [],
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

      <Divider orientation="left" style={{ margin: '32px 0 16px' }}>Student Questions</Divider>
      <div style={{ marginBottom: '24px', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        {(rule.conditions?.student_question || []).map((sq, index) => (
          <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <AutoComplete
                style={{ width: '100%' }}
                placeholder="Enter Question (e.g. Do you have a laptop?)"
                value={sq.question}
                options={questionSchema.map(q => ({ value: q.key, label: q.label }))}
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
                onChange={(val) => {
                  const newQs = [...(rule.conditions.student_question || [])];
                  newQs[index].question = val;
                  handleConditionChange('student_question', newQs);
                }}
                filterOption={(inputValue, option) =>
                  option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                }
              />
            </div>
            <div style={{ flex: 1 }}>
              {(() => {
                const schemaForQ = questionSchema.find(q => q.key === sq.question);
                const answerOptions = schemaForQ?.options?.map(opt => ({ value: opt, label: opt })) || [];
                return (
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="Enter acceptable answers"
                    value={sq.answer || []}
                    options={answerOptions}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    onChange={(val) => {
                      const newQs = [...(rule.conditions.student_question || [])];
                      newQs[index].answer = val;
                      handleConditionChange('student_question', newQs);
                    }}
                  />
                );
              })()}
            </div>
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => {
                const newQs = [...(rule.conditions.student_question || [])];
                newQs.splice(index, 1);
                handleConditionChange('student_question', newQs);
              }}
            />
          </div>
        ))}
        <Button 
          type="dashed" 
          onClick={() => {
            const newQs = [...(rule.conditions.student_question || [])];
            newQs.push({ question: '', answer: [] });
            handleConditionChange('student_question', newQs);
          }} 
          block 
          icon={<PlusOutlined />}
        >
          Add Question Condition
        </Button>
      </div>

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