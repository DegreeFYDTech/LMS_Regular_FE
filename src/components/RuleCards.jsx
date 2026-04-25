import React, { useState } from 'react';
import { Card, Tag, Button, Space, Tooltip, Typography, Row, Col, Badge, Avatar } from 'antd';
import {
  EditOutlined,
  CopyOutlined,
  DeleteOutlined,
  PoweroffOutlined,
  TeamOutlined,
  CalendarOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

const RuleCards = ({
  rules,
  onEditRule,
  onDeleteRule,
  onToggleRule,
  onDuplicateRule,
  idKey = 'lead_assignment_rule_l2_id',
  type = 'l2'
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getConditionCount = (rule) => {
    if (type === 'l3') {
      let count = 0;
      if (rule.university_name?.length > 0) count++;
      if (rule.source?.length > 0) count++;
      if (rule.course_conditions) {
        Object.values(rule.course_conditions).forEach(val => {
          if (Array.isArray(val) && val.length > 0) count++;
        });
      }
      return count;
    }
    return Object.values(rule.conditions || {}).filter(val =>
      Array.isArray(val) && val.length > 0
    ).length;
  };

  const getAgents = (rule) => {
    return rule.counsellors || rule.assignedCounsellorDetails || [];
  };

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        {rules.map((rule) => {
          const ruleId = rule[idKey];
          const conditionCount = getConditionCount(rule);
          const agents = getAgents(rule);

          return (
            <Col xs={24} md={12} lg={8} key={ruleId}>
              <Badge.Ribbon
                text={rule.is_active ? "Active" : "Inactive"}
                color={rule.is_active ? "green" : "red"}
              >
                <Card
                  hoverable
                  style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}
                  actions={[
                    <Tooltip title="Toggle status">
                      <Button
                        type="text"
                        icon={<PoweroffOutlined />}
                        onClick={() => onToggleRule(ruleId)}
                        style={{ color: rule.is_active ? '#52c41a' : '#ff4d4f' }}
                      />
                    </Tooltip>,
                    <Tooltip title="Edit">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => onEditRule(rule)}
                        style={{ color: '#1890ff' }}
                      />
                    </Tooltip>,
                    <Tooltip title="Duplicate">
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={() => onDuplicateRule(rule)}
                        style={{ color: '#faad14' }}
                      />
                    </Tooltip>,
                    <Tooltip title="Delete">
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => onDeleteRule(ruleId)}
                      />
                    </Tooltip>,
                  ]}
                >
                  <Card.Meta
                    title={<Text strong ellipsis style={{ width: '80%' }}>{rule.custom_rule_name || rule.name}</Text>}
                    description={
                      <Space size="middle" style={{ marginTop: '4px' }}>
                        <Text type="secondary" style={{ fontSize: '11px' }}><TeamOutlined /> {agents.length} Agents</Text>
                        <Text type="secondary" style={{ fontSize: '11px' }}><CalendarOutlined /> {formatDate(rule.updated_at)}</Text>
                      </Space>
                    }
                  />

                  <div style={{ marginTop: '20px', minHeight: '80px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <Tag color="blue">{conditionCount} Conditions</Tag>
                    </div>

                    <Space direction="vertical" style={{ width: '100%' }}>
                      {type === 'l3' ? (
                        <>
                          {rule.university_name?.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'start', fontSize: '12px' }}>
                              <Text type="secondary" style={{ width: '70px', flexShrink: 0 }}>Univ:</Text>
                              <Text ellipsis>{rule.university_name.join(', ')}</Text>
                            </div>
                          )}
                          {rule.course_conditions?.stream?.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'start', fontSize: '12px' }}>
                              <Text type="secondary" style={{ width: '70px', flexShrink: 0 }}>Stream:</Text>
                              <Text ellipsis>{rule.course_conditions.stream.join(', ')}</Text>
                            </div>
                          )}
                        </>
                      ) : (
                        ['preferred_degree', 'preferred_specialization', 'preferred_budget'].map(field => {
                          const value = rule.conditions?.[field];
                          if (!value || value.length === 0) return null;
                          const labels = {
                            preferred_degree: 'Degree',
                            preferred_specialization: 'Spec',
                            preferred_budget: 'Budget'
                          };
                          return (
                            <div key={field} style={{ display: 'flex', alignItems: 'start', fontSize: '12px' }}>
                              <Text type="secondary" style={{ width: '70px', flexShrink: 0 }}>{labels[field]}:</Text>
                              <Text ellipsis>{value.join(', ')}</Text>
                            </div>
                          );
                        })
                      )}
                    </Space>
                  </div>

                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                    <Avatar.Group maxCount={3} size="small">
                      {agents.map(agent => (
                        <Tooltip title={agent.counsellor_name} key={agent.counsellor_id}>
                          <Avatar style={{ backgroundColor: '#1890ff' }}>{agent.counsellor_name.charAt(0)}</Avatar>
                        </Tooltip>
                      ))}
                    </Avatar.Group>
                  </div>
                </Card>
              </Badge.Ribbon>
            </Col>
          );
        })}
      </Row>

      {rules.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '40px' }} bordered={false}>
          <Text type="secondary">No rules configured. Click "New Rule" to get started.</Text>
        </Card>
      )}
    </div>
  );
};

export default RuleCards;