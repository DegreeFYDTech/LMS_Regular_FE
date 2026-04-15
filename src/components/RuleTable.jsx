import React, { useState } from 'react';
import { Table, Tag, Button, Space, Tooltip, Typography, Layout } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const RuleTable = ({
  rules,
  onEditRule,
  onDeleteRule,
  onToggleRule,
  idKey = 'lead_assignment_rule_l2_id',
  type = 'l2'
}) => {
  const formatConditions = (record) => {
    if (type === 'l3') {
      const parts = [];
      if (record.university_name?.length > 0) parts.push(`University: ${record.university_name.join(', ')}`);
      if (record.course_conditions?.stream?.length > 0) parts.push(`Streams: ${record.course_conditions.stream.join(', ')}`);
      if (record.course_conditions?.degree?.length > 0) parts.push(`Degrees: ${record.course_conditions.degree.join(', ')}`);
      if (record.source?.length > 0) parts.push(`Source: ${record.source.join(', ')}`);
      return parts.join(' • ') || 'Any';
    }

    const conditions = record.conditions || {};
    const displayFields = [
      { key: 'preferred_university', label: 'Univ' },
      { key: 'preferred_degree', label: 'Deg' },
      { key: 'preferred_specialization', label: 'Sp' },
      { key: 'preferred_stream', label: 'Stream' },
      { key: 'preferred_city', label: 'City' },
      { key: 'preferred_state', label: 'State' },
    ];

    return displayFields
      .filter(field => conditions[field.key] && conditions[field.key].length > 0)
      .map(field => `${field.label}: ${conditions[field.key].join(', ')}`)
      .join(' • ') || 'Any';
  };

  const columns = [
    {
      title: 'Rule Name',
      key: 'name',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.custom_rule_name || record.name}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>ID: {record[idKey]}</Text>
        </Space>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      sorter: (a, b) => (a.priority || 0) - (b.priority || 0),
      render: (val) => <Tag color="gold">{val || 0}</Tag>
    },
    {
      title: 'Conditions',
      key: 'conditions',
      ellipsis: true,
      render: (_, record) => (
        <Tooltip title={formatConditions(record)}>
          <Text ellipsis style={{ maxWidth: 300 }}>{formatConditions(record)}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Agents',
      key: 'agents',
      render: (_, record) => {
        const agents = record.counsellors || record.assignedCounsellorDetails || [];
        return (
          <Space wrap size={[0, 4]}>
            {agents.slice(0, 2).map((agent) => (
              <Tag color="processing" key={agent.counsellor_id}>{agent.counsellor_name}</Tag>
            ))}
            {agents.length > 2 && <Tag color="default">+{agents.length - 2}</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.is_active ? 'success' : 'error'}>
          {record.is_active ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Toggle Status">
            <Button
              type="text"
              icon={record.is_active ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              onClick={() => onToggleRule(record[idKey])}
              danger={!record.is_active}
              style={{ color: record.is_active ? '#52c41a' : '#ff4d4f' }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => onEditRule(record)} style={{ color: '#1890ff' }} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onDeleteRule(record[idKey])} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={rules}
      rowKey={(record) => record[idKey]}
      pagination={{ pageSize: 10 }}
      size="middle"
      expandable={{
        expandedRowRender: (record) => {
          const conditions = type === 'l3' ? record.course_conditions : record.conditions;
          return (
            <div style={{ padding: '8px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <Typography.Title level={5} style={{ fontSize: '14px', margin: 0 }}>Detailed Conditions </Typography.Title>
                <Tag color="gold" style={{ fontSize: '10px' }}>Priority: {record.priority || 0}</Tag>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {type === 'l3' ? (
                  <>
                    {['preferred_university', 'preferred_specialization', 'preferred_degree', 'preferred_stream', 'preferred_city', 'preferred_state'].map(field => {
                      const value = record.conditions?.[field];
                      if (!value || (Array.isArray(value) && value.length === 0)) return null;
                      const labels = {
                        preferred_university: 'Univ',
                        preferred_specialization: 'Spec',
                        preferred_degree: 'Deg',
                        preferred_stream: 'Stream',
                        preferred_city: 'City',
                        preferred_state: 'State'
                      };
                      return (
                        <div key={field} style={{ display: 'flex', alignItems: 'start', fontSize: '12px' }}>
                          <Text type="secondary" style={{ width: '70px', flexShrink: 0 }}>{labels[field]}:</Text>
                          <Text ellipsis>{Array.isArray(value) ? value.join(', ') : value}</Text>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  Object.entries(record.conditions || {}).map(([key, value]) => {
                    if (!value || (Array.isArray(value) && value.length === 0)) return null;
                    return (
                      <div key={key}>
                        <Text type="secondary" block style={{ fontSize: '12px', textTransform: 'uppercase' }}>{key.replace(/_/g, ' ')}</Text>
                        <Space wrap>
                          {Array.isArray(value) ? value.map(v => <Tag key={v}>{v}</Tag>) : <Text>{value}</Text>}
                        </Space>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        }
      }}
    />
  );
};

export default RuleTable;