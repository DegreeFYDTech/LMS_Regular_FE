import React, { useEffect, useState, useMemo } from 'react';
import { Table, Input, Select, DatePicker, Button, Tag, Card, Typography, Space, Badge, Tooltip, Empty, Breadcrumb, Avatar } from 'antd';
import {
  SearchOutlined,
  HistoryOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  DesktopOutlined,
  ReloadOutlined,
  FilterOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { fetchLoginAttempts } from '../network/counsellor';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

const LoginAttempts = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});

  const load = async (p = page, l = limit, f = filters) => {
    setLoading(true);
    try {
      const params = { page: p, limit: l, ...f };
      if (f.dateRange && f.dateRange.length === 2) {
        params.startDate = f.dateRange[0].startOf('day').toISOString();
        params.endDate = f.dateRange[1].endOf('day').toISOString();
      }
      const res = await fetchLoginAttempts(params);
      setData(res.attempts || []);
      setTotal(res.total || 0);
      setPage(res.page || p);
      setLimit(res.limit || l);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1, limit, filters); }, []);

  const columns = [
    {
      title: 'Temporal Signature',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (t) => (
        <Space direction="vertical" size={0}>
          <Text strong className="text-[12px]">{dayjs(t).format('DD MMM YYYY')}</Text>
          <Text type="secondary" className="text-[11px] uppercase">{dayjs(t).format('HH:mm:ss A')}</Text>
        </Space>
      )
    },
    {
      title: 'Identity & Tier',
      key: 'user',
      render: (_, record) => (
        <Space size="middle">
          <Avatar className="bg-indigo-100 text-indigo-600" icon={<UserOutlined />} />
          <div>
            <div className="font-bold text-gray-800">{record.user_name}</div>
            <Tag className="text-[10px] uppercase font-bold rounded-full border-none bg-gray-100 text-gray-600">
              {record.user_type}
            </Tag>
          </div>
        </Space>
      )
    },
    {
      title: 'Connectivity',
      key: 'connectivity',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text className="text-xs flex items-center gap-1">
            <GlobalOutlined className="text-blue-400" /> {record.ip_address}
          </Text>
          <Text type="secondary" className="text-[10px] flex items-center gap-1">
            <DesktopOutlined className="text-gray-400" /> {record.device || 'Undefined Hardware'}
          </Text>
        </Space>
      )
    },
    {
      title: 'Outcome',
      dataIndex: 'success',
      key: 'success',
      width: 120,
      render: (s) => s ? (
        <Tag icon={<CheckCircleOutlined />} color="success" className="rounded-lg px-2 py-0.5 border-none shadow-sm font-bold uppercase text-[10px]">
          Authorized
        </Tag>
      ) : (
        <Tag icon={<ExclamationCircleOutlined />} color="error" className="rounded-lg px-2 py-0.5 border-none shadow-sm font-bold uppercase text-[10px]">
          Violation
        </Tag>
      )
    },
    {
      title: 'Audit Metadata',
      dataIndex: 'meta',
      key: 'meta',
      ellipsis: true,
      render: (m) => {
        if (!m) return <Text type="secondary" className="italic text-xs">No Meta Captured</Text>;
        try {
          const meta = typeof m === 'string' ? JSON.parse(m) : m;
          return (
            <Tooltip title={<pre className="text-[10px]">{JSON.stringify(meta, null, 2)}</pre>} overlayStyle={{ maxWidth: '400px' }}>
              <div className="bg-gray-50 p-1.5 rounded border border-gray-100 flex gap-2">
                {Object.keys(meta).slice(0, 2).map(key => (
                  <Tag key={key} className="m-0 text-[9px] bg-white border-gray-200">
                    <span className="text-gray-400">{key}:</span> {String(meta[key])}
                  </Tag>
                ))}
                {Object.keys(meta).length > 2 && <Text type="secondary" className="text-[9px]">+{Object.keys(meta).length - 2} more</Text>}
              </div>
            </Tooltip>
          );
        } catch (e) {
          return <Text type="secondary" className="text-[11px]">{String(m)}</Text>;
        }
      }
    }
  ];

  const handleApplyFilters = () => { load(1, limit, filters); };
  const handleReset = () => {
    const fresh = {};
    setFilters(fresh);
    load(1, limit, fresh);
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-6 lg:p-8 font-sans">
      {/* Navigation Breadcrumb */}
      <Breadcrumb className="mb-6 text-[12px] uppercase tracking-wider font-semibold">
        <Breadcrumb.Item href="/counsellorslisting"><HomeOutlined /> Team</Breadcrumb.Item>
        <Breadcrumb.Item>Audit Hub: Login Surveillance</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <Title level={2} className="m-0 text-gray-800 flex items-center gap-3">
            <HistoryOutlined className="text-indigo-600" />
            Security Audit Trail
          </Title>
          <Text type="secondary">Review authentication history and network signatures for all endpoints</Text>
        </div>

        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => load(page, limit, filters)}
            className="rounded-lg shadow-sm h-10 px-4"
          >
            Refresh Feed
          </Button>
        </Space>
      </div>

      {/* Structured Filters */}
      <Card className="mb-6 rounded-xl border-none shadow-sm overflow-visible">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="space-y-1.5">
            <Text strong className="text-[11px] uppercase text-gray-400 tracking-wider flex items-center gap-1">
              <SearchOutlined /> Identity Search
            </Text>
            <Input
              placeholder="Internal ID or Name..."
              value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
              className="rounded-lg h-10 border-gray-200"
              allowClear
            />
          </div>

          <div className="space-y-1.5">
            <Text strong className="text-[11px] uppercase text-gray-400 tracking-wider flex items-center gap-1">
              <SafetyCertificateOutlined /> Authorization Tier
            </Text>
            <Select
              placeholder="Select Type"
              className="w-full h-10"
              value={filters.user_type}
              onChange={v => setFilters(p => ({ ...p, user_type: v }))}
              allowClear
            >
              <Option value="counsellor">Counsellors (L2/L3)</Option>
              <Option value="supervisor">Supervisors</Option>
              <Option value="analyser">System Analysers</Option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Text strong className="text-[11px] uppercase text-gray-400 tracking-wider flex items-center gap-1">
              <CheckCircleOutlined /> Security Outcome
            </Text>
            <Select
              placeholder="Status"
              className="w-full h-10"
              value={filters.success}
              onChange={v => setFilters(p => ({ ...p, success: v }))}
              allowClear
            >
              <Option value={true}>Authorized Access</Option>
              <Option value={false}>Denied Access</Option>
            </Select>
          </div>

          <div className="space-y-1.5 lg:col-span-1">
            <Text strong className="text-[11px] uppercase text-gray-400 tracking-wider flex items-center gap-1">
              <FilterOutlined /> Surveillance Window
            </Text>
            <RangePicker
              className="w-full h-10 rounded-lg border-gray-200"
              value={filters.dateRange}
              onChange={r => setFilters(p => ({ ...p, dateRange: r }))}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="primary"
              onClick={handleApplyFilters}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 border-none h-10 font-bold rounded-lg shadow-md"
            >
              Execute Audit
            </Button>
            <Button
              onClick={handleReset}
              className="h-10 rounded-lg"
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="rounded-xl border-none shadow-sm overflow-hidden p-0">
        <Table
          columns={columns}
          dataSource={data}
          rowKey={(r) => r.id}
          loading={loading}
          className="premium-table"
          scroll={{ x: 1000 }}
          locale={{ emptyText: <Empty description="No surveillance data matches your query" /> }}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['20', '50', '100'],
            onChange: (p, s) => load(p, s, filters),
            className: "pr-6 py-4"
          }}
        />
      </Card>
    </div>
  );
};

export default LoginAttempts;

