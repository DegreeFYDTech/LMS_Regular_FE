import React, { useState, Suspense } from 'react';
import ReportAnalysis from './ReportAnalysis';
import TrackReportAnalysis from './TrackReportAnalysis';
import TrackerRportAnalysis1 from './TrackerRportAnalysis1';
import TrackerReportAnalysis2 from './TrackerReportAnalysis2';
import TrackerReportAnalysis3 from './TrackerReportAnalysis3';
import CollegeStatusReports from './CollegeStatusReports';
import CounsellorStatsDashboard from './CounsellorReport';
import TabsNavigation from '../components/ReportAnalysis/TabsNavigation';
import { useSelector } from 'react-redux';
import FormToAdmissionsReport from './FormAdmission';

const MainReport = () => {
  const storedRole = useSelector((state) => state.auth.role);
  const [activeTab, setActiveTab] = useState('lead');
  const [leadSubTab, setLeadSubTab] = useState(storedRole == "Analyser" ? "campaign" : 'api');

  const renderContent = () => {
    if (activeTab === 'admission' || activeTab === 'application') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100">
            <span className="text-slate-400 font-black text-xl">SOON</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Module Under Construction</h2>
          <p className="text-slate-500 max-w-sm mx-auto font-medium">
            The <span className="text-blue-600 font-bold capitalize">{activeTab}</span> analytics engine is currently being optimized for release.
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case 'lead':
        return <ReportAnalysis key="lead" forcedTab="lead" leadSubTabProp={leadSubTab} setLeadSubTabProp={setLeadSubTab} />;
      case 'api_analytics':
        return <ReportAnalysis key="api_analytics" forcedTab="lead" leadSubTabProp="api" />;
      case 'remarks':
        return <ReportAnalysis key="remarks" forcedTab="remarks" />;
      case 'track':
        return <TrackReportAnalysis key="track" />;
      case 'attempt':
        return <TrackerRportAnalysis1 key="attempt" forcedGroupBy={leadSubTab === 'hour' ? 'hour' : 'counsellor'} />;
      case 'tracker2':
        return <TrackerReportAnalysis2 key="tracker2" forcedGroupBy={leadSubTab === 'counsellor' ? 'counsellor' : 'slot'} />;
      case 'collegeStatusReports':
        return <CollegeStatusReports key="collegeStatusReports" />;
      case 'counsellorReport':
        return <CounsellorStatsDashboard key="counsellorReport" />;
      case 'formToAdmissions':
        return <FormToAdmissionsReport key="formToAdmissions" />;
      default:
        return <ReportAnalysis key="default" forcedTab="lead" leadSubTabProp={leadSubTab} setLeadSubTabProp={setLeadSubTab} />;
    }
  };

  return (
    <div className="bg-slate-50 p-2 md:px-6 lg:px-8">
      <div className="mx-auto">
        <TabsNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          leadSubTab={leadSubTab}
          setLeadSubTab={setLeadSubTab}
        />

        <div className="transition-all duration-500 ">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em] animate-pulse">Syncing Engine...</p>
            </div>
          }>
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 my-6">
              {renderContent()}
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default MainReport;
