import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Table, Tag, Spin, Empty, Statistic, Row, Col } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { BASE_URL } from '../config/api';

const PaymentStatus = ({ studentId }) => {
    const [loading, setLoading] = useState(false);
    const [payments, setPayments] = useState([]);
    const [studentInfo, setStudentInfo] = useState(null);

    useEffect(() => {
        if (studentId) {
            fetchPaymentStatus();
        }
    }, [studentId]);

    const fetchPaymentStatus = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/payment/student-details/${studentId}`, {
                withCredentials: true
            });

            if (response.data) {
                setStudentInfo(response.data.student);
                setPayments(response.data.payments || []);
            }
        } catch (error) {
            console.error("Failed to fetch payment status:", error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'College',
            dataIndex: 'college_name',
            key: 'college_name',
        },
        {
            title: 'Course',
            dataIndex: 'course_name',
            key: 'course_name',
        },
        {
            title: 'Amount',
            dataIndex: 'final_amount',
            key: 'final_amount',
            render: (amount, record) => (
                <div>
                    <div className="font-semibold">{record.currency || 'INR'} {amount}</div>
                    {record.discount_amount > 0 && (
                        <div className="text-xs text-gray-500">
                            Base: {record.currency || 'INR'} {record.base_amount}
                        </div>
                    )}
                </div>
            )
        },
        {
            title: 'Coupon',
            dataIndex: 'couponCode',
            key: 'couponCode',
            render: (code) => code ? <Tag color="blue">{code}</Tag> : <span className="text-gray-400">-</span>
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
                    <Tag color={color} icon={icon} style={{ minWidth: '90px', textAlign: 'center' }}>
                        {status}
                    </Tag>
                );
            }
        },
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => new Date(date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        }
    ];

    // Calculate summary statistics
    const totalPaid = payments
        .filter(p => p.status === 'COMPLETED' || p.status === 'PAID')
        .reduce((sum, p) => sum + parseFloat(p.final_amount || 0), 0);

    const totalPending = payments
        .filter(p => p.status === 'PENDING')
        .reduce((sum, p) => sum + parseFloat(p.final_amount || 0), 0);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Spin size="large" />
            </div>
        );
    }

    if (!payments || payments.length === 0) {
        return (
            <Card className="shadow-sm">
                <Empty
                    description="No payment records found for this student"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Student Info Card */}
            {studentInfo && (
                <Card className="shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">{studentInfo.name}</h3>
                            <div className="text-sm text-gray-600 mt-1">
                                <span className="mr-4">📧 {studentInfo.email}</span>
                                <span>📱 {studentInfo.phone}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Payment Summary */}
            <Row gutter={16}>
                <Col span={8}>
                    <Card bordered={false} className="bg-green-50 shadow-sm">
                        <Statistic
                            title="Total Paid"
                            value={totalPaid}
                            prefix="₹"
                            precision={2}
                            valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} className="bg-orange-50 shadow-sm">
                        <Statistic
                            title="Pending"
                            value={totalPending}
                            prefix="₹"
                            precision={2}
                            valueStyle={{ color: '#fa8c16', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} className="bg-blue-50 shadow-sm">
                        <Statistic
                            title="Total Transactions"
                            value={payments.length}
                            valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Payment History Table */}
            <Card className="shadow-sm" title={<span className="text-base font-semibold">Payment History</span>}>
                <Table
                    columns={columns}
                    dataSource={payments}
                    rowKey="id"
                    pagination={false}
                    className="border border-gray-100 rounded-lg overflow-hidden"
                    scroll={{ x: true }}
                />
            </Card>
        </div>
    );
};

export default PaymentStatus;
