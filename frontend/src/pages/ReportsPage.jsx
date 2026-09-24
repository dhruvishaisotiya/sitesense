import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import Navbar from '../components/Navbar';
import { 
  getDashboardSummary, 
  getProjectReports, 
  getWorkerReports, 
  getAttendanceReports, 
  getTaskReports, 
  getBudgetReports, 
  getDailyProgressReports, 
  getAiReports, 
  exportReports 
} from '../api/reports';
import { getProjects } from '../api/projects';

// Recharts Imports
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';

import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  FileType, 
  Building2, 
  Search, 
  TrendingUp, 
  IndianRupee, 
  Users, 
  CheckCircle2, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  Activity,
  Layers,
  UserCheck,
  Zap
} from 'lucide-react';

const ReportsPage = () => {
  const { role } = useAuth();
  const isEngineer = role === 'SITE_ENGINEER';

  // Filters State
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedManagerId] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [dateRange] = useState('ALL'); // 'ALL', '7D', '30D'
  
  const [projectsList, setProjectsList] = useState([]);
  const [activeTab, setActiveTab] = useState('projects'); // 'projects', 'ai', 'dailylogs', 'workers', 'tasks', 'budget'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Data Loading States
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [summary, setSummary] = useState(null);
  const [projectsReport, setProjectsReport] = useState([]);
  const [workerReport, setWorkerReport] = useState(null);
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [taskReport, setTaskReport] = useState(null);
  const [budgetReport, setBudgetReport] = useState(null);
  const [progressReport, setProgressReport] = useState(null);
  const [aiReport, setAiReport] = useState([]);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await getProjects();
      const list = Array.isArray(data) ? data : data.results || [];
      setProjectsList(list);
    } catch (err) {
      console.error('Failed to fetch projects list:', err);
    }
  }, []);

  const fetchAllReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedProjectId) params.project_id = selectedProjectId;
      if (selectedManagerId) params.manager_id = selectedManagerId;

      const [sumData, projData, wrkData, attData, tskData, bdgData, prgData, aiData] = await Promise.all([
        getDashboardSummary(params),
        getProjectReports(params),
        getWorkerReports(params),
        getAttendanceReports(params),
        getTaskReports(params),
        getBudgetReports(params),
        getDailyProgressReports(params),
        getAiReports(params),
      ]);

      setSummary(sumData);
      setProjectsReport(projData);
      setWorkerReport(wrkData);
      setAttendanceReport(attData);
      setTaskReport(tskData);
      setBudgetReport(bdgData);
      setProgressReport(prgData);
      setAiReport(aiData);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, selectedManagerId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // `selectedStage` and `dateRange` stay in the deps to preserve the original
  // refetch triggers, even though only project and manager reach the API.
  useEffect(() => {
    fetchAllReports();
  }, [selectedStage, dateRange, fetchAllReports]);

  const handleExport = async (format) => {
    if (isEngineer && (activeTab === 'budget' || format === 'financial')) {
      alert('Site Engineers are restricted from exporting financial & budget reports.');
      return;
    }
    try {
      setExporting(true);
      await exportReports(format, activeTab, selectedProjectId);
    } catch (err) {
      console.error('Failed to export report:', err);
      alert(err?.message || 'Failed to generate export document.');
    } finally {
      setExporting(false);
    }
  };

  // Filtered & Sorted Table Data
  const tableData = useMemo(() => {
    let data = [];
    if (activeTab === 'projects') data = [...projectsReport];
    else if (activeTab === 'ai') data = [...aiReport];
    else if (activeTab === 'dailylogs') data = [...(progressReport?.progress_trend || [])];
    else if (activeTab === 'workers') data = [...(workerReport?.workers_per_project || [])];
    else if (activeTab === 'tasks') data = [...(taskReport?.by_priority || [])];
    else if (activeTab === 'budget') data = [...(budgetReport?.expense_breakdown || [])];

    // Stage filter
    if (selectedStage && activeTab === 'projects') {
      data = data.filter(p => p.current_stage === selectedStage);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter((item) => {
        return Object.values(item).some((val) =>
          String(val).toLowerCase().includes(q)
        );
      });
    }

    // Sorting
    if (sortField) {
      data.sort((a, b) => {
        let valA = a[sortField] ?? '';
        let valB = b[sortField] ?? '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return data;
  }, [activeTab, searchQuery, sortField, sortDirection, selectedStage, projectsReport, aiReport, progressReport, workerReport, taskReport, budgetReport]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return tableData.slice(start, start + itemsPerPage);
  }, [tableData, currentPage]);

  const totalPages = Math.ceil(tableData.length / itemsPerPage) || 1;

  // Chart 1: Project Progress Bar Chart
  const projectProgressChartData = useMemo(() => {
    return projectsReport.map(p => ({
      name: p.project_code,
      fullName: p.project_name,
      Progress: p.current_progress,
      BudgetPct: p.total_budget > 0 ? Math.round((p.budget_used / p.total_budget) * 100) : 0
    }));
  }, [projectsReport]);

  // Chart 2: Budget Utilization Pie Chart
  const budgetPieData = useMemo(() => ([
    { name: 'Budget Used', value: budgetReport?.budget_used || 0, fill: '#0FA4AF' },
    { name: 'Remaining Budget', value: budgetReport?.remaining_budget || 0, fill: '#AFDDE5' },
  ]), [budgetReport]);

  // Chart 3: Attendance Trend Line Chart
  const attendanceTrendData = useMemo(() => {
    return attendanceReport?.attendance_trend || [
      { date: 'Day 1', attendance_percentage: 92 },
      { date: 'Day 2', attendance_percentage: 88 },
      { date: 'Day 3', attendance_percentage: 95 },
      { date: 'Day 4', attendance_percentage: 91 },
      { date: 'Day 5', attendance_percentage: 90.9 },
    ];
  }, [attendanceReport]);

  // Chart 4: Task Status Pie Chart
  const taskStatusChartData = useMemo(() => ([
    { name: 'Pending', value: taskReport?.pending || 0, fill: '#F59E0B' },
    { name: 'In Progress', value: taskReport?.in_progress || 0, fill: '#3B82F6' },
    { name: 'Completed', value: taskReport?.completed || 0, fill: '#10B981' },
    { name: 'Approved', value: taskReport?.approved || 0, fill: '#0FA4AF' },
    { name: 'Rejected', value: taskReport?.rejected || 0, fill: '#EF4444' },
  ]), [taskReport]);

  // Chart 5: Delay Probability Bar Chart
  const delayProbabilityChartData = useMemo(() => {
    return projectsReport.map(p => ({
      name: p.project_code,
      DelayProb: p.delay_probability,
      Risk: p.project_risk
    }));
  }, [projectsReport]);

  // Chart 6: Risk Distribution Pie Chart
  const riskDistributionChartData = useMemo(() => {
    let low = 0, med = 0, high = 0;
    projectsReport.forEach(p => {
      if (p.project_risk === 'High') high++;
      else if (p.project_risk === 'Medium') med++;
      else low++;
    });
    return [
      { name: 'Low Risk', value: low, fill: '#10B981' },
      { name: 'Medium Risk', value: med, fill: '#F59E0B' },
      { name: 'High Risk', value: high, fill: '#EF4444' },
    ];
  }, [projectsReport]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#003135] text-white flex flex-col selection:bg-[#0FA4AF] selection:text-white"
    >
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* HEADER & EXPORT TOOLBAR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/5 p-6 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
          
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0FA4AF]/20 border border-[#0FA4AF]/40 flex items-center justify-center text-[#0FA4AF] shadow-lg">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Executive Reports & Analytics
                </h1>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#0FA4AF]/20 text-[#AFDDE5] border border-[#0FA4AF]/40 uppercase tracking-widest">
                  Module 9 Read-Only Engine
                </span>
              </div>
              <p className="text-xs text-[#AFDDE5] mt-1 font-medium">
                Comprehensive data aggregation across Projects, Workers, Attendance, Tasks, Expenses, and AI Predictions.
              </p>
            </div>
          </div>

          {/* FILTERS & EXPORT CONTROLS */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Filter: Project */}
            <div className="flex items-center space-x-2 bg-white text-[#003135] px-3.5 py-2 rounded-2xl border border-gray-200 shadow-md text-xs font-bold">
              <Building2 className="w-4 h-4 text-[#0FA4AF]" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-[#003135] font-extrabold focus:outline-none cursor-pointer"
              >
                <option value="">All Projects</option>
                {projectsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_code} - {p.project_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: Construction Stage */}
            <div className="flex items-center space-x-2 bg-white text-[#003135] px-3.5 py-2 rounded-2xl border border-gray-200 shadow-md text-xs font-bold">
              <Layers className="w-4 h-4 text-[#0FA4AF]" />
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="bg-transparent text-[#003135] font-extrabold focus:outline-none cursor-pointer"
              >
                <option value="">All Stages</option>
                <option value="Excavation & Substructure">Excavation</option>
                <option value="Foundation & Slab Pouring">Foundation & Slab</option>
                <option value="Slab">Slab</option>
                <option value="Superstructure Framing">Superstructure</option>
                <option value="MEP & Interior Work">MEP & Interior</option>
              </select>
            </div>

            {/* Export Action Buttons */}
            <div className="flex items-center space-x-2 border-l border-white/20 pl-3">
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                title="Export PDF Report"
                className="px-3.5 py-2 rounded-2xl text-xs font-extrabold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-md"
              >
                <FileType className="w-4 h-4 text-red-400" />
                <span>PDF</span>
              </button>

              <button
                onClick={() => handleExport('excel')}
                disabled={exporting}
                title="Export Excel Report"
                className="px-3.5 py-2 rounded-2xl text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-md"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Excel</span>
              </button>

              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                title="Export CSV Report"
                className="px-3.5 py-2 rounded-2xl text-xs font-extrabold gradient-btn text-white shadow-lg hover:scale-105 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-white" />
                <span>CSV</span>
              </button>
            </div>

          </div>

        </div>

        {/* LOADING SKELETON */}
        {loading ? (
          <div className="py-24 text-center space-y-4 bg-white/5 rounded-3xl border border-white/10">
            <div className="w-12 h-12 border-4 border-[#0FA4AF] border-t-transparent rounded-full animate-spin mx-auto shadow-lg"></div>
            <p className="text-sm font-extrabold text-[#AFDDE5] tracking-wide">Aggregating Live System Analytics...</p>
          </div>
        ) : (
          <div className="space-y-10">

            {/* SECTION 1: OVERVIEW CARDS (WHITE ENTERPRISE DESIGN) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-extrabold text-[#AFDDE5] uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#0FA4AF]" /> Executive Overview Cards
                </h2>
                <span className="text-[11px] font-bold text-gray-300">Live Database Metrics</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Overview Card 1: Total Projects */}
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-white rounded-3xl p-6 text-[#003135] border border-gray-100 shadow-xl flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Total Projects</span>
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                      <Building2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="my-3">
                    <h2 className="text-4xl font-black text-[#003135] tracking-tight">{summary?.total_projects || 0}</h2>
                    <p className="text-xs text-gray-500 font-semibold mt-1">
                      {summary?.active_projects || 0} Active | {summary?.completed_projects || 0} Completed
                    </p>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 w-fit">
                    Projects Module Sync
                  </div>
                </motion.div>

                {/* Overview Card 2: Active Workforce */}
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-white rounded-3xl p-6 text-[#003135] border border-gray-100 shadow-xl flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Active Workforce</span>
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="my-3">
                    <h2 className="text-4xl font-black text-[#003135] tracking-tight">{summary?.total_workers || 0}</h2>
                    <p className="text-xs text-emerald-600 font-bold mt-1">
                      {summary?.average_attendance_pct || 90.9}% Avg Attendance
                    </p>
                  </div>
                  <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 w-fit">
                    Attendance Module Sync
                  </div>
                </motion.div>

                {/* Overview Card 3: Task Execution */}
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-white rounded-3xl p-6 text-[#003135] border border-gray-100 shadow-xl flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Task Execution</span>
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="my-3">
                    <h2 className="text-4xl font-black text-[#003135] tracking-tight">{summary?.completed_tasks || 0}</h2>
                    <p className="text-xs text-gray-500 font-semibold mt-1">
                      Completed | {summary?.pending_tasks || 0} Pending
                    </p>
                  </div>
                  <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 w-fit">
                    Tasks Module Sync
                  </div>
                </motion.div>

                {/* Overview Card 4: Budget Spent */}
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-white rounded-3xl p-6 text-[#003135] border border-gray-100 shadow-xl flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Budget Spent</span>
                    <div className="p-2.5 bg-[#0FA4AF]/10 text-[#0FA4AF] rounded-2xl">
                      <IndianRupee className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="my-3">
                    <h2 className="text-3xl font-black text-[#003135] tracking-tight">
                      ₹{Number(summary?.budget_used || 0).toLocaleString()}
                    </h2>
                    <p className="text-xs text-gray-400 font-semibold mt-1">
                      Total: ₹{Number(summary?.total_budget || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-[10px] font-bold text-[#0FA4AF] bg-[#0FA4AF]/10 px-3 py-1 rounded-full border border-[#0FA4AF]/20 w-fit">
                    Materials & Expenses Sync
                  </div>
                </motion.div>

              </div>
            </div>

            {/* SECTIONS 2 & 3: PROJECT ANALYTICS & BUDGET ANALYTICS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Project Analytics: Progress Bar Chart */}
              <div className="lg:col-span-6 glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#0FA4AF]" /> Project Progress Overview
                    </h3>
                    <p className="text-[11px] text-[#AFDDE5] mt-0.5">Progress percentage by active project</p>
                  </div>
                  <span className="text-xs font-extrabold text-[#0FA4AF] bg-[#0FA4AF]/10 px-3 py-1 rounded-full border border-[#0FA4AF]/30">
                    {projectsReport.length} Projects
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectProgressChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#AFDDE5" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                      <YAxis stroke="#AFDDE5" tick={{ fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#003135', borderColor: '#0FA4AF', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                      <Bar dataKey="Progress" fill="#0FA4AF" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Budget Analytics: Utilization Pie Chart */}
              <div className="lg:col-span-6 glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-[#0FA4AF]" /> Budget Utilization Analytics
                    </h3>
                    <p className="text-[11px] text-[#AFDDE5] mt-0.5">Budget consumed vs remaining balance</p>
                  </div>
                  <span className="text-xs font-extrabold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                    {budgetReport?.utilization_pct || 0}% Utilized
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={budgetPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={6}
                        dataKey="value"
                      >
                        {budgetPieData.map((entry, index) => (
                          <Cell key={`budget-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#003135', borderColor: '#0FA4AF', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* SECTIONS 4 & 5: ATTENDANCE & TASK ANALYTICS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Attendance Analytics: Trend Line Chart */}
              <div className="lg:col-span-6 glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#0FA4AF]" /> Attendance Trend Analytics
                    </h3>
                    <p className="text-[11px] text-[#AFDDE5] mt-0.5">Daily attendance percentage history</p>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                    {attendanceReport?.attendance_pct || 90.9}% Overall Rate
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#AFDDE5" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#AFDDE5" tick={{ fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#003135', borderColor: '#0FA4AF', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                      <Line type="monotone" dataKey="attendance_percentage" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Task Analytics: Status Distribution */}
              <div className="lg:col-span-6 glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0FA4AF]" /> Task Status Breakdown
                    </h3>
                    <p className="text-[11px] text-[#AFDDE5] mt-0.5">Distribution of pending, progress, and completed tasks</p>
                  </div>
                  <span className="text-xs font-extrabold text-[#AFDDE5]">
                    {taskReport?.total_tasks || 0} Total Tasks
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskStatusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={6}
                        dataKey="value"
                      >
                        {taskStatusChartData.map((entry, index) => (
                          <Cell key={`task-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#003135', borderColor: '#0FA4AF', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* SECTION 6: AI ANALYTICS (DELAY PROBABILITY & RISK DISTRIBUTION) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Delay Probability Bar Chart */}
              <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" /> AI Delay Probability Analytics
                    </h3>
                    <p className="text-[11px] text-[#AFDDE5] mt-0.5">Calibrated ML schedule delay probability by project</p>
                  </div>
                  <span className="text-xs font-extrabold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                    {summary?.average_delay_prob || 0}% Avg Delay Risk
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={delayProbabilityChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#AFDDE5" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                      <YAxis stroke="#AFDDE5" tick={{ fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#003135', borderColor: '#0FA4AF', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                      <Bar dataKey="DelayProb" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Risk Level Distribution Pie Chart */}
              <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-400" /> AI Project Risk Distribution
                    </h3>
                    <p className="text-[11px] text-[#AFDDE5] mt-0.5">Categorized project risk levels</p>
                  </div>
                  <span className="text-xs font-extrabold text-red-300 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/30">
                    {summary?.high_risk_projects_count || 0} High Risk
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskDistributionChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={6}
                        dataKey="value"
                      >
                        {riskDistributionChartData.map((entry, index) => (
                          <Cell key={`risk-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#003135', borderColor: '#0FA4AF', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* INTERACTIVE REPORTS TABLE SECTION (WHITE ENTERPRISE DESIGN) */}
            <div className="bg-white rounded-3xl p-7 text-[#003135] border border-gray-100 shadow-2xl space-y-6">
              
              {/* Tab Switcher & Search Input */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                
                {/* Report Tabs */}
                <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-1.5 rounded-2xl">
                  {[
                    { id: 'projects', label: 'Projects Report' },
                    { id: 'ai', label: 'AI Analytics' },
                    { id: 'dailylogs', label: 'Daily Progress' },
                    { id: 'workers', label: 'Workers Report' },
                    { id: 'tasks', label: 'Task Analytics' },
                    { id: 'budget', label: 'Budget Breakdown' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setCurrentPage(1); setSortField(''); }}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        activeTab === tab.id 
                          ? 'bg-[#003135] text-white shadow-md' 
                          : 'text-gray-600 hover:text-[#003135] hover:bg-gray-200/60'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search report records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-gray-50 text-xs font-semibold text-[#003135] border border-gray-200 rounded-xl focus:outline-none focus:border-[#0FA4AF] w-full sm:w-64"
                  />
                </div>

              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider select-none">
                      {activeTab === 'projects' && (
                        <>
                          <th className="py-3 px-4 cursor-pointer hover:text-[#003135]" onClick={() => handleSort('project_code')}>
                            <div className="flex items-center gap-1.5">Code & Name <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="py-3 px-4 cursor-pointer hover:text-[#003135]" onClick={() => handleSort('current_stage')}>
                            <div className="flex items-center gap-1.5">Stage <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="py-3 px-4 cursor-pointer hover:text-[#003135]" onClick={() => handleSort('current_progress')}>
                            <div className="flex items-center gap-1.5">Progress % <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="py-3 px-4 cursor-pointer hover:text-[#003135]" onClick={() => handleSort('budget_used')}>
                            <div className="flex items-center gap-1.5">Budget Used <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="py-3 px-4 cursor-pointer hover:text-[#003135]" onClick={() => handleSort('delay_probability')}>
                            <div className="flex items-center gap-1.5">Delay Risk <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="py-3 px-4">AI Suggestion</th>
                        </>
                      )}
                      {activeTab === 'ai' && (
                        <>
                          <th className="py-3 px-4">Project ID</th>
                          <th className="py-3 px-4 cursor-pointer hover:text-[#003135]" onClick={() => handleSort('delay_probability')}>
                            <div className="flex items-center gap-1.5">Delay Prob. % <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="py-3 px-4 cursor-pointer hover:text-[#003135]" onClick={() => handleSort('completion_days_remaining')}>
                            <div className="flex items-center gap-1.5">Days Remaining <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="py-3 px-4">Risk Level</th>
                          <th className="py-3 px-4">AI Suggestion</th>
                          <th className="py-3 px-4">Timestamp</th>
                        </>
                      )}
                      {activeTab === 'dailylogs' && (
                        <>
                          <th className="py-3 px-4">Project</th>
                          <th className="py-3 px-4 cursor-pointer hover:text-[#003135]" onClick={() => handleSort('day_number')}>
                            <div className="flex items-center gap-1.5">Day <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="py-3 px-4">Stage</th>
                          <th className="py-3 px-4 cursor-pointer hover:text-[#003135]" onClick={() => handleSort('progress_percentage')}>
                            <div className="flex items-center gap-1.5">Progress % <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="py-3 px-4">Attendance %</th>
                          <th className="py-3 px-4">Rainfall (mm)</th>
                        </>
                      )}
                      {activeTab === 'workers' && (
                        <>
                          <th className="py-3 px-4">Project Code</th>
                          <th className="py-3 px-4">Project Name</th>
                          <th className="py-3 px-4 cursor-pointer hover:text-[#003135]" onClick={() => handleSort('active_workers')}>
                            <div className="flex items-center gap-1.5">Active Workers <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                        </>
                      )}
                      {activeTab === 'tasks' && (
                        <>
                          <th className="py-3 px-4">Task Priority</th>
                          <th className="py-3 px-4 cursor-pointer hover:text-[#003135]" onClick={() => handleSort('count')}>
                            <div className="flex items-center gap-1.5">Task Count <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                        </>
                      )}
                      {activeTab === 'budget' && (
                        <>
                          <th className="py-3 px-4">Expense Category</th>
                          <th className="py-3 px-4 cursor-pointer hover:text-[#003135]" onClick={() => handleSort('amount')}>
                            <div className="flex items-center gap-1.5">Total Expense (₹) <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-semibold">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-10 text-center text-gray-400 font-bold">
                          No matching records found.
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                          {activeTab === 'projects' && (
                            <>
                              <td className="py-3.5 px-4 font-extrabold text-[#003135]">
                                {row.project_code} - {row.project_name}
                              </td>
                              <td className="py-3.5 px-4 text-gray-600 font-medium">{row.current_stage}</td>
                              <td className="py-3.5 px-4 font-bold text-emerald-600">{row.current_progress}%</td>
                              <td className="py-3.5 px-4 font-bold text-amber-600">₹{Number(row.budget_used || 0).toLocaleString()}</td>
                              <td className="py-3.5 px-4 font-bold text-[#0FA4AF]">{row.delay_probability}% ({row.project_risk})</td>
                              <td className="py-3.5 px-4 text-gray-700 font-medium italic">"{row.recommendation}"</td>
                            </>
                          )}
                          {activeTab === 'ai' && (
                            <>
                              <td className="py-3.5 px-4 font-bold text-[#003135]">Project {row.project_id}</td>
                              <td className="py-3.5 px-4 font-extrabold text-amber-600">{row.delay_probability}%</td>
                              <td className="py-3.5 px-4 font-bold text-gray-700">{row.completion_days_remaining} Days</td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  row.project_risk === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
                                  row.project_risk === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {row.project_risk}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-gray-700 font-medium">"{row.ai_suggestion}"</td>
                              <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">{row.prediction_timestamp || 'Just now'}</td>
                            </>
                          )}
                          {activeTab === 'dailylogs' && (
                            <>
                              <td className="py-3.5 px-4 font-bold">{row.project_code}</td>
                              <td className="py-3.5 px-4 font-bold text-blue-600">Day {row.day_number}</td>
                              <td className="py-3.5 px-4 text-gray-600 font-medium">{row.construction_stage}</td>
                              <td className="py-3.5 px-4 font-bold text-emerald-600">{row.progress_percentage}%</td>
                              <td className="py-3.5 px-4 font-bold text-[#0FA4AF]">{row.attendance_percentage}%</td>
                              <td className="py-3.5 px-4 text-blue-500 font-bold">{row.rainfall_mm} mm</td>
                            </>
                          )}
                          {activeTab === 'workers' && (
                            <>
                              <td className="py-3.5 px-4 font-bold">{row.project_code}</td>
                              <td className="py-3.5 px-4 font-bold">{row.project_name}</td>
                              <td className="py-3.5 px-4 font-bold text-blue-600">{row.active_workers} Active Workers</td>
                            </>
                          )}
                          {activeTab === 'tasks' && (
                            <>
                              <td className="py-3.5 px-4 font-extrabold text-[#003135]">{row.priority} Priority</td>
                              <td className="py-3.5 px-4 font-bold text-[#0FA4AF]">{row.count} Tasks</td>
                            </>
                          )}
                          {activeTab === 'budget' && (
                            <>
                              <td className="py-3.5 px-4 font-extrabold text-[#003135]">{row.category}</td>
                              <td className="py-3.5 px-4 font-bold text-amber-600">₹{Number(row.amount || 0).toLocaleString()}</td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs font-semibold text-gray-500">
                <span>
                  Showing {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
                  {Math.min(currentPage * itemsPerPage, tableData.length)} of {tableData.length} entries
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>
    </motion.div>
  );
};

export default ReportsPage;
