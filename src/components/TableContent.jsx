import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useContext,
} from 'react';
import {
  PhoneOutlined,
  PhoneFilled,
  BellOutlined,
  MessageOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ExportOutlined,
  AimOutlined,
  DownOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons';
import { Table, Tag, Button, Tooltip, Dropdown, Menu } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { debounce } from 'lodash';
import { LeadsContext } from '../context/LeadsContext';

const TableContent = ({
  leadsdata,
  loading,
  activeRole,
  handleConnect,
  handleDisconnect,
  setOpenChatModel,
  handleAssignedtoL2,
  handleAssignedtoL3,
  activeTab,
  callbackType,
  handleFilterChange,
  setCallbackType,
}) => {
  const navigate = useNavigate();
  const { leads, setLeads } = useContext(LeadsContext);
  const userRole = useSelector((state) => state.auth.user).role;

  useEffect(() => {
    setLeads(leadsdata);
  }, [leadsdata, setLeads]);

  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // ✅ Initialize sortConfig from URL params on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    // Check for all possible sort parameters with "sort" suffix
    const sortParams = ['createdAtsort', 'lastCallsort', 'nextCallbacksort', 'remarkssort'];

    for (const param of sortParams) {
      const direction = urlParams.get(param);
      if (direction && (direction === 'asc' || direction === 'desc')) {
        // Map URL param to internal field name
        const paramToFieldMap = {
          'createdAtsort': 'createdAt',
          'lastCallsort': 'lastCall',
          'nextCallbacksort': 'nextCallback',
          'remarkssort': 'remarks'
        };

        setSortConfig({
          key: paramToFieldMap[param],
          direction
        });
        break;
      }
    }
  }, []);

  useEffect(() => {
    setSelectedLeadIds([]);
  }, [leads]);

  const showCopyFeedback = useCallback((msg) => {
    alert(msg);
  }, []);

  const handleCopyPrevention = useCallback((e, fieldName) => {
    e.preventDefault();
    showCopyFeedback(`${fieldName} copying is not allowed`);
  }, [showCopyFeedback]);

  const debouncedFilterChange = useCallback(
    debounce((key, value, updatedFilters) => {
      handleFilterChange(key, value, updatedFilters);
    }, 500),
    [handleFilterChange]
  );

  const getCurrentFilters = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const currentFilters = {};
    for (const [key, value] of urlParams.entries()) {
      if (key !== 'page') currentFilters[key] = value;
    }
    return currentFilters;
  }, []);

  // ✅ Fixed Antd sorter handler
  const handleSortChangeFromTable = (_pagination, _filters, sorter) => {
    if (!sorter || !sorter.field) return;

    const field = sorter.field;

    // Map internal field names to URL parameter names with "sort" suffix
    const fieldToParamMap = {
      'createdAt': 'createdAtsort',
      'lastCall': 'lastCallsort',
      'nextCallback': 'nextCallbacksort',
      'remarks': 'remarkssort'
    };

    const key = fieldToParamMap[field] || field;
    const direction = sorter.order === 'ascend' ? 'asc' : 'desc';

    const currentFilters = getCurrentFilters();
    const updatedFilters = { ...currentFilters, [key]: direction };

    setSortConfig({
      key: field,
      direction
    });
    debouncedFilterChange(key, direction, updatedFilters);
  };

  const sortedLeads = useMemo(() => {
    if (!sortConfig.key || !leads) return leads;

    return [...leads].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'createdAt':
          const aDate = (activeRole === 'l2' || activeRole === 'to' || activeRole === 'Supervisor' || activeRole === 'Analyser')
            ? a.created_at : a.assigned_l3_date;
          const bDate = (activeRole === 'l2' || activeRole === 'to' || activeRole === 'Supervisor' || activeRole === 'Analyser')
            ? b.created_at : b.assigned_l3_date;
          aValue = new Date(aDate);
          bValue = new Date(bDate);
          break;
        case 'lastCall':
          const aLastRemark = a?.student_remarks?.[a.student_remarks.length - 1];
          const bLastRemark = b?.student_remarks?.[b.student_remarks.length - 1];
          aValue = new Date(aLastRemark?.created_at || '');
          bValue = new Date(bLastRemark?.created_at || '');
          break;
        case 'nextCallback':
          const aLastRemarkCB = a?.student_remarks?.[a.student_remarks.length - 1];
          const bLastRemarkCB = b?.student_remarks?.[b.student_remarks.length - 1];
          aValue = new Date(aLastRemarkCB?.callback_date || '');
          bValue = new Date(bLastRemarkCB?.callback_date || '');
          break;
        case 'remarks':
          const aRemarks = (activeRole === 'l2' || activeRole === 'to' || activeRole === 'Supervisor' || activeRole === 'Analyser')
            ? (a.remark_count || a.remarks_count || 0) : (a.total_remarks_l3 || 0);
          const bRemarks = (activeRole === 'l2' || activeRole === 'to' || activeRole === 'Supervisor' || activeRole === 'Analyser')
            ? (b.remark_count || b.remarks_count || 0) : (b.total_remarks_l3 || 0);
          aValue = Number(aRemarks);
          bValue = Number(bRemarks);
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        default:
          return 0;
      }

      if (sortConfig.key !== 'remarks') {
        if (!aValue || isNaN(aValue.getTime())) return 1;
        if (!bValue || isNaN(bValue.getTime())) return -1;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [leads, sortConfig, activeRole]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  }, []);

  const formatDateOnly = useCallback((dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }, []);

  const isCallbackOverdue = (dateString) => {
    if (!dateString) return false;
    const callbackDate = new Date(dateString);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    callbackDate.setHours(0, 0, 0, 0);
    return callbackDate < currentDate;
  };

  const isCallbackToday = (dateString) => {
    if (!dateString) return false;
    const callbackDate = new Date(dateString);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    callbackDate.setHours(0, 0, 0, 0);
    return callbackDate.getTime() === currentDate.getTime();
  };

  const rowSelection = (userRole === 'Supervisor' || userRole === 'to') ? {
    selectedRowKeys: selectedLeadIds,
    onChange: (selectedRowKeys) => setSelectedLeadIds(selectedRowKeys),
  } : null;

  const selectedLeadObjects = useMemo(() =>
    sortedLeads.filter(lead => selectedLeadIds.includes(lead.student_id)),
    [sortedLeads, selectedLeadIds]);

  const handleAssignmentAction = useCallback((level) => {
    if (selectedLeadObjects.length === 0) return;
    if (level === 'l2') handleAssignedtoL2(selectedLeadObjects);
    if (level === 'l3') handleAssignedtoL3(selectedLeadObjects);
    setSelectedLeadIds([]);
  }, [selectedLeadObjects, handleAssignedtoL2, handleAssignedtoL3]);

  const getLeftBorderClass = (lead) => {
    if (lead.is_reactivity) return 'border-l-4 border-l-green-500';
    const lastRemark = lead?.student_remarks?.[lead.student_remarks.length - 1];
    const callbackDate = lastRemark?.callback_date;
    if (isCallbackOverdue(callbackDate)) return 'border-l-4 border-l-red-500';
    if (isCallbackToday(callbackDate)) return 'border-l-4 border-l-yellow-500';
    return 'border-l-4 border-l-transparent';
  };

  const getStatusColor = (status) => {
    const map = {
      Hot: 'red', Warm: 'orange', Cold: 'blue',
      Interested: 'green', 'Not Interested': 'default',
      Callback: 'gold', Enrolled: 'purple'
    };
    return map[status] || 'default';
  };

  const ActionButtons = React.memo(({ lead }) => {
    if (userRole === 'Analyser') {
      return <span className="text-gray-400 text-sm">No actions</span>;
    }
    return (
      <div className="flex items-center space-x-1">
        <Tooltip title="Call Lead">
          <Button
            type="text"
            icon={<PhoneFilled style={{ color: '#16a34a', fontSize: 16 }} />}
            onClick={() => handleConnect(lead)}
            size="small"
          />
        </Tooltip>
        <Tooltip title="Missed Call">
          <Button
            type="text"
            icon={<PhoneOutlined style={{ color: '#dc2626', fontSize: 16 }} />}
            onClick={() => handleDisconnect(lead)}
            size="small"
          />
        </Tooltip>

        <Tooltip title="WhatsApp">
          <Button
            type="text"
            icon={
              <div style={{ position: "relative", display: "inline-block" }}>
                <WhatsAppOutlined
                  style={{
                    color: lead.number_of_unread_messages > 0 ? "#16a34a" : "#9ca3af",
                    fontSize: 16,
                  }}
                />

                {lead.number_of_unread_messages > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -10,
                      backgroundColor: "#ef4444",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "0 4px",
                      borderRadius: 10,
                      lineHeight: "14px",
                      minWidth: 14,
                      textAlign: "center",
                    }}
                  >
                    +{lead.number_of_unread_messages}
                  </span>
                )}
              </div>
            }
            onClick={() => setOpenChatModel(lead)}
            size="small"
          />


        </Tooltip>
      </div>
    );
  });

  // ✅ Columns with proper field names
  const columns = useMemo(() => [
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      field: 'createdAt', // Internal field name
      sorter: true,
      sortOrder: sortConfig.key === 'createdAt' ?
        (sortConfig.direction === 'asc' ? 'ascend' : 'descend') : null,
      width: 200,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <ClockCircleOutlined className="text-gray-400" />
          <span className="text-sm text-gray-700">{formatDate(value)}</span>
        </div>
      ),
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      field: 'remarks', // Internal field name (same as sortConfig.key)
      sorter: true,
      sortOrder: sortConfig.key === 'remarks' ?
        (sortConfig.direction === 'asc' ? 'ascend' : 'descend') : null,
      width: 150,
      align: 'center',
      render: (value) => (
        <Tag className="px-2 py-1 text-xs">
          {value || 0}
        </Tag>
      ),
    },
    {
      title: 'Lead ID',
      dataIndex: 'student_id',
      key: 'student_id',
      width: 200,
      render: (value) => (
        <span
          className='flex gap-3 text-blue-500 hover:underline cursor-pointer'
          onClick={() => window.open(`/student/${value}`, '_blank')}
        >
          <ExportOutlined /> <span>{value}</span>
        </span>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'student_name',
      key: 'student_name',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 160,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">{record.student_phone || '--'}</span>
            {record.numberOfUnreadMessages > 0 && (
              <Tag color="red" size="small">{record.numberOfUnreadMessages}</Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'student_email',
      key: 'student_email',
      width: 250,
      render: (value) => (
        <Tooltip title={value}>
          <div
            className="truncate text-sm text-gray-600"
          >
            {value || '--'}
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Last Call',
      dataIndex: 'lastCall',
      key: 'lastCall',
      field: 'lastCall',
      sorter: true,
      sortOrder: sortConfig.key === 'lastCall' ?
        (sortConfig.direction === 'asc' ? 'ascend' : 'descend') : null,
      width: 220,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <CalendarOutlined className="text-gray-400" />
          <span className="text-sm text-gray-700 text-nowrap">{formatDate(value)}</span>
        </div>
      ),
    },
    {
      title: 'Next Callback',
      dataIndex: 'nextCallback',
      key: 'nextCallback',
      field: 'nextCallback',
      sorter: true,
      sortOrder: sortConfig.key === 'nextCallback' ?
        (sortConfig.direction === 'asc' ? 'ascend' : 'descend') : null,
      width: 280,
      render: (value, record) => {
        const isOverdue = isCallbackOverdue(value?.date);
        const isToday = isCallbackToday(value?.date);
        return (
          <div className="space-y-1 flex">
            <div className={`flex items-center space-x-2 ${isOverdue ? 'text-red-600' : isToday ? 'text-blue-600' : 'text-gray-700'
              }`}>
              {isOverdue && <ExclamationCircleOutlined className="text-red-500" />}
              {isToday && <CheckCircleOutlined className="text-blue-500" />}
              <CalendarOutlined className={
                isOverdue ? 'text-red-500' : isToday ? 'text-blue-500' : 'text-gray-400'
              } />
              <span className="text-sm font-medium text-nowrap">{formatDateOnly(value?.date)}</span>
            </div>
            {value?.time && (
              <div className={`text-xs pl-5 ${isOverdue ? 'text-red-500' : isToday ? 'text-blue-500' : 'text-gray-500'
                }`}>
                {value.time}
              </div>
            )}
            {isOverdue && <div className="text-xs text-red-600 font-medium pl-5">Overdue</div>}
            {isToday && <div className="text-xs text-blue-600 font-medium pl-5">Today</div>}
          </div>
        );
      },
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 200,
      render: (value) => <Tag color="blue">{value || 'Unknown'}</Tag>,
    },
    {
      title: 'Counsellor (L2)',
      dataIndex: 'counsellorL2',
      key: 'counsellorL2',
      width: 140,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <UserOutlined className="text-gray-400" />
          <span className="text-sm text-gray-700 truncate">{value || '--'}</span>
        </div>
      ),
    },
    {
      title: 'Counsellor (L3)',
      dataIndex: 'counsellorL3',
      key: 'counsellorL3',
      width: 140,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <UserOutlined className="text-gray-400" />
          <span className="text-sm text-gray-700 truncate">{value || '--'}</span>
        </div>
      ),
    },
    {
      title: 'Campaign',
      dataIndex: 'campaign',
      key: 'campaign',
      width: 280,
      render: (value) => (
        <Tooltip title={value}>
          <div className="truncate text-sm text-gray-600">{value || '--'}</div>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (value) => <Tag color={getStatusColor(value)}>{value || 'Fresh'}</Tag>,
    },
    {
      title: 'Sub-status',
      dataIndex: 'subStatus',
      key: 'subStatus',
      width: 200,
      render: (value) => <Tag>{value || '--'}</Tag>,
    },
    ...(userRole !== 'Analyser' ? [{
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 140,
      render: (_, record) => <ActionButtons lead={record} />,
    }] : []),
  ], [sortConfig, formatDate, formatDateOnly, handleCopyPrevention, userRole, activeRole]);

  const dataSource = useMemo(() => {
    if (!sortedLeads) return [];
    return sortedLeads.map(lead => {
      const lastRemark = lead?.student_remarks?.[lead.student_remarks.length - 1];
      return {
        key: lead.student_id,
        ...lead,
        createdAt: (activeRole === 'l2' || activeRole === 'to' || activeRole === 'Supervisor' || activeRole === 'Analyser')
          ? lead.created_at : lead.assigned_l3_date,
        lastCall: lastRemark?.created_at || '',
        nextCallback: {
          date: lastRemark?.callback_date || '',
          time: lastRemark?.callback_time || '',
        },
        remarks: Number((activeRole === 'l2' || activeRole === 'to' || activeRole === 'Supervisor' || activeRole === 'Analyser')
          ? (lead.remark_count || lead.remarks_count || 0) : (lead.total_remarks_l3 || 0)),
        source: lead?.lead_activities?.[0]?.source || 'Unknown',
        campaign: lead?.lead_activities?.[0]?.utm_campaign || '',
        counsellorL2: lead.assignedCounsellor?.counsellor_name || lead.counsellorDetails?.name || '',
        counsellorL3: lead.assignedCounsellorL3?.counsellor_name || lead.counsellorL3Details?.name || '',
        status: lastRemark?.lead_status || 'Fresh',
        subStatus: lastRemark?.lead_sub_status || '',
      };
    });
  }, [sortedLeads, activeRole]);

  const assignmentMenu = (
    <Menu>
      <Menu.Item key="l2" onClick={() => handleAssignmentAction('l2')}>
        Assign to L2 Agent
      </Menu.Item>
      <Menu.Item key="l3" onClick={() => handleAssignmentAction('l3')}>
        Assign to L3 Agent
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Legend / Callback filters */}
      {activeTab === 'callback' ? (
        <div className="flex gap-3 flex-wrap p-3 justify-between items-center bg-gray-50">
          <span className="font-semibold text-gray-800">Callback</span>
          <div className="flex gap-3">
            {[
              { type: 'today', label: 'Today', color: 'yellow' },
              { type: 'overdue', label: 'Overdue', color: 'red' },
              { type: 'all', label: 'All', color: 'blue' }
            ].map(({ type, label, color }) => (
              <Button
                key={type}
                type={callbackType === type ? 'primary' : 'default'}
                size="small"
                onClick={() => {
                  setCallbackType(type);
                  const currentFilters = getCurrentFilters();
                  const updatedFilters = { ...currentFilters, callback: type };
                  handleFilterChange('callback', type, updatedFilters);
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-sm" />
              <span className="text-gray-700">Reactive Lead</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-sm" />
              <span className="text-gray-700">Overdue Callback</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-sm" />
              <span className="text-gray-700">Today Callback</span>
            </div>
          </div>
        </div>
      )}

      {/* Selection bar */}
      {selectedLeadIds.length > 0 && (userRole === 'Supervisor' || userRole === 'to') && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AimOutlined className="text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">
                {selectedLeadIds.length} lead{selectedLeadIds.length > 1 ? 's' : ''} selected
              </span>
              <Button
                type="link"
                size="small"
                onClick={() => setSelectedLeadIds([])}
                className="p-0 h-auto"
              >
                Clear selection
              </Button>
            </div>
            <Dropdown overlay={assignmentMenu} trigger={['click']}>
              <Button type="primary" size="small">
                Assign Agent <DownOutlined />
              </Button>
            </Dropdown>
          </div>
        </div>
      )}

      {/* Table */}
      <Table
        size="middle"
        loading={loading}
        columns={columns}
        dataSource={dataSource}
        rowSelection={rowSelection}
        pagination={false}
        scroll={{ x: 1800 }}
        onChange={handleSortChangeFromTable}
        rowClassName={(record, index) => {
          const isSelected = selectedLeadIds.includes(record.student_id);
          const base = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
          const selectedClass = isSelected ? 'bg-blue-50 border-blue-200' : '';
          const borderClass = getLeftBorderClass(record);
          return `${base} ${selectedClass} ${borderClass} hover:bg-gray-50`;
        }}
        className="custom-table"
        sticky={{ offsetHeader: 0, offsetScroll: 0 }}
      />
    </div>
  );
};

export default React.memo(TableContent);