import React from 'react';
import {
  LayoutDashboard,
  BarChart2,
  PhoneCall,
  FileText,
  PieChart,
  Target,
  Zap
} from 'lucide-react';

const SoberReportNav = ({ activeLevel, setActiveLevel, activeTab, setActiveTab }) => {
  const levels = [
    { id: 'lead', label: 'Lead Intelligence', icon: Target },
    { id: 'admission', label: 'Admission Status', icon: Zap },
    { id: 'application', label: 'Applications', icon: Layers }
  ];

  const leadTabs = [
    { id: 'api', label: 'API Analytics', icon: Zap },
    { id: 'remarks', label: 'Counsellor Remarks', icon: PieChart },
    { id: 'track', label: 'General Track', icon: BarChart2 },
    { id: 'attempt', label: 'Lead Attempt', icon: PhoneCall },
    { id: 'tracker2', label: 'Unique Tracker', icon: FileText }
  ];

  return (
    <div className="space-y-4">
      {/* Level Selector - Compact Pill Style */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        {levels.map((level) => {
          const isActive = activeLevel === level.id;
          return (
            <button
              key={level.id}
              onClick={() => setActiveLevel(level.id)}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 flex items-center gap-2 ${isActive
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              <level.icon size={16} />
              {level.label}
            </button>
          );
        })}
      </div>

      {/* Sub-tabs for Lead Level - Simple Underline Style */}
      {activeLevel === 'lead' && (
        <div className="flex items-center gap-8 border-b border-slate-200 px-2 overflow-x-auto no-scrollbar">
          {leadTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 pt-2 text-xs font-black uppercase tracking-widest relative transition-all duration-300 whitespace-nowrap ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.4)] animate-in slide-in-from-bottom-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Layers = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

export default SoberReportNav;
