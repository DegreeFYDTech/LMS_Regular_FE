import React, { useState, useEffect, useRef } from 'react';
import { BASE_URL } from '../config/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Segmented, Button, message, Dropdown, Modal, Table, Spin, Empty } from "antd";
import dayjs from 'dayjs';
import {
  FilePdfOutlined,
  FilterOutlined,
  BarChartOutlined,
  TableOutlined,
  TeamOutlined,
  FieldTimeOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import ReportTable from '../components/MainReport/ReportTable';
import DashboardHeader from '../components/MainReport/DashboardHeader';
import { useSelector } from 'react-redux';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

const TrackerReportAnalysis2 = ({ forcedGroupBy = null }) => {
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingRaw, setIsDownloadingRaw] = useState(false);
  const [groupBy, setGroupBy] = useState(forcedGroupBy || 'slot');
  const [showChart, setShowChart] = useState(false);
  const [filters, setFilters] = useState({
    date_start: getTodayDate(),
    date_end: getTodayDate()
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedSupervisors, setExpandedSupervisors] = useState({});
  const [supervisorGroups, setSupervisorGroups] = useState([]);
  const barChartRef = useRef(null);
    const userRole = useSelector((state) => state.auth.role);

  const toggleSupervisor = (supervisorName) => {
    setExpandedSupervisors(prev => ({
      ...prev,
      [supervisorName]: !prev[supervisorName]
    }));
  };

  const toggleAllSupervisors = () => {
    const allExpanded = Object.values(expandedSupervisors).every(val => val);
    const newState = {};
    supervisorGroups.forEach(group => {
      newState[group.supervisorName] = !allExpanded;
    });
    setExpandedSupervisors(newState);
  };

const fetchData = async () => {
  setLoading(true);
  try {
    const params = new URLSearchParams({
      ...Object.fromEntries(Object.entries(filters).filter(([_, val]) => val)),
      groupBy
    });

    const res = await fetch(
      `${BASE_URL}/studentcoursestatus/track-report-2?${params.toString()}`,
      {
        method: "GET",
        credentials: "include"
      }
    );

    const json = await res.json();

    if (json.success) {
      setData(json.rows || []);
      setSupervisorGroups(json.groupedBySupervisor || []);

      if (json.groupedBySupervisor) {
        const initialExpanded = {};
        json.groupedBySupervisor.forEach(group => {
          initialExpanded[group.supervisorName] = true;
        });
        setExpandedSupervisors(initialExpanded);
      }
    } else {
      setData([]);
      setSupervisorGroups([]);
    }
  } catch (err) {
    console.error('Error fetching tracker report:', err);
    setData([]);
    setSupervisorGroups([]);
  }
  setLoading(false);
};


  useEffect(() => {
    if (forcedGroupBy) {
      setGroupBy(forcedGroupBy);
    }
  }, [forcedGroupBy]);

  useEffect(() => {
    fetchData();
  }, [groupBy]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setDrawerOpen(false);
    fetchData();
  };

  const BUCKET_LABELS = {
    totalUniqueRemarks: 'Total Unique Remarks',
    firstTimeConnected: 'First Time Connected',
    firstTimeICC: 'First Time ICC',
    firstTimeNI: 'First Time NI',
  };

  const [drillDown, setDrillDown] = useState({
    visible: false, loading: false, data: [], groupLabel: '', bucket: '',
  });

  const handleCellClick = async (groupLabel, bucket, drillBy) => {
    setDrillDown({ visible: true, loading: true, data: [], groupLabel, bucket });
    try {
      const params = new URLSearchParams({
        date_start: filters.date_start,
        date_end: filters.date_end,
        groupBy: groupBy === 'supervisor' ? 'counsellor' : groupBy,
        drill_group: groupLabel,
        drill_bucket: bucket,
      });
      if (drillBy === 'supervisor') params.append('drill_by', 'supervisor');

      const res = await fetch(`${BASE_URL}/studentcoursestatus/track-report-2-drilldown?${params.toString()}`, {
        credentials: 'include',
      });
      const result = await res.json();
      setDrillDown(prev => ({ ...prev, loading: false, data: result.success ? result.data : [] }));
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
    { title: 'Counsellor', dataIndex: 'counsellor_name', key: 'counsellor_name', width: 150 },
    { title: 'Status', dataIndex: 'current_student_status', key: 'current_student_status', width: 150 },
    { title: 'Source', dataIndex: 'source', key: 'source', width: 120 },
    { title: 'Created At', dataIndex: 'created_at', key: 'created_at', width: 170, render: (v) => v ? dayjs(v).format('DD MMM YYYY HH:mm') : '--' },
  ];

  const getChartData = (filterOverall = true) => {
    const filteredData = filterOverall ? data.filter(row => row.groupKey !== 'Overall') : data;

    const labels = [
      'Total Unique Remarks',
      'First Time Connected',
      'First Time ICC',
      'First Time NI'
    ];

    const datasets = filteredData.map((row, index) => {
      const colors = [
        'rgba(59, 130, 246, 0.85)',
        'rgba(16, 185, 129, 0.85)',
        'rgba(245, 158, 11, 0.85)',
        'rgba(239, 68, 68, 0.85)',
        'rgba(139, 92, 246, 0.85)',
        'rgba(236, 72, 153, 0.85)',
        'rgba(20, 184, 166, 0.85)',
        'rgba(251, 146, 60, 0.85)',
        'rgba(134, 239, 172, 0.85)',
        'rgba(147, 197, 253, 0.85)',
        'rgba(252, 211, 77, 0.85)',
        'rgba(249, 115, 22, 0.85)',
        'rgba(190, 18, 60, 0.85)',
        'rgba(99, 102, 241, 0.85)',
        'rgba(168, 85, 247, 0.85)'
      ];

      const color = colors[index % colors.length];

      return {
        label: row.groupKey,
        data: [
          row.totalUniqueRemarks,
          row.firstTimeConnected,
          row.firstTimeICC,
          row.firstTimeNI
        ],
        backgroundColor: color,
        borderColor: color.replace('0.85', '1'),
        borderWidth: 2
      };
    });

    return {
      labels,
      datasets
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 11, weight: 'bold' },
          padding: 12,
          usePointStyle: true,
          pointStyle: 'rect',
          boxWidth: 15
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 11 },
        padding: 10,
        callbacks: {
          title: function (context) {
            return `${context[0].dataset.label} - ${context[0].label}`;
          },
          label: function (context) {
            return `Count: ${context.parsed.y}`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#fff',
        font: {
          weight: 'bold',
          size: 9
        },
        formatter: (value) => {
          return value > 0 ? value : '';
        },
        anchor: 'center',
        align: 'center'
      },
      title: {
        display: true,
        text: `${groupBy === 'slot' ? 'Time Slot' : 'Counsellor'} Performance Comparison`,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 15
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          font: { size: 11 },
          stepSize: 50
        },
        title: {
          display: true,
          text: 'Count',
          font: {
            size: 13,
            weight: 'bold'
          }
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11, weight: 'bold' },
          maxRotation: 0,
          minRotation: 0
        },
        title: {
          display: true,
          text: 'Metrics',
          font: {
            size: 13,
            weight: 'bold'
          }
        }
      }
    }
  };

  const downloadPDF = async () => {
  setIsDownloading(true);
  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Time Slot Analysis', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date Range: ${filters.date_start} to ${filters.date_end}`, 14, 22);

    const slotParams = new URLSearchParams({
      ...Object.fromEntries(Object.entries(filters).filter(([_, val]) => val)),
      groupBy: 'slot'
    });

    const slotRes = await fetch(
      `${BASE_URL}/studentcoursestatus/track-report-2?${slotParams.toString()}`,
      { credentials: "include" } // 👈 Cookies included
    );

    const slotResult = await slotRes.json();
    const slotData = slotResult.success ? slotResult.rows : [];

    const slotHeaders = [[
      'Time Slot',
      'Total Unique',
      'First Connected',
      'First ICC',
      'First NI'
    ]];

    const slotRows = slotData.map(row => [
      row.groupKey,
      row.totalUniqueRemarks,
      row.firstTimeConnected,
      row.firstTimeICC,
      row.firstTimeNI
    ]);

    autoTable(doc, {
      head: slotHeaders,
      body: slotRows,
      startY: 28,
      theme: 'grid'
    });

    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Counsellor Analysis', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date Range: ${filters.date_start} to ${filters.date_end}`, 14, 22);

    const counsellorParams = new URLSearchParams({
      ...Object.fromEntries(Object.entries(filters).filter(([_, val]) => val)),
      groupBy: 'counsellor'
    });

    const counsellorRes = await fetch(
      `${BASE_URL}/studentcoursestatus/track-report-2?${counsellorParams.toString()}`,
      { credentials: "include" } // 👈 Cookies included
    );

    const counsellorResult = await counsellorRes.json();
    const counsellorData = counsellorResult.success ? counsellorResult.rows : [];

    const counsellorHeaders = [[
      'Counsellor',
      'Total Unique',
      'First Connected',
      'First ICC',
      'First NI'
    ]];

    const counsellorRows = counsellorData.map(row => [
      row.groupKey,
      row.totalUniqueRemarks,
      row.firstTimeConnected,
      row.firstTimeICC,
      row.firstTimeNI
    ]);

    autoTable(doc, {
      head: counsellorHeaders,
      body: counsellorRows,
      startY: 28,
      theme: 'grid'
    });

    doc.save(`tracker-report-${filters.date_start}-${filters.date_end}.pdf`);

  } catch (error) {
    console.error('PDF generation failed:', error);
    alert('Failed to generate PDF. Please try again.');
  } finally {
    setIsDownloading(false);
  }
};


const downloadRawDataAsCSV = async () => {
  setIsDownloadingRaw(true);

  try {
    const params = new URLSearchParams({
      date_start: filters.date_start,
      date_end: filters.date_end,
      groupBy: 'detailed'
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    message.info('Fetching student-level data...');

    const response = await fetch(
      `${BASE_URL}/studentcoursestatus/track-report-2-raw?${params.toString()}`,
      {
        signal: controller.signal,
        credentials: "include"
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        message.error(errorJson.message || 'Failed to fetch raw data');
      } catch {
        message.error('Failed to fetch raw data');
      }
      return;
    }

    const result = await response.json();
    
    if (!result.success) {
      message.error(result.message || 'Failed to fetch raw data');
      return;
    }

    // Convert JSON to CSV
    const convertToCSV = (data) => {
      if (!data || data.length === 0) return '';
      
      // Get headers from the first object
      const headers = Object.keys(data[0]);
      
      // Create CSV content
      const csvRows = [];
      
      // Add headers
      csvRows.push(headers.join(','));
      
      // Add data rows
      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }
      
      return csvRows.join('\n');
    };

    const csvData = convertToCSV(result.data);
    
    if (!csvData) {
      message.error('No data to download');
      return;
    }

    // Create and download CSV file
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `student-raw-data-${filters.date_start}-${filters.date_end}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    message.success(`CSV file downloaded! (${result.count} records)`);

  } catch (error) {
    if (error.name === 'AbortError') {
      message.error('Request timeout. Please try a smaller date range.');
    } else {
      console.error('Error downloading raw data:', error);
      message.error('Error downloading raw data: ' + error.message);
    }
  } finally {
    setIsDownloadingRaw(false);
  }
};


  // Download raw data as JSON
const downloadRawDataAsJSON = async () => {
  setIsDownloadingRaw(true);
  try {
    const params = new URLSearchParams({
      date_start: filters.date_start,
      date_end: filters.date_end,
      groupBy: 'counsellor'
    });

    const response = await fetch(
      `${BASE_URL}/studentcoursestatus/track-report-2-raw?${params.toString()}`,
      {
        credentials: "include" // 👈 attach cookies
      }
    );

    const result = await response.json();

    if (result.success) {
      const dataStr = JSON.stringify({
        metadata: {
          date_range: result.date_range,
          total_students: result.count,
          generated_at: result.generated_at
        },
        students: result.data
      }, null, 2);

      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `student-raw-data-${filters.date_start}-${filters.date_end}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success(`Raw JSON data downloaded! (${result.count} students)`);
    } else {
      message.error('Failed to fetch raw data');
    }
  } catch (error) {
    console.error('Error downloading raw data:', error);
    message.error('Error downloading raw data');
  } finally {
    setIsDownloadingRaw(false);
  }
};


  const getHeaderLabel = () => (groupBy === 'counsellor' ? 'Counsellor' : 'Time Slot');

  const headers = [
    getHeaderLabel(),
    'Total Unique Remarks',
    'First Time Connected',
    'First Time ICC',
    'First Time NI'
  ];

  // Dropdown items for raw data download
  const rawDataDownloadItems = [
    {
      key: 'csv',
      label: 'Download as CSV',
      icon: <FileTextOutlined />,
      onClick: downloadRawDataAsCSV
    },
    {
      key: 'json',
      label: 'Download as JSON',
      icon: <DatabaseOutlined />,
      onClick: downloadRawDataAsJSON
    }
  ];

  return (
    <>
      <DashboardHeader 
        title="Unique Student Tracker"
        actions={
          <>
            <Segmented
              size="middle"
              value={showChart ? "chart" : "table"}
              onChange={(val) => setShowChart(val === "chart")}
              options={[
                { label: "TABLE", value: "table", icon: <TableOutlined /> },
                { label: "CHART", value: "chart", icon: <BarChartOutlined /> }
              ]}
              className="shadow-sm bg-white px-1 py-1 rounded-xl font-bold text-xs"
            />

            {userRole !== "Analyser" && (
              <>
                <Dropdown
                  menu={{ items: rawDataDownloadItems }}
                  placement="bottomRight"
                  trigger={['click']}
                >
                  <Button
                    type="primary"
                    size="middle"
                    icon={<DatabaseOutlined />}
                    loading={isDownloadingRaw}
                    className="rounded-xl font-bold bg-blue-600 shadow-md shadow-blue-200 text-xs h-[32px] flex items-center"
                  >
                    EXPORT
                  </Button>
                </Dropdown>

                <Button
                  type="primary"
                  size="middle"
                  icon={isDownloading ? null : <FilePdfOutlined />}
                  onClick={downloadPDF}
                  disabled={data.length === 0 || isDownloading}
                  loading={isDownloading}
                  className="rounded-xl font-bold bg-slate-900 hover:bg-slate-800 shadow-md text-xs h-[32px] flex items-center"
                >
                  {isDownloading ? '...' : 'PDF'}
                </Button>

                <Button
                  type="default"
                  size="middle"
                  icon={<FilterOutlined />}
                  onClick={() => setDrawerOpen(true)}
                  className="rounded-xl font-bold border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-400 shadow-sm text-xs h-[32px] flex items-center"
                >
                  FILTERS
                </Button>
              </>
            )}
          </>
        }
      />

      {/* Filters Drawer */}
      <div
          className={`fixed inset-0 z-50 transition-opacity duration-300 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          style={{ backgroundColor: drawerOpen ? 'rgba(0,0,0,0.5)' : 'transparent' }}
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
                <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Start Date</label>
                  <input
                    type="date"
                    name="date_start"
                    value={filters.date_start}
                    onChange={handleFilterChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">End Date</label>
                  <input
                    type="date"
                    name="date_end"
                    value={filters.date_end}
                    onChange={handleFilterChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <button
                className="w-full mt-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className=" mx-auto  pb-12">
            {!showChart ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <ReportTable
                        columns={[
                            { key: 'groupKey', label: groupBy === 'slot' ? 'Time Slot' : groupBy === 'counsellor' ? 'Counsellor' : 'Supervisor' },
                            { key: 'totalUniqueRemarks', label: 'Total Unique Remarks', align: 'center', render: (v, row) => <span className="cursor-pointer hover:underline hover:text-blue-700" onClick={() => handleCellClick(row.groupKey, 'totalUniqueRemarks', groupBy === 'supervisor' ? 'supervisor' : undefined)}>{v}</span> },
                            { key: 'firstTimeConnected', label: 'First Time Connected', align: 'center', render: (v, row) => <span className="cursor-pointer hover:underline hover:text-blue-700" onClick={() => handleCellClick(row.groupKey, 'firstTimeConnected', groupBy === 'supervisor' ? 'supervisor' : undefined)}>{v}</span> },
                            { key: 'firstTimeICC', label: 'First Time ICC', align: 'center', render: (v, row) => <span className="cursor-pointer hover:underline hover:text-blue-700" onClick={() => handleCellClick(row.groupKey, 'firstTimeICC', groupBy === 'supervisor' ? 'supervisor' : undefined)}>{v}</span> },
                            { key: 'firstTimeNI', label: 'First Time NI', align: 'center', render: (v, row) => <span className="cursor-pointer hover:underline hover:text-blue-700" onClick={() => handleCellClick(row.groupKey, 'firstTimeNI', groupBy === 'supervisor' ? 'supervisor' : undefined)}>{v}</span> },
                        ]}
                        data={groupBy === 'supervisor' ? supervisorGroups.map(g => ({ ...g.totals, groupKey: g.supervisorName })) : data}
                        loading={loading}
                        emptyText="No tracking data found"
                    />
                </div>
            ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8" ref={barChartRef}>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Bar Chart Analysis</h3>
            <div style={{ height: '500px' }}>
              <Bar data={getChartData()} options={chartOptions} />
            </div>
          </div>
        )}
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
            <span className="font-black text-slate-800">{drillDown.groupLabel || '—'}</span>
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
              rowKey="student_id"
              pagination={{ pageSize: 20, showSizeChanger: false }}
              size="small"
              scroll={{ x: 'max-content' }}
            />
          ) : !drillDown.loading ? (
            <Empty description="No students found" />
          ) : null}
        </Spin>
      </Modal>
    </>
  );
};

export default TrackerReportAnalysis2;