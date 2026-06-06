import React, { useState, useEffect, useCallback, useRef } from "react";
import { debounce } from "lodash-es";
import { Search, Filter, X, Calendar, UserCheck, UserMinus, Users, Coffee, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Drawer, Table, Tag } from "antd";

import {
  getAllCounsellorsonBreak,
  applyBreakForCounsellor,
  endBreakForCounsellor,
  getCounsellorBreakDetails,
} from "../network/counsellor";
import Loader from "../common/Loader";

const secondsToHHMMSS = (sc) => {
  const total = parseInt(sc) || 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "--";
  return new Date(dateString).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
  });
};

const PAGE_SIZES = [10, 20, 50];

const UserListing = () => {
  const [users, setUsers]                 = useState([]);
  const [pagination, setPagination]       = useState({ page: 1, limit: 20, totalCount: 0, totalPages: 1 });
  const [overallStats, setOverallStats]   = useState({ total: 0, onBreak: 0, notOnBreak: 0 });
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState(null);
  const [breakActionLoading, setBreakActionLoading] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // All filter state — all sent to backend
  const [searchInput, setSearchInput] = useState("");   // raw input
  const [searchParam, setSearchParam] = useState("");   // debounced value sent to API
  const [startDate,   setStartDate]   = useState("");
  const [endDate,     setEndDate]     = useState("");
  const [breakStatus, setBreakStatus] = useState("");   // '' | 'on_break' | 'not_on_break'
  const [page,  setPage]  = useState(1);
  const [limit, setLimit] = useState(20);

  // Drawer state
  const [drawerOpen, setDrawerOpen]         = useState(false);
  const [drawerUser, setDrawerUser]         = useState(null);
  const [drawerBreaks, setDrawerBreaks]     = useState([]);
  const [drawerLoading, setDrawerLoading]   = useState(false);

  // Debounce search — 450 ms
  const debouncedSetSearch = useRef(
    debounce((value) => {
      setSearchParam(value);
      setPage(1);
    }, 450)
  ).current;

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  const fetchCounsellors = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { page, limit };
      if (searchParam)  params.search      = searchParam;
      if (startDate)    params.from        = startDate;
      if (endDate)      params.to          = endDate;
      if (breakStatus)  params.breakStatus = breakStatus;

      const response = await getAllCounsellorsonBreak(params);
      const payload  = response.data || response;

      setUsers(payload.data || []);
      if (payload.pagination)   setPagination(payload.pagination);
      if (payload.overallStats) setOverallStats(payload.overallStats);
      setError(null);
    } catch (err) {
      console.error("Error fetching counsellors:", err);
      setError("Failed to load counsellors. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchParam, startDate, endDate, breakStatus]);

  useEffect(() => { fetchCounsellors(); }, [fetchCounsellors]);

  // Reset page when any filter changes
  const applyFilter = (setter) => (value) => { setter(value); setPage(1); };

  const resetFilters = () => {
    setSearchInput(""); setSearchParam(""); debouncedSetSearch.cancel();
    setStartDate(""); setEndDate(""); setBreakStatus(""); setPage(1);
  };

  const handleTakeBreak = async (counsellor_id) => {
    setBreakActionLoading((p) => ({ ...p, [counsellor_id]: true }));
    try { await applyBreakForCounsellor(counsellor_id, "other"); await fetchCounsellors(); }
    catch (e) { console.error("Failed to start break:", e); }
    finally { setBreakActionLoading((p) => ({ ...p, [counsellor_id]: false })); }
  };

  const handleEndBreak = async (counsellor_id) => {
    setBreakActionLoading((p) => ({ ...p, [counsellor_id]: true }));
    try { await endBreakForCounsellor(counsellor_id); await fetchCounsellors(); }
    catch (e) { console.error("Failed to end break:", e); }
    finally { setBreakActionLoading((p) => ({ ...p, [counsellor_id]: false })); }
  };

  const openBreakDrawer = async (user) => {
    setDrawerUser(user);
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const params = {};
      if (startDate) params.from = startDate;
      if (endDate)   params.to   = endDate;
      const res = await getCounsellorBreakDetails(user.counsellor_id, params);
      setDrawerBreaks(res.data || []);
    } catch (e) {
      console.error("Failed to fetch break details:", e);
      setDrawerBreaks([]);
    } finally {
      setDrawerLoading(false);
    }
  };

  // overallStats comes from backend — counts across ALL pages, not just the current slice
  const activeFiltersCount = [searchParam, startDate, endDate, breakStatus].filter(Boolean).length;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>{error}</p>
          <button onClick={fetchCounsellors} className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Counsellor Break Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">L2 active counsellors — manage breaks on their behalf</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search with debounce */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-72"
              />
              {searchInput && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => { setSearchInput(""); setSearchParam(""); debouncedSetSearch.cancel(); setPage(1); }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors relative"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <button
              onClick={fetchCounsellors}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Counsellors</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{overallStats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full"><Users className="h-6 w-6 text-blue-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Not on Break</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{overallStats.notOnBreak}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full"><UserCheck className="h-6 w-6 text-green-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">On Break</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{overallStats.onBreak}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full"><UserMinus className="h-6 w-6 text-red-600" /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-6 pb-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="py-16 flex justify-center"><Loader /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Counsellor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On Break</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. of Breaks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Break</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        No counsellors found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const isActioning = breakActionLoading[user.counsellor_id];
                      return (
                        <tr key={user.counsellor_id} className="hover:bg-gray-50">
                          {/* Name + email */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                {user.counsellor_name?.charAt(0)?.toUpperCase() || "U"}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.counsellor_name}</div>
                                <div className="text-xs text-gray-500">{user.counsellor_email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Account status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.status === "active"   ? "bg-green-100 text-green-800" :
                              user.status === "inactive" ? "bg-gray-100 text-gray-600"  :
                                                           "bg-yellow-100 text-yellow-800"
                            }`}>
                              {user.status || "active"}
                            </span>
                          </td>

                          {/* Currently on break */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.currently_on_break ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                            }`}>
                              {user.currently_on_break ? "Yes" : "No"}
                            </span>
                          </td>

                          {/* Break count */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {parseInt(user.no_of_breaks_today) || 0}
                            </span>
                          </td>

                          {/* Total time */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              {secondsToHHMMSS(user.total_break_time)}
                            </span>
                          </td>

                          {/* Last break */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs space-y-1">
                            {user.last_break ? (
                              <>
                                <div>
                                  <span className="inline-flex px-2 py-0.5 font-semibold rounded-full bg-green-100 text-green-800">
                                    {formatDate(user.last_break.break_start)}
                                  </span>
                                </div>
                                <div>
                                  <span className="inline-flex px-2 py-0.5 font-semibold rounded-full bg-red-100 text-red-800">
                                    {user.last_break.break_end ? formatDate(user.last_break.break_end) : "On Break"}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          {/* Take / End Break + View */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                            <button
                              onClick={() => openBreakDrawer(user)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-gray-500 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                              <Eye className="h-3 w-3" /> View
                            </button>
                            {user.currently_on_break ? (
                              <button
                                onClick={() => handleEndBreak(user.counsellor_id)}
                                disabled={isActioning}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Coffee className="h-3 w-3" />
                                {isActioning ? "Ending…" : "End Break"}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleTakeBreak(user.counsellor_id)}
                                disabled={isActioning}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Coffee className="h-3 w-3" />
                                {isActioning ? "Starting…" : "Take Break"}
                              </button>
                            )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="px-6 pb-8">
        <div className="bg-white rounded-lg border border-gray-200 px-6 py-4 flex items-center justify-between">
          {/* Page-size selector + info */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              Showing {users.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
            </span>
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
              >
                {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Page buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevPage}
              className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page number pills */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 2)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "…" ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      item === page
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNextPage}
              className="p-1.5 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(pagination.totalPages)}
              disabled={page === pagination.totalPages}
              className="px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* Filter Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 backdrop-blur-xs bg-opacity-50" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
              <div>
                <h2 className="text-lg font-semibold text-white">Filters</h2>
                <p className="text-sm text-blue-100 mt-0.5">All filters apply server-side</p>
              </div>
              <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-blue-500 rounded-full">
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Break Status */}
              <div>
                <div className="flex items-center mb-4">
                  <Users className="h-4 w-4 text-gray-500 mr-2" />
                  <label className="text-sm font-medium text-gray-900">Break Status</label>
                </div>
                <div className="space-y-3">
                  {[
                    { value: "",              label: "All" },
                    { value: "not_on_break",  label: "Not on Break" },
                    { value: "on_break",      label: "Currently on Break" },
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center cursor-pointer">
                      <input
                        type="radio" name="breakStatus" value={value}
                        checked={breakStatus === value}
                        onChange={() => { applyFilter(setBreakStatus)(value); }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3 text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <div className="flex items-center mb-4">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <label className="text-sm font-medium text-gray-900">Date Range</label>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <input
                      type="date" value={startDate}
                      onChange={(e) => applyFilter(setStartDate)(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <input
                      type="date" value={endDate}
                      onChange={(e) => applyFilter(setEndDate)(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer footer */}
            <div className="p-6 border-t border-gray-200">
              <button onClick={resetFilters} className="w-full mb-3 text-blue-600 text-sm font-medium hover:text-blue-700">
                Clear All Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Break Details Drawer */}
      <Drawer
        title={
          <div>
            <div className="font-bold text-gray-800">{drawerUser?.counsellor_name}</div>
            <div className="text-xs text-gray-500 font-normal">{drawerUser?.counsellor_email}</div>
            <div className="flex gap-4 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                Meal: {parseInt(drawerUser?.meal_breaks) || 0} break{parseInt(drawerUser?.meal_breaks) !== 1 ? 's' : ''} · {secondsToHHMMSS(drawerUser?.meal_break_time)}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                Lunch: {parseInt(drawerUser?.lunch_breaks) || 0} break{parseInt(drawerUser?.lunch_breaks) !== 1 ? 's' : ''} · {secondsToHHMMSS(drawerUser?.lunch_break_time)}
              </span>
            </div>
          </div>
        }
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDrawerBreaks([]); setDrawerUser(null); }}
        width={680}
        destroyOnClose
      >
        <Table
          loading={drawerLoading}
          dataSource={drawerBreaks}
          rowKey="id"
          size="small"
          pagination={false}
          columns={[
            {
              title: '#',
              render: (_, __, idx) => idx + 1,
              width: 40,
            },
            {
              title: 'Type',
              dataIndex: 'break_type',
              render: (type) => {
                const t = (type || 'Other').toLowerCase();
                const color = t === 'meal' ? 'orange' : t === 'lunch' ? 'gold' : 'default';
                return <Tag color={color}>{type || 'Other'}</Tag>;
              },
            },
            {
              title: 'From',
              dataIndex: 'break_start',
              render: (v) => v ? new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) : '—',
            },
            {
              title: 'To',
              dataIndex: 'break_end',
              render: (v) => v
                ? new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
                : <Tag color="red">On Break</Tag>,
            },
            {
              title: 'Duration',
              dataIndex: 'duration_formatted',
              render: (v, row) => v || secondsToHHMMSS(row.duration_seconds) || '—',
            },
            {
              title: 'Notes',
              dataIndex: 'notes',
              render: (v) => v || '—',
              ellipsis: true,
            },
          ]}
          summary={() => drawerBreaks.length > 0 && (
            <Table.Summary.Row>
              <Table.Summary.Cell colSpan={4} className="font-semibold text-right text-gray-600">Total</Table.Summary.Cell>
              <Table.Summary.Cell>
                <span className="font-bold text-purple-700">
                  {secondsToHHMMSS(drawerBreaks.reduce((s, b) => s + (parseInt(b.duration_seconds) || 0), 0))}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell />
            </Table.Summary.Row>
          )}
        />
      </Drawer>
    </div>
  );
};

export default UserListing;
