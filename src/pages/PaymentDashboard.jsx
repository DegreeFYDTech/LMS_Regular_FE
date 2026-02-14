import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Table, Tag, Select, DatePicker, Button, Statistic, Row, Col, Drawer, Space } from 'antd';
import { SearchOutlined, ReloadOutlined, FilterOutlined, DollarOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { BASE_URL } from '../config/api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const PaymentDashboard = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [analytics, setAnalytics] = useState({
        total_records: 0,
        success: 0,
        failed: 0,
        pending: 0,
        total_revenue: 0
    });

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    const [filters, setFilters] = useState({
        role: '',
        user_id: '',
        from_date: null,
        to_date: null,
        status: ''
    });

    const [drawerVisible, setDrawerVisible] = useState(false);

    useEffect(() => {
        const getCookie = (name) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
        };

        setFilters(prev => ({
            ...prev,
            role: getCookie('role') || '',
            user_id: getCookie('id') || ''
        }));
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = {
                status: filters.status,
                from_date: filters.from_date ? filters.from_date.format('YYYY-MM-DD') : undefined,
                to_date: filters.to_date ? filters.to_date.format('YYYY-MM-DD') : undefined
            };

            if (filters.role) params.role = filters.role;
            if (filters.user_id) params.user_id = filters.user_id;

            const response = await axios.get(`${BASE_URL}/payment/reports`, {
                params,
                withCredentials: true
            });

            const fetchedData = response.data.data || [];
            setData(fetchedData);
            setAnalytics(response.data.analytics);
            setPagination(prev => ({ ...prev, total: fetchedData.length }));

        } catch (error) {
            console.error("Failed to fetch reports:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleTableChange = (newPagination) => {
        setPagination(newPagination);
    };

    const handleApplyFilters = () => {
        fetchReports();
        setDrawerVisible(false);
    };

    const handleClearFilters = () => {
        setFilters(prev => ({
            ...prev,
            from_date: null,
            to_date: null,
            status: ''
        }));
    };

    const columns = [
        {
            title: 'Student Name',
            dataIndex: ['student', 'student_name'],
            key: 'student_name',
            render: (text, record) => record.student ? record.student.student_name : record.student_name || 'N/A',
            fixed: 'left',
            width: 150,
        },
        {
            title: 'Email',
            dataIndex: ['student', 'student_email'],
            key: 'email',
            render: (text, record) => record.student ? record.student.student_email : record.email || 'N/A',
            width: 200,
        },
        {
            title: 'Phone',
            dataIndex: ['student', 'student_phone'],
            key: 'phone',
            render: (text, record) => record.student ? record.student.student_phone : record.phone || 'N/A',
            width: 130,
        },
        {
            title: 'College',
            dataIndex: 'college_name',
            key: 'college_name',
            width: 180,
        },
        {
            title: 'Course',
            dataIndex: 'course_name',
            key: 'course_name',
            width: 120,
        },
        {
            title: 'Amount',
            dataIndex: 'final_amount',
            key: 'final_amount',
            render: (amount, record) => (
                <div>
                    <div className="font-semibold text-gray-900">₹{amount}</div>
                    {record.discount_amount > 0 && (
                        <div className="text-xs text-gray-500">Base: ₹{record.base_amount}</div>
                    )}
                </div>
            ),
            width: 120,
        },
        {
            title: 'Coupon',
            dataIndex: 'couponCode',
            key: 'couponCode',
            render: (code) => code ? <Tag color="blue">{code}</Tag> : <span className="text-gray-400">-</span>,
            width: 120,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            render: (status) => {
                let color = 'default';
                let icon = null;

                if (status === 'COMPLETED' || status === 'PAID') {
                    color = 'success';
                    icon = <CheckCircleOutlined />;
                } else if (status === 'FAILED') {
                    color = 'error';
                    icon = <CloseCircleOutlined />;
                } else if (status === 'PENDING') {
                    color = 'warning';
                    icon = <ClockCircleOutlined />;
                }

                return (
                    <Tag color={color} icon={icon} style={{ minWidth: '100px', textAlign: 'center' }}>
                        {status}
                    </Tag>
                );
            },
            width: 130,
        },
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => new Date(date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            width: 120,
        }
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Analytics</h1>
                        <p className="text-gray-600">Track and analyze payment transactions</p>
                    </div>
                    <Space>
                        <Button
                            icon={<FilterOutlined />}
                            onClick={() => setDrawerVisible(true)}
                            size="large"
                        >
                            Filters
                        </Button>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchReports}
                            loading={loading}
                            size="large"
                        >
                            Refresh
                        </Button>
                    </Space>
                </div>
            </div>

            {/* Analytics Cards */}
            <Row gutter={16} className="mb-6">
                <Col xs={24} sm={12} md={4}>
                    <Card bordered={false} className="text-center shadow-sm hover:shadow-md transition-shadow">
                        <Statistic
                            title="Total Initiated"
                            value={analytics.total_records}
                            valueStyle={{ color: '#1890ff', fontWeight: '600' }}
                            prefix={<DollarOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={4}>
                    <Card bordered={false} className="text-center shadow-sm hover:shadow-md transition-shadow">
                        <Statistic
                            title="Successful"
                            value={analytics.success}
                            valueStyle={{ color: '#52c41a', fontWeight: '600' }}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={4}>
                    <Card bordered={false} className="text-center shadow-sm hover:shadow-md transition-shadow">
                        <Statistic
                            title="Failed"
                            value={analytics.failed}
                            valueStyle={{ color: '#ff4d4f', fontWeight: '600' }}
                            prefix={<CloseCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={4}>
                    <Card bordered={false} className="text-center shadow-sm hover:shadow-md transition-shadow">
                        <Statistic
                            title="Pending"
                            value={analytics.pending}
                            valueStyle={{ color: '#faad14', fontWeight: '600' }}
                            prefix={<ClockCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={24} md={8}>
                    <Card bordered={false} className="text-center shadow-sm hover:shadow-md transition-shadow">
                        <Statistic
                            title="Total Revenue"
                            value={analytics.total_revenue}
                            prefix="₹"
                            precision={2}
                            valueStyle={{ color: '#722ed1', fontWeight: '600' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Data Table */}
            <Card className="shadow-md" style={{ borderRadius: '12px' }}>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                        pageSizeOptions: ['10', '20', '50', '100']
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1300 }}
                    className="custom-table"
                />
            </Card>

            {/* Filter Drawer */}
            <Drawer
                title={
                    <div className="flex items-center gap-2">
                        <FilterOutlined />
                        <span>Filter Payments</span>
                    </div>
                }
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                width={400}
                footer={
                    <div className="flex justify-between">
                        <Button onClick={handleClearFilters}>Clear All</Button>
                        <Space>
                            <Button onClick={() => setDrawerVisible(false)}>Cancel</Button>
                            <Button type="primary" icon={<SearchOutlined />} onClick={handleApplyFilters}>
                                Apply Filters
                            </Button>
                        </Space>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                        <RangePicker
                            className="w-full"
                            value={[filters.from_date, filters.to_date]}
                            onChange={(dates) => setFilters(prev => ({
                                ...prev,
                                from_date: dates ? dates[0] : null,
                                to_date: dates ? dates[1] : null
                            }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                        <Select
                            placeholder="Select status"
                            className="w-full"
                            allowClear
                            value={filters.status || undefined}
                            onChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
                        >
                            <Option value="COMPLETED">Completed</Option>
                            <Option value="PENDING">Pending</Option>
                            <Option value="FAILED">Failed</Option>
                        </Select>
                    </div>
                </div>
            </Drawer>
        </div>
    );
};

export default PaymentDashboard;
