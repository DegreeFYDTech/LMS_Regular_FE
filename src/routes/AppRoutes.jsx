import React, { lazy, Suspense } from 'react';
import { Routes, Route } from "react-router-dom";

import { PrivateRoute, PublicRoute, RoleBasedRoute } from "../routes/ProtectedRoutes";
import AuthChecker from "../components/AuthChecker";

const Loader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
  </div>
);

const MainLayout = lazy(() => import("../layouts/MainLayout"));

const Login = lazy(() => import("../components/Login"));
const Home = lazy(() => import("../pages/Home"));
const StudentPage = lazy(() => import("../pages/StudentPage"));
const MainReport = lazy(() => import("../pages/MainReport"));

const ScoreBoard = lazy(() => import("../pages/ScoreBoard"));
const LeadAssignmentL2 = lazy(() => import("../pages/LeadAssignmentL2"));
const LeadAssignmentL3 = lazy(() => import("../pages/LeadAssignmentL3"));
const CounsellorListing = lazy(() => import("../pages/CounsellorListing"));
const AddCounsellor = lazy(() => import("../pages/AddCounsellor"));
const ManageTemplates = lazy(() => import("../pages/ManageTemplates"));
const BulkUpload = lazy(() => import("../pages/BulkUpload"));
const CounsellorBreakDashboard = lazy(() => import("../pages/counsellor_break_activities"));
const NotFoundPage = lazy(() => import("../components/404 Page Not Found/Main"));
const ManageCourses = lazy(() => import('../pages/ManageCourses'));
const WebsiteChatDashboard = lazy(() => import('../components/chat/WebsiteChatDashboard'));
const TrackerReportAnalysis3 = lazy(() => import('../pages/TrackerReportAnalysis3'));
const AnalyserBucket = lazy(() => import('../pages/AnalyserBucket'));
const CollegeBrochure = lazy(() => import('../pages/CollegeBrochure'));
const ManageNILeads = lazy(() => import('../pages/ManageNILeads'));
const Tracker4 = lazy(() => import('../components/ReportAnalysis/Tracker4'));
const ReconRuleset = lazy(() => import('../pages/ReconRuleset'));
const RuleSetDB = lazy(() => import('../pages/RuleSetDB'));

const AppRoutes = () => {
  return (
    <>
      <AuthChecker />

      <Suspense fallback={<Loader />}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          <Route element={<PrivateRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<RoleBasedRoute allowedRoles={["Supervisor", "l2", "l3", "Analyser", "to"]}><Home /></RoleBasedRoute>} />
              <Route path="/student/:studentId" element={<RoleBasedRoute allowedRoles={["Supervisor", "l2", "l3", "Analyser", "to"]}><StudentPage /></RoleBasedRoute>} />
              <Route path="/scroreboard" element={<RoleBasedRoute allowedRoles={["Supervisor", "to"]}><ScoreBoard /></RoleBasedRoute>} />
              <Route path="/managenileads" element={<RoleBasedRoute allowedRoles={["Supervisor"]}><ManageNILeads /></RoleBasedRoute>} />

              {/* Unified Report Route - Added "to" role */}
              <Route path="/analysisreport" element={<RoleBasedRoute allowedRoles={["Supervisor", "Analyser", "to"]}><MainReport /></RoleBasedRoute>} />
              <Route path="/analysisreportni" element={<RoleBasedRoute allowedRoles={["Supervisor", "Analyser", "to"]}><Tracker4 /></RoleBasedRoute>} />
              <Route path="/college-brochure" element={<CollegeBrochure />} />
              <Route path="/college-brochure/:universityName" element={<CollegeBrochure />} />

              <Route path="/counsellors-break-dashboard" element={<RoleBasedRoute allowedRoles={["Supervisor", "to"]}><CounsellorBreakDashboard /></RoleBasedRoute>} />
              <Route path="/counsellorslisting" element={<RoleBasedRoute allowedRoles={["Supervisor", "to"]}><CounsellorListing /></RoleBasedRoute>} />
              <Route path="/addcounsellor" element={<RoleBasedRoute allowedRoles={["Supervisor", "to"]}><AddCounsellor /></RoleBasedRoute>} />
              <Route path="/leadassignmentl2" element={<RoleBasedRoute allowedRoles={["Supervisor"]}><LeadAssignmentL2 /></RoleBasedRoute>} />
              <Route path="/leadassignmentl3" element={<RoleBasedRoute allowedRoles={["Supervisor"]}><LeadAssignmentL3 /></RoleBasedRoute>} />
              <Route path="/reconRuleset" element={<RoleBasedRoute allowedRoles={["Supervisor"]}><ReconRuleset /></RoleBasedRoute>} />
              <Route path="/manangetemplates" element={<RoleBasedRoute allowedRoles={["Supervisor"]}><ManageTemplates /></RoleBasedRoute>} />
              <Route path="/bulkupload" element={<RoleBasedRoute allowedRoles={["Supervisor"]}><BulkUpload /></RoleBasedRoute>} />

              <Route path="/manageCourses" element={<RoleBasedRoute allowedRoles={["Supervisor"]}><ManageCourses /></RoleBasedRoute>} />
              <Route path="/website-chat" element={<RoleBasedRoute allowedRoles={["Supervisor", "l2", "l3", "Analyser", "to"]}><WebsiteChatDashboard /></RoleBasedRoute>} />

              <Route path="/analyserbucket" element={<RoleBasedRoute allowedRoles={["Supervisor"]}><AnalyserBucket /></RoleBasedRoute>} />
              <Route path="/rulesetdb" element={<RoleBasedRoute allowedRoles={["Supervisor"]}><RuleSetDB /></RoleBasedRoute>} />

            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default AppRoutes;