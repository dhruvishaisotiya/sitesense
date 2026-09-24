import React, { useCallback, useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import Navbar from '../components/Navbar';
import DailyLogModal from '../components/DailyLogModal';
import DailyLogDetailsModal from '../components/DailyLogDetailsModal';
import { getProjects } from '../api/projects';
import { getDailyLogs, createDailyLog, updateDailyLog, getDailyLogAnalytics } from '../api/dailylogs';

// Recharts Import
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { ClipboardList, CloudRain, TrendingUp, Percent, IndianRupee, Building2, Hash, Search, Plus, Eye, Edit } from 'lucide-react';

const DailyLogsPage = () => {
  const { role } = useAuth();
  const isEngineer = role === 'SITE_ENGINEER';

  // Data State
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [analytics, setAnalytics] = useState({
    latest_day_number: 0,
    average_attendance_percentage: 0,
    total_rainfall_mm: 0,
    latest_progress_percentage: 0,
    total_budget_used: 0,
    attendance_trend: [],
    rainfall_trend: [],
    progress_trend: [],
    budget_trend: [],
    stage_distribution: [],
  });

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedDayNumber, setSelectedDayNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingLogItem, setEditingLogItem] = useState(null);
  const [viewingLogItem, setViewingLogItem] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await getProjects({ status: 'ACTIVE' });
      setProjects(data.results || data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const fetchDailyLogsAndAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedProjectId) params.project_id = selectedProjectId;
      if (selectedStage) params.construction_stage = selectedStage;
      if (selectedDayNumber) params.day_number = selectedDayNumber;
      if (searchQuery) params.search = searchQuery;

      const [logsData, analyticsData] = await Promise.all([
        getDailyLogs(params),
        getDailyLogAnalytics({ project_id: selectedProjectId })
      ]);

      setLogs(logsData.results || logsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to fetch daily progress data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, selectedStage, selectedDayNumber, searchQuery]);

  useEffect(() => {
    fetchDailyLogsAndAnalytics();
  }, [fetchDailyLogsAndAnalytics]);

  const handleSaveLog = async (payload, logId) => {
    if (logId) {
      await updateDailyLog(logId, payload);
    } else {
      await createDailyLog(payload);
    }
    fetchDailyLogsAndAnalytics();
  };

  return (
    <div className="min-h-screen bg-[#003135] text-white flex flex-col selection:bg-[#0FA4AF] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Daily Site Operations (AI Dataset Engine)
              </h1>
              <span className="text-xs px-3 py-1 rounded-full bg-[#0FA4AF]/20 text-[#0FA4AF] border border-[#0FA4AF]/40 font-bold">
                MODULE 7
              </span>
            </div>
            <p className="text-xs text-[#AFDDE5] mt-1">
              Automates system metrics from Projects, Workers, Attendance, Tasks, & Expenses for AI dataset row generation.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-stretch sm:self-auto">
            {isEngineer && (
              <button
                onClick={() => {
                  setEditingLogItem(null);
                  setIsLogModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white gradient-btn shadow-lg shadow-[#0FA4AF]/20 flex items-center space-x-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Record Today's Progress</span>
              </button>
            )}
          </div>
        </div>

        {/* Top Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-[#024950] text-[#0FA4AF]">
              <Hash className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-[#AFDDE5] font-medium uppercase">Latest Day</p>
              <h3 className="text-xl font-extrabold text-white">Day {analytics.latest_day_number}</h3>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-[#0FA4AF]/20 text-[#0FA4AF] border border-[#0FA4AF]/30">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-[#AFDDE5] font-medium uppercase">Avg Attendance</p>
              <h3 className="text-xl font-extrabold text-[#0FA4AF]">{analytics.average_attendance_percentage}%</h3>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <CloudRain className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-[#AFDDE5] font-medium uppercase">Total Rainfall</p>
              <h3 className="text-xl font-extrabold text-blue-400">{analytics.total_rainfall_mm} <span className="text-xs font-normal">mm</span></h3>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-[#AFDDE5] font-medium uppercase">Overall Progress</p>
              <h3 className="text-xl font-extrabold text-emerald-400">{analytics.latest_progress_percentage}%</h3>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-[#AFDDE5] font-medium uppercase">Budget Used</p>
              <h3 className="text-xl font-extrabold text-amber-300">₹{analytics.total_budget_used.toLocaleString()}</h3>
            </div>
          </div>

        </div>

        {/* Recharts Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Progress & Attendance Trend Chart */}
          <div className="lg:col-span-12 glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#0FA4AF]" />
                Daily Progress (%) & Attendance (%) Trend
              </h3>
              <span className="text-[10px] text-[#AFDDE5] font-mono">AI Dataset Analytics</span>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.progress_trend}>
                  <XAxis dataKey="day_number" stroke="#AFDDE5" fontSize={10} tickLine={false} />
                  <YAxis stroke="#AFDDE5" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#003135', borderColor: '#0FA4AF', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="progress_percentage" name="Overall Progress (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="attendance_percentage" name="Attendance (%)" fill="#0FA4AF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Controls Toolbar */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Project Filter */}
            <div className="flex items-center space-x-2 bg-black/20 px-3 py-2 rounded-xl border border-white/10">
              <Building2 className="w-4 h-4 text-[#0FA4AF]" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-[#003135]">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#003135]">
                    {p.project_code} - {p.project_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stage Filter */}
            <div className="flex items-center space-x-2 bg-black/20 px-3 py-2 rounded-xl border border-white/10">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-[#003135]">All Construction Stages</option>
                <option value="Excavation & Substructure" className="bg-[#003135]">Excavation & Substructure</option>
                <option value="Foundation & Slab Pouring" className="bg-[#003135]">Foundation & Slab Pouring</option>
                <option value="Structural Steel & Superstructure" className="bg-[#003135]">Structural Steel & Superstructure</option>
                <option value="Masonry & External Walls" className="bg-[#003135]">Masonry & External Walls</option>
                <option value="MEP Rough-In" className="bg-[#003135]">MEP Rough-In</option>
                <option value="Interior Finishing" className="bg-[#003135]">Interior Finishing</option>
                <option value="Façade & Cladding" className="bg-[#003135]">Façade & Cladding</option>
                <option value="Landscaping & Handover" className="bg-[#003135]">Landscaping & Handover</option>
              </select>
            </div>

            {/* Day Number Filter */}
            <div className="flex items-center space-x-2 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
              <Hash className="w-4 h-4 text-[#0FA4AF]" />
              <input
                type="number"
                min="1"
                value={selectedDayNumber}
                onChange={(e) => setSelectedDayNumber(e.target.value)}
                placeholder="Day #"
                className="w-16 bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              />
              {selectedDayNumber && (
                <button onClick={() => setSelectedDayNumber('')} className="text-xs text-gray-400 hover:text-white">Clear</button>
              )}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search progress ID, project..."
              className="w-full pl-9 pr-3 py-2 bg-black/20 border border-white/10 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#0FA4AF]"
            />
          </div>

        </div>

        {/* History Table */}
        <div className="glass-panel-light rounded-3xl overflow-hidden shadow-2xl border border-white/80 text-[#003135]">
          {loading ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-10 h-10 border-4 border-[#0FA4AF] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-gray-500">Loading AI Progress Dataset Entries...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <ClipboardList className="w-10 h-10 text-gray-400 mx-auto" />
              <p className="text-sm font-bold text-[#003135]">No Daily Progress Records Found</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Site Engineers can click "Record Today's Progress" to compile metrics for AI dataset training.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#003135] text-[#AFDDE5] uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Progress ID</th>
                    <th className="px-6 py-4">Project & Day #</th>
                    <th className="px-6 py-4">Building Specs</th>
                    <th className="px-6 py-4">Workforce & Attendance</th>
                    <th className="px-6 py-4">Rainfall (mm) & Impact</th>
                    <th className="px-6 py-4">Stage</th>
                    <th className="px-6 py-4">Progress (%)</th>
                    <th className="px-6 py-4">Budget Used (₹)</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white font-medium">
                  {logs.map((log) => {
                    const maxDay = analytics.latest_day_number;
                    const isLatestDay = log.day_number === maxDay;

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono font-bold text-[#0FA4AF] bg-[#0FA4AF]/10 px-2.5 py-1 rounded-md border border-[#0FA4AF]/20">
                            {log.progress_id}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-extrabold text-[#003135]">
                            Day {log.day_number}
                          </span>
                          <p className="text-[10px] font-bold text-gray-500 truncate max-w-[120px]">
                            {log.project_detail?.project_code}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-[#003135]">
                            {log.building_type}
                          </span>
                          <p className="text-[10px] text-gray-400">
                            {log.blocks} Blk | {log.floors} Flr | {Number(log.area_sqft).toLocaleString()} sqft
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-[#003135]">
                            {log.current_workers} Workers
                          </span>
                          <p className="text-[10px] text-emerald-600 font-semibold">
                            {log.attendance_percentage}% Attendance
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-blue-600">
                            {log.rainfall_mm} mm
                          </span>
                          <p className="text-[10px] font-semibold">
                            Affected: {log.rain_affected_work ? <span className="text-red-500">YES</span> : <span className="text-emerald-600">NO</span>}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-xs text-[#003135]">
                            {log.construction_stage}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-extrabold text-emerald-600 text-sm">
                            {log.progress_percentage}%
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-extrabold text-amber-600">
                            ₹{Number(log.budget_used).toLocaleString()}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setViewingLogItem(log);
                              setIsDetailsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#0FA4AF] hover:text-white text-gray-600 transition-colors cursor-pointer"
                            title="View AI Dataset Record"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isEngineer && isLatestDay && (
                            <button
                              onClick={() => {
                                setEditingLogItem(log);
                                setIsLogModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-500 hover:text-white text-amber-700 transition-colors cursor-pointer"
                              title="Edit Latest Entry"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Daily Progress Log Modal */}
      <DailyLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSave={handleSaveLog}
        logItem={editingLogItem}
      />

      {/* Daily Progress Details Drawer */}
      <DailyLogDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        logItem={viewingLogItem}
      />
    </div>
  );
};

export default DailyLogsPage;
