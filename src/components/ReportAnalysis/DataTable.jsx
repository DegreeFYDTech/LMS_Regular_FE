import { ChevronDown, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import ReportTable from '../MainReport/ReportTable';
import Pagination from './Pagination';

const DataTable = ({
  activeTab,
  leadSubTab,
  loading,
  currentData,
  currentPage,
  totalPages,
  pageSize,
  handlePageChange,
  handlePageSizeChange,
  sortField,
  sortOrder,
  handleSort,
  showDetailedColumns
}) => {
  const [expandedSupervisors, setExpandedSupervisors] = useState({});

  const toggleSupervisor = (name) => {
    setExpandedSupervisors(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Only enable sorting for lead tab and not for api subTab
  const onColumnSort = (columnKey) => {
    if (handleSort && activeTab === 'lead' && leadSubTab !== 'api') {
      handleSort(columnKey);
    }
  };

  // Helper function to render column value based on lead_count
  const renderValueWithDash = (val, row, columnKey) => {
    // Check if this is a Total row
    const isTotalRow = row.group_by?.toString().toLowerCase() === 'total' || 
                       row.agentName?.toString().toLowerCase() === 'total' ||
                       (row.isSupervisor && row.supervisorName?.toString().toLowerCase() === 'total');

    // Skip for group_by column (first column)
    if (columnKey === 'group_by') {
      if (isTotalRow) {
        return <span className="font-black text-slate-900 bg-yellow-50 px-2 py-1 rounded">TOTAL</span>;
      }
      return row.isSupervisor ?
        <span className="font-black text-slate-900">{val || row.agentName || 'Unassigned'}</span> :
        <span className="pl-6 text-slate-500">{val || row.agentName || 'Unassigned'}</span>;
    }

    // If lead_count is 0, show dash for all other columns (except group_by)
    if (row.lead_count === 0 || row.total_leads === 0) {
      return <span className="font-bold text-slate-400">—</span>;
    }

    // Special handling for percentage columns
    if (columnKey.includes('Percent') ||
      columnKey === 'leadToForm' ||
      columnKey === 'formToAdmission' ||
      columnKey === 'leadToAdmission' ||
      columnKey === 'preNIPercent') {
      return (
        <span className={`font-bold ${isTotalRow ? 'text-blue-700' : 'text-slate-900'}`}>
          {typeof val === 'number' ? `${val.toFixed(1)}%` : '0%'}
        </span>
      );
    }

    // For numeric columns
    return <span className={`font-bold ${isTotalRow ? 'text-blue-700' : 'text-slate-900'}`}>{val || 0}</span>;
  };

  const columns = useMemo(() => {
    switch (activeTab) {
      case 'admission':
        return [
          {
            key: 'courseName',
            label: 'Course',
            sortable: false,
            render: (val) => val
          },
          {
            key: 'universityName',
            label: 'University',
            sortable: false,
            render: (val) => val
          },
          {
            key: 'studentId',
            label: 'Student ID',
            sortable: false,
            render: (val) => val
          },
          {
            key: 'currentL2',
            label: 'L2 Counsellor',
            sortable: false,
            render: (val) => val
          },
          {
            key: 'currentL3',
            label: 'L3 Counsellor',
            sortable: false,
            render: (val) => val
          },
          {
            key: 'status',
            label: 'Status',
            sortable: false,
            render: (val) => (
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider rounded-lg border border-blue-100">
                {val}
              </span>
            )
          },
          {
            key: 'createdAt',
            label: 'Created',
            sortable: false,
            render: (val) => val ? new Date(val).toLocaleDateString() : '—'
          },
        ];

      case 'application':
        return [
          {
            key: 'formID',
            label: 'Form ID',
            sortable: false,
            render: (val) => val
          },
          {
            key: 'studentName',
            label: 'Student',
            sortable: false,
            render: (val) => val
          },
          {
            key: 'studentEmail',
            label: 'Email',
            sortable: false,
            render: (val) => val
          },
          {
            key: 'studentPhoneNumber',
            label: 'Phone',
            sortable: false,
            render: (val) => val
          },
          {
            key: 'courseName',
            label: 'Course',
            sortable: false,
            render: (val) => val
          },
          {
            key: 'collegeName',
            label: 'College',
            sortable: false,
            render: (val) => val
          },
          {
            key: 'counsellorName',
            label: 'L2',
            sortable: false,
            render: (val) => val
          },
          {
            key: 'counsellorNameL3',
            label: 'L3',
            sortable: false,
            render: (val) => val
          },
        ];

      case 'lead':
        if (leadSubTab === 'api') {
          return [
            {
              key: 'studentName',
              label: 'Student',
              sortable: false,
              render: (val) => val
            },
            {
              key: 'studentId',
              label: 'Student Id',
              sortable: false,
              render: (val) => val
            },
            {
              key: 'collegeName',
              label: 'Univeristy Name',
              sortable: false,
              render: (val) => val
            },
            {
              key: 'counsellorName',
              label: 'Counsellor',
              sortable: false,
              render: (val) => val
            },
            {
              key: 'apiSentStatus',
              label: 'API Status',
              sortable: false,
              render: (val) => (
                <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded ${val === 'Proceed' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                  {val}
                </span>
              )
            },
          ];
        }

        const groupLabelMap = {
          agent: 'Counsellor',
          source: 'Traffic Source',
          campaign: 'Campaign Identity',
          source_url: 'Referral Engine (URL)',
          created_at: 'Temporal Matrix (Created At)'
        };

        // Check if we should hide the supervisor row (all zeros and "No Supervisor")
        const shouldHideSupervisorRow = (row) => {
          if (row.isSupervisor && row.supervisorName === 'No Supervisor') {
            const metrics = [
              'lead_count', 'total_leads', 'freshCount', 'attempted', 'connectedAnytime',
              'icc', 'formfilled', 'formFilled', 'need_active', 'admission', 'active_cases', 'ni', 'enrolled',
              'under_3_remarks', 'remarks_4_7', 'remarks_8_10', 'remarks_gt_10', 'preNI'
            ];

            return metrics.every(metric =>
              (row[metric] === 0 || row[metric] === undefined || row[metric] === null)
            );
          }
          return false;
        };

        const defaultLeadColumns = [
          {
            key: 'group_by',
            label: groupLabelMap[leadSubTab] || 'Segment Identity',
            sortable: true,
            render: (val, row) => {
              // Check if this is a Total row
              const isTotalRow = val?.toString().toLowerCase() === 'total' || 
                                row.agentName?.toString().toLowerCase() === 'total' ||
                                (row.isSupervisor && row.supervisorName?.toString().toLowerCase() === 'total');

              // Skip rendering if this is a "No Supervisor" row with all zeros
              if (shouldHideSupervisorRow(row)) {
                return null;
              }

              return (
                <div className="flex items-center gap-2">
                  {row.isSupervisor && !isTotalRow && (
                    <button onClick={() => toggleSupervisor(row.supervisorName)}>
                      {expandedSupervisors[row.supervisorName] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                  {isTotalRow ? (
                    <span className="font-black text-slate-900 bg-yellow-50 px-2 py-1 rounded">TOTAL</span>
                  ) : (
                    <span className={row.isSupervisor ? "font-black text-slate-900" : "pl-6 text-slate-500"}>
                      {val || row.agentName || 'Unassigned'}
                    </span>
                  )}
                </div>
              );
            }
          },
          {
            key: 'lead_count',
            label: 'Leads',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'lead_count');
            }
          },
          {
            key: 'attempted',
            label: 'Attempted',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'attempted');
            }
          },
          {
            key: 'connectedAnytime',
            label: 'Connected',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'connectedAnytime');
            }
          },
          {
            key: 'icc',
            label: 'ICC',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'icc');
            }
          },
          {
            key: 'formFilled',
            label: 'Forms',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'formFilled');
            }
          },
          {
            key: 'need_active',
            label: 'Need Active',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'need_active');
            }
          },
          {
            key: 'admission',
            label: 'Adm.',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'admission');
            }
          },
          {
            key: 'preNI',
            label: 'PreNI',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'preNI');
            }
          },
          {
            key: 'connectedAnytimePercent',
            label: 'Connected%',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'connectedAnytimePercent');
            }
          },
          {
            key: 'iccPercent',
            label: 'Icc%',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'iccPercent');
            }
          },
          {
            key: 'leadToForm',
            label: 'L2F %',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'leadToForm');
            }
          },
          {
            key: 'formToAdmission',
            label: 'F2A %',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'formToAdmission');
            }
          },
          {
            key: 'leadToAdmission',
            label: 'L2A %',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'leadToAdmission');
            }
          },
          {
            key: 'preNIPercent',
            label: 'PreNI %',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'preNIPercent');
            }
          },
        ];

        const detailedLeadColumns = [
          {
            key: 'group_by',
            label: groupLabelMap[leadSubTab] || 'Segment Identity',
            sortable: true,
            render: (val, row) => {
              // Check if this is a Total row
              const isTotalRow = val?.toString().toLowerCase() === 'total' || 
                                row.agentName?.toString().toLowerCase() === 'total' ||
                                (row.isSupervisor && row.supervisorName?.toString().toLowerCase() === 'total');

              // Skip rendering if this is a "No Supervisor" row with all zeros
              if (shouldHideSupervisorRow(row)) {
                return null;
              }

              return (
                <div className="flex items-center gap-2">
                  {row.isSupervisor && !isTotalRow && (
                    <button onClick={() => toggleSupervisor(row.supervisorName)}>
                      {expandedSupervisors[row.supervisorName] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                  {isTotalRow ? (
                    <span className="font-black text-slate-900 bg-yellow-50 px-2 py-1 rounded">TOTAL</span>
                  ) : (
                    <span className={row.isSupervisor ? "font-black text-slate-900" : "pl-6 text-slate-500"}>
                      {val || row.agentName || 'Unassigned'}
                    </span>
                  )}
                </div>
              );
            }
          },
          {
            key: 'lead_count',
            label: 'LEADS',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'lead_count');
            }
          },
          {
            key: 'active_cases',
            label: 'ACTIVE',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'active_cases');
            }
          },
          {
            key: 'ni',
            label: 'NOT INTERESTED',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'ni');
            }
          },
          {
            key: 'under_3_remarks',
            label: '< 3 REMARKS',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'under_3_remarks');
            }
          },
          {
            key: 'remarks_4_7',
            label: '4-7 REMARKS',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'remarks_4_7');
            }
          },
          {
            key: 'remarks_8_10',
            label: '8-10 REMARKS',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'remarks_8_10');
            }
          },
          {
            key: 'remarks_gt_10',
            label: '> 10 REMARKS',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'remarks_gt_10');
            }
          },
          {
            key: 'preNI',
            label: 'PreNI',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'preNI');
            }
          },
          {
            key: 'preNIPercent',
            label: 'PreNI %',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'preNIPercent');
            }
          },
          {
            key: 'formfilled',
            label: 'FORMS',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'formfilled');
            }
          },
          {
            key: 'need_active',
            label: 'NEED ACTIVE',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'need_active');
            }
          },
          {
            key: 'admission',
            label: 'ADMISSIONS',
            align: 'center',
            sortable: true,
            render: (val, row) => {
              if (shouldHideSupervisorRow(row)) return null;
              return renderValueWithDash(val, row, 'admission');
            }
          },
        ];

        return showDetailedColumns ? detailedLeadColumns : defaultLeadColumns;

      case 'remarks':
        const timeColumns = Array.from({ length: 11 }, (_, i) => {
          const hour = (i + 9).toString().padStart(2, '0');
          const nextHour = (i + 10).toString().padStart(2, '0');
          const slot = `${hour}:00 - ${nextHour}:00`;
          return {
            key: `slot_${hour}`,
            label: `${hour}:00`,
            align: 'center',
            sortable: false,
            render: (_, row) => {
              const count = row.timeSlots?.[slot]?.count || 0;
              return count === 0 ? <span className="text-slate-200">—</span> : <span className="font-bold text-slate-900">{count}</span>;
            }
          };
        });

        return [
          {
            key: 'counsellorName',
            label: 'Counsellor',
            sortable: false,
            render: (val, row) => (
              <div className="flex items-center gap-2">
                {row.isSupervisor && (
                  <button onClick={() => toggleSupervisor(row.supervisorName)}>
                    {expandedSupervisors[row.supervisorName] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                )}
                <span className={row.isSupervisor ? "font-black text-slate-900" : "pl-6 text-slate-500"}>
                  {row.isSupervisor ? row.supervisorName : val}
                </span>
              </div>
            )
          },
          {
            key: 'totalRemarks',
            label: 'Total',
            align: 'center',
            sortable: false,
            render: (val) => {
              const display = typeof val === 'object' && val !== null ? val.count : val;
              return <span className="font-bold text-slate-900">{display ?? 0}</span>;
            }
          },
          ...timeColumns
        ];

      default:
        return [];
    }
  }, [activeTab, leadSubTab, expandedSupervisors, showDetailedColumns]);

  const tableData = useMemo(() => {
    if (!currentData.data) return [];

    const sortData = (data) => {
      // Only sort if activeTab is 'lead' and leadSubTab is not 'api'
      if (activeTab !== 'lead' || leadSubTab === 'api' || !sortField || !sortOrder) return data;

      // Separate the Total row (if exists) and other rows
      const totalRow = data.find(row => 
        row.group_by?.toString().toLowerCase() === 'total' || 
        row.agentName?.toString().toLowerCase() === 'total' ||
        (row.isSupervisor && row.supervisorName?.toString().toLowerCase() === 'total')
      );
      
      const otherRows = data.filter(row => 
        !(row.group_by?.toString().toLowerCase() === 'total') &&
        !(row.agentName?.toString().toLowerCase() === 'total') &&
        !(row.isSupervisor && row.supervisorName?.toString().toLowerCase() === 'total')
      );

      // Sort only the non-Total rows
      const sortedRows = [...otherRows].sort((a, b) => {
        // When sorting, treat dash rows (lead_count = 0) as lowest values
        if ((a.lead_count === 0 || a.total_leads === 0) && (b.lead_count === 0 || b.total_leads === 0)) {
          return 0;
        }
        if (a.lead_count === 0 || a.total_leads === 0) return 1;
        if (b.lead_count === 0 || b.total_leads === 0) return -1;

        let aValue = a[sortField];
        let bValue = b[sortField];

        if (sortField.includes('.')) {
          const keys = sortField.split('.');
          aValue = keys.reduce((obj, key) => obj?.[key], a);
          bValue = keys.reduce((obj, key) => obj?.[key], b);
        }

        if (aValue === null || aValue === undefined) return sortOrder === 'asc' ? -1 : 1;
        if (bValue === null || bValue === undefined) return sortOrder === 'asc' ? 1 : -1;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }

        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();

        if (sortOrder === 'asc') {
          return aString.localeCompare(bString);
        } else {
          return bString.localeCompare(aString);
        }
      });

      // Always put the Total row at the bottom
      const result = [...sortedRows];
      if (totalRow) {
        result.push(totalRow);
      }
      
      return result;
    };

    const addRowClasses = (data) => {
      return data.map((item, index) => {
        const baseClass = item.rowClass || '';
        const isOddRow = index % 2 === 1;
        const zebraClass = isOddRow ? 'bg-blue-50/30' : 'bg-white';
        
        // Check if this is a Total row
        const isTotalRow = item.group_by?.toString().toLowerCase() === 'total' || 
                          item.agentName?.toString().toLowerCase() === 'total' ||
                          (item.isSupervisor && item.supervisorName?.toString().toLowerCase() === 'total');
        
        // Add special class for Total row
        const totalClass = isTotalRow ? 'bg-blue-50 border-t-2 border-blue-200' : '';
        
        return {
          ...item,
          rowClass: `${baseClass} ${zebraClass} ${totalClass}`.trim()
        };
      });
    };

    if (activeTab === 'remarks') {
      const supervisors = {};
      currentData.data.forEach(item => {
        const sName = item.supervisorName || 'No Supervisor';
        if (!supervisors[sName]) supervisors[sName] = { supervisorName: sName, totalRemarks: 0, timeSlots: {}, counsellors: [], isSupervisor: true };
        supervisors[sName].totalRemarks += item.totalRemarks || 0;
        supervisors[sName].counsellors.push(item);
        Object.entries(item.timeSlots || {}).forEach(([slot, data]) => {
          if (!supervisors[sName].timeSlots[slot]) supervisors[sName].timeSlots[slot] = { count: 0 };
          supervisors[sName].timeSlots[slot].count += data.count || 0;
        });
      });

      const flattened = [];
      Object.values(supervisors).sort((a, b) => a.supervisorName.localeCompare(b.supervisorName)).forEach(s => {
        flattened.push({ ...s, rowClass: 'bg-slate-50' });
        if (expandedSupervisors[s.supervisorName]) {
          s.counsellors.forEach(c => flattened.push(c));
        }
      });

      const sortedData = sortData(flattened);
      return addRowClasses(sortedData);
    }

    if (activeTab === 'lead' && leadSubTab === 'agent') {
      const supervisors = {};
      currentData.data.forEach(item => {
        const sName = item.supervisor_name || item.supervisorName || 'No Supervisor';

        // Skip processing if this is a "No Supervisor" row with all zeros
        const metrics = [
          'lead_count', 'total_leads', 'freshCount', 'attempted', 'connectedAnytime',
          'icc', 'formfilled', 'formFilled', 'need_active', 'admission', 'active_cases', 'ni', 'enrolled',
          'under_3_remarks', 'remarks_4_7', 'remarks_8_10', 'remarks_gt_10', 'preNI'
        ];

        const allZeros = sName === 'No Supervisor' && metrics.every(metric =>
          (item[metric] === 0 || item[metric] === undefined || item[metric] === null)
        );

        if (allZeros) return; // Skip this item entirely

        // Identify if this is a Total row
        const isTotalRow = sName.toLowerCase() === 'total' ||
                          item.group_by?.toString().toLowerCase() === 'total' ||
                          item.agentName?.toString().toLowerCase() === 'total';

        if (!supervisors[sName]) {
          supervisors[sName] = {
            supervisorName: sName,
            lead_count: 0,
            total_leads: 0,
            freshCount: 0,
            attempted: 0,
            connectedAnytime: 0,
            icc: 0,
            formfilled: 0,
            formFilled: 0,
            need_active: 0,
            admission: 0,
            connectedAnytimePercent: 0,
            iccPercent: 0,
            leadToForm: 0,
            formToAdmission: 0,
            leadToAdmission: 0,
            active_cases: 0,
            ni: 0,
            enrolled: 0,
            under_3_remarks: 0,
            remarks_4_7: 0,
            remarks_8_10: 0,
            remarks_gt_10: 0,
            preNI: 0,
            preNIPercent: 0,
            counsellors: [],
            isSupervisor: true,
            group_by: sName,
            isTotalRow: isTotalRow
          };
        }

        supervisors[sName].lead_count += item.lead_count || 0;
        supervisors[sName].total_leads += item.total_leads || 0;
        supervisors[sName].freshCount += item.freshCount || 0;
        supervisors[sName].attempted += item.attempted || 0;
        supervisors[sName].connectedAnytime += item.connectedAnytime || 0;
        supervisors[sName].icc += item.icc || 0;
        supervisors[sName].formfilled += item.formfilled || 0;
        supervisors[sName].formFilled += item.formFilled || 0;
        supervisors[sName].need_active += item.need_active || 0;
        supervisors[sName].admission += item.admission || 0;
        supervisors[sName].active_cases += item.active_cases || 0;
        supervisors[sName].ni += item.ni || 0;
        supervisors[sName].enrolled += item.enrolled || 0;
        supervisors[sName].under_3_remarks += item.under_3_remarks || 0;
        supervisors[sName].remarks_4_7 += item.remarks_4_7 || 0;
        supervisors[sName].remarks_8_10 += item.remarks_8_10 || 0;
        supervisors[sName].remarks_gt_10 += item.remarks_gt_10 || 0;
        supervisors[sName].preNI += item.preNI || 0;
        supervisors[sName].counsellors.push(item);
      });

      Object.values(supervisors).forEach(s => {
        const lead_count = s.lead_count || s.total_leads || 0;
        const attempted = s.attempted || 0;
        const formFilled = s.formFilled || s.formfilled || 0;
        const admission = s.admission || 0;
        const connectedAnytime = s.connectedAnytime || 0;
        const icc = s.icc || 0;
        const preNI = s.preNI || 0;

        s.connectedAnytimePercent = lead_count > 0 ? Number(((connectedAnytime / lead_count) * 100).toFixed(1)) : 0;
        s.iccPercent = lead_count > 0 ? Number(((icc / lead_count) * 100).toFixed(1)) : 0;
        s.preNIPercent = lead_count > 0 ? Number(((preNI / lead_count) * 100).toFixed(1)) : 0;
        s.leadToForm = attempted > 0 ? Number(((formFilled / attempted) * 100).toFixed(1)) : 0;
        s.formToAdmission = formFilled > 0 ? Number(((admission / formFilled) * 100).toFixed(1)) : 0;
        s.leadToAdmission = attempted > 0 ? Number(((admission / attempted) * 100).toFixed(1)) : 0;
      });

      const flattened = [];
      const sortedSupervisors = sortData(Object.values(supervisors));

      sortedSupervisors.forEach((s, index) => {
        const isOddSupervisor = index % 2 === 1;
        const supervisorRowClass = isOddSupervisor ? 'bg-blue-50/30' : 'bg-white';
        flattened.push({ ...s, rowClass: supervisorRowClass });
        if (expandedSupervisors[s.supervisorName]) {
          const sortedCounsellors = sortData(s.counsellors);
          sortedCounsellors.forEach((c, counsellorIndex) => {
            const isOddCounsellor = counsellorIndex % 2 === 1;
            const counsellorRowClass = isOddCounsellor ? 'bg-blue-50/10' : 'bg-white';
            flattened.push({ ...c, rowClass: counsellorRowClass });
          });
        }
      });
      return flattened;
    }

    if (activeTab === 'lead') {
      const processedData = currentData.data.map(item => {
        const lead_count = item.lead_count || item.total_leads || 0;
        const preNI = item.preNI || 0;

        return {
          ...item,
          lead_count,
          total_leads: item.total_leads || item.lead_count || 0,
          freshCount: item.freshCount || 0,
          attempted: item.attempted || 0,
          connectedAnytime: item.connectedAnytime || 0,
          icc: item.icc || 0,
          formfilled: item.formfilled || item.formFilled || 0,
          formFilled: item.formFilled || item.formfilled || 0,
          need_active: item.need_active || 0,
          admission: item.admission || item.admission_count || 0,
          connectedAnytimePercent: item.connectedAnytimePercent || 0,
          iccPercent: item.iccPercent || 0,
          leadToForm: item.leadToForm || 0,
          formToAdmission: item.formToAdmission || 0,
          leadToAdmission: item.leadToAdmission || 0,
          active_cases: item.active_cases || 0,
          ni: item.ni || 0,
          enrolled: item.enrolled || 0,
          under_3_remarks: item.under_3_remarks || 0,
          remarks_4_7: item.remarks_4_7 || 0,
          remarks_8_10: item.remarks_8_10 || 0,
          remarks_gt_10: item.remarks_gt_10 || 0,
          preNI,
          preNIPercent: lead_count > 0 ? Number(((preNI / lead_count) * 100).toFixed(1)) : 0
        };
      });

      const sortedData = sortData(processedData);
      return addRowClasses(sortedData);
    }

    const sortedData = sortData(currentData.data);
    return addRowClasses(sortedData);
  }, [currentData.data, activeTab, leadSubTab, expandedSupervisors, sortField, sortOrder]);

  const renderSortIndicator = (columnKey) => {
    // Only show sort indicator for lead tab and non-api subtabs
    if (activeTab !== 'lead' || leadSubTab === 'api') {
      return null;
    }

    const isActive = sortField === columnKey;
    const isAsc = sortOrder === 'asc';

    return (
      <span className="ml-1 flex flex-col">
        <ArrowUp
          size={10}
          className={`mb-0.5 ${isActive && isAsc ? 'text-white' : 'text-blue-200/50'}`}
        />
        <ArrowDown
          size={10}
          className={`${isActive && !isAsc ? 'text-white' : 'text-blue-200/50'}`}
        />
      </span>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="h-auto">
        <ReportTable
          columns={columns.map(col => ({
            ...col,
            headerRender: col.sortable && activeTab === 'lead' && leadSubTab !== 'api' ? (
              <button
                onClick={() => onColumnSort(col.key)}
                className="flex items-center justify-center gap-1 hover:text-white transition-colors"
              >
                <span>{col.label}</span>
                {renderSortIndicator(col.key)}
              </button>
            ) : col.label
          }))}
          data={tableData}
          loading={loading}
          emptyText="Target system returned no data payload"
        />
      </div>

      {activeTab !== 'remarks' && totalPages > 1 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-white">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}
    </div>
  );
};

export default DataTable;