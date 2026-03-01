import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Select,
  DatePicker,
  Spin,
  Empty,
  Tooltip
} from 'antd';
import dayjs from 'dayjs';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import { Filter, Download, RotateCcw, Building2, Users, LayoutGrid, Eye } from 'lucide-react';
import DashboardHeader from '../components/MainReport/DashboardHeader';

const { Option } = Select;
const { RangePicker } = DatePicker;

const CollegeStatusReports = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    reportType: 'colleges',
    startDate: dayjs().startOf('month'),
    endDate: dayjs(),
  });

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        reportType: filters.reportType,
        startDate: filters.startDate.format('YYYY-MM-DD'),
        endDate: filters.endDate.format('YYYY-MM-DD'),
      };

      const response = await axios.get(`${BASE_URL}/StudentCourseStatusLogs/reports`, { params });

      if (response.data.success) {
        const uniqueStatuses = [...new Set(response.data.data.statuses)];
        const updatedData = {
          ...response.data,
          data: {
            ...response.data.data,
            statuses: uniqueStatuses,
            rows: response.data.data.rows.map(row => {
              const cleanedRow = { ...row };
              uniqueStatuses.forEach(status => {
                if (!cleanedRow.hasOwnProperty(status)) {
                  cleanedRow[status] = 0;
                }
              });
              return cleanedRow;
            })
          }
        };
        setReportData(updatedData);
      } else {
        throw new Error('Failed to fetch report data');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDateRangeChange = (dates) => {
    if (dates) {
      setFilters(prev => ({
        ...prev,
        startDate: dates[0],
        endDate: dates[1]
      }));
    }
  };

  const handleResetFilters = () => {
    setFilters({
      reportType: 'colleges',
      startDate: dayjs().startOf('month'),
      endDate: dayjs(),
    });
  };

  const handleExport = async () => {
    try {
      const params = {
        ...filters,
        startDate: filters.startDate.format('YYYY-MM-DD'),
        endDate: filters.endDate.format('YYYY-MM-DD')
      };

      const response = await axios.get(`${BASE_URL}/StudentCourseStatusLogs/reports/export`, {
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `status-report-${filters.reportType}-${dayjs().format('DD-MM-YYYY')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  // Stats cards data
  const getStatsCards = () => {
    if (!reportData?.data) return [];
    const { rows, statuses, totals } = reportData.data;
    const isCollegesView = filters.reportType === 'colleges';
    return [
      {
        label: isCollegesView ? 'Total Colleges' : 'Total Counsellors',
        value: rows.length,
        icon: isCollegesView ? Building2 : Users,
        color: 'blue'
      },
      {
        label: 'Grand Total',
        value: totals.grandTotal,
        icon: Users,
        color: 'slate'
      },
      {
        label: 'Status Types',
        value: statuses.length,
        icon: LayoutGrid,
        color: 'green'
      },
      {
        label: 'View Type',
        value: filters.reportType.toUpperCase(),
        icon: Eye,
        color: filters.reportType === 'l2' ? 'green' : filters.reportType === 'l3' ? 'orange' : 'blue'
      }
    ];
  };

  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-500' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-500' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'bg-orange-500' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-600', icon: 'bg-slate-500' }
  };

  // Build table columns
  const getTableColumns = () => {
    if (!reportData?.data) return [];
    const { statuses } = reportData.data;
    const isCollegesView = filters.reportType === 'colleges';
    const rowKey = isCollegesView ? 'college' : 'counsellor';
    const rowTitle = isCollegesView ? 'College' : 'Counsellor';

    return [
      {
        title: rowTitle,
        dataIndex: rowKey,
        key: rowKey,
        fixed: 'left',
        width: 200,
        render: (text) => (
          <span className="font-semibold text-slate-800">{text}</span>
        )
      },
      ...statuses.map(status => ({
        title: (
          <div className="whitespace-nowrap font-bold text-center px-2 truncate text-slate-700" title={status}>
            {status}
          </div>
        ),
        dataIndex: status,
        key: status,
        width: 180,
        align: 'center',
        render: (count) => (
          <Tooltip title={`${status}: ${count} students`}>
            <div className="flex justify-center">
              {count > 0 ? (
                <span className="inline-flex items-center justify-center min-w-8 h-8 rounded-full text-slate-800 text-sm font-medium bg-slate-50">
                  {count}
                </span>
              ) : (
                <span className="text-slate-300">0</span>
              )}
            </div>
          </Tooltip>
        )
      })),
      {
        title: 'Total',
        dataIndex: 'total',
        key: 'total',
        fixed: 'right',
        width: 100,
        align: 'center',
        render: (total) => (
          <span className="inline-flex items-center justify-center min-w-10 h-8 text-blue-700 bg-blue-50 rounded-lg text-sm font-black px-3">
            {total}
          </span>
        )
      }
    ];
  };

  const getDataSource = () => {
    if (!reportData?.data?.rows) return [];
    const { rows, statuses, totals } = reportData.data;
    const isCollegesView = filters.reportType === 'colleges';
    const rowKey = isCollegesView ? 'college' : 'counsellor';

    return [
      ...rows,
      {
        [rowKey]: 'TOTAL',
        ...statuses.reduce((acc, status) => {
          acc[status] = totals.statusTotals[status] || 0;
          return acc;
        }, {}),
        total: totals.grandTotal,
        isTotalRow: true
      }
    ];
  };

  const statsCards = getStatsCards();

  return (
    <div className="p-2 md:p-4 animate-in fade-in duration-500">
      <div className="mx-auto">
        <DashboardHeader
          title="College Status Reports"
          subtitle="Pivot table view showing status distribution"
          actions={
            <>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all font-bold text-xs shadow-sm shadow-slate-100 border ${showFilters ? 'bg-blue-500 text-white border-blue-600' : 'bg-blue-600 text-white border-slate-200 hover:border-blue-300'}`}
              >
                <Filter size={14} />
                {showFilters ? 'HIDE FILTERS' : 'FILTERS'}
              </button>
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all font-bold text-xs shadow-sm shadow-slate-100 border bg-blue-600 text-white border-slate-200 hover:border-blue-300"
              >
                <RotateCcw size={14} />
                RESET
              </button>
            </>
          }
        />

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-wrap items-end gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Date Range</label>
                <RangePicker
                  value={[filters.startDate, filters.endDate]}
                  onChange={handleDateRangeChange}
                  format="DD/MM/YYYY"
                  size="middle"
                  className="!rounded-lg"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Report Type</label>
                <Select
                  className="w-44"
                  value={filters.reportType}
                  onChange={(value) => handleFilterChange('reportType', value)}
                  size="middle"
                >
                  <Option value="colleges">Colleges</Option>
                  <Option value="l2">L2 Counsellors</Option>
                  <Option value="l3">L3 Counsellors</Option>
                </Select>
              </div>
              <button
                onClick={fetchReportData}
                className="flex items-center gap-2 px-5 py-2 rounded-lg cursor-pointer transition-all font-bold text-xs bg-blue-600 text-white hover:bg-blue-700"
              >
                <Filter size={13} />
                GENERATE
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {reportData?.data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statsCards.map((card, i) => {
              const colors = colorMap[card.color] || colorMap.blue;
              const Icon = card.icon;
              return (
                <div key={i} className={`${colors.bg} rounded-xl p-4 border border-slate-100`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 ${colors.icon} rounded-lg flex items-center justify-center`}>
                      <Icon size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{card.label}</p>
                      <p className={`text-xl font-black ${colors.text}`}>{card.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <Spin spinning={loading} size="large">
            {reportData?.data?.rows ? (
              <div className="overflow-x-auto">
                <Table
                  columns={getTableColumns()}
                  dataSource={getDataSource()}
                  rowKey={(record) => record[filters.reportType === 'colleges' ? 'college' : 'counsellor']}
                  loading={loading}
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                  bordered={false}
                  size="middle"
                  rowClassName={(record) => record.isTotalRow ? 'bg-slate-50 font-bold' : 'hover:bg-slate-50/50'}
                  className="college-status-table"
                />
              </div>
            ) : (
              <div className="py-16">
                <Empty description={
                  <span className="text-slate-400 font-medium">Select filters and click Generate to view report</span>
                } />
              </div>
            )}
          </Spin>
        </div>
      </div>

      <style>{`
        .college-status-table .ant-table-thead > tr > th {
          white-space: nowrap !important;
          background-color: #f8fafc !important;
          font-weight: 700 !important;
          color: #374151 !important;
          border-bottom: 2px solid #e2e8f0 !important;
          padding: 12px 8px !important;
          font-size: 12px !important;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .college-status-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 10px 8px !important;
        }
        .college-status-table .ant-table-tbody > tr:hover > td {
          background-color: #f8fafc !important;
        }
        .college-status-table .ant-table-cell {
          white-space: nowrap !important;
        }
      `}</style>
    </div>
  );
};

export default CollegeStatusReports;