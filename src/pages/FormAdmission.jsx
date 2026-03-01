import React, { useState, useEffect } from 'react';
import {
    Table,
    DatePicker,
    Card,
    Spin,
    Empty,
    Tag,
    Tooltip,
    Space,
    Typography,
    Button,
    Select
} from 'antd';
import {
    CalendarOutlined,
    DownloadOutlined,
    ReloadOutlined,
    RiseOutlined,
    FallOutlined,
    MinusOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import DashboardHeader from '../components/MainReport/DashboardHeader';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

const FormToAdmissionsReport = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [summaryStats, setSummaryStats] = useState({
        totalYtdForms: 0,
        totalYtdAdmissions: 0,
        totalYtdF2A: 0,
        totalMtdForms: 0,
        totalMtdAdmissions: 0,
        totalMtdF2A: 0,
        totalFtdForms: 0,
        totalFtdAdmissions: 0,
        totalFtdF2A: 0
    });

    const fetchData = async (date) => {
        setLoading(true);
        try {
            const tillDate = date.format('YYYY-MM-DD');
            const url = `${BASE_URL}/StudentCourseStatusLogs/course-reports?till_date=${tillDate}`;

            const response = await axios.get(url, {
                withCredentials: true,
            });

            if (response.data.success) {
                setData(response.data.data);
                calculateSummaryStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(selectedDate);
    }, []);

    const calculateSummaryStats = (data) => {
        // Get totals row (last item)
        const totals = data[data.length - 1];
        if (totals && totals.college_name === 'Total') {
            setSummaryStats({
                totalYtdForms: totals.ytd_forms,
                totalYtdAdmissions: totals.ytd_admissions,
                totalYtdF2A: totals.ytd_f2a,
                totalMtdForms: totals.mtd_forms,
                totalMtdAdmissions: totals.mtd_admissions,
                totalMtdF2A: totals.mtd_f2a,
                totalFtdForms: totals.ftd_forms,
                totalFtdAdmissions: totals.ftd_admissions,
                totalFtdF2A: totals.ftd_f2a
            });
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        fetchData(date);
    };

    const handleReset = () => {
        const today = dayjs();
        setSelectedDate(today);
        fetchData(today);
    };

    const getF2ATag = (value) => {
        let color = 'red';
        let icon = <FallOutlined />;

        if (value >= 50) {
            color = 'green';
            icon = <RiseOutlined />;
        } else if (value >= 30) {
            color = 'orange';
            icon = <MinusOutlined />;
        }

        return (
            <Tag color={color} className="px-3 py-1 font-semibold">
                {icon} {value}%
            </Tag>
        );
    };

    const columns = [
        {
            title: 'College',
            dataIndex: 'college_name',
            key: 'college_name',
            fixed: 'left',
            width: 250,
            render: (text, record) => (
                <Space>
                    <span className={`font-semibold ${record.college_name === 'Total' ? 'text-blue-600' : 'text-gray-800'}`}>
                        {text}
                    </span>
                    {record.college_name === 'Total' && (
                        <Tag color="blue" className="ml-2">Summary</Tag>
                    )}
                </Space>
            ),
        },
        // YTD Columns
        {
            title: 'YTD Forms',
            children: [
                {
                    title: 'Forms',
                    dataIndex: 'ytd_forms',
                    key: 'ytd_forms',
                    width: 100,
                    align: 'center',
                    sorter: (a, b) => a.ytd_forms - b.ytd_forms,
                    render: (value, record) => (
                        <span className={`font-medium ${record.college_name === 'Total' ? 'text-blue-600' : ''}`}>
                            {value}
                        </span>
                    ),
                },
                {
                    title: 'Adm',
                    dataIndex: 'ytd_admissions',
                    key: 'ytd_admissions',
                    width: 100,
                    align: 'center',
                    sorter: (a, b) => a.ytd_admissions - b.ytd_admissions,
                    render: (value, record) => (
                        <span className={`font-medium ${record.college_name === 'Total' ? 'text-blue-600' : ''}`}>
                            {value}
                        </span>
                    ),
                },
                {
                    title: 'F2A',
                    dataIndex: 'ytd_f2a',
                    key: 'ytd_f2a',
                    width: 100,
                    align: 'center',
                    sorter: (a, b) => a.ytd_f2a - b.ytd_f2a,
                    render: (value) => getF2ATag(value),
                },
            ],
        },
        // MTD Columns
        {
            title: 'MTD Forms',
            children: [
                {
                    title: 'Forms',
                    dataIndex: 'mtd_forms',
                    key: 'mtd_forms',
                    width: 100,
                    align: 'center',
                    sorter: (a, b) => a.mtd_forms - b.mtd_forms,
                    render: (value, record) => (
                        <span className={`font-medium ${record.college_name === 'Total' ? 'text-blue-600' : ''}`}>
                            {value}
                        </span>
                    ),
                },
                {
                    title: 'Adm',
                    dataIndex: 'mtd_admissions',
                    key: 'mtd_admissions',
                    width: 100,
                    align: 'center',
                    sorter: (a, b) => a.mtd_admissions - b.mtd_admissions,
                    render: (value, record) => (
                        <span className={`font-medium ${record.college_name === 'Total' ? 'text-blue-600' : ''}`}>
                            {value}
                        </span>
                    ),
                },
                {
                    title: 'F2A',
                    dataIndex: 'mtd_f2a',
                    key: 'mtd_f2a',
                    width: 100,
                    align: 'center',
                    sorter: (a, b) => a.mtd_f2a - b.mtd_f2a,
                    render: (value) => getF2ATag(value),
                },
            ],
        },
        // FTD Columns
        {
            title: 'FTD Forms',
            children: [
                {
                    title: 'Forms',
                    dataIndex: 'ftd_forms',
                    key: 'ftd_forms',
                    width: 100,
                    align: 'center',
                    sorter: (a, b) => a.ftd_forms - b.ftd_forms,
                    render: (value, record) => (
                        <span className={`font-medium ${record.college_name === 'Total' ? 'text-blue-600' : ''}`}>
                            {value}
                        </span>
                    ),
                },
                {
                    title: 'Adm',
                    dataIndex: 'ftd_admissions',
                    key: 'ftd_admissions',
                    width: 100,
                    align: 'center',
                    sorter: (a, b) => a.ftd_admissions - b.ftd_admissions,
                    render: (value, record) => (
                        <span className={`font-medium ${record.college_name === 'Total' ? 'text-blue-600' : ''}`}>
                            {value}
                        </span>
                    ),
                },
                {
                    title: 'F2A',
                    dataIndex: 'ftd_f2a',
                    key: 'ftd_f2a',
                    width: 100,
                    align: 'center',
                    sorter: (a, b) => a.ftd_f2a - b.ftd_f2a,
                    render: (value) => getF2ATag(value),
                },
            ],
        },
    ];

    const summaryCards = [
        {
            title: 'YTD Performance',
            metrics: [
                { label: 'Total Forms', value: summaryStats.totalYtdForms, color: 'blue' },
                { label: 'Total Admissions', value: summaryStats.totalYtdAdmissions, color: 'green' },
                { label: 'F2A Rate', value: `${summaryStats.totalYtdF2A}%`, color: 'purple' },
            ]
        },
        {
            title: 'MTD Performance',
            metrics: [
                { label: 'Total Forms', value: summaryStats.totalMtdForms, color: 'blue' },
                { label: 'Total Admissions', value: summaryStats.totalMtdAdmissions, color: 'green' },
                { label: 'F2A Rate', value: `${summaryStats.totalMtdF2A}%`, color: 'purple' },
            ]
        },
        {
            title: 'Today\'s Performance',
            metrics: [
                { label: 'Total Forms', value: summaryStats.totalFtdForms, color: 'blue' },
                { label: 'Total Admissions', value: summaryStats.totalFtdAdmissions, color: 'green' },
                { label: 'F2A Rate', value: `${summaryStats.totalFtdF2A}%`, color: 'purple' },
            ]
        }
    ];

    return (
        <div className="p-2 md:px-3 animate-in fade-in duration-500">
            <div className="mx-auto">
                <DashboardHeader
                    title="Form to Admissions Report"
                    subtitle="Track form submissions and conversion rates across colleges"
                    actions={
                        <div className="flex items-center gap-3">
                            <Space>
                                <CalendarOutlined className="text-gray-400" />
                                <Text strong className="text-gray-600">Till Date:</Text>
                            </Space>
                            <DatePicker
                                value={selectedDate}
                                onChange={handleDateChange}
                                format="YYYY-MM-DD"
                                className="!rounded-lg h-10 border-gray-300 hover:border-blue-400 focus:border-blue-500 w-40"
                                allowClear={false}
                            />

                            <Button
                                type="primary"
                                icon={<DownloadOutlined />}
                                className="flex items-center bg-blue-600 py-5"
                            >
                                Export
                            </Button>
                        </div>
                    }
                />

                {/* Summary Cards */}
                {data.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {summaryCards.map((card, idx) => (
                            <Card key={idx} className="shadow-sm hover:shadow-md transition-shadow">
                                <Title level={5} className="!mb-4 text-gray-700">{card.title}</Title>
                                <div className="space-y-3">
                                    {card.metrics.map((metric, midx) => (
                                        <div key={midx} className="flex justify-between items-center">
                                            <Text type="secondary">{metric.label}</Text>
                                            <Text strong className={`text-${metric.color}-600 text-lg`}>
                                                {metric.value}
                                            </Text>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Data Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <Spin spinning={loading} size="large">
                        {data.length > 0 ? (
                            <Table
                                columns={columns}
                                dataSource={data}
                                loading={loading}
                                rowKey={(record) => record.college_name}
                                scroll={{ x: 1500 }}
                                pagination={{
                                    pageSize: 20,
                                    showSizeChanger: true,
                                    showTotal: (total) => `Total ${total} colleges`,
                                    className: "px-4 py-2"
                                }}
                                bordered
                                className="form-to-admissions-table"
                                summary={() => (
                                    <Table.Summary fixed>
                                        <Table.Summary.Row>
                                            <Table.Summary.Cell index={0} colSpan={1}>
                                                <Text strong className="text-blue-600">Total Summary</Text>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} colSpan={9}>
                                                <div className="flex gap-6">
                                                    <Text>YTD F2A: <Tag color="blue">{summaryStats.totalYtdF2A}%</Tag></Text>
                                                    <Text>MTD F2A: <Tag color="green">{summaryStats.totalMtdF2A}%</Tag></Text>
                                                    <Text>Today F2A: <Tag color="purple">{summaryStats.totalFtdF2A}%</Tag></Text>
                                                </div>
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    </Table.Summary>
                                )}
                            />
                        ) : (
                            !loading && (
                                <div className="py-16">
                                    <Empty
                                        description={
                                            <span className="text-gray-500 font-medium">
                                                No data available for selected date
                                            </span>
                                        }
                                    />
                                </div>
                            )
                        )}
                    </Spin>
                </div>
            </div>

            <style>{`
        .form-to-admissions-table .ant-table-thead > tr > th {
          background-color: #f8fafc !important;
          font-weight: 600 !important;
          color: #1e293b !important;
          border-bottom: 2px solid #e2e8f0 !important;
          padding: 12px 8px !important;
          font-size: 12px !important;
          text-align: center !important;
        }
        .form-to-admissions-table .ant-table-thead > tr > th[colspan] {
          text-align: center !important;
          background-color: #f1f5f9 !important;
        }
        .form-to-admissions-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 10px 8px !important;
        }
        .form-to-admissions-table .ant-table-tbody > tr:hover > td {
          background-color: #f8fafc !important;
        }
        .form-to-admissions-table .ant-table-summary {
          background-color: #f8fafc !important;
          border-top: 2px solid #e2e8f0 !important;
        }
      `}</style>
        </div>
    );
};

export default FormToAdmissionsReport;