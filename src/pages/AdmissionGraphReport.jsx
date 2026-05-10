import React, { useState, useEffect, useCallback } from 'react';
import { DatePicker, Button, Spin, Tooltip, ConfigProvider, theme as antTheme } from 'antd';
import { ReloadOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { BASE_URL } from '../config/api';

const { RangePicker } = DatePicker;

const COLLEGE_COLORS = [
  '#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EF4444',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
  '#06B6D4', '#F43F5E', '#A78BFA', '#34D399', '#60A5FA',
];

const THEMES = {
  dark: {
    bg: '#0f172a',
    surface: '#1e293b',
    surfaceHover: '#263248',
    border: '#334155',
    borderLight: '#1e3a5f',
    text: '#f1f5f9',
    textSub: '#94a3b8',
    textMuted: '#64748b',
    inputBg: '#0f172a',
    chartGrid: '#1e3a5f',
    tooltipBg: '#0f172a',
    scrollbarThumb: '#334155',
  },
  light: {
    bg: '#f8fafc',
    surface: '#ffffff',
    surfaceHover: '#f1f5f9',
    border: '#e2e8f0',
    borderLight: '#dbeafe',
    text: '#0f172a',
    textSub: '#475569',
    textMuted: '#94a3b8',
    inputBg: '#ffffff',
    chartGrid: '#e2e8f0',
    tooltipBg: '#ffffff',
    scrollbarThumb: '#cbd5e1',
  },
};

const formatXLabel = (dateStr) => {
  const d = new Date(dateStr);
  const day = d.getUTCDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${monthNames[d.getUTCMonth()]}`;
};

const CustomTooltip = ({ active, payload, label, t }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: t.tooltipBg,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: '12px 16px',
      color: t.text,
      fontSize: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      minWidth: 160,
    }}>
      <div style={{ color: t.textMuted, marginBottom: 8, fontWeight: 700, fontSize: 11, letterSpacing: '0.06em' }}>
        {label}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: t.textSub, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{p.name}</span>
          <span style={{ color: t.text, fontWeight: 700, marginLeft: 4 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const StatCard = ({ label, value, color, icon, t }) => (
  <div style={{
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 14,
    padding: '18px 22px',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: `${color}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 20, flexShrink: 0,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ color: t.textMuted, fontSize: 11, letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{value}</div>
    </div>
  </div>
);

const CollegeDropdown = ({ colleges, selected, onChange, t }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const allSelected = selected.length === colleges.length && colleges.length > 0;
  const filtered = colleges.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  const toggle = (college) => {
    onChange(selected.includes(college)
      ? selected.filter(c => c !== college)
      : [...selected, college]);
  };

  const toggleAll = () => onChange(allSelected ? [] : [...colleges]);

  useEffect(() => {
    if (!open) { setSearch(''); return; }
    const handler = (e) => {
      if (!e.target.closest('#college-dropdown-root')) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const label = selected.length === 0
    ? 'Select Colleges'
    : allSelected
    ? 'All Colleges'
    : selected.length === 1
    ? selected[0]
    : `${selected.length} of ${colleges.length} Colleges`;

  return (
    <div id="college-dropdown-root" style={{ position: 'relative', minWidth: 230 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          background: t.inputBg,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          padding: '7px 12px',
          color: t.text,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 13,
          gap: 8,
          transition: 'border-color 0.2s',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selected.length === 0 ? t.textMuted : t.text }}>
          {label}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M2 4l4 4 4-4" stroke={t.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 1000,
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 10,
          width: 300,
          maxHeight: 340,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
        }}>
          {/* Search */}
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}` }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search colleges..."
              style={{
                width: '100%',
                background: t.bg,
                border: `1px solid ${t.border}`,
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: 12,
                color: t.text,
                outline: 'none',
              }}
            />
          </div>

          {/* Select All */}
          <div
            onClick={toggleAll}
            style={{
              padding: '9px 14px',
              cursor: 'pointer',
              borderBottom: `1px solid ${t.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: allSelected ? '#8B5CF6' : t.text,
              fontWeight: 600,
              fontSize: 13,
              background: allSelected ? 'rgba(139,92,246,0.08)' : 'transparent',
              userSelect: 'none',
            }}
          >
            <span style={{
              width: 16, height: 16,
              border: `2px solid ${allSelected ? '#8B5CF6' : t.textMuted}`,
              borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: allSelected ? '#8B5CF6' : 'transparent',
              flexShrink: 0,
            }}>
              {allSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </span>
            Select All
            <span style={{ marginLeft: 'auto', fontSize: 11, color: t.textMuted, fontWeight: 400 }}>{colleges.length} total</span>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: t.textMuted, fontSize: 12 }}>No colleges found</div>
            )}
            {filtered.map((college) => {
              const idx = colleges.indexOf(college);
              const checked = selected.includes(college);
              const color = COLLEGE_COLORS[idx % COLLEGE_COLORS.length];
              return (
                <div
                  key={college}
                  onClick={() => toggle(college)}
                  style={{
                    padding: '8px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13,
                    color: checked ? color : t.textSub,
                    background: checked ? `${color}10` : 'transparent',
                    borderBottom: `1px solid ${t.border}`,
                    userSelect: 'none',
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{
                    width: 16, height: 16,
                    border: `2px solid ${checked ? color : t.textMuted}`,
                    borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: checked ? color : 'transparent',
                    flexShrink: 0,
                  }}>
                    {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{college}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const ChartCard = ({ title, subtitle, children, t }) => (
  <div style={{
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 16,
    padding: '20px 24px',
    marginBottom: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
      <span style={{ color: t.text, fontSize: 14, fontWeight: 700 }}>{title}</span>
      {subtitle && <span style={{ color: t.textMuted, fontSize: 12 }}>{subtitle}</span>}
    </div>
    {children}
  </div>
);

const AdmissionGraphReport = () => {
  const [isDark, setIsDark] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs().subtract(14, 'day'), dayjs()]);
  const [colleges, setColleges] = useState([]);
  const [selectedColleges, setSelectedColleges] = useState([]);
  const [graphData, setGraphData] = useState(null);

  const t = THEMES[isDark ? 'dark' : 'light'];

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const res = await fetch(`${BASE_URL}/StudentCourseStatusLogs/colleges-list`, { credentials: 'include' });
        const json = await res.json();
        if (json.success) {
          setColleges(json.data);
          setSelectedColleges(json.data);
        }
      } catch (e) {
        console.error('Failed to fetch colleges', e);
      }
    };
    fetchColleges();
  }, []);

  const fetchData = useCallback(async (overrideColleges) => {
    if (!dateRange[0] || !dateRange[1]) return;
    setLoading(true);
    try {
      const active = overrideColleges ?? selectedColleges;
      const params = new URLSearchParams({
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
      });
      if (active.length > 0 && active.length < colleges.length) {
        active.forEach(c => params.append('colleges', c));
      }
      const res = await fetch(
        `${BASE_URL}/StudentCourseStatusLogs/graph-reports?${params.toString()}`,
        { credentials: 'include' }
      );
      const json = await res.json();
      if (json.success) setGraphData(json.data);
    } catch (e) {
      console.error('Failed to fetch graph data', e);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedColleges, colleges.length]);

  useEffect(() => {
    if (colleges.length > 0) fetchData(colleges);
  }, [colleges]);

  const chartData = graphData
    ? graphData.dates.map((date, i) => {
        const point = { date, label: formatXLabel(date) };
        graphData.series.forEach(s => {
          point[`f_${s.college}`] = s.forms[i];
          point[`a_${s.college}`] = s.admissions[i];
        });
        return point;
      })
    : [];

  const visibleSeries = graphData?.series.filter(s => selectedColleges.includes(s.college)) ?? [];
  const totalForms = visibleSeries.reduce((sum, s) => sum + s.forms.reduce((a, b) => a + b, 0), 0);
  const totalAdmissions = visibleSeries.reduce((sum, s) => sum + s.admissions.reduce((a, b) => a + b, 0), 0);
  const convRate = totalForms > 0 ? ((totalAdmissions / totalForms) * 100).toFixed(1) : '0.0';

  const dateSubtitle = dateRange[0] && dateRange[1]
    ? `${dateRange[0].format('MMM D')} – ${dateRange[1].format('MMM D, YYYY')}`
    : '';

  const sharedLineProps = (key, s, i) => {
    const colorIdx = colleges.indexOf(s.college);
    const color = COLLEGE_COLORS[(colorIdx >= 0 ? colorIdx : i) % COLLEGE_COLORS.length];
    return {
      key: s.college,
      type: 'monotone',
      dataKey: `${key}_${s.college}`,
      name: s.college,
      stroke: color,
      strokeWidth: 2,
      dot: { r: 3, fill: color, strokeWidth: 0 },
      activeDot: { r: 5, strokeWidth: 2, stroke: t.surface },
      label: { fill: color, fontSize: 10, position: 'top', formatter: v => v > 0 ? v : '' },
    };
  };

  return (
    <ConfigProvider theme={{ algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm }}>
      <div style={{ background: t.bg, minHeight: '100vh', padding: '24px 28px', color: t.text, fontFamily: 'inherit', transition: 'background 0.25s, color 0.25s' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ color: t.text, fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Admissions Graph Report
            </h1>
            <p style={{ color: t.textMuted, fontSize: 13, margin: '3px 0 0' }}>{dateSubtitle}</p>
          </div>
          <button
            onClick={() => setIsDark(d => !d)}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              padding: '7px 14px',
              cursor: 'pointer',
              color: t.textSub,
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            {isDark
              ? <><SunOutlined style={{ fontSize: 15, color: '#F59E0B' }} /> Light</>
              : <><MoonOutlined style={{ fontSize: 15, color: '#6366F1' }} /> Dark</>
            }
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{
          background: t.surface,
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
          border: `1px solid ${t.border}`,
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <span style={{ color: t.textMuted, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', marginRight: 2 }}>FILTERS</span>
          <div style={{ width: 1, height: 20, background: t.border, margin: '0 4px' }} />
          <RangePicker
            value={dateRange}
            onChange={v => v && setDateRange(v)}
            format="MMM D, YYYY"
            allowClear={false}
          />
          <CollegeDropdown
            colleges={colleges}
            selected={selectedColleges}
            onChange={setSelectedColleges}
            t={t}
          />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Button
              type="primary"
              onClick={() => fetchData()}
              loading={loading}
              style={{ background: '#7C3AED', borderColor: '#7C3AED', fontWeight: 600 }}
            >
              Apply
            </Button>
            <Tooltip title="Reset — last 14 days, all colleges">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  const newRange = [dayjs().subtract(14, 'day'), dayjs()];
                  setDateRange(newRange);
                  setSelectedColleges(colleges);
                  fetchData(colleges);
                }}
                style={{ borderColor: t.border, color: t.textSub, background: t.bg }}
              />
            </Tooltip>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
          <StatCard label="FORMS FILLED" value={totalForms.toLocaleString()} color="#8B5CF6" icon="📋" t={t} />
          <StatCard label="ADMISSIONS" value={totalAdmissions.toLocaleString()} color="#10B981" icon="🎓" t={t} />
          <StatCard label="CONVERSION" value={`${convRate}%`} color="#F59E0B" icon="📈" t={t} />
          <StatCard label="COLLEGES" value={selectedColleges.length} color="#3B82F6" icon="🏛️" t={t} />
        </div>

        <Spin spinning={loading} size="large">
          {/* Forms Chart */}
          <ChartCard title="Forms Filled" subtitle="first entry per student-course pair" t={t}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 14, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 4" stroke={t.chartGrid} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: t.textMuted, fontSize: 11 }}
                  axisLine={{ stroke: t.border }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: t.textMuted, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <ReTooltip content={<CustomTooltip t={t} />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 14 }}
                  formatter={(value) => <span style={{ color: t.textSub, fontSize: 12 }}>{value}</span>}
                />
                {visibleSeries.map((s, i) => (
                  <Line {...sharedLineProps('f', s, i)} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Admissions Chart */}
          <ChartCard title="Admissions" subtitle="first 'Admission' status per student-course pair" t={t}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 14, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 4" stroke={t.chartGrid} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: t.textMuted, fontSize: 11 }}
                  axisLine={{ stroke: t.border }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: t.textMuted, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <ReTooltip content={<CustomTooltip t={t} />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 14 }}
                  formatter={(value) => <span style={{ color: t.textSub, fontSize: 12 }}>{value}</span>}
                />
                {visibleSeries.map((s, i) => (
                  <Line {...sharedLineProps('a', s, i)} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {!graphData && !loading && (
            <div style={{
              textAlign: 'center', padding: '80px 0',
              color: t.textMuted,
              background: t.surface,
              borderRadius: 16,
              border: `1px dashed ${t.border}`,
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📉</div>
              <p style={{ fontSize: 14, margin: 0 }}>No data found for the selected filters.</p>
              <p style={{ fontSize: 12, margin: '4px 0 0', color: t.textMuted }}>Try adjusting the date range or college selection.</p>
            </div>
          )}
        </Spin>
      </div>
    </ConfigProvider>
  );
};

export default AdmissionGraphReport;
