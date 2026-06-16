import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Inbox, Info } from 'lucide-react';
import ReportTable from '../MainReport/ReportTable';

const LeadStatusPivotTable = ({
  data = [],
  selectedColleges = [],
  selectedSupervisors = [],
  selectedCounsellors = [],
  onCellClick
}) => {
  const [expandedSupervisors, setExpandedSupervisors] = useState({});
  const [showTotalOnly, setShowTotalOnly] = useState(false);

  const toggleSupervisor = (name) => {
    setExpandedSupervisors(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const rowTarget = (row) => row.isSupervisor
    ? { supervisorName: row.supervisorName, label: row.supervisorName }
    : { counsellor: row.counsellor, label: row.counsellor };

  // Extract unique values
  const colleges = useMemo(() => {
    return [...new Set(data.map(d => d.college_name).filter(Boolean))].sort();
  }, [data]);

  const displayColleges = selectedColleges.length > 0 ? selectedColleges : colleges;

  const columns = useMemo(() => {
    const cols = [
      { 
        key: 'name', 
        label: 'Lead Pipeline Architecture',
        render: (val, row) => (
          <div className="flex items-center gap-2">
            {row.isSupervisor && (
              <button onClick={() => toggleSupervisor(row.supervisorName)}>
                {expandedSupervisors[row.supervisorName] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
            <span className={row.isSupervisor ? "font-black text-slate-900" : "pl-6 text-slate-500 font-medium"}>
              {row.isSupervisor ? row.supervisorName : row.counsellor}
            </span>
          </div>
        )
      }
    ];

    displayColleges.forEach(college => {
      cols.push({
        key: `college_${college}`,
        label: college,
        align: 'center',
        render: (_, row) => {
          const stats = row.collegeStats?.[college] || { dnp: 0, tf: 0, p: 0, t: 0 };
          const click = (bucket, val) => val > 0 && onCellClick?.(rowTarget(row), bucket, { college_name: college });
          if (showTotalOnly) return (
            <span className="font-bold cursor-pointer hover:underline" onClick={() => click('total', stats.t)}>{stats.t || '-'}</span>
          );
          return (
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="text-red-500 font-black cursor-pointer hover:underline" title="DNP" onClick={() => click('dnp', stats.dnp)}>{stats.dnp || '-'}</span>
              <span className="text-amber-500 font-black cursor-pointer hover:underline" title="Tech Fail" onClick={() => click('tf', stats.tf)}>{stats.tf || '-'}</span>
              <span className="text-emerald-500 font-black cursor-pointer hover:underline" title="Proceed" onClick={() => click('p', stats.p)}>{stats.p || '-'}</span>
              <span className="text-slate-900 font-black bg-slate-100 px-1.5 py-0.5 rounded cursor-pointer hover:underline" title="Total" onClick={() => click('total', stats.t)}>{stats.t || '-'}</span>
            </div>
          );
        }
      });
    });

    cols.push({
      key: 'grand_total',
      label: 'Aggregate',
      align: 'center',
      render: (_, row) => (
        <span
          className="text-blue-600 font-black px-2 py-1 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100"
          onClick={() => (row.totals?.Total || 0) > 0 && onCellClick?.(rowTarget(row), 'total', {})}
        >
          {row.totals?.Total || 0}
        </span>
      )
    });

    return cols;
  }, [displayColleges, expandedSupervisors, showTotalOnly, onCellClick]);

  const tableData = useMemo(() => {
    const supervisors = {};
    data.forEach(record => {
      const sName = record.supervisor || 'No Supervisor';
      const cName = record.counsellor;
      const college = record.college_name;

      if (!supervisors[sName]) supervisors[sName] = { supervisorName: sName, counsellors: {}, totals: { 'Total': 0 }, collegeStats: {}, isSupervisor: true };
      if (!supervisors[sName].counsellors[cName]) supervisors[sName].counsellors[cName] = { counsellor: cName, totals: { 'Total': 0 }, collegeStats: {} };

      const getVal = (v) => typeof v === 'object' && v !== null ? (v.count ?? 0) : (v ?? 0);
      const dnp = Number(getVal(record['Do Not Proceed']));
      const tf = Number(getVal(record['Technical Fail']));
      const p = Number(getVal(record['Proceed']));
      const t = dnp + tf + p;

      // Update Counsellor
      if (!supervisors[sName].counsellors[cName].collegeStats[college]) supervisors[sName].counsellors[cName].collegeStats[college] = { dnp: 0, tf: 0, p: 0, t: 0 };
      supervisors[sName].counsellors[cName].collegeStats[college].dnp += dnp;
      supervisors[sName].counsellors[cName].collegeStats[college].tf += tf;
      supervisors[sName].counsellors[cName].collegeStats[college].p += p;
      supervisors[sName].counsellors[cName].collegeStats[college].t += t;
      supervisors[sName].counsellors[cName].totals.Total += t;

      // Update Supervisor
      if (!supervisors[sName].collegeStats[college]) supervisors[sName].collegeStats[college] = { dnp: 0, tf: 0, p: 0, t: 0 };
      supervisors[sName].collegeStats[college].dnp += dnp;
      supervisors[sName].collegeStats[college].tf += tf;
      supervisors[sName].collegeStats[college].p += p;
      supervisors[sName].collegeStats[college].t += t;
      supervisors[sName].totals.Total += t;
    });

    const flattened = [];
    Object.values(supervisors).sort((a,b) => a.supervisorName.localeCompare(b.supervisorName)).forEach(s => {
      if (selectedSupervisors.length > 0 && !selectedSupervisors.includes(s.supervisorName)) return;
      flattened.push({ ...s, rowClass: 'bg-slate-50/50' });
      if (expandedSupervisors[s.supervisorName]) {
        Object.values(s.counsellors).sort((a,b) => a.counsellor.localeCompare(b.counsellor)).forEach(c => {
          if (selectedCounsellors.length > 0 && !selectedCounsellors.includes(c.counsellor)) return;
          flattened.push(c);
        });
      }
    });
    return flattened;
  }, [data, expandedSupervisors, selectedSupervisors, selectedCounsellors]);

  return (
    <div className="flex flex-col  border-t-3 border-slate-100">
      <div className="px-6 py-3 flex items-center justify-between bg-slate-50/10">
        <div className="flex items-center gap-3">
          <div>
            <h4 className="text-sm font-black text-slate-900 mt-0.5">API Disposition Pivot</h4>
          </div>
          {!showTotalOnly && (
            <div className="flex items-center gap-3 ml-6 animate-in fade-in slide-in-from-left-2 transition-all">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"/> <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">DNP</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"/> <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Fail</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"/> <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Success</span></div>
            </div>
          )}
        </div>
        
        <div className="flex items-center bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setShowTotalOnly(false)}
            className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${!showTotalOnly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Resolution
          </button>
          <button
            onClick={() => setShowTotalOnly(true)}
            className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${showTotalOnly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Abstract
          </button>
        </div>
      </div>

      <ReportTable 
        columns={columns}
        data={tableData}
        loading={false}
        emptyText="No matrix data available for this sector"
      />
    </div>
  );
};

export default LeadStatusPivotTable;