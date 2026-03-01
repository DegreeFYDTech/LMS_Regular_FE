import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Select,
  DatePicker,
  Spin,
  Empty,
  Tooltip,
  Radio
} from 'antd';
import dayjs from 'dayjs';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import { Filter, Download, RotateCcw, Building2, Users, LayoutGrid, Eye, Calendar, Clock } from 'lucide-react';
import DashboardHeader from '../components/MainReport/DashboardHeader';

const { Option } = Select;
const { RangePicker } = DatePicker;

const CollegeStatusReports = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilterType, setDateFilterType] = useState('main'); // 'main' or 'firstTime'
  const [filters, setFilters] = useState({
    reportType: 'colleges',
    startDate: dayjs().startOf('month'),
    endDate: dayjs(),
    firstTimeDateRange: [null, null],
  });

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        reportType: filters.reportType,
      };

      // Only include the active date filter based on selection
      if (dateFilterType === 'main') {
        params.startDate = filters.startDate.format('YYYY-MM-DD');
        params.endDate = filters.endDate.format('YYYY-MM-DD');
      } else if (dateFilterType === 'firstTime') {
        if (filters.firstTimeDateRange[0] && filters.firstTimeDateRange[1]) {
          params.firstTimeFrom = filters.firstTimeDateRange[0].format('YYYY-MM-DD');
          params.firstTimeTo = filters.firstTimeDateRange[1].format('YYYY-MM-DD');
        }
      }

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
  }, [filters, dateFilterType]);

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
      // Automatically switch to main date filter type
      setDateFilterType('main');
    } else {
      // If dates are cleared, reset to default
      setFilters(prev => ({
        ...prev,
        startDate: dayjs().startOf('month'),
        endDate: dayjs()
      }));
    }
  };

  const handleFirstTimeDateRangeChange = (dates) => {
    if (dates) {
      setFilters(prev => ({
        ...prev,
        firstTimeDateRange: [dates[0], dates[1]]
      }));
      // Automatically switch to first time date filter type
      setDateFilterType('firstTime');
    } else {
      // If dates are cleared, reset to null
      setFilters(prev => ({
        ...prev,
        firstTimeDateRange: [null, null]
      }));
    }
  };

  const handleDateFilterTypeChange = (e) => {
    setDateFilterType(e.target.value);
  };

  const handleResetFilters = () => {
    setFilters({
      reportType: 'colleges',
      startDate: dayjs().startOf('month'),
      endDate: dayjs(),
      firstTimeDateRange: [null, null],
    });
    setDateFilterType('main');
  };

  const handleExport = async () => {
    try {
      const params = {
        reportType: filters.reportType,
      };

      // Only include the active date filter in export
      if (dateFilterType === 'main') {
        params.startDate = filters.startDate.format('YYYY-MM-DD');
        params.endDate = filters.endDate.format('YYYY-MM-DD');
      } else if (dateFilterType === 'firstTime') {
        params.firstTimeFrom = filters.firstTimeDateRange[0] ? filters.firstTimeDateRange[0].format('YYYY-MM-DD') : null;
        params.firstTimeTo = filters.firstTimeDateRange[1] ? filters.firstTimeDateRange[1].format('YYYY-MM-DD') : null;
      }

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

  // Format date display
  const formatDateRange = () => {
    return `${filters.startDate.format('DD MMM')} - ${filters.endDate.format('DD MMM YYYY')}`;
  };

  const formatFirstTimeDateRange = () => {
    if (filters.firstTimeDateRange[0] && filters.firstTimeDateRange[1]) {
      return `${filters.firstTimeDateRange[0].format('DD MMM')} - ${filters.firstTimeDateRange[1].format('DD MMM YYYY')}`;
    }
    return null;
  };

  // Determine which date range is active
  const isMainDateActive = dateFilterType === 'main';
  const isFirstTimeDateActive = dateFilterType === 'firstTime';

  return (
    <div className="p-2 md:p-4 animate-in fade-in duration-500">
      <div className="mx-auto">
        <DashboardHeader
          title="College Status Reports"
          subtitle="Pivot table view showing status distribution"
          actions={
            <>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all font-bold text-xs shadow-sm shadow-slate-100 border bg-emerald-600 text-white border-slate-200 hover:bg-emerald-700"
              >
                <Download size={14} />
                EXPORT
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
          <div className="flex flex-col gap-4">
            {/* Date Filter Type Selection */}
            <div className="flex items-center gap-4 pb-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Date Filter:
              </span>
              <Radio.Group
                value={dateFilterType}
                onChange={handleDateFilterTypeChange}
                size="small"
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="main">First Time Date Range</Radio.Button>
                <Radio.Button value="firstTime"> Main Date Range</Radio.Button>
              </Radio.Group>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Main Date Range Picker - disabled when firstTime is active */}
              <div className={`flex items-center gap-2 rounded-lg px-3 py-1 border transition-all ${isMainDateActive
                ? 'bg-blue-50 border-blue-200'
                : 'bg-slate-50 border-slate-200 opacity-50'
                }`}>
                <Calendar size={18} className={isMainDateActive ? 'text-blue-500' : 'text-slate-400'} />
                <RangePicker
                  value={[filters.startDate, filters.endDate]}
                  onChange={handleDateRangeChange}
                  format="DD/MM/YYYY"
                  size="middle"
                  className="!border-0 !bg-transparent !shadow-none !p-0"
                  allowClear={false}
                  suffixIcon={null}
                  placeholder={['Start Date', 'End Date']}
                  disabled={!isMainDateActive}
                />
              </div>

              {/* First Time Date Range Picker - disabled when main is active */}
              <div className={`flex items-center gap-2 rounded-lg px-3 py-1 border transition-all ${isFirstTimeDateActive
                ? 'bg-purple-50 border-purple-200'
                : 'bg-slate-50 border-slate-200 opacity-50'
                }`}>
                <Clock size={18} className={isFirstTimeDateActive ? 'text-purple-500' : 'text-slate-400'} />
                <RangePicker
                  value={[filters.firstTimeDateRange[0], filters.firstTimeDateRange[1]]}
                  onChange={handleFirstTimeDateRangeChange}
                  format="DD/MM/YYYY"
                  size="middle"
                  className="!border-0 !bg-transparent !shadow-none !p-0"
                  placeholder={['First Time From', 'First Time To']}
                  allowClear={true}
                  suffixIcon={null}
                  disabled={!isFirstTimeDateActive}
                />
              </div>

              {/* Report Type Dropdown */}
              <Select
                value={filters.reportType}
                onChange={(value) => handleFilterChange('reportType', value)}
                size="middle"
                className="min-w-[160px]"
                dropdownClassName="rounded-lg"
              >
                <Option value="colleges">Colleges</Option>
                <Option value="l2">L2 Counsellors</Option>
                <Option value="l3">L3 Counsellors</Option>
              </Select>

              {/* Active Filter Indicators */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-slate-400">Active:</span>
                <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full">
                  {filters.reportType === 'colleges' ? 'Colleges' : filters.reportType === 'l2' ? 'L2' : 'L3'}
                </span>
                {isMainDateActive && (
                  <span className="text-xs font-semibold bg-green-50 text-green-600 px-3 py-1.5 rounded-full">
                    Main: {formatDateRange()}
                  </span>
                )}
                {isFirstTimeDateActive && filters.firstTimeDateRange[0] && filters.firstTimeDateRange[1] && (
                  <span className="text-xs font-semibold bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full">
                    First: {formatFirstTimeDateRange()}
                  </span>
                )}
                {isFirstTimeDateActive && (!filters.firstTimeDateRange[0] || !filters.firstTimeDateRange[1]) && (
                  <span className="text-xs font-semibold bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full">
                    First: Not Set
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

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
                  <span className="text-slate-400 font-medium">No data available for selected filters</span>
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
        
        /* Custom Picker styles */
        .ant-picker-range, .ant-picker {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .ant-picker-range .ant-picker-input input,
        .ant-picker input {
          font-size: 13px !important;
          font-weight: 500 !important;
          color: #1e293b !important;
        }
        .ant-picker-range .ant-picker-active-bar {
          background: #3b82f6 !important;
        }
        .ant-picker-range:hover,
        .ant-picker:hover {
          background: transparent !important;
        }
        .ant-picker-range-focused,
        .ant-picker-focused {
          box-shadow: none !important;
        }
        .ant-picker-clear {
          background: transparent !important;
        }
        
        /* Radio button styles */
        .ant-radio-group-small .ant-radio-button-wrapper {
          font-size: 11px;
          padding: 0 12px;
          height: 28px;
          line-height: 26px;
        }
      `}</style>
    </div>
  );
};

export default CollegeStatusReports;