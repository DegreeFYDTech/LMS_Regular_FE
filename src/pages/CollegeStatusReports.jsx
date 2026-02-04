import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  Select, 
  DatePicker, 
  Button, 
  Statistic, 
  Tag, 
  Space, 
  Spin, 
  Empty,
  Tooltip
} from 'antd';
import { 
  DownloadOutlined, 
  ReloadOutlined,
  BankOutlined,
  TeamOutlined,
  CalendarOutlined,
  FilterOutlined,
  AppstoreOutlined,
  UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { BASE_URL } from '../config/api';

const { Option } = Select;
const { RangePicker } = DatePicker;

const CollegeStatusReports = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    reportType: 'colleges', // 'colleges', 'l2', 'l3'
    startDate: dayjs().startOf('month'),
    endDate: dayjs(),
  });

  // Fetch report data
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
        // Remove duplicate statuses from the response
        const uniqueStatuses = [...new Set(response.data.data.statuses)];
        const updatedData = {
          ...response.data,
          data: {
            ...response.data.data,
            statuses: uniqueStatuses,
            // Clean up rows to only have unique status columns
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

  // Render pivot table
  const renderPivotTable = () => {
    if (!reportData?.data?.rows) return <Empty description="No data available" />;

    const { rows, statuses, totals } = reportData.data;
    const isCollegesView = filters.reportType === 'colleges';
    const rowKey = isCollegesView ? 'college' : 'counsellor';
    const rowTitle = isCollegesView ? 'College' : 'Counsellor';

    // Create table columns dynamically
    const tableColumns = [
      {
        title: rowTitle,
        dataIndex: rowKey,
        key: rowKey,
        fixed: 'left',
        width: 200,
        render: (text) => (
          <div className="flex items-center">
         
            <span className="font-semibold">{text}</span>
          </div>
        )
      },
      ...statuses.map(status => ({
        title: (
          <div className="whitespace-nowrap font-bold text-center px-2 truncate" title={status}>
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
                <span className={`inline-flex items-center justify-center min-w-8 h-8 rounded-full text-black text-sm font-normal `}>
                  {count}
                </span>
              ) : (
                <span className="text-gray-400">0</span>
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
          <span className="inline-flex items-center justify-center min-w-10 h-8  text-black rounded-md text-sm font-bold px-2">
            {total}
          </span>
        )
      }
    ];

    // Add totals row
    const dataSource = [
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

    return (
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className=" p-4 rounded-lg shadow ">
            <Statistic
              title={isCollegesView ? "Total Colleges" : "Total Counsellors"}
              value={rows.length}
              prefix={isCollegesView ? <BankOutlined className="text-blue-500" /> : <UserOutlined className="text-blue-500" />}
              valueStyle={{ fontSize: '20px', color: '#1890ff' }}
            />
          </div>
          <div className="bg-white p-4 rounded-lg shadow ">
            <Statistic
              title="Grand Total"
              value={totals.grandTotal}
              prefix={<TeamOutlined />}
              valueStyle={{ fontSize: '20px' }}
            />
          </div>
          <div className="bg-white p-4 rounded-lg shadow ">
            <Statistic
              title="Status Types"
              value={statuses.length}
              prefix={<AppstoreOutlined className="text-green-500" />}
              valueStyle={{ fontSize: '20px', color: '#52c41a' }}
            />
          </div>
          <div className="bg-white p-4 rounded-lg shadow ">
            <Statistic
              title="View Type"
              value={filters.reportType.toUpperCase()}
              valueStyle={{ 
                fontSize: '20px',
                color: filters.reportType === 'l2' ? '#52c41a' : 
                       filters.reportType === 'l3' ? '#fa8c16' : '#1890ff' 
              }}
            />
          </div>
        </div>

        {/* Pivot Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <Table
            columns={tableColumns}
            dataSource={dataSource}
            rowKey={rowKey}
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            bordered={false}
            size="middle"
            rowClassName={(record) => record.isTotalRow ? 'bg-gray-50 font-bold' : ''}
            className="custom-pivot-table"
          />
        </div>
      </div>
    );
  };



  return (
    <div className="p-6  min-h-screen px-14">
      {/* Header with Filters in Single Line */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <AppstoreOutlined className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">College Status Reports</h1>
              <p className="text-gray-600">Pivot table view showing status distribution</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Date Range */}
            <div className="flex items-center gap-2">
              <CalendarOutlined className="text-gray-500" />
              <RangePicker
                className="w-full lg:w-auto"
                value={[filters.startDate, filters.endDate]}
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
                size="middle"
              />
            </div>

            {/* Report Type */}
            <div className="flex items-center gap-2">
              <AppstoreOutlined className="text-gray-500" />
              <Select
                className="w-40"
                value={filters.reportType}
                onChange={(value) => handleFilterChange('reportType', value)}
                size="middle"
              >
                <Option value="colleges">
                  <div className="flex items-center">
                    <BankOutlined className="mr-2" /> Colleges
                  </div>
                </Option>
                <Option value="l2">
                  <div className="flex items-center">
                    <UserOutlined className="mr-2 text-green-500" /> L2 Counsellors
                  </div>
                </Option>
                <Option value="l3">
                  <div className="flex items-center">
                    <UserOutlined className="mr-2 text-orange-500" /> L3 Counsellors
                  </div>
                </Option>
              </Select>
            </div>

            {/* Action Buttons */}
            <Space>
              <Button 
                type="primary" 
                icon={<FilterOutlined />}
                onClick={fetchReportData}
                loading={loading}
                size="middle"
                className="bg-blue-500 hover:bg-blue-600"
              >
                Generate
              </Button>
              <Button 
                onClick={handleResetFilters}
                icon={<ReloadOutlined />}
                size="middle"
                className="border-gray-300"
              >
                Reset
              </Button>
              {/* <Button 
                type="default"
                onClick={handleExport}
                icon={<DownloadOutlined />}
                size="middle"
                className="border-gray-300 hover:border-blue-500"
              >
                Export
              </Button> */}
            </Space>
          </div>
        </div>

       
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow  p-4">
        <Spin spinning={loading} size="large">
          {reportData ? renderPivotTable() : (
            <div className="py-12">
              <Empty description="Select filters and click Generate to view report" />
            </div>
          )}
        </Spin>
      </div>
    </div>
  );
};

// Add custom CSS for table styling
const style = document.createElement('style');
style.textContent = `
  .custom-pivot-table .ant-table-thead > tr > th {
    white-space: nowrap !important;
    background-color: #f8fafc !important;
    font-weight: 600 !important;
    color: #374151 !important;
    border-bottom: 2px solid #e5e7eb !important;
    padding: 12px 8px !important;
  }
  
  .custom-pivot-table .ant-table-tbody > tr > td {
    border-bottom: 1px solid #f3f4f6 !important;
    padding: 10px 8px !important;
  }
  
  .custom-pivot-table .ant-table-tbody > tr:hover > td {
    background-color: #f9fafb !important;
  }
  
  .custom-pivot-table .ant-table-cell {
    white-space: nowrap !important;
  }
  
  .bg-gray-50 {
    background-color: #f9fafb !important;
  }
`;
document.head.appendChild(style);

export default CollegeStatusReports;