import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  DatePicker,
  Select,
  Spin,
  Empty,
  Tooltip,
  Modal,
} from 'antd';
import dayjs from 'dayjs';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import { Download, RotateCcw, Building2, Users, FileText, Calendar, AlertCircle, X } from 'lucide-react';
import DashboardHeader from '../components/MainReport/DashboardHeader';

const { RangePicker } = DatePicker;

const CATEGORY_LABELS = {
  not_worked: 'Not Worked',
  days_0_3: '0–3 Days',
  days_4_6: '4–6 Days',
  days_6_plus: '6+ Days',
  total: 'Total',
};

const ActiveFormReport = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs()]);
  const [groupBy, setGroupBy] = useState('college');
  const [formType, setFormType] = useState(null);

  const [drillDown, setDrillDown] = useState({
    visible: false,
    loading: false,
    data: [],
    groupName: '',
    category: '',
  });

  const fetchReportData = useCallback(async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return;

    setLoading(true);
    try {
      const params = {
        date_from: dateRange[0].format('YYYY-MM-DD'),
        date_to: dateRange[1].format('YYYY-MM-DD'),
        type: groupBy === 'l3' ? 'l3_summary' : 'summary',
        ...(formType && { form_type: formType }),
      };

      const response = await axios.get(`${BASE_URL}/studentcoursestatus/active-form-college-report`, { params });
      setReportData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching active form report:', error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, groupBy]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleCellClick = useCallback(async (groupName, category) => {
    setDrillDown({ visible: true, loading: true, data: [], groupName, category });
    try {
      const params = {
        date_from: dateRange[0].format('YYYY-MM-DD'),
        date_to: dateRange[1].format('YYYY-MM-DD'),
        type: 'raw',
        group_by: groupBy,
        drill_group: groupName,
        ...(category !== 'total' && { drill_category: category }),
      };
      const response = await axios.get(`${BASE_URL}/studentcoursestatus/active-form-college-report`, { params });
      setDrillDown(prev => ({ ...prev, loading: false, data: Array.isArray(response.data) ? response.data : [] }));
    } catch (error) {
      console.error('Drill-down fetch failed:', error);
      setDrillDown(prev => ({ ...prev, loading: false, data: [] }));
    }
  }, [dateRange, groupBy]);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = {
        date_from: dateRange[0].format('YYYY-MM-DD'),
        date_to: dateRange[1].format('YYYY-MM-DD'),
        type: 'raw',
      };

      const response = await axios.get(`${BASE_URL}/studentcoursestatus/active-form-college-report`, { params });
      const exportData = Array.isArray(response.data) ? response.data : [];

      if (exportData.length === 0) {
        alert("No data available to export");
        return;
      }

      const headers = ['Student ID', 'Course Name', 'College', 'Current Status', 'Assigned L3', 'Form Filled Date', 'Last L3 Remark Date', 'Last L3 Remark', 'L3 Counsellor (Remarked)'];
      const rows = exportData.map(row => [
        row.student_id,
        `"${row.course_name}"`,
        `"${row.college_name}"`,
        `"${row.course_status}"`,
        `"${row.assigned_l3_name || ''}"`,
        row.form_filled_date ? dayjs(row.form_filled_date).format('DD-MM-YYYY HH:mm') : '',
        row.last_l3_remark_date ? dayjs(row.last_l3_remark_date).format('DD-MM-YYYY HH:mm') : '',
        `"${(row.last_l3_remark || '').replace(/"/g, '""')}"`,
        `"${row.l3_counsellor_name || ''}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `active-form-raw-data-${dayjs().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const makeCellRender = (category, colorClass) => (count, record) => {
    const groupName = groupBy === 'l3' ? record.assigned_l3_name : record.university_name;
    return (
      <Tooltip title={`Click to see ${CATEGORY_LABELS[category]} students`}>
        <span
          onClick={() => handleCellClick(groupName, category)}
          className={`inline-flex items-center justify-center min-w-8 h-8 rounded-full text-sm font-bold cursor-pointer hover:scale-110 transition-transform ${colorClass}`}
        >
          {count}
        </span>
      </Tooltip>
    );
  };

  const stats = {
    totalCount: reportData.length,
    totalForms: reportData.reduce((acc, curr) => acc + parseInt(curr.total_count || 0), 0),
    notWorked: reportData.reduce((acc, curr) => acc + parseInt(curr.not_worked_cases || 0), 0),
    zeroToThree: reportData.reduce((acc, curr) => acc + parseInt(curr.days_0_3 || 0), 0),
  };

  const columns = [
    {
      title: groupBy === 'l3' ? 'L3 Counsellor' : 'College Name',
      dataIndex: groupBy === 'l3' ? 'assigned_l3_name' : 'university_name',
      key: 'group_name',
      render: (text) => <div className="font-semibold text-slate-800">{text}</div>,
    },
    {
      title: 'Not Worked',
      dataIndex: 'not_worked_cases',
      key: 'not_worked_cases',
      align: 'center',
      render: makeCellRender('not_worked', 'text-slate-600 bg-slate-100 border border-slate-200'),
    },
    {
      title: '0-3 Days',
      dataIndex: 'days_0_3',
      key: 'days_0_3',
      align: 'center',
      render: makeCellRender('days_0_3', 'text-blue-600 bg-blue-50 border border-blue-100'),
    },
    {
      title: '4-6 Days',
      dataIndex: 'days_4_6',
      key: 'days_4_6',
      align: 'center',
      render: makeCellRender('days_4_6', 'text-amber-600 bg-amber-50 border border-amber-100'),
    },
    {
      title: '6+ Days',
      dataIndex: 'days_6_plus',
      key: 'days_6_plus',
      align: 'center',
      render: makeCellRender('days_6_plus', 'text-rose-600 bg-rose-50 border border-rose-100'),
    },
    {
      title: 'Total Active Forms',
      dataIndex: 'total_count',
      key: 'total_count',
      align: 'center',
      render: makeCellRender('total', 'text-slate-800 bg-slate-200 px-3 rounded-lg'),
    },
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
      title: 'College',
      dataIndex: 'college_name',
      key: 'college_name',
      ellipsis: true,
    },
    {
      title: 'Course',
      dataIndex: 'course_name',
      key: 'course_name',
      ellipsis: true,
    },
    {
      title: 'Current Status',
      dataIndex: 'course_status',
      key: 'course_status',
      width: 200,
      render: (v) => <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{v}</span>,
    },
    {
      title: 'Assigned L3',
      dataIndex: 'assigned_l3_name',
      key: 'assigned_l3_name',
      width: 140,
    },
    {
      title: 'Form Filled Date',
      dataIndex: 'form_filled_date',
      key: 'form_filled_date',
      width: 150,
      render: (v) => v ? dayjs(v).format('DD MMM YYYY HH:mm') : '--',
    },
    {
      title: 'Last L3 Remark',
      dataIndex: 'last_l3_remark_date',
      key: 'last_l3_remark_date',
      width: 150,
      render: (v) => v ? dayjs(v).format('DD MMM YYYY HH:mm') : <span className="text-slate-400">No remark</span>,
    },
    {
      title: 'Remark',
      dataIndex: 'last_l3_remark',
      key: 'last_l3_remark',
      ellipsis: true,
      render: (v) => v || '--',
    },
    {
      title: 'Remarked By',
      dataIndex: 'l3_counsellor_name',
      key: 'l3_counsellor_name',
      width: 140,
    },
  ];

  return (
    <div className="p-2 md:p-4 animate-in fade-in duration-500">
      <div className="mx-auto">
        <DashboardHeader
          title="Active Form Reports"
          subtitle="Analysis based on days since last L3 remark"
          actions={
            <>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all font-bold text-xs shadow-sm shadow-slate-100 border bg-emerald-600 text-white border-slate-200 hover:bg-emerald-700"
              >
                <Download size={14} />
                EXPORT RAW DATA
              </button>
              <button
                onClick={() => { setDateRange([dayjs().startOf('month'), dayjs()]); setGroupBy('college'); }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all font-bold text-xs shadow-sm shadow-slate-100 border bg-blue-600 text-white border-slate-200 hover:bg-blue-700"
              >
                <RotateCcw size={14} />
                RESET
              </button>
            </>
          }
        />

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 border bg-slate-50 border-slate-200">
              <Calendar size={18} className="text-slate-400" />
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                format="DD/MM/YYYY"
                size="middle"
                className="!border-0 !bg-transparent !shadow-none !p-0"
                allowClear={false}
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 border bg-slate-50 border-slate-200">
              <Users size={16} className="text-slate-400" />
              <Select
                value={groupBy}
                onChange={setGroupBy}
                size="middle"
                className="!border-0 !bg-transparent !shadow-none min-w-[130px]"
                variant="borderless"
                options={[
                  { value: 'college', label: 'By College' },
                  { value: 'l3', label: 'By L3' },
                ]}
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 border bg-slate-50 border-slate-200">
              <Select
                value={formType}
                onChange={setFormType}
                allowClear
                placeholder="Form Type"
                size="middle"
                className="!border-0 !bg-transparent !shadow-none min-w-[110px]"
                variant="borderless"
                options={[
                  { value: 'paid', label: '✓ Paid' },
                  { value: 'unpaid', label: '✗ Unpaid' },
                ]}
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Selected Period:</span>
              <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full">
                {dateRange[0].format('DD MMM')} – {dateRange[1].format('DD MMM YYYY')}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: groupBy === 'l3' ? 'Total L3s' : 'Total Colleges', value: stats.totalCount, icon: Building2, bg: 'bg-blue-50', iconBg: 'bg-blue-500', textColor: 'text-blue-700', shadow: 'shadow-blue-200', labelColor: 'text-blue-400' },
            { label: 'Not Worked Cases', value: stats.notWorked, icon: AlertCircle, bg: 'bg-slate-100', iconBg: 'bg-slate-600', textColor: 'text-slate-700', shadow: 'shadow-slate-200', labelColor: 'text-slate-400' },
            { label: 'Total Active Forms', value: stats.totalForms, icon: FileText, bg: 'bg-emerald-50', iconBg: 'bg-emerald-500', textColor: 'text-emerald-700', shadow: 'shadow-emerald-200', labelColor: 'text-emerald-400' },
            { label: 'Worked (0-3 Days)', value: stats.zeroToThree, icon: Users, bg: 'bg-blue-50', iconBg: 'bg-blue-400', textColor: 'text-blue-600', shadow: 'shadow-blue-100', labelColor: 'text-blue-400' },
          ].map(({ label, value, icon: Icon, bg, iconBg, textColor, shadow, labelColor }) => (
            <div key={label} className={`${bg} rounded-xl p-4  border-opacity-50`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center shadow-lg ${shadow}`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${labelColor}`}>{label}</p>
                  <p className={`text-2xl font-black ${textColor}`}>{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <Spin spinning={loading} size="large" tip="Analyzing L3 Activity...">
            {reportData.length > 0 ? (
              <Table
                columns={columns}
                dataSource={reportData}
                rowKey={groupBy === 'l3' ? 'assigned_l3_name' : 'university_name'}
                pagination={false}
                className="custom-report-table"
                size="middle"
                scroll={{ x: 'max-content' }}
              />
            ) : (
              <div className="py-20 text-center">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div className="flex flex-col items-center">
                      <span className="text-slate-400 font-bold text-lg">No Active Forms Found</span>
                      <p className="text-slate-400 text-sm mt-1">Adjust the date range or check if forms are currently active.</p>
                    </div>
                  }
                />
              </div>
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
          <div className="flex items-center gap-3">
            <span className="font-black text-slate-800">{drillDown.groupName}</span>
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {CATEGORY_LABELS[drillDown.category]}
            </span>
            <span className="text-xs text-slate-400">
              {dateRange[0].format('DD MMM')} – {dateRange[1].format('DD MMM YYYY')}
            </span>
          </div>
        }
      >
        <Spin spinning={drillDown.loading} tip="Loading students...">
          {drillDown.data.length > 0 ? (
            <Table
              columns={drillColumns}
              dataSource={drillDown.data}
              rowKey={(r) => `${r.student_id}-${r.course_id}`}
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
        .custom-report-table .ant-table-thead > tr > th {
          background-color: #f8fafc !important;
          color: #64748b !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          font-size: 11px !important;
          border-bottom: 1px solid #e2e8f0 !important;
          padding: 16px !important;
        }
        .custom-report-table .ant-table-tbody > tr > td {
          padding: 16px !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .custom-report-table .ant-table-tbody > tr:hover > td {
          background-color: #f8fafc !important;
        }
      `}</style>
    </div>
  );
};

export default ActiveFormReport;
