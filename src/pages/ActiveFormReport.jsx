import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  DatePicker,
  Select,
  Spin,
  Empty,
  Tooltip,
} from 'antd';
import dayjs from 'dayjs';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import { Download, RotateCcw, Building2, Users, FileText, Calendar, AlertCircle } from 'lucide-react';
import DashboardHeader from '../components/MainReport/DashboardHeader';

const { RangePicker } = DatePicker;

const ActiveFormReport = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs()]);
  const [groupBy, setGroupBy] = useState('college');

  const fetchReportData = useCallback(async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return;

    setLoading(true);
    try {
      const params = {
        date_from: dateRange[0].format('YYYY-MM-DD'),
        date_to: dateRange[1].format('YYYY-MM-DD'),
        type: groupBy === 'l3' ? 'l3_summary' : 'summary'
      };

      const response = await axios.get(`${BASE_URL}/studentcoursestatus/active-form-college-report`, { params });
      
      if (Array.isArray(response.data)) {
        setReportData(response.data);
      } else {
        setReportData([]);
      }
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

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const handleResetFilters = () => {
    setDateRange([dayjs().startOf('month'), dayjs()]);
    setGroupBy('college');
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      // Always fetch raw data for export as requested by the user
      const params = {
        date_from: dateRange[0].format('YYYY-MM-DD'),
        date_to: dateRange[1].format('YYYY-MM-DD'),
        type: 'raw'
      };

      const response = await axios.get(`${BASE_URL}/studentcoursestatus/active-form-college-report`, { params });
      const exportData = Array.isArray(response.data) ? response.data : [];

      if (exportData.length === 0) {
        alert("No data available to export");
        return;
      }

      const headers = ['Student ID', 'Course Name', 'College', 'Current Status', 'Form Filled Date', 'Last L3 Remark Date', 'Last L3 Remark', 'L3 Counsellor'];
      const rows = exportData.map(row => [
        row.student_id,
        `"${row.course_name}"`,
        `"${row.college_name}"`,
        `"${row.course_status}"`,
        row.form_filled_date ? dayjs(row.form_filled_date).format('DD-MM-YYYY HH:mm') : '',
        row.last_l3_remark_date ? dayjs(row.last_l3_remark_date).format('DD-MM-YYYY HH:mm') : '',
        `"${(row.last_l3_remark || '').replace(/"/g, '""')}"`,
        `"${row.l3_counsellor_name || ''}"`
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

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
      title: 'Not Worked Cases',
      dataIndex: 'not_worked_cases',
      key: 'not_worked_cases',
      align: 'center',
      render: (count) => (
        <Tooltip title="Last remark is not from L3 or no remarks exist">
          <span className="inline-flex items-center justify-center min-w-8 h-8 rounded-full text-slate-600 text-sm font-bold bg-slate-100 border border-slate-200">
            {count}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '0-3 Days',
      dataIndex: 'days_0_3',
      key: 'days_0_3',
      align: 'center',
      render: (count) => (
        <span className="inline-flex items-center justify-center min-w-8 h-8 rounded-full text-blue-600 text-sm font-bold bg-blue-50 border border-blue-100">
          {count}
        </span>
      ),
    },
    {
      title: '4-6 Days',
      dataIndex: 'days_4_6',
      key: 'days_4_6',
      align: 'center',
      render: (count) => (
        <span className="inline-flex items-center justify-center min-w-8 h-8 rounded-full text-amber-600 text-sm font-bold bg-amber-50 border border-amber-100">
          {count}
        </span>
      ),
    },
    {
      title: '6+ Days',
      dataIndex: 'days_6_plus',
      key: 'days_6_plus',
      align: 'center',
      render: (count) => (
        <span className="inline-flex items-center justify-center min-w-8 h-8 rounded-full text-rose-600 text-sm font-bold bg-rose-50 border border-rose-100">
          {count}
        </span>
      ),
    },
    {
      title: 'Total Active Forms',
      dataIndex: 'total_count',
      key: 'total_count',
      align: 'center',
      render: (count) => (
        <span className="inline-flex items-center justify-center px-3 h-8 rounded-lg text-slate-800 text-sm font-black bg-slate-200">
          {count}
        </span>
      ),
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
                onClick={handleResetFilters}
                className="flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all font-bold text-xs shadow-sm shadow-slate-100 border bg-blue-600 text-white border-slate-200 hover:bg-blue-700"
              >
                <RotateCcw size={14} />
                RESET
              </button>
            </>
          }
        />

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 border bg-slate-50 border-slate-200">
              <Calendar size={18} className="text-slate-400" />
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
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
            
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Selected Period:</span>
              <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full">
                {dateRange[0].format('DD MMM')} - {dateRange[1].format('DD MMM YYYY')}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
                <Building2 size={20} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">{groupBy === 'l3' ? 'Total L3s' : 'Total Colleges'}</p>
                <p className="text-2xl font-black text-blue-700">{stats.totalCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center shadow-lg shadow-slate-200">
                <AlertCircle size={20} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Not Worked Cases</p>
                <p className="text-2xl font-black text-slate-700">{stats.notWorked}</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Total Active Forms</p>
                <p className="text-2xl font-black text-emerald-700">{stats.totalForms}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-100">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Worked (0-3 Days)</p>
                <p className="text-2xl font-black text-blue-600">{stats.zeroToThree}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
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
