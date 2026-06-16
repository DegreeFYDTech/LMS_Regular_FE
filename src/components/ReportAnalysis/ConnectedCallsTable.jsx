import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ReportTable from '../MainReport/ReportTable';

const ConnectedCallsTable = ({ data, onCellClick }) => {
  const [expandedSupervisors, setExpandedSupervisors] = useState({});

  const toggleSupervisor = (name) => {
    setExpandedSupervisors(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const rowTarget = (row) => row.isSupervisor
    ? { supervisorName: row.supervisorName, label: row.supervisorName }
    : { counsellorId: row.counsellorId, label: row.counsellorName };

  const columns = useMemo(() => {
    const cols = [
      {
        key: 'name',
        label: 'Counsellor Architecture',
        render: (val, row) => (
          <div className="flex items-center gap-2">
            {row.isSupervisor && (
              <button onClick={() => toggleSupervisor(row.supervisorName)}>
                {expandedSupervisors[row.supervisorName] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
            <span className={row.isSupervisor ? "font-black text-slate-900" : "pl-6 text-slate-500 font-medium"}>
              {row.isSupervisor ? row.supervisorName : row.counsellorName}
            </span>
          </div>
        )
      },
      {
        key: 'totalRemarks',
        label: 'Remarks',
        align: 'center',
        render: (val, row) => (
          <span
            className="font-black text-slate-900 cursor-pointer hover:underline hover:text-blue-700"
            onClick={() => onCellClick?.(rowTarget(row), 'totalRemarks')}
          >
            {val || 0}
          </span>
        )
      },
      {
        key: 'totalConnectedCalls',
        label: 'Connected',
        align: 'center',
        render: (val, row) => (
          <span
            className="font-black text-emerald-600 cursor-pointer hover:underline"
            onClick={() => onCellClick?.(rowTarget(row), 'totalConnectedCalls')}
          >
            {val || 0}
          </span>
        )
      },
      {
        key: 'percentage',
        label: 'Success Rate',
        align: 'center',
        render: (_, row) => {
          const perc = row.totalRemarks > 0 ? Math.round((row.totalConnectedCalls / row.totalRemarks) * 100) : 0;
          return (
            <div className="flex flex-col items-center">
              <span className={`font-black ${perc > 50 ? 'text-emerald-600' : perc > 20 ? 'text-amber-600' : 'text-red-600'}`}>
                {perc}%
              </span>
              <div className="w-12 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                <div className={`h-full transition-all duration-500 ${perc > 50 ? 'bg-emerald-500' : perc > 20 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${perc}%` }} />
              </div>
            </div>
          );
        }
      }
    ];

    for (let i = 9; i <= 19; i++) {
        const hour = i;
        const slotLabel = `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`;
        cols.push({
            key: `slot_${hour}`,
            label: `${hour % 12 || 12}${hour >= 12 ? 'PM' : 'AM'}`,
            align: 'center',
            render: (_, row) => {
                let count = 0;
                if (row.isSupervisor) {
                    count = row.counsellors.reduce((sum, c) => sum + (Number(c.timeSlots?.[slotLabel]?.count) || 0), 0);
                } else {
                    count = Number(row.timeSlots?.[slotLabel]?.count) || 0;
                }
                return (
                  <span
                    className={`text-[11px] font-bold cursor-pointer hover:underline ${count > 0 ? 'text-slate-900' : 'text-slate-300'}`}
                    onClick={() => count > 0 && onCellClick?.(rowTarget(row), 'slot', { hour })}
                  >
                    {count || '-'}
                  </span>
                );
            }
        });
    }

    return cols;
  }, [expandedSupervisors, onCellClick]);

  const tableData = useMemo(() => {
    const groups = {};
    data.forEach(item => {
      const sName = item.supervisorName || 'No Supervisor';
      if (!groups[sName]) groups[sName] = { supervisorName: sName, totalRemarks: 0, totalConnectedCalls: 0, counsellors: [], isSupervisor: true };
      groups[sName].counsellors.push(item);
      groups[sName].totalRemarks += item.totalRemarks || 0;
      groups[sName].totalConnectedCalls += item.totalConnectedCalls || 0;
    });

    const flattened = [];
    Object.values(groups).sort((a,b) => a.supervisorName.localeCompare(b.supervisorName)).forEach(s => {
      flattened.push({ ...s, rowClass: 'bg-slate-50/50' });
      if (expandedSupervisors[s.supervisorName]) {
        s.counsellors.sort((a,b) => a.counsellorName.localeCompare(b.counsellorName)).forEach(c => flattened.push(c));
      }
    });
    return flattened;
  }, [data, expandedSupervisors]);

  return (
    <div className="flex flex-col mt-8 border-t border-slate-100">
      <div className="p-6 flex items-center justify-between bg-slate-50/10">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Connectivity Metrics</span>
          <h4 className="text-sm font-black text-slate-900 mt-0.5">Connected Calls Distribution</h4>
        </div>
      </div>

      <ReportTable 
        columns={columns}
        data={tableData}
        loading={false}
        emptyText="No connectivity data available for this phase"
      />
    </div>
  );
};

export default ConnectedCallsTable;