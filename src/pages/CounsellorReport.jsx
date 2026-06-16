import React, { useState, useEffect } from 'react';
import {
    Table,
    DatePicker,
    Select,
    Spin,
    Empty,
    Modal
} from 'antd';
import dayjs from 'dayjs';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import { Filter, Download, RotateCcw, Users, FileText, AlertTriangle, Clock } from 'lucide-react';
import DashboardHeader from '../components/MainReport/DashboardHeader';
import ExportFieldSelectModal from '../components/modals/ExportFieldSelectModal';

const { RangePicker } = DatePicker;
const { Option } = Select;

const CounsellorStatsDashboard = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [dateRange, setDateRange] = useState([null, null]);
    const [selectedCounsellor, setSelectedCounsellor] = useState('all');
    const [formType, setFormType] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [summaryStats, setSummaryStats] = useState({
        totalForms: 0,
        activeForms: 0,
        notInitiated: 0,
        calledWithin3Days: 0,
        called4To6Days: 0,
        called7PlusDays: 0,
    });

    const fetchData = async (startDate, endDate, counsellorId) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();

            if (startDate && endDate) {
                params.append('start_date', startDate.format('YYYY-MM-DD'));
                params.append('end_date', endDate.format('YYYY-MM-DD'));
            }

            if (counsellorId && counsellorId !== 'all') {
                params.append('counsellor_id', counsellorId);
            }
            if (formType) params.append('form_type', formType);

            const url = `${BASE_URL}/StudentCourseStatusLogs/counsellor-stats${params.toString() ? `?${params.toString()}` : ''}`;

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

    const calculateSummaryStats = (data) => {
        const totals = data.reduce(
            (acc, curr) => ({
                totalForms: acc.totalForms + (parseInt(curr.total_forms) || 0),
                activeForms: acc.activeForms + (parseInt(curr.active_forms) || 0),
                notInitiated: acc.notInitiated + (parseInt(curr.not_initiated_count) || 0),
                calledWithin3Days: acc.calledWithin3Days + (parseInt(curr.called_within_3_days) || 0),
                called4To6Days: acc.called4To6Days + (parseInt(curr.called_4_to_6_days) || 0),
                called7PlusDays: acc.called7PlusDays + (parseInt(curr.called_7_plus_days) || 0),
            }),
            {
                totalForms: 0,
                activeForms: 0,
                notInitiated: 0,
                calledWithin3Days: 0,
                called4To6Days: 0,
                called7PlusDays: 0,
            }
        );
        setSummaryStats(totals);
    };

    useEffect(() => {
        const [start, end] = dateRange;
        fetchData(start, end, selectedCounsellor);
    }, [formType]);

    const handleDateRangeChange = (dates) => {
        setDateRange(dates);
        if (dates && dates[0] && dates[1]) {
            fetchData(dates[0], dates[1], selectedCounsellor);
        } else {
            fetchData(null, null, selectedCounsellor);
        }
    };

    const handleCounsellorChange = (value) => {
        setSelectedCounsellor(value);
        const [startDate, endDate] = dateRange;
        fetchData(startDate, endDate, value);
    };

    const handleReset = () => {
        setDateRange([null, null]);
        setSelectedCounsellor('all');
        fetchData(null, null, 'all');
    };

    const COUNSELLOR_EXPORT_FIELD_LABELS = {
        counsellor_name: 'Counsellor',
        total_forms: 'Total Forms',
        active_forms: 'Active Forms',
        not_initiated_count: 'Not Initiated',
        called_within_3_days: 'Called Within 3 Days',
        called_4_to_6_days: 'Called 4-6 Days',
        called_7_plus_days: 'Called 7+ Days',
    };

    const [exportModalOpen, setExportModalOpen] = useState(false);

    const convertToCSV = (rows) => {
        if (!rows || rows.length === 0) return '';
        const headers = Object.keys(rows[0]);
        const csvRows = rows.map((row) =>
            headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
        );
        return [headers.join(','), ...csvRows].join('\n');
    };

    const confirmExport = (selectedFields) => {
        const filteredData = data.map((row) => {
            const filtered = {};
            selectedFields.forEach((key) => {
                filtered[key] = row[key];
            });
            return filtered;
        });
        const csvContent = convertToCSV(filteredData);
        const url = window.URL.createObjectURL(new Blob([csvContent], { type: 'text/csv' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `counsellor-performance-${dayjs().format('DD-MM-YYYY')}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        setExportModalOpen(false);
    };

    const BUCKET_LABELS = {
        total_forms: 'Total Forms',
        active_forms: 'Active Forms',
        not_initiated_count: 'Not Initiated',
        called_within_3_days: 'Called Within 3 Days',
        called_4_to_6_days: 'Called 4-6 Days',
        called_7_plus_days: 'Called 7+ Days',
    };

    const [drillDown, setDrillDown] = useState({
        visible: false, loading: false, data: [], counsellorName: '', bucket: '',
    });

    const handleCellClick = async (row, bucket) => {
        setDrillDown({ visible: true, loading: true, data: [], counsellorName: row.counsellor_name, bucket });
        try {
            const params = new URLSearchParams();
            const [start, end] = dateRange;
            if (start && end) {
                params.append('start_date', start.format('YYYY-MM-DD'));
                params.append('end_date', end.format('YYYY-MM-DD'));
            }
            if (formType) params.append('form_type', formType);
            params.append('counsellor_id', row.assigned_l3_counsellor_id || row.assigned_counsellor_l3_id || 'Unassigned');
            params.append('bucket', bucket);

            const res = await axios.get(`${BASE_URL}/StudentCourseStatusLogs/counsellor-stats/drilldown?${params.toString()}`, {
                withCredentials: true,
            });
            setDrillDown(prev => ({ ...prev, loading: false, data: res.data.success ? res.data.data : [] }));
        } catch (err) {
            console.error('Drill-down fetch failed:', err);
            setDrillDown(prev => ({ ...prev, loading: false, data: [] }));
        }
    };

    const drillColumns = [
        {
            title: 'Student ID', dataIndex: 'student_id', key: 'student_id', width: 130,
            render: (v) => (
                <span className="text-blue-600 hover:underline cursor-pointer font-mono text-sm"
                    onClick={() => window.open(`/student/${v}`, '_blank')}>{v}</span>
            ),
        },
        { title: 'Name', dataIndex: 'student_name', key: 'student_name', width: 150 },
        { title: 'University', dataIndex: 'university_name', key: 'university_name', width: 180 },
        { title: 'Course', dataIndex: 'course_name', key: 'course_name', width: 180 },
        { title: 'Latest Status', dataIndex: 'latest_status', key: 'latest_status', width: 180 },
        { title: 'First Status Date', dataIndex: 'first_status_date', key: 'first_status_date', width: 170, render: (v) => v ? dayjs(v).format('DD MMM YYYY HH:mm') : '--' },
        { title: 'First Remark Date', dataIndex: 'first_remark_date', key: 'first_remark_date', width: 170, render: (v) => v ? dayjs(v).format('DD MMM YYYY HH:mm') : <span className="text-slate-400">No remark</span> },
        { title: 'Days to First Action', dataIndex: 'days_to_first_action', key: 'days_to_first_action', width: 140, align: 'center', render: (v) => v == null ? <span className="text-slate-400">—</span> : v },
    ];

    const counsellorOptions = [...new Map(
        data.map(item => [item.assigned_counsellor_l3_id, {
            id: item.assigned_counsellor_l3_id,
            name: item.counsellor_name
        }])
    ).values()];

    const statsCards = [
        {
            label: 'Total Forms',
            value: summaryStats.totalForms,
            icon: FileText,
            color: 'blue'
        },
        {
            label: 'Active Forms',
            value: summaryStats.activeForms,
            icon: FileText,
            color: 'green'
        },
        {
            label: 'Not Initiated',
            value: summaryStats.notInitiated,
            icon: AlertTriangle,
            color: 'orange'
        },
        {
            label: 'Called Within 3 Days',
            value: summaryStats.calledWithin3Days,
            icon: Clock,
            color: 'purple'
        }
    ];

    const colorMap = {
        blue: {
            bg: 'bg-blue-50',
            text: 'text-blue-600',
            icon: 'bg-blue-500',
            shadow: 'shadow-blue-100'
        },
        green: {
            bg: 'bg-emerald-50',
            text: 'text-emerald-600',
            icon: 'bg-emerald-500',
            shadow: 'shadow-emerald-100'
        },
        orange: {
            bg: 'bg-orange-50',
            text: 'text-orange-600',
            icon: 'bg-orange-500',
            shadow: 'shadow-orange-100'
        },
        purple: {
            bg: 'bg-purple-50',
            text: 'text-purple-600',
            icon: 'bg-purple-500',
            shadow: 'shadow-purple-100'
        },
        slate: {
            bg: 'bg-slate-50',
            text: 'text-slate-600',
            icon: 'bg-slate-500',
            shadow: 'shadow-slate-100'
        }
    };

    const columns = [
        {
            title: 'Counsellor',
            dataIndex: 'counsellor_name',
            key: 'counsellor_name',
            fixed: 'left',
            width: 220,
            render: (text) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users size={14} className="text-blue-600" />
                    </div>
                    <span className="font-semibold text-slate-800">{text}</span>
                </div>
            ),
        },
        {
            title: 'Total Forms',
            dataIndex: 'total_forms',
            key: 'total_forms',
            width: 120,
            align: 'center',
            sorter: (a, b) => parseInt(a.total_forms) - parseInt(b.total_forms),
            render: (value, row) => (
                <span className="inline-flex items-center justify-center min-w-8 px-3 py-1 rounded-lg text-blue-700 text-sm font-bold cursor-pointer hover:bg-blue-50" onClick={() => handleCellClick(row, 'total_forms')}>
                    {parseInt(value) || 0}
                </span>
            ),
        },
        {
            title: 'Active Forms',
            dataIndex: 'active_forms',
            key: 'active_forms',
            width: 130,
            align: 'center',
            sorter: (a, b) => parseInt(a.active_forms) - parseInt(b.active_forms),
            render: (value, row) => (
                <span className="inline-flex items-center justify-center min-w-8 px-3 py-1 rounded-lg text-green-700 text-sm font-bold cursor-pointer hover:bg-green-50" onClick={() => handleCellClick(row, 'active_forms')}>
                    {parseInt(value) || 0}
                </span>
            ),
        },
        {
            title: 'Not Initiated',
            dataIndex: 'not_initiated_count',
            key: 'not_initiated_count',
            width: 130,
            align: 'center',
            sorter: (a, b) => parseInt(a.not_initiated_count) - parseInt(b.not_initiated_count),
            render: (value, row) => (
                <span className="inline-flex items-center justify-center min-w-8 px-3 py-1 rounded-lg text-orange-700 text-sm font-bold cursor-pointer hover:bg-orange-50" onClick={() => handleCellClick(row, 'not_initiated_count')}>
                    {parseInt(value) || 0}
                </span>
            ),
        },
        {
            title: 'Called Within 3 Days',
            dataIndex: 'called_within_3_days',
            key: 'called_within_3_days',
            width: 160,
            align: 'center',
            sorter: (a, b) => parseInt(a.called_within_3_days) - parseInt(b.called_within_3_days),
            render: (value, row) => (
                <span className="inline-flex items-center justify-center min-w-8 px-3 py-1 rounded-lg text-purple-700 text-sm font-medium cursor-pointer hover:bg-purple-50" onClick={() => handleCellClick(row, 'called_within_3_days')}>
                    {parseInt(value) || 0}
                </span>
            ),
        },
        {
            title: 'Called 4-6 Days',
            dataIndex: 'called_4_to_6_days',
            key: 'called_4_to_6_days',
            width: 150,
            align: 'center',
            sorter: (a, b) => parseInt(a.called_4_to_6_days) - parseInt(b.called_4_to_6_days),
            render: (value, row) => (
                <span className="inline-flex items-center justify-center min-w-8 px-3 py-1 rounded-lg bg-yellow-50 text-yellow-700 text-sm font-medium cursor-pointer hover:bg-yellow-100" onClick={() => handleCellClick(row, 'called_4_to_6_days')}>
                    {parseInt(value) || 0}
                </span>
            ),
        },
        {
            title: 'Called 7+ Days',
            dataIndex: 'called_7_plus_days',
            key: 'called_7_plus_days',
            width: 140,
            align: 'center',
            sorter: (a, b) => parseInt(a.called_7_plus_days) - parseInt(b.called_7_plus_days),
            render: (value, row) => (
                <span className="inline-flex items-center justify-center min-w-8 px-3 py-1 rounded-lg bg-red-50 text-red-700 text-sm font-medium cursor-pointer hover:bg-red-100" onClick={() => handleCellClick(row, 'called_7_plus_days')}>
                    {parseInt(value) || 0}
                </span>
            ),
        }
    ];

    return (
        <div className="p-2 md:p-4 animate-in fade-in duration-500">
            <div className="mx-auto">
                <DashboardHeader
                    title="Counsellor Performance Dashboard"
                    subtitle="Track counsellor performance and student follow-up metrics"
                    actions={
                        <div className="flex items-center gap-3">
                            <Select
                                value={formType}
                                onChange={setFormType}
                                allowClear
                                placeholder="Form Type"
                                style={{ minWidth: 130 }}
                                options={[
                                    { value: 'paid', label: '✓ Paid' },
                                    { value: 'unpaid', label: '✗ Unpaid' },
                                ]}
                            />
                            <RangePicker
                                className="!rounded-lg h-10 border-gray-300 hover:border-blue-400 focus:border-blue-500"
                                onChange={handleDateRangeChange}
                                value={dateRange}
                                format="YYYY-MM-DD"
                                placeholder={['Start Date', 'End Date']}
                            />

                            <button
                                onClick={() => setExportModalOpen(true)}
                                disabled={data.length === 0}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all font-medium text-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50"
                            >
                                <Download size={16} />
                                Export
                            </button>

                            <button
                                onClick={handleReset}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                            >
                                <RotateCcw size={16} />
                                Reset
                            </button>
                        </div>
                    }
                />

                <ExportFieldSelectModal
                    open={exportModalOpen}
                    onClose={() => setExportModalOpen(false)}
                    onExport={confirmExport}
                    title="Select Fields to Export"
                    fieldGroups={[
                        {
                            label: 'Available Fields',
                            color: 'blue',
                            fields: Object.keys(data[0] || {})
                                .filter((key) => COUNSELLOR_EXPORT_FIELD_LABELS[key])
                                .map((key) => ({ key, label: COUNSELLOR_EXPORT_FIELD_LABELS[key] })),
                        },
                    ]}
                />

                {/* Stats Cards */}
                {data.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {statsCards.map((card, i) => {
                            const colors = colorMap[card.color] || colorMap.blue;
                            const Icon = card.icon;

                            return (
                                <div
                                    key={i}
                                    className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center shadow-lg`}>
                                            <Icon size={20} className="text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                                                {card.label}
                                            </p>
                                            <p className={`text-2xl font-bold ${colors.text}`}>
                                                {card.value.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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
                                rowKey={(record) => `${record.assigned_counsellor_l3_id}`}
                                scroll={{ x: 1400 }}
                                pagination={{
                                    pageSize: 10,
                                    showSizeChanger: true,
                                    showTotal: (total) => `Total ${total} counsellors`,
                                    className: "px-4 py-2"
                                }}
                                className="counsellor-stats-table"
                            />
                        ) : (
                            !loading && (
                                <div className="py-16">
                                    <Empty
                                        description={
                                            <span className="text-gray-500 font-medium">
                                                No counsellor data available
                                            </span>
                                        }
                                    />
                                </div>
                            )
                        )}
                    </Spin>
                </div>
            </div>

            {/* Drill-down modal */}
            <Modal
                open={drillDown.visible}
                onCancel={() => setDrillDown(prev => ({ ...prev, visible: false }))}
                width="92vw"
                style={{ top: 20 }}
                footer={null}
                title={
                    <div className="flex items-center gap-3">
                        <span className="font-black text-slate-800">{drillDown.counsellorName || '—'}</span>
                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {BUCKET_LABELS[drillDown.bucket] || drillDown.bucket}
                        </span>
                    </div>
                }
            >
                <Spin spinning={drillDown.loading} tip="Loading students...">
                    {drillDown.data.length > 0 ? (
                        <Table
                            columns={drillColumns}
                            dataSource={drillDown.data}
                            rowKey={(r, idx) => `${r.student_id}-${r.course_id || idx}`}
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
                .counsellor-stats-table .ant-table-thead > tr > th {
                    white-space: nowrap !important;
                    background-color: #f8fafc !important;
                    font-weight: 600 !important;
                    color: #1e293b !important;
                    border-bottom: 2px solid #e2e8f0 !important;
                    padding: 14px 12px !important;
                    font-size: 12px !important;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .counsellor-stats-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding: 12px 12px !important;
                }
                .counsellor-stats-table .ant-table-tbody > tr:hover > td {
                    background-color: #f8fafc !important;
                }
                .counsellor-stats-table .ant-table-cell {
                    white-space: nowrap !important;
                }
                .ant-select-selector {
                    border-radius: 0.5rem !important;
                    border-color: #e2e8f0 !important;
                }
                .ant-select-selector:hover {
                    border-color: #3b82f6 !important;
                }
                .ant-picker {
                    border-radius: 0.5rem !important;
                    border-color: #e2e8f0 !important;
                }
                .ant-picker:hover {
                    border-color: #3b82f6 !important;
                }
                .ant-picker-focused {
                    border-color: #3b82f6 !important;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
                }
            `}</style>
        </div>
    );
};

export default CounsellorStatsDashboard;