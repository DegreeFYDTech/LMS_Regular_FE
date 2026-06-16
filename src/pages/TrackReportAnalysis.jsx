import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { Modal, Table, Spin, Empty } from 'antd';
import { BASE_URL } from '../config/api';
import ReportTable from '../components/MainReport/ReportTable';
import DashboardHeader from '../components/MainReport/DashboardHeader';
import ExportFieldSelectModal from '../components/modals/ExportFieldSelectModal';

const timeIntervals = [
  'Till 11 AM','11:00 - 12:00','12:00 - 13:00','13:00 - 14:00','14:00 - 15:00',
  '15:00 - 16:00','16:00 - 17:00','17:00 - 18:00','18:00 - 19:00','After 7 PM'
];

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

const TrackReportAnalysis = () => {
  const [from, setFrom] = useState(() => new Date().toISOString().substring(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().substring(0, 10));
  const [loading, setLoading] = useState(true);
  const [overall, setOverall] = useState({});
  const [stats, setStats] = useState({});
  const [tableRows, setTableRows] = useState([]);

  useEffect(() => {
    setLoading(true);
    axios.get(`${BASE_URL}/studentcoursestatus/track-report?start_date=${from}&end_date=${to}`)
      .then(res => {
        setOverall(res.data.overall || {});
        setStats(res.data.stats || {});
        setTableRows(res.data.data || []);
      })
      .catch(() => {
        setOverall({});
        setStats({});
        setTableRows([]);
      })
      .finally(() => setLoading(false));
  }, [from, to]);

  const changeRange = (days) => {
    const f = new Date(from);
    const t = new Date(to);
    f.setDate(f.getDate() + days);
    t.setDate(t.getDate() + days);
    setFrom(f.toISOString().substring(0, 10));
    setTo(t.toISOString().substring(0, 10));
  };

  const handlePrevDay = () => changeRange(-1);
  const handleNextDay = () => changeRange(1);

  const handleClear = () => {
    const today = new Date().toISOString().substring(0, 10);
    setFrom(today);
    setTo(today);
  };

  const BUCKET_LABELS = {
    new_leads: 'New Leads',
    new_counselling: 'Counselling Done',
    connected_calls: 'Connected Calls',
  };

  const [drillDown, setDrillDown] = useState({
    visible: false, loading: false, data: [], timeInterval: '', bucket: '',
  });

  const handleCellClick = async (timeInterval, bucket) => {
    setDrillDown({ visible: true, loading: true, data: [], timeInterval, bucket });
    try {
      const res = await axios.get(`${BASE_URL}/studentcoursestatus/track-report-drilldown`, {
        params: { start_date: from, end_date: to, time_interval: timeInterval, bucket },
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
    { title: 'Status', dataIndex: 'current_student_status', key: 'current_student_status', width: 150 },
    { title: 'Source', dataIndex: 'source', key: 'source', width: 120 },
    { title: 'Time', dataIndex: 'created_at', key: 'created_at', width: 170, render: (v) => v ? dayjs(v).format('DD MMM YYYY HH:mm') : '--' },
  ];

  const renderClickableCount = (key) => (val, row) => {
    const count = typeof val === 'object' ? val?.count : (val || 0);
    return count > 0 ? (
      <span className="cursor-pointer hover:underline hover:text-blue-700 font-semibold" onClick={() => handleCellClick(row.time_interval, key)}>{count}</span>
    ) : count;
  };

  const columns = [
    { key: 'time_interval', label: 'Time Interval' },
    { key: 'new_leads', label: 'New Leads', align: 'center', render: renderClickableCount('new_leads') },
    { key: 'new_counselling', label: 'Counselling Done', align: 'center', render: renderClickableCount('new_counselling') },
    { key: 'connected_calls', label: 'Connected', align: 'center', render: renderClickableCount('connected_calls') },
  ];

  const data = timeIntervals.map(time => {
    return tableRows.find(r => r.time_interval === time) || { time_interval: time };
  });

  const TRACK_EXPORT_FIELD_LABELS = {
    time_interval: 'Time Interval',
    new_leads: 'New Leads',
    new_counselling: 'Counselling Done',
    connected_calls: 'Connected Calls',
  };

  const [exportModalOpen, setExportModalOpen] = useState(false);

  const getValueOnly = (v) => (typeof v === 'object' && v !== null ? v.count ?? 0 : v ?? 0);

  const confirmExport = (selectedFields) => {
    const exportRows = data.map((row) => {
      const filtered = {};
      selectedFields.forEach((key) => {
        filtered[key] = key === 'time_interval' ? row.time_interval : getValueOnly(row[key]);
      });
      return filtered;
    });
    const headers = selectedFields;
    const csvRows = [headers.join(',')];
    exportRows.forEach((row) => {
      csvRows.push(headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','));
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `track-report-${from}-to-${to}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    setExportModalOpen(false);
  };

  return (
    <>
      <DashboardHeader 
        title="General Track Analytics"
        actions={
          <div className="flex flex-wrap items-center gap-4">
            <div className="px-4 py-2 bg-blue-50/50 rounded-xl border border-blue-100/50">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mr-3">Active Range</span>
              <span className="text-sm font-bold text-slate-900">{formatDate(from)} — {formatDate(to)}</span>
            </div>
            
            <ControlPanel
              from={from}
              to={to}
              onPrev={handlePrevDay}
              onNext={handleNextDay}
              onClear={handleClear}
            />

            <button
              onClick={() => setExportModalOpen(true)}
              disabled={data.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all text-sm font-bold disabled:opacity-50"
            >
              Export
            </button>
          </div>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        <ReportTable
          columns={columns}
          data={data}
          loading={loading}
          emptyText="No tracking data found for this period"
        />
      </div>

      {/* Export field-selection modal */}
      <ExportFieldSelectModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={confirmExport}
        title="Select Fields to Export"
        fieldGroups={[
          {
            label: 'Available Fields',
            color: 'blue',
            fields: Object.keys(TRACK_EXPORT_FIELD_LABELS).map((key) => ({
              key,
              label: TRACK_EXPORT_FIELD_LABELS[key],
            })),
          },
        ]}
      />

      {/* Drill-down modal */}
      <Modal
        open={drillDown.visible}
        onCancel={() => setDrillDown(prev => ({ ...prev, visible: false }))}
        width="92vw"
        style={{ top: 20 }}
        footer={null}
        title={
          <div className="flex items-center gap-3">
            <span className="font-black text-slate-800">{drillDown.timeInterval || '—'}</span>
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
              rowKey={(r, idx) => r.remark_id || `${r.student_id}-${idx}`}
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

const ControlPanel = ({ from, to, onPrev, onNext, onClear }) => (
  <div className="flex items-center gap-3">
    <button
      onClick={onPrev}
      className="p-2.5 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100 bg-white transition-all shadow-sm"
      aria-label="Previous Day"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    
    <button
      onClick={onNext}
      className="p-2.5 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-100 bg-white transition-all shadow-sm"
      aria-label="Next Day"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
    
    <button
      onClick={onClear}
      className="ml-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-blue-100 transition-all text-sm"
    >
      Reset View
    </button>
  </div>
);

export default TrackReportAnalysis;
