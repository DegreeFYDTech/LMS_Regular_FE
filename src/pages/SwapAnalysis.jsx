import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Card, Table, Spin, Alert, Typography, Tag, Drawer, Badge,
  Button, Select, Divider, Form,
} from "antd";
import { DatePicker } from "antd";
import {
  TeamOutlined, UserOutlined, LoadingOutlined, FilterOutlined, ClearOutlined,
} from "@ant-design/icons";
import { BASE_URL } from "../config/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const COLS_META = [
  { key: "total_swaps",          label: "Total Swaps" },
  { key: "pre_app_swaps",        label: "Pre App" },
  { key: "icc_swaps",            label: "ICC" },
  { key: "pre_to_icc",           label: "Pre App → ICC" },
  { key: "icc_to_app",           label: "ICC → Application" },
  { key: "not_interested_count", label: "Not Interested" },
  { key: "remarks_after_swap",   label: "Remarks After Swap" },
];

const AGGS = COLS_META.map((c) => c.key);
const fmt  = (n) => (Number(n) || 0).toLocaleString();
const pct  = (n, d) => (d > 0 ? ((n / d) * 100).toFixed(1) : "0.0");

const METRIC_LABELS = {
  total_swaps:          "All Swapped Students",
  pre_app_swaps:        "Swapped at Pre Application",
  icc_swaps:            "Swapped at ICC",
  pre_to_icc:           "Pre App → ICC Converted",
  icc_to_app:           "ICC → Application / Admission / Enrolled",
  not_interested_count: "Not Interested",
  remarks_after_swap:   "Remarks After Swap",
};

const CARD_ACCENT = {
  total_swaps:              "#3b82f6",
  pre_app_swaps:            "#f97316",
  icc_swaps:                "#8b5cf6",
  pre_to_icc:               "#22c55e",
  icc_to_app:               "#06b6d4",
  not_interested_count:     "#6b7280",
  total_remarks_after_swap: "#ef4444",
};

const DRILLDOWN_COLS = [
  {
    title: "Student", dataIndex: "student_name", key: "student_name",
    render: (v, r) => (
      <span><b>{v}</b><br />
        <Text type="secondary" style={{ fontSize: 11 }}>{r.student_id}</Text>
      </span>
    ),
  },
  {
    title: "Status at Swap", dataIndex: "status_at_swap", key: "status_at_swap",
    render: (v) => v ? <Tag>{v}</Tag> : null,
  },
  {
    title: "Current Status", dataIndex: "current_student_status", key: "current_student_status",
    render: (v) => <Tag>{v}</Tag>,
  },
  { title: "From", dataIndex: "from_counsellor", key: "from_counsellor", render: (v) => v || "—" },
  { title: "To",   dataIndex: "to_counsellor",   key: "to_counsellor" },
  {
    title: "Swapped At", dataIndex: "swapped_at", key: "swapped_at",
    render: (v) => v ? new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—",
  },
];

const REMARKS_DRILLDOWN_COLS = [
  {
    title: "Student", dataIndex: "student_name", key: "student_name",
    render: (v, r) => (
      <span><b>{v}</b><br />
        <Text type="secondary" style={{ fontSize: 11 }}>{r.student_id}</Text>
      </span>
    ),
  },
  {
    title: "Current Status", dataIndex: "current_student_status", key: "current_student_status",
    render: (v) => <Tag>{v}</Tag>,
  },
  {
    title: "Remarks After Swap", dataIndex: "remark_count", key: "remark_count",
    align: "center", render: (v) => <Badge count={Number(v) || 0} color="#374151" overflowCount={999} />,
  },
  { title: "To Counsellor", dataIndex: "to_counsellor", key: "to_counsellor" },
  {
    title: "First Swapped At", dataIndex: "swapped_at", key: "swapped_at",
    render: (v) => v ? new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—",
  },
];

const EMPTY_FILTERS = { studentRange: null, swapRange: null, sources: [], sourceUrls: [], campaigns: [], rulesets: [] };

function buildQueryString(f) {
  const p = new URLSearchParams();
  if (f.studentRange?.[0]) p.set("studentFrom", f.studentRange[0].toISOString());
  if (f.studentRange?.[1]) p.set("studentTo",   f.studentRange[1].toISOString());
  if (f.swapRange?.[0])    p.set("swapFrom",    f.swapRange[0].toISOString());
  if (f.swapRange?.[1])    p.set("swapTo",      f.swapRange[1].toISOString());
  if (f.sources?.length)    p.set("sources",    f.sources.join(","));
  if (f.sourceUrls?.length) p.set("sourceUrls", f.sourceUrls.join(","));
  if (f.campaigns?.length)  p.set("campaigns",  f.campaigns.join(","));
  if (f.rulesets?.length)   p.set("rulesets",   f.rulesets.join(","));
  return p.toString();
}

function activeCount(f) {
  return [!!f.studentRange, !!f.swapRange, f.sources?.length > 0, f.sourceUrls?.length > 0, f.campaigns?.length > 0, f.rulesets?.length > 0].filter(Boolean).length;
}

export default function SwapAnalysis() {
  const [summary, setSummary]               = useState(null);
  const [counsellorRows, setCounsellorRows] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);

  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen]       = useState(false);
  const [pending, setPending]             = useState(EMPTY_FILTERS);
  const [filterOpts, setFilterOpts]       = useState({ sources: [], sourceUrls: [], campaigns: [], rulesets: [] });
  const [optsLoading, setOptsLoading]     = useState(false);
  const optsFetched = useRef(false);

  const [drawer, setDrawer]             = useState({ open: false, title: "", metric: null });
  const [drillRows, setDrillRows]       = useState([]);
  const [drillLoading, setDrillLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const qs = buildQueryString(activeFilters);
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/swap-monitor/analysis-data${qs ? `?${qs}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || "Failed to load");
        setSummary(data.summary);
        setCounsellorRows(data.counsellorRows);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [activeFilters]);

  const openFilterDrawer = () => {
    setPending({ ...activeFilters });
    setFilterOpen(true);
    if (!optsFetched.current) {
      optsFetched.current = true;
      setOptsLoading(true);
      const token = localStorage.getItem("token");
      fetch(`${BASE_URL}/swap-monitor/analysis-filters`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => { if (d.success) setFilterOpts(d); })
        .catch(() => {})
        .finally(() => setOptsLoading(false));
    }
  };

  const applyFilters  = () => { setActiveFilters({ ...pending }); setFilterOpen(false); };
  const clearFilters  = () => { setPending(EMPTY_FILTERS); setActiveFilters(EMPTY_FILTERS); setFilterOpen(false); };

  const openDrilldown = useCallback((type, id, name, metric) => {
    if (!id || !metric) return;
    setDrawer({ open: true, title: `${METRIC_LABELS[metric]} — ${name}`, metric });
    setDrillRows([]);
    setDrillLoading(true);
    const token = localStorage.getItem("token");
    const qs = buildQueryString(activeFilters);
    fetch(
      `${BASE_URL}/swap-monitor/drilldown?type=${type}&id=${encodeURIComponent(id)}&metric=${metric}${qs ? `&${qs}` : ""}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((r) => r.json())
      .then((d) => setDrillRows(d.rows || []))
      .catch(() => setDrillRows([]))
      .finally(() => setDrillLoading(false));
  }, [activeFilters]);

  const tableData = useMemo(() => {
    const map = {};
    for (const row of counsellorRows) {
      const sid = row.supervisor_id || "__none__";
      if (!map[sid]) {
        map[sid] = {
          key: `sup-${sid}`, _id: sid, _type: "supervisor", isSupervisor: true,
          name: row.supervisor_name || "—", counsellorCount: 0,
          ...Object.fromEntries(AGGS.map((k) => [k, 0])),
          children: [],
        };
      }
      const g = map[sid];
      g.counsellorCount++;
      AGGS.forEach((k) => { g[k] += Number(row[k]) || 0; });
      g.children.push({
        key: `cou-${row.to_counsellor_id}`, _id: row.to_counsellor_id, _type: "counsellor",
        isSupervisor: false, name: row.counsellor_name,
        ...Object.fromEntries(AGGS.map((k) => [k, Number(row[k]) || 0])),
      });
    }
    return Object.values(map)
      .sort((a, b) => b.total_swaps - a.total_swaps)
      .map((g) => ({ ...g, children: g.children.sort((a, b) => b.total_swaps - a.total_swaps) }));
  }, [counsellorRows]);

  const columns = [
    {
      title: "Supervisor / Counsellor", dataIndex: "name", key: "name", width: "22%",
      render: (name, rec) => rec.isSupervisor ? (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TeamOutlined style={{ color: "#9ca3af" }} />
          <span style={{ fontWeight: 700, color: "#111827" }}>{name}</span>
          <Tag style={{ fontSize: 11 }}>{rec.counsellorCount} counsellor{rec.counsellorCount !== 1 ? "s" : ""}</Tag>
        </span>
      ) : (
        <span style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 4 }}>
          <UserOutlined style={{ color: "#d1d5db" }} />
          <span style={{ color: "#374151" }}>{name}</span>
        </span>
      ),
    },
    ...COLS_META.map(({ key, label }) => ({
      title: label, dataIndex: key, key, align: "center",
      render: (val, rec) => {
        const n = Number(val) || 0;
        const clickable = n > 0;
        return (
          <span
            onClick={clickable ? () => openDrilldown(rec._type, rec._id, rec.name, key) : undefined}
            style={{
              fontWeight: rec.isSupervisor ? 700 : 400,
              fontSize: 13,
              color: clickable ? "#111827" : "#d1d5db",
              cursor: clickable ? "pointer" : "default",
              textDecoration: clickable ? "underline" : "none",
              textDecorationStyle: "dotted",
              textDecorationColor: "#9ca3af",
            }}
          >
            {fmt(val)}
          </span>
        );
      },
    })),
  ];

  const s = summary || {};
  const preAppTotal = Number(s.pre_app_swaps) || 0;
  const iccTotal    = Number(s.icc_swaps)     || 0;

  const statCards = summary ? [
    { key: "total_swaps",              label: "Total Swap Events",  value: fmt(s.total_swaps),              sub: `${fmt(s.unique_students)} unique students` },
    { key: "pre_app_swaps",            label: "Pre App Swaps",      value: fmt(s.pre_app_swaps),            sub: "Status at time of swap" },
    { key: "icc_swaps",               label: "ICC Swaps",          value: fmt(s.icc_swaps),                sub: "Status at time of swap" },
    { key: "pre_to_icc",              label: "Pre → ICC",         value: fmt(s.pre_to_icc),               sub: `${pct(s.pre_to_icc, preAppTotal)}% of Pre App` },
    { key: "icc_to_app",              label: "ICC → Application", value: fmt(s.icc_to_app),               sub: `${pct(s.icc_to_app, iccTotal)}% of ICC` },
    { key: "not_interested_count",    label: "Not Interested",     value: fmt(s.not_interested_count),     sub: "Current status" },
    { key: "total_remarks_after_swap", label: "Remarks After Swap", value: fmt(s.total_remarks_after_swap), sub: "Post first-swap, non-disabled" },
  ] : [];

  const filterCount = activeCount(activeFilters);
  const drilldownCols = drawer.metric === "remarks_after_swap" ? REMARKS_DRILLDOWN_COLS : DRILLDOWN_COLS;
  const toOpts = (arr) => (arr || []).map((v) => ({ label: v, value: v }));

  if (!loading && error) {
    return <div style={{ padding: 32 }}><Alert type="error" message="Failed to load swap analysis" description={error} showIcon /></div>;
  }

  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh", padding: "28px 20px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <Title level={3} style={{ margin: 0, color: "#111827" }}>Swap Analysis Report</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Current status reflects live student data.
              <span style={{ marginLeft: 8, color: "#6b7280" }}>Click any number to view students.</span>
            </Text>
          </div>
          <Badge count={filterCount} offset={[-4, 4]}>
            <Button icon={<FilterOutlined />} onClick={openFilterDrawer} type={filterCount > 0 ? "primary" : "default"}>
              Filters
            </Button>
          </Badge>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* Summary cards — 7-column grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, marginBottom: 20 }}>
              {statCards.map((c) => (
                <Card
                  key={c.key}
                  size="small"
                  styles={{ body: { padding: "14px 16px" } }}
                  style={{ borderLeft: `3px solid ${CARD_ACCENT[c.key] || "#e5e7eb"}`, borderRadius: 6, minWidth: 0 }}
                >
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{c.value}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#374151", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>{c.label}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{c.sub}</div>
                </Card>
              ))}
            </div>

            {/* Main counsellor table */}
            <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 6 }}>
              <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                size="middle"
                onRow={(rec) => ({ style: rec.isSupervisor ? { background: "#f9fafb" } : {} })}
              />
            </Card>
          </>
        )}
      </div>

      {/* Filter Drawer */}
      <Drawer
        title="Filters"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        width={420}
        footer={
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button icon={<ClearOutlined />} onClick={clearFilters}>Clear All</Button>
            <Button type="primary" onClick={applyFilters}>Apply</Button>
          </div>
        }
      >
        <Spin spinning={optsLoading}>
          <Form layout="vertical" size="middle">
            <Form.Item label="Ruleset">
              <Select
                mode="multiple"
                allowClear
                placeholder="All rulesets"
                style={{ width: "100%" }}
                options={toOpts(filterOpts.rulesets)}
                value={pending.rulesets}
                onChange={(v) => setPending((p) => ({ ...p, rulesets: v }))}
              />
            </Form.Item>

            <Divider style={{ margin: "8px 0" }}>Date Filters</Divider>

            <Form.Item label="Student Created At">
              <RangePicker
                style={{ width: "100%" }}
                value={pending.studentRange ? pending.studentRange.map((d) => dayjs(d)) : null}
                onChange={(dates) => setPending((p) => ({ ...p, studentRange: dates ? [dates[0].toDate(), dates[1].toDate()] : null }))}
                format="DD MMM YYYY"
              />
            </Form.Item>

            <Form.Item label="Swap Date">
              <RangePicker
                style={{ width: "100%" }}
                value={pending.swapRange ? pending.swapRange.map((d) => dayjs(d)) : null}
                onChange={(dates) => setPending((p) => ({ ...p, swapRange: dates ? [dates[0].toDate(), dates[1].toDate()] : null }))}
                format="DD MMM YYYY"
              />
            </Form.Item>

            <Divider style={{ margin: "8px 0" }}>Lead Source (First Activity)</Divider>

            <Form.Item label="Source">
              <Select mode="multiple" allowClear placeholder="All sources" style={{ width: "100%" }}
                options={toOpts(filterOpts.sources)} value={pending.sources}
                onChange={(v) => setPending((p) => ({ ...p, sources: v }))} maxTagCount="responsive" />
            </Form.Item>

            <Form.Item label="Source URL">
              <Select mode="multiple" allowClear placeholder="All source URLs" style={{ width: "100%" }}
                options={toOpts(filterOpts.sourceUrls)} value={pending.sourceUrls}
                onChange={(v) => setPending((p) => ({ ...p, sourceUrls: v }))} maxTagCount="responsive" />
            </Form.Item>

            <Form.Item label="Campaign Name">
              <Select mode="multiple" allowClear placeholder="All campaigns" style={{ width: "100%" }}
                options={toOpts(filterOpts.campaigns)} value={pending.campaigns}
                onChange={(v) => setPending((p) => ({ ...p, campaigns: v }))} maxTagCount="responsive" />
            </Form.Item>
          </Form>
        </Spin>
      </Drawer>

      {/* Drilldown Drawer */}
      <Drawer
        title={drawer.title}
        open={drawer.open}
        onClose={() => setDrawer((p) => ({ ...p, open: false }))}
        width={920}
        styles={{ body: { padding: "16px 20px" } }}
      >
        {drillLoading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
          </div>
        ) : (
          <Table
            columns={drilldownCols}
            dataSource={drillRows.map((r, i) => ({ ...r, key: i }))}
            pagination={{ pageSize: 20, showSizeChanger: false }}
            size="small"
            locale={{ emptyText: "No data for this selection" }}
          />
        )}
      </Drawer>
    </div>
  );
}
