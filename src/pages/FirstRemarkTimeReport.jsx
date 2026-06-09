import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  DatePicker,
  Select,
  Drawer,
  Button,
  Spin,
  Empty,
  Tooltip,
  Modal,
} from 'antd';
import dayjs from 'dayjs';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import { fetchLeadOptions } from '../network/leadassignmentl2';
import {
  Download,
  RotateCcw,
  Users,
  Clock,
  AlertCircle,
  SlidersHorizontal,
  Timer,
} from 'lucide-react';
import DashboardHeader from '../components/MainReport/DashboardHeader';

const { RangePicker } = DatePicker;

const BUCKET_LABELS = {
  below_15:  '< 15 Min',
  min_15_30: '15 – 30 Min',
  above_30:  '> 30 Min',
  no_remark: 'No Remark',
  total:     'Total',
};

const GROUP_OPTIONS = [
  { value: 'counsellor', label: 'Counsellor' },
  { value: 'campaign',   label: 'Campaign' },
  { value: 'source',     label: 'Source' },
];

const GROUP_COL_TITLE = {
  counsellor: 'Counsellor (L2)',
  campaign:   'Campaign',
  source:     'Source',
};

const GROUP_STAT_LABEL = {
  counsellor: 'Total Counsellors',
  campaign:   'Total Campaigns',
  source:     'Total Sources',
};

const DEFAULT_STATE = {
  dateRange:  null,
  groupBy:    'counsellor',
  source:     [],
  source_url: [],
  campaign:   [],
};

const FirstRemarkTimeReport = () => {
  const [loading, setLoading]       = useState(false);
  const [reportData, setReportData] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // applied = what the API uses; draft = what's being edited in the drawer
  const [applied, setApplied] = useState(DEFAULT_STATE);
  const [draft, setDraft]     = useState(DEFAULT_STATE);

  const [options, setOptions] = useState({ sources: [], campaigns: [], sourceUrls: [] });

  const [drillDown, setDrillDown] = useState({
    visible: false, loading: false, data: [], groupLabel: '', bucket: '',
  });

  // ── Load filter options ───────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchLeadOptions();
        setOptions({
          sources:    [...(data?.data?.source || [])],
          campaigns:  [...(data?.data?.utm_campaign || data?.data?.campaign_name || [])],
          sourceUrls: [...(data?.data?.first_source_url || [])],
        });
      } catch (err) {
        console.error('Error loading lead options:', err);
      }
    };
    load();
  }, []);

  // ── Summary fetch ─────────────────────────────────────────────────────────────
  const fetchReportData = useCallback(async () => {
    const { dateRange, groupBy, source, source_url, campaign } = applied;
    setLoading(true);
    try {
      const params = {
        ...(dateRange?.[0] && { date_from: dateRange[0].format('YYYY-MM-DD') }),
        ...(dateRange?.[1] && { date_to:   dateRange[1].format('YYYY-MM-DD') }),
        type:      'summary',
        group_by:  groupBy,
        ...(source.length     && { source:     source.join(',') }),
        ...(source_url.length && { source_url: source_url.join(',') }),
        ...(campaign.length   && { campaign:   campaign.join(',') }),
      };
      const res = await axios.get(`${BASE_URL}/first-remark-time`, { params, withCredentials: true });
      setReportData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching first remark time report:', err);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => { fetchReportData(); }, [fetchReportData]);

  // ── Drill-down fetch ──────────────────────────────────────────────────────────
  const handleCellClick = useCallback(async (groupLabel, bucket) => {
    setDrillDown({ visible: true, loading: true, data: [], groupLabel, bucket });
    const { dateRange, groupBy, source, source_url, campaign } = applied;
    try {
      const params = {
        ...(dateRange?.[0] && { date_from: dateRange[0].format('YYYY-MM-DD') }),
        ...(dateRange?.[1] && { date_to:   dateRange[1].format('YYYY-MM-DD') }),
        type:        'raw',
        group_by:    groupBy,
        drill_group: groupLabel,
        ...(bucket !== 'total' && { drill_bucket: bucket }),
        ...(source.length     && { source:     source.join(',') }),
        ...(source_url.length && { source_url: source_url.join(',') }),
        ...(campaign.length   && { campaign:   campaign.join(',') }),
      };
      const res = await axios.get(`${BASE_URL}/first-remark-time`, { params, withCredentials: true });
      setDrillDown(prev => ({ ...prev, loading: false, data: Array.isArray(res.data) ? res.data : [] }));
    } catch (err) {
      console.error('Drill-down fetch failed:', err);
      setDrillDown(prev => ({ ...prev, loading: false, data: [] }));
    }
  }, [applied]);

  // ── Export ────────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    const { dateRange, groupBy, source, source_url, campaign } = applied;
    setLoading(true);
    try {
      const params = {
        ...(dateRange?.[0] && { date_from: dateRange[0].format('YYYY-MM-DD') }),
        ...(dateRange?.[1] && { date_to:   dateRange[1].format('YYYY-MM-DD') }),
        type:      'export',
        group_by:  groupBy,
        ...(source.length     && { source:     source.join(',') }),
        ...(source_url.length && { source_url: source_url.join(',') }),
        ...(campaign.length   && { campaign:   campaign.join(',') }),
      };
      const res = await axios.get(`${BASE_URL}/first-remark-time`, { params, responseType: 'blob', withCredentials: true });
      const url  = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `first-remark-time-${dateRange ? `${dateRange[0].format('YYYY-MM-DD')}-to-${dateRange[1].format('YYYY-MM-DD')}` : 'all'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Drawer helpers ────────────────────────────────────────────────────────────
  const openDrawer = () => {
    setDraft({ ...applied });
    setDrawerOpen(true);
  };

  const applyFilters = () => {
    setApplied({ ...draft });
    setDrawerOpen(false);
  };

  const resetAll = () => {
    setDraft(DEFAULT_STATE);
    setApplied(DEFAULT_STATE);
    setDrawerOpen(false);
  };

  const activeFilterCount =
    applied.source.length + applied.campaign.length + applied.source_url.length +
    (applied.groupBy !== 'counsellor' ? 1 : 0);

  // ── Cell renderer ─────────────────────────────────────────────────────────────
  const makeCellRender = (bucket, colorClass) => (count, record) => (
    <Tooltip title={`Click to drill into ${BUCKET_LABELS[bucket]} for ${record.group_label || '—'}`}>
      <span
        onClick={() => handleCellClick(record.group_label, bucket)}
        className={`inline-flex items-center justify-center min-w-[36px] h-8 px-2 rounded-full text-sm font-bold cursor-pointer hover:scale-110 transition-transform ${colorClass}`}
      >
        {count ?? 0}
      </span>
    </Tooltip>
  );

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const stats = {
    totalGroups:   reportData.length,
    totalBelow15:  reportData.reduce((a, r) => a + parseInt(r.below_15  || 0), 0),
    total15to30:   reportData.reduce((a, r) => a + parseInt(r.min_15_30 || 0), 0),
    totalNoRemark: reportData.reduce((a, r) => a + parseInt(r.no_remark || 0), 0),
  };

  // ── Columns ───────────────────────────────────────────────────────────────────
  const columns = [
    {
      title: GROUP_COL_TITLE[applied.groupBy], dataIndex: 'group_label', key: 'group_label',
      render: (v) => <div className="font-semibold text-slate-800">{v || '—'}</div>,
    },
    { title: '< 15 Min',   dataIndex: 'below_15',  key: 'below_15',  align: 'center', render: makeCellRender('below_15',  'text-emerald-700 bg-emerald-50 border border-emerald-200') },
    { title: '15 – 30 Min',dataIndex: 'min_15_30', key: 'min_15_30', align: 'center', render: makeCellRender('min_15_30', 'text-amber-700 bg-amber-50 border border-amber-200') },
    { title: '> 30 Min',   dataIndex: 'above_30',  key: 'above_30',  align: 'center', render: makeCellRender('above_30',  'text-rose-700 bg-rose-50 border border-rose-200') },
    { title: 'No Remark',  dataIndex: 'no_remark', key: 'no_remark', align: 'center', render: makeCellRender('no_remark', 'text-slate-600 bg-slate-100 border border-slate-200') },
    { title: 'Total',      dataIndex: 'total',     key: 'total',     align: 'center', render: makeCellRender('total',     'text-slate-800 bg-slate-200 px-3 rounded-lg') },
  ];

  // ── Drill columns ─────────────────────────────────────────────────────────────
  const drillColumns = [
    {
      title: 'Student ID', dataIndex: 'student_id', key: 'student_id', width: 130,
      render: (v) => (
        <span className="text-blue-600 hover:underline cursor-pointer font-mono text-sm"
          onClick={() => window.open(`/student/${v}`, '_blank')}>{v}</span>
      ),
    },
    { title: 'Counsellor',      dataIndex: 'counsellor_name',       key: 'counsellor_name',       width: 150 },
    { title: 'Lead Created At', dataIndex: 'created_at',            key: 'created_at',            width: 160, render: (v) => v ? dayjs(v).format('DD MMM YYYY HH:mm') : '--' },
    { title: 'First Remark At', dataIndex: 'first_remark_date',     key: 'first_remark_date',     width: 160, render: (v) => v ? dayjs(v).format('DD MMM YYYY HH:mm') : <span className="text-slate-400">No remark</span> },
    {
      title: 'Duration (min)', dataIndex: 'duration_minutes', key: 'duration_minutes', width: 130, align: 'center',
      render: (v) => {
        if (v == null) return <span className="text-slate-400">—</span>;
        const n = parseFloat(v);
        const cls = n < 15 ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
          : n <= 30         ? 'text-amber-700 bg-amber-50 border-amber-200'
          :                   'text-rose-700 bg-rose-50 border-rose-200';
        return <span className={`text-xs font-bold px-2 py-1 rounded-full border ${cls}`}>{n.toFixed(1)} min</span>;
      },
    },
    {
      title: 'Current Status', dataIndex: 'current_student_status', key: 'current_student_status', width: 170,
      render: (v) => <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{v || '—'}</span>,
    },
    { title: 'Source',     dataIndex: 'source',     key: 'source',     width: 120, render: (v) => v || '—' },
    { title: 'Source URL', dataIndex: 'source_url', key: 'source_url', ellipsis: true, render: (v) => v || '—' },
    { title: 'Campaign',   dataIndex: 'campaign',   key: 'campaign',   width: 160, ellipsis: true, render: (v) => v || '—' },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-2 md:p-4 animate-in fade-in duration-500">
      <div className="mx-auto">
        <DashboardHeader
          title="First Remark Time Report"
          subtitle="Time from lead creation to first L2 counsellor remark"
          actions={
            <>
              <button
                onClick={openDrawer}
                className="relative flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all font-bold text-xs shadow-sm border bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              >
                <SlidersHorizontal size={14} />
                FILTERS
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all font-bold text-xs shadow-sm border bg-emerald-600 text-white border-slate-200 hover:bg-emerald-700"
              >
                <Download size={14} />
                EXPORT XLSX
              </button>
              <button
                onClick={resetAll}
                className="flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all font-bold text-xs shadow-sm border bg-blue-600 text-white border-slate-200 hover:bg-blue-700"
              >
                <RotateCcw size={14} />
                RESET
              </button>
            </>
          }
        />

        {/* ── Active chips ── */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full">
            {applied.dateRange ? `${applied.dateRange[0].format('DD MMM')} – ${applied.dateRange[1].format('DD MMM YYYY')}` : 'All Time'}
          </span>
          {applied.groupBy !== 'counsellor' && (
            <span className="text-xs font-bold bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
              Group: {GROUP_COL_TITLE[applied.groupBy]}
            </span>
          )}
          {applied.source.map(s => (
            <span key={s} className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">{s}</span>
          ))}
          {applied.campaign.map(c => (
            <span key={c} className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">{c}</span>
          ))}
          {applied.source_url.map(u => (
            <span key={u} className="text-xs font-bold bg-slate-50 text-slate-600 px-3 py-1 rounded-full border border-slate-200 max-w-[240px] truncate">{u}</span>
          ))}
        </div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: GROUP_STAT_LABEL[applied.groupBy], value: stats.totalGroups,   icon: Users,       bg: 'bg-blue-50',    iconBg: 'bg-blue-500',    textColor: 'text-blue-700',    shadow: 'shadow-blue-200',    labelColor: 'text-blue-400' },
            { label: '< 15 Min Response',                value: stats.totalBelow15,  icon: Timer,       bg: 'bg-emerald-50', iconBg: 'bg-emerald-500', textColor: 'text-emerald-700', shadow: 'shadow-emerald-200', labelColor: 'text-emerald-400' },
            { label: '15–30 Min Response',               value: stats.total15to30,   icon: Clock,       bg: 'bg-amber-50',   iconBg: 'bg-amber-500',   textColor: 'text-amber-700',   shadow: 'shadow-amber-200',   labelColor: 'text-amber-400' },
            { label: 'No Remark',                        value: stats.totalNoRemark, icon: AlertCircle, bg: 'bg-slate-100',  iconBg: 'bg-slate-600',   textColor: 'text-slate-700',   shadow: 'shadow-slate-200',   labelColor: 'text-slate-400' },
          ].map(({ label, value, icon: Icon, bg, iconBg, textColor, shadow, labelColor }) => (
            <div key={label} className={`${bg} rounded-xl p-4`}>
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

        {/* ── Summary table ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <Spin spinning={loading} size="large" tip="Loading report...">
            {reportData.length > 0 ? (
              <Table
                columns={columns}
                dataSource={reportData}
                rowKey="group_label"
                pagination={false}
                className="custom-report-table"
                size="middle"
                scroll={{ x: 'max-content' }}
                summary={(pageData) => {
                  const t = pageData.reduce(
                    (acc, r) => ({
                      below_15:  acc.below_15  + parseInt(r.below_15  || 0),
                      min_15_30: acc.min_15_30 + parseInt(r.min_15_30 || 0),
                      above_30:  acc.above_30  + parseInt(r.above_30  || 0),
                      no_remark: acc.no_remark + parseInt(r.no_remark || 0),
                      total:     acc.total     + parseInt(r.total     || 0),
                    }),
                    { below_15: 0, min_15_30: 0, above_30: 0, no_remark: 0, total: 0 }
                  );
                  return (
                    <Table.Summary.Row className="font-black bg-slate-50">
                      <Table.Summary.Cell index={0}>
                        <span className="font-black text-slate-700 text-sm">Grand Total</span>
                      </Table.Summary.Cell>
                      {[
                        { val: t.below_15,  cls: 'text-emerald-700' },
                        { val: t.min_15_30, cls: 'text-amber-700' },
                        { val: t.above_30,  cls: 'text-rose-700' },
                        { val: t.no_remark, cls: 'text-slate-600' },
                        { val: t.total,     cls: 'text-slate-800' },
                      ].map(({ val, cls }, i) => (
                        <Table.Summary.Cell key={i} index={i + 1} align="center">
                          <span className={`font-black text-sm ${cls}`}>{val}</span>
                        </Table.Summary.Cell>
                      ))}
                    </Table.Summary.Row>
                  );
                }}
              />
            ) : (
              <div className="py-20 text-center">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div className="flex flex-col items-center">
                      <span className="text-slate-400 font-bold text-lg">No Data Found</span>
                      <p className="text-slate-400 text-sm mt-1">Adjust the date range or filters and try again.</p>
                    </div>
                  }
                />
              </div>
            )}
          </Spin>
        </div>
      </div>

      {/* ── Filter Drawer ── */}
      <Drawer
        title={<span className="font-black text-slate-800">Report Filters</span>}
        placement="right"
        width={380}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex gap-3">
            <Button block onClick={resetAll}>Reset All</Button>
            <Button type="primary" block onClick={applyFilters}>Apply Filters</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Date Range</p>
            <RangePicker
              value={draft.dateRange}
              onChange={(val) => setDraft(d => ({ ...d, dateRange: val }))}
              format="DD/MM/YYYY"
              style={{ width: '100%' }}
              allowClear={false}
            />
          </div>

          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Group By</p>
            <Select
              value={draft.groupBy}
              onChange={(val) => setDraft(d => ({ ...d, groupBy: val }))}
              options={GROUP_OPTIONS}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Source</p>
            <Select
              mode="multiple"
              allowClear
              placeholder="Select sources…"
              value={draft.source}
              onChange={(val) => setDraft(d => ({ ...d, source: val }))}
              options={options.sources.map(s => ({ value: s, label: s }))}
              style={{ width: '100%' }}
              maxTagCount="responsive"
            />
          </div>

          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Campaign</p>
            <Select
              mode="multiple"
              allowClear
              placeholder="Select campaigns…"
              value={draft.campaign}
              onChange={(val) => setDraft(d => ({ ...d, campaign: val }))}
              options={options.campaigns.map(c => ({ value: c, label: c }))}
              style={{ width: '100%' }}
              maxTagCount="responsive"
            />
          </div>

          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Source URL</p>
            <Select
              mode="multiple"
              allowClear
              placeholder="Select source URLs…"
              value={draft.source_url}
              onChange={(val) => setDraft(d => ({ ...d, source_url: val }))}
              options={options.sourceUrls.map(u => ({ value: u, label: u }))}
              style={{ width: '100%' }}
              maxTagCount="responsive"
            />
          </div>
        </div>
      </Drawer>

      {/* ── Drill-down modal ── */}
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
              {BUCKET_LABELS[drillDown.bucket]}
            </span>
            <span className="text-xs text-slate-400">
              {applied.dateRange ? `${applied.dateRange[0].format('DD MMM')} – ${applied.dateRange[1].format('DD MMM YYYY')}` : 'All Time'}
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

export default FirstRemarkTimeReport;
