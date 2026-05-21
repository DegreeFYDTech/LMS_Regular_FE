import React, { useState, useEffect } from 'react';
import {
    Table,
    DatePicker,
    Card,
    Spin,
    Empty,
    Tag,
    Space,
    Typography,
    Button,
    Select,
    Modal,
    Tooltip,
} from 'antd';
import {
    CalendarOutlined,
    DownloadOutlined,
    RiseOutlined,
    FallOutlined,
    MinusOutlined,
    AppstoreOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import DashboardHeader from '../components/MainReport/DashboardHeader';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const METRIC_LABELS = {
    range_forms: 'Range Forms',
    range_admissions: 'Range Admissions',
    month_forms: 'Month Forms',
    month_admissions: 'Month Admissions',
    year_forms: 'Year Forms',
    year_admissions: 'Year Admissions',
};

const FormToAdmissionsReport = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState({ rangeLabel: '', monthLabel: '', yearLabel: '', groupBy: 'college' });
    const [selectedRange, setSelectedRange] = useState([dayjs().subtract(6, 'day'), dayjs()]);
    const [groupBy, setGroupBy] = useState('college');
    const [summaryStats, setSummaryStats] = useState({
        totalRangeForms: 0,
        totalRangeAdmissions: 0,
        totalRangeF2A: 0,
        totalMonthForms: 0,
        totalMonthAdmissions: 0,
        totalMonthF2A: 0,
        totalYearForms: 0,
        totalYearAdmissions: 0,
        totalYearF2A: 0,
    });

    const [drillDown, setDrillDown] = useState({
        visible: false,
        loading: false,
        data: [],
        collegeName: '',
        metric: '',
    });

    const fetchData = async (range, gb = groupBy) => {
        if (!range || !range[0] || !range[1]) return;
        setLoading(true);
        try {
            const startDate = range[0].format('YYYY-MM-DD');
            const endDate = range[1].format('YYYY-MM-DD');
            const url = `${BASE_URL}/StudentCourseStatusLogs/course-reports?start_date=${startDate}&end_date=${endDate}&group_by=${gb}`;

            const response = await axios.get(url, { withCredentials: true });

            if (response.data.success) {
                setData(response.data.data);
                setMeta(response.data.meta || {});
                calculateSummaryStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(selectedRange);
    }, []);

    const computeF2A = (forms, admissions) =>
        forms > 0 ? Number(((admissions / forms) * 100).toFixed(1)) : 0;

    const calculateSummaryStats = (rows) => {
        const totals = rows[rows.length - 1];
        if (totals && totals.college_name === 'Total') {
            setSummaryStats({
                totalRangeForms: totals.range_forms || 0,
                totalRangeAdmissions: totals.range_admissions || 0,
                totalRangeF2A: computeF2A(totals.range_forms, totals.range_admissions),
                totalMonthForms: totals.month_forms || 0,
                totalMonthAdmissions: totals.month_admissions || 0,
                totalMonthF2A: computeF2A(totals.month_forms, totals.month_admissions),
                totalYearForms: totals.year_forms || 0,
                totalYearAdmissions: totals.year_admissions || 0,
                totalYearF2A: computeF2A(totals.year_forms, totals.year_admissions),
            });
        }
    };

    const handleRangeChange = (range) => {
        setSelectedRange(range);
        if (range && range[0] && range[1]) fetchData(range, groupBy);
    };

    const handleGroupByChange = (value) => {
        setGroupBy(value);
        fetchData(selectedRange, value);
    };

    const handleCellClick = async (collegeName, metric) => {
        if (!collegeName || collegeName === 'Total') return;
        setDrillDown({ visible: true, loading: true, data: [], collegeName, metric });
        try {
            const response = await axios.get(`${BASE_URL}/StudentCourseStatusLogs/course-reports`, {
                params: {
                    start_date: selectedRange[0].format('YYYY-MM-DD'),
                    end_date: selectedRange[1].format('YYYY-MM-DD'),
                    group_by: groupBy,
                    type: 'raw',
                    college_name: collegeName,
                    metric,
                },
                withCredentials: true,
            });
            const raw = response.data?.data ?? response.data;
            setDrillDown(prev => ({
                ...prev,
                loading: false,
                data: Array.isArray(raw) ? raw : [],
            }));
        } catch (error) {
            console.error('Drill-down failed:', error);
            setDrillDown(prev => ({ ...prev, loading: false, data: [] }));
        }
    };

    const handleExport = () => {
        if (!data.length) {
            alert('No data available to export');
            return;
        }
        const colLabel = groupBy === 'l3' ? 'L3 Counsellor' : 'College';
        const headers = [
            colLabel,
            `${meta.rangeLabel || 'Range'} Forms`,
            `${meta.rangeLabel || 'Range'} Admissions`,
            `${meta.rangeLabel || 'Range'} F2A%`,
            `${meta.monthLabel || 'Month'} Forms`,
            `${meta.monthLabel || 'Month'} Admissions`,
            `${meta.monthLabel || 'Month'} F2A%`,
            `${meta.yearLabel || 'Year'} Forms`,
            `${meta.yearLabel || 'Year'} Admissions`,
            `${meta.yearLabel || 'Year'} F2A%`,
        ];
        const rows = data.map(row => [
            `"${row.college_name || ''}"`,
            row.range_forms || 0,
            row.range_admissions || 0,
            computeF2A(row.range_forms, row.range_admissions),
            row.month_forms || 0,
            row.month_admissions || 0,
            computeF2A(row.month_forms, row.month_admissions),
            row.year_forms || 0,
            row.year_admissions || 0,
            computeF2A(row.year_forms, row.year_admissions),
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `form-to-admissions-${selectedRange[0].format('YYYY-MM-DD')}-to-${selectedRange[1].format('YYYY-MM-DD')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const getF2ATag = (value) => {
        let color = 'red';
        let icon = <FallOutlined />;
        if (value >= 50) { color = 'green'; icon = <RiseOutlined />; }
        else if (value >= 30) { color = 'orange'; icon = <MinusOutlined />; }
        return (
            <Tag color={color} className="px-3 py-1 font-semibold">
                {icon} {value}%
            </Tag>
        );
    };

    const makeClickableCell = (value, record, metricKey) => {
        const isTotal = record.college_name === 'Total';
        if (isTotal) {
            return <span className="font-medium text-blue-600">{value || 0}</span>;
        }
        return (
            <Tooltip title={`Click to view students`}>
                <span
                    onClick={() => handleCellClick(record.college_name, metricKey)}
                    className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-full text-sm font-bold cursor-pointer hover:scale-110 transition-transform text-blue-700 bg-blue-50 border border-blue-100"
                >
                    {value || 0}
                </span>
            </Tooltip>
        );
    };

    const makeGroup = (groupTitle, formsKey, admissionsKey) => ({
        title: groupTitle,
        children: [
            {
                title: 'Forms',
                dataIndex: formsKey,
                key: formsKey,
                width: 100,
                align: 'center',
                sorter: (a, b) => (a[formsKey] || 0) - (b[formsKey] || 0),
                render: (value, record) => makeClickableCell(value, record, formsKey),
            },
            {
                title: 'Adm',
                dataIndex: admissionsKey,
                key: admissionsKey,
                width: 100,
                align: 'center',
                sorter: (a, b) => (a[admissionsKey] || 0) - (b[admissionsKey] || 0),
                render: (value, record) => makeClickableCell(value, record, admissionsKey),
            },
            {
                title: 'F2A',
                key: `${formsKey}_f2a`,
                width: 100,
                align: 'center',
                sorter: (a, b) => computeF2A(a[formsKey], a[admissionsKey]) - computeF2A(b[formsKey], b[admissionsKey]),
                render: (_, record) => getF2ATag(computeF2A(record[formsKey], record[admissionsKey])),
            },
        ],
    });

    const columns = [
        {
            title: groupBy === 'l3' ? 'L3 Counsellor' : 'College',
            dataIndex: 'college_name',
            key: 'college_name',
            fixed: 'left',
            width: 250,
            render: (text, record) => (
                <Space>
                    <span className={`font-semibold ${record.college_name === 'Total' ? 'text-blue-600' : 'text-gray-800'}`}>
                        {text}
                    </span>
                    {record.college_name === 'Total' && <Tag color="blue" className="ml-2">Summary</Tag>}
                </Space>
            ),
        },
        makeGroup(meta.rangeLabel || 'Range', 'range_forms', 'range_admissions'),
        makeGroup(meta.monthLabel || 'Month', 'month_forms', 'month_admissions'),
        makeGroup(meta.yearLabel || 'Year', 'year_forms', 'year_admissions'),
    ];

    const drillColumns = [
        {
            title: 'Student ID',
            dataIndex: 'student_id',
            key: 'student_id',
            width: 130,
            render: (v) => (
                <span
                    className="text-blue-600 hover:underline cursor-pointer font-mono text-sm"
                    onClick={() => window.open(`/student/${v}`, '_blank')}
                >
                    {v}
                </span>
            ),
        },
        {
            title: 'Student Name',
            dataIndex: 'student_name',
            key: 'student_name',
            width: 160,
            render: (v) => v || '--',
        },
        {
            title: 'College Name',
            dataIndex: 'college_name',
            key: 'college_name',
            ellipsis: true,
        },
        {
            title: 'Course Name',
            dataIndex: 'course_name',
            key: 'course_name',
            ellipsis: true,
        },
        {
            title: 'Form Filled Date',
            dataIndex: 'form_filled_date',
            key: 'form_filled_date',
            width: 160,
            render: (v) => v ? dayjs(v).format('DD MMM YYYY') : '--',
        },
        {
            title: 'Admission Date',
            dataIndex: 'admission_date',
            key: 'admission_date',
            width: 160,
            render: (v) => v ? dayjs(v).format('DD MMM YYYY') : '--',
        },
        {
            title: 'Assigned Counsellor',
            dataIndex: 'assigned_l3_name',
            key: 'assigned_l3_name',
            width: 160,
            render: (v) => v || '--',
        },
    ];

    const summaryCards = [
        {
            title: meta.rangeLabel ? `Range: ${meta.rangeLabel}` : 'Range Performance',
            metrics: [
                { label: 'Total Forms', value: summaryStats.totalRangeForms, color: 'blue' },
                { label: 'Total Admissions', value: summaryStats.totalRangeAdmissions, color: 'green' },
                { label: 'F2A Rate', value: `${summaryStats.totalRangeF2A}%`, color: 'purple' },
            ],
        },
        {
            title: meta.monthLabel ? `Month: ${meta.monthLabel}` : 'Month Performance',
            metrics: [
                { label: 'Total Forms', value: summaryStats.totalMonthForms, color: 'blue' },
                { label: 'Total Admissions', value: summaryStats.totalMonthAdmissions, color: 'green' },
                { label: 'F2A Rate', value: `${summaryStats.totalMonthF2A}%`, color: 'purple' },
            ],
        },
        {
            title: meta.yearLabel || 'Year Performance',
            metrics: [
                { label: 'Total Forms', value: summaryStats.totalYearForms, color: 'blue' },
                { label: 'Total Admissions', value: summaryStats.totalYearAdmissions, color: 'green' },
                { label: 'F2A Rate', value: `${summaryStats.totalYearF2A}%`, color: 'purple' },
            ],
        },
    ];

    return (
        <div className="p-2 md:px-3 animate-in fade-in duration-500">
            <div className="mx-auto">
                <DashboardHeader
                    title="Form to Admissions Report"
                    subtitle="Track form submissions and conversion rates across colleges"
                    actions={
                        <div className="flex items-center gap-3">
                            <Select
                                value={groupBy}
                                onChange={handleGroupByChange}
                                style={{ width: 140 }}
                                options={[
                                    { value: 'college', label: <span><AppstoreOutlined className="mr-1" />College-wise</span> },
                                    { value: 'l3', label: <span><AppstoreOutlined className="mr-1" />L3-wise</span> },
                                ]}
                            />
                            <Space>
                                <CalendarOutlined className="text-gray-400" />
                                <Text strong className="text-gray-600">Date Range:</Text>
                            </Space>
                            <RangePicker
                                value={selectedRange}
                                onChange={handleRangeChange}
                                format="YYYY-MM-DD"
                                className="rounded-lg! h-10 border-gray-300 hover:border-blue-400 focus:border-blue-500"
                                allowClear={false}
                            />
                            <Button
                                type="primary"
                                icon={<DownloadOutlined />}
                                onClick={handleExport}
                                className="flex items-center bg-blue-600 py-5"
                            >
                                Export
                            </Button>
                        </div>
                    }
                />

                {data.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {summaryCards.map((card, idx) => (
                            <Card key={idx} className="shadow-sm hover:shadow-md transition-shadow">
                                <Title level={5} className="mb-4! text-gray-700">{card.title}</Title>
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
                                    className: "px-4 py-2",
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
                                                    <Text>Range F2A: <Tag color="blue">{summaryStats.totalRangeF2A}%</Tag></Text>
                                                    <Text>Month F2A: <Tag color="green">{summaryStats.totalMonthF2A}%</Tag></Text>
                                                    <Text>Year F2A: <Tag color="purple">{summaryStats.totalYearF2A}%</Tag></Text>
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
                                                No data available for selected date range
                                            </span>
                                        }
                                    />
                                </div>
                            )
                        )}
                    </Spin>
                </div>
            </div>

            {/* Drill-down Modal */}
            <Modal
                open={drillDown.visible}
                onCancel={() => setDrillDown(prev => ({ ...prev, visible: false }))}
                width="90vw"
                style={{ top: 20 }}
                footer={null}
                title={
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-black text-slate-800">{drillDown.collegeName}</span>
                        <Tag color="blue" className="font-semibold">
                            {METRIC_LABELS[drillDown.metric] || drillDown.metric}
                        </Tag>
                        <span className="text-xs text-slate-400">
                            {selectedRange[0]?.format('DD MMM')} – {selectedRange[1]?.format('DD MMM YYYY')}
                        </span>
                    </div>
                }
            >
                <Spin spinning={drillDown.loading} tip="Loading students...">
                    {drillDown.data.length > 0 ? (
                        <Table
                            columns={drillColumns}
                            dataSource={drillDown.data}
                            rowKey={(r, i) => `${r.student_id}-${r.course_id ?? i}`}
                            pagination={{ pageSize: 20, showSizeChanger: false }}
                            size="small"
                            scroll={{ x: 'max-content' }}
                        />
                    ) : !drillDown.loading ? (
                        <Empty description="No students found" />
                    ) : null}
                </Spin>
            </Modal>

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
