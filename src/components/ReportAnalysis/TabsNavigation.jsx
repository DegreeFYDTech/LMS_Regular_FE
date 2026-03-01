import {
  Users,
  FileText,
  TrendingUp,
  Activity,
  Filter,
  ChevronRight,
  PieChart,
  Target,
  BarChart2,
  PhoneCall,
  LayoutDashboard,
  Database,
  Search,
  Building2,
  UserCheck
} from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';

const TabsNavigation = ({ activeTab, setActiveTab, leadSubTab, setLeadSubTab }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showSubtabs, setShowSubtabs] = useState(false);
  const storedRole = useSelector((state) => state.auth.role);

  const getTabs = () => {
    if (storedRole === 'Analyser') {
      return [
        {
          id: 'lead',
          label: 'Lead Intelligence',
          icon: Target,
          description: 'Lead form & monitoring',
          subtabs: [
            { id: 'campaign', label: 'Lead Form (Campaign)' },
            { id: 'source_url', label: 'Lead Form (Source URL)' }
          ]
        }
      ];
    }

    return [
      {
        id: 'lead',
        label: 'Lead Intelligence',
        icon: Target,
        description: 'Lead form & monitoring',
        subtabs: [
          { id: 'api', label: 'API Report' },
          { id: 'agent', label: 'Lead Form (Agent)' },
          { id: 'source', label: 'Lead Form (Source)' },
          { id: 'campaign', label: 'Lead Form (Campaign)' },
          { id: 'source_url', label: 'Lead Form (Source URL)' },
          { id: 'created_at', label: 'Lead Form (Created At)' }
        ]
      },
      { id: 'remarks', label: 'Counsellor Remarks', icon: PieChart },
      { id: 'track', label: 'General Track', icon: BarChart2 },
      {
        id: 'attempt',
        label: 'Lead Attempt',
        icon: PhoneCall,
        subtabs: [
          { id: 'time', label: 'Time Based Analytics' },
          { id: 'hour', label: 'Hourly Performance Analysis' }
        ]
      },
      {
        id: 'tracker2',
        label: 'Unique Tracker',
        icon: TrendingUp,
        subtabs: [
          { id: 'slot', label: 'Hourly Analysis' },
          { id: 'counsellor', label: 'Counsellor Analysis' }
        ]
      },
      {
        id: 'collegeStatusReports',
        label: 'College Status Reports',
        icon: Building2
      },
      {
        id: 'counsellorReport',
        label: 'Counsellor Report',
        icon: UserCheck
      },
    ];
  };


  const tabs = getTabs();

  const handleTabClick = (tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab.disabled) return;

    setActiveTab(tabId);

    if (tab.subtabs) {
      setShowSubtabs(true);
    } else {
      setShowSubtabs(false);
    }
  };

  const handleSubtabClick = (subtabId) => {
    setLeadSubTab(subtabId);
    setShowSubtabs(false);
  };

  const handleBackToTabs = () => {
    setShowSubtabs(false);
    setActiveTab(null);
  };

  return (
    <>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 group"
        title="Toggle Reports Menu"
      >
        <Filter className="w-5 h-5" />
        {activeTab && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
            ✓
          </span>
        )}
      </button>

      {showMenu && (
        <div className="fixed bottom-24 right-6 z-50 flex gap-0 w-80">
          {showSubtabs ? (
            <div className="bg-white rounded-lg shadow-xl border border-gray-300 overflow-hidden w-full">
              <div
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={handleBackToTabs}
              >
                <ChevronRight className="w-4 h-4 text-gray-500 rotate-180" />
                <span className="text-sm font-semibold text-gray-700">Back to Reports</span>
              </div>

              <div className="p-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 rounded-lg mb-4">
                  <p className="text-sm font-semibold text-blue-700">Select Report Type</p>
                  <p className="text-xs text-blue-600 mt-1">Lead Level Reports</p>
                </div>

                {tabs.find(t => t.id === activeTab)?.subtabs.map((subtab) => (
                  <button
                    key={subtab.id}
                    onClick={() => handleSubtabClick(subtab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm rounded-lg transition-all mb-2 group ${leadSubTab === subtab.id
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                      }`}
                  >
                    <span className="font-medium">{subtab.label}</span>
                    {leadSubTab === subtab.id && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden w-full">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isDisabled = tab.disabled;

                return (
                  <div
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex items-center justify-between gap-3 px-4 py-3 transition-all duration-200 border-b border-gray-100 last:border-b-0 cursor-pointer hover:shadow-sm ${isDisabled
                      ? 'bg-gray-100 text-gray-400'
                      : activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-r-4 border-blue-500 shadow-sm'
                        : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg transition-colors ${isDisabled
                          ? 'bg-gray-200 text-gray-400'
                          : activeTab === tab.id
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-300'
                            : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600'
                          }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className={`text-sm font-semibold ${isDisabled ? 'text-gray-400' : ''}`}>
                          {tab.label}
                          {isDisabled && <span className="ml-2 text-xs bg-gray-300 text-gray-600 px-1.5 py-0.5 rounded">Coming Soon</span>}
                        </span>
                        <span className={`text-xs ${isDisabled
                          ? 'text-gray-400'
                          : activeTab === tab.id
                            ? 'text-blue-600 font-medium'
                            : 'text-gray-500'
                          }`}>
                          {tab.description}
                        </span>
                      </div>
                    </div>
                    {tab.subtabs && !isDisabled && (
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

export default TabsNavigation;
