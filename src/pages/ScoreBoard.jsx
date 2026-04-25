
import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Users, FileText, MessageSquare, Crown, Medal, Award, Star, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { FetchScoreBoardStats } from '../network/ScoreBoard';
const ScoreBoard = () => {
  const [activeTab, setActiveTab] = useState('L2');
  const [leaderboardData, setLeaderboardData] = useState({ L2: [], L3: [] });
  // const [summaryStats, setSummaryStats] = useState({});
  const [weekInfo, setWeekInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch leaderboard data from API
  const fetchLeaderboardData = async (level = null, week = null, year = null) => {
    try {
      setLoading(true);
      setError(null);

      const result = await FetchScoreBoardStats(level, week, year);

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch data');
      }

      const { data } = result;

      // Update state with fetched data
      if (level) {
        setLeaderboardData(prev => ({
          ...prev,
          [level.toUpperCase()]: data.leaderboard || []
        }));
      } else {
        setLeaderboardData({
          L2: data.leaderboard.L2 || [],
          L3: data.leaderboard.L3 || []
        });
      }

      // setSummaryStats(data.summary || {});
      setWeekInfo(data.week || {});

    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  // Initial data fetch
  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  // Fetch data when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // You can optionally fetch specific level data here
    // fetchLeaderboardData(tab);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchLeaderboardData();
  };

  // Get current data for active tab
  const currentData = leaderboardData[activeTab] || [];
  const sortedData = [...currentData].sort((a, b) => b.totalPoints - a.totalPoints);
  const topPerformer = sortedData[0];

  // Calculate stats for current tab
  const currentStats = sortedData.reduce((acc, c) => ({
    counsellors: acc.counsellors + 1,
    forms: acc.forms + c.formsCompleted,
    remarks: acc.remarks + c.totalRemarks,
    avgEfficiency: acc.avgEfficiency + c.efficiency
  }), { counsellors: 0, forms: 0, remarks: 0, avgEfficiency: 0 });

  const getRankBadge = (index) => {
    const badges = ['🥇', '🥈', '🥉'];
    return badges[index] || `#${index + 1}`;
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className={`relative overflow-hidden rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-xl bg-gradient-to-br ${color}`}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <Icon className="w-8 h-8 text-white/90" />
          {trend && <div className={`text-xs px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>}
        </div>
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <div className="text-white/80 text-sm font-medium">{title}</div>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-xl font-semibold text-slate-700">Loading leaderboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <h2 className="text-xl font-bold text-slate-800">Error Loading Data</h2>
          </div>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 animate-fadeIn">
      <div className="p-6 mx-auto">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
          <div className="flex items-center gap-4 mb-4 lg:mb-0">
            <div className="relative">
              <Trophy className="w-12 h-12 text-yellow-500 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-white text-xs font-bold">!</span>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
                Performance Dashboard
              </h1>
              <p className="text-slate-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Week {weekInfo.weekNumber || 'Current'} • {weekInfo.year || new Date().getFullYear()} • Live Rankings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200 shadow-lg hover:bg-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Level Tabs */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-slate-200 shadow-lg">
              {['L2', 'L3'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === tab
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                    : 'text-slate-600 hover:bg-white/80'
                    }`}
                >
                  Level {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performer Spotlight */}
        {topPerformer && (
          <div className="mb-8 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-3xl p-8 text-white relative overflow-hidden animate-slideInUp">
            <div className="relative z-10 flex items-center gap-6">
              <div className="text-6xl animate-bounce">👑</div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">Top Performer</h2>
                <p className="text-xl mb-1">{topPerformer.name}</p>
                <p className="text-white/90">{topPerformer.totalPoints.toLocaleString()} points • {topPerformer.efficiency}% efficiency</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold animate-pulse">{topPerformer.badge}</div>
                <div className="text-white/90">{topPerformer.streak} day streak</div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Counsellors"
            value={currentStats.counsellors}
            icon={Users}
            color="from-blue-500 to-cyan-500"
            trend={5}
          />
          <StatCard
            title="Forms Completed"
            value={currentStats.forms}
            icon={FileText}
            color="from-green-500 to-emerald-500"
            trend={12}
          />
          <StatCard
            title="Total Remarks"
            value={currentStats.remarks}
            icon={MessageSquare}
            color="from-purple-500 to-pink-500"
            trend={8}
          />
          <StatCard
            title="Avg Efficiency"
            value={currentStats.counsellors > 0 ? `${Math.round(currentStats.avgEfficiency / currentStats.counsellors)}%` : '0%'}
            icon={Star}
            color="from-orange-500 to-red-500"
            trend={3}
          />
        </div>

        {/* No Data Message */}
        {sortedData.length === 0 ? (
          <div className="bg-white/90 rounded-3xl p-12 text-center border border-slate-200">
            <Trophy className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-600 mb-2">No Data Available</h3>
            <p className="text-slate-500">No counsellor data found for Level {activeTab} this week.</p>
          </div>
        ) : (

          /* Leaderboard Table */
          <div className="bg-white/90 rounded-3xl overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-slate-800 to-blue-800 px-6 py-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Trophy className="w-7 h-7 text-yellow-400" />
                Level {activeTab} Leaderboard ({sortedData.length} counsellors)
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Counsellor</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">Forms</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">Remarks</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">Efficiency</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">Trend</th>
                    {/* <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">Streak</th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedData.map((counsellor, index) => (
                    <tr
                      key={counsellor.counsellorId}
                      className={`transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-lg ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-amber-50' :
                        index === 1 ? 'bg-gradient-to-r from-gray-50 to-slate-50' :
                          index === 2 ? 'bg-gradient-to-r from-orange-50 to-amber-50' :
                            'hover:bg-slate-50'
                        }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* Rank */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                            index === 1 ? 'bg-gradient-to-br from-gray-400 to-slate-500 text-white' :
                              index === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white' :
                                'bg-gradient-to-br from-slate-500 to-gray-500 text-white'
                            }`}>
                            {getRankBadge(index)}
                          </div>
                        </div>
                      </td>

                      {/* Counsellor */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                              <span className="text-sm font-bold text-white">{counsellor.avatar}</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 text-sm">{counsellor.badge}</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-slate-800">{counsellor.name}</div>
                            {/* {counsellor.streak > 3 && (
                            <div className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full font-bold inline-block">
                              {counsellor.streak} day streak 🔥
                            </div>
                          )} */}
                          </div>
                        </div>
                      </td>

                      {/* Points */}
                      <td className="px-6 py-4 text-center">
                        <div className="text-xl font-bold text-blue-700">
                          {counsellor.totalPoints.toLocaleString()}
                        </div>
                      </td>

                      {/* Forms */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                          <span className="text-lg font-bold text-green-700">{counsellor.formsCompleted}</span>
                        </div>
                      </td>

                      {/* Remarks */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                          <span className="text-lg font-bold text-purple-700">{counsellor.totalRemarks}</span>
                        </div>
                      </td>

                      {/* Efficiency */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-lg font-bold text-slate-700">{counsellor.efficiency}%</span>
                          </div>
                          <div className="w-16 bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${counsellor.efficiency}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Trend */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {counsellor.trend === 'up' ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <TrendingUp className="w-5 h-5" />
                              <span className="text-sm font-semibold">Rising</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-600">
                              <TrendingDown className="w-5 h-5" />
                              <span className="text-sm font-semibold">Falling</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Streak */}
                      {/* <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl font-bold ${
                        counsellor.streak > 5 ? 'bg-gradient-to-br from-red-100 to-orange-100 text-red-700' :
                        counsellor.streak > 3 ? 'bg-gradient-to-br from-orange-100 to-yellow-100 text-orange-700' :
                        'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700'
                      }`}>
                        {counsellor.streak}
                      </div>
                    </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
        
        .animate-slideInUp {
          animation: slideInUp 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ScoreBoard;