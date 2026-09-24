import React, { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import Navbar from '../components/Navbar';
import TaskModal from '../components/TaskModal';
import TaskDetailsModal from '../components/TaskDetailsModal';
import TaskReviewModal from '../components/TaskReviewModal';
import { getProjects } from '../api/projects';
import { 
  getTasks, 
  createTask, 
  updateTask, 
  deleteTask, 
  updateTaskProgress, 
  markTaskComplete, 
  approveTask, 
  rejectTask, 
  getTaskAnalytics 
} from '../api/tasks';

// Recharts Import
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

import { 
  CheckSquare, 
  Building2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Search, 
  Kanban, 
  List, 
  Sparkles, 
  User, 
  AlertTriangle,
  Play,
  Check
} from 'lucide-react';

const TasksPage = () => {
  const { role } = useAuth();
  const isEngineer = role === 'SITE_ENGINEER';
  const isManagerOrAdmin = role === 'ADMIN' || role === 'PROJECT_MANAGER';

  // View mode
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'

  // Data state
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [analytics, setAnalytics] = useState({
    total_tasks: 0,
    pending_count: 0,
    in_progress_count: 0,
    completed_count: 0,
    approved_count: 0,
    rejected_count: 0,
    overdue_count: 0,
    priorities: { Low: 0, Medium: 0, High: 0, Critical: 0 },
  });

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [reviewTask, setReviewTask] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await getProjects({ status: 'ACTIVE' });
      setProjects(data.results || data);
    } catch (err) {
      console.error('Failed to fetch projects for task filter:', err);
    }
  }, []);

  // Rebuilt only when a filter changes, which is exactly when the effect
  // below should refetch.
  const fetchTasksAndAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedProjectId) params.project_id = selectedProjectId;
      if (selectedPriority) params.priority = selectedPriority;
      if (selectedStatus) params.status = selectedStatus;
      if (searchQuery) params.search = searchQuery;

      const [tasksData, analyticsData] = await Promise.all([
        getTasks(params),
        getTaskAnalytics(params)
      ]);

      setTasks(tasksData.results || tasksData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load tasks and analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, selectedPriority, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchTasksAndAnalytics();
  }, [fetchTasksAndAnalytics]);

  // Handlers
  const handleCreateOrUpdateTask = async (formData, taskId) => {
    if (taskId) {
      await updateTask(taskId, formData);
    } else {
      await createTask(formData);
    }
    fetchTasksAndAnalytics();
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this construction task?')) {
      try {
        await deleteTask(id);
        fetchTasksAndAnalytics();
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  const handleUpdateProgress = async (id, data) => {
    await updateTaskProgress(id, data);
    fetchTasksAndAnalytics();
    if (selectedTaskDetails && selectedTaskDetails.id === id) {
      const updated = tasks.find(t => t.id === id);
      if (updated) setSelectedTaskDetails(updated);
    }
  };

  const handleMarkComplete = async (id) => {
    await markTaskComplete(id);
    fetchTasksAndAnalytics();
  };

  const handleApprove = async (id, data) => {
    await approveTask(id, data);
    fetchTasksAndAnalytics();
  };

  const handleReject = async (id, data) => {
    await rejectTask(id, data);
    fetchTasksAndAnalytics();
  };

  // Status Badge Helper
  const getPriorityBadge = (pri) => {
    switch (pri) {
      case 'Critical':
        return 'bg-red-500/10 text-red-600 border-red-300';
      case 'High':
        return 'bg-amber-500/10 text-amber-700 border-amber-300';
      case 'Medium':
        return 'bg-blue-500/10 text-blue-700 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-300';
      case 'Completed':
        return 'bg-blue-500/10 text-blue-700 border-blue-300';
      case 'In Progress':
        return 'bg-amber-500/10 text-amber-700 border-amber-300';
      case 'Rejected':
        return 'bg-red-500/10 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // Recharts Data
  const pieChartData = [
    { name: 'Pending', value: analytics.pending_count, color: '#94A3B8' },
    { name: 'In Progress', value: analytics.in_progress_count, color: '#F59E0B' },
    { name: 'Completed', value: analytics.completed_count, color: '#3B82F6' },
    { name: 'Approved', value: analytics.approved_count, color: '#10B981' },
    { name: 'Rejected', value: analytics.rejected_count, color: '#EF4444' },
  ].filter(item => item.value > 0);

  const barChartData = [
    { priority: 'Low', count: analytics.priorities?.Low || 0, fill: '#94A3B8' },
    { priority: 'Medium', count: analytics.priorities?.Medium || 0, fill: '#3B82F6' },
    { priority: 'High', count: analytics.priorities?.High || 0, fill: '#F59E0B' },
    { priority: 'Critical', count: analytics.priorities?.Critical || 0, fill: '#EF4444' },
  ];

  // Kanban Columns
  const columns = [
    { key: 'Pending', label: 'Pending', color: 'border-slate-300 bg-slate-50/50' },
    { key: 'In Progress', label: 'In Progress', color: 'border-amber-300 bg-amber-50/30' },
    { key: 'Completed', label: 'Completed (For Review)', color: 'border-blue-300 bg-blue-50/30' },
    { key: 'Approved', label: 'Approved', color: 'border-emerald-300 bg-emerald-50/30' },
  ];

  return (
    <div className="min-h-screen bg-[#003135] text-white flex flex-col selection:bg-[#0FA4AF] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Tasks & Field Work Automation
              </h1>
              <span className="text-xs px-3 py-1 rounded-full bg-[#0FA4AF]/20 text-[#0FA4AF] border border-[#0FA4AF]/40 font-bold">
                MODULE 5
              </span>
            </div>
            <p className="text-xs text-[#AFDDE5] mt-1">
              {isEngineer
                ? "Track assigned tasks, log technical work progress, and submit completion reports."
                : "Manage construction tasks, assign site engineers, monitor Kanban columns, and review completed work."}
            </p>
          </div>

          <div className="flex items-center space-x-3 self-stretch sm:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#024950] p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'kanban' ? 'bg-[#0FA4AF] text-white shadow-md' : 'text-[#AFDDE5] hover:text-white'
                }`}
              >
                <Kanban className="w-4 h-4" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-[#0FA4AF] text-white shadow-md' : 'text-[#AFDDE5] hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
                <span>List Table</span>
              </button>
            </div>

            {/* Create Task Button */}
            {isManagerOrAdmin && (
              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white gradient-btn shadow-lg shadow-[#0FA4AF]/20 flex items-center space-x-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Analytics Section: Metric Cards + Recharts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Summary Metric Cards */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-[#024950] text-[#0FA4AF]">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-[#AFDDE5] font-medium uppercase">Total Tasks</p>
                <h3 className="text-xl font-extrabold text-white">{analytics.total_tasks}</h3>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-[#AFDDE5] font-medium uppercase">In Progress</p>
                <h3 className="text-xl font-extrabold text-amber-300">{analytics.in_progress_count}</h3>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-[#AFDDE5] font-medium uppercase">Completed</p>
                <h3 className="text-xl font-extrabold text-blue-300">{analytics.completed_count}</h3>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-[#AFDDE5] font-medium uppercase">Approved</p>
                <h3 className="text-xl font-extrabold text-emerald-400">{analytics.approved_count}</h3>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-[#AFDDE5] font-medium uppercase">Overdue</p>
                <h3 className="text-xl font-extrabold text-red-400">{analytics.overdue_count}</h3>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4 bg-gradient-to-r from-[#003135] to-[#024950]">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-[#AFDDE5] font-medium uppercase">Rejected</p>
                <h3 className="text-xl font-extrabold text-rose-300">{analytics.rejected_count}</h3>
              </div>
            </div>
          </div>

          {/* Recharts Pie & Bar Chart Panels */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Status Pie Chart */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
              <h3 className="text-xs font-bold text-white mb-1">Task Status Breakdown</h3>
              {pieChartData.length === 0 ? (
                <div className="h-36 flex items-center justify-center text-xs text-gray-400">No tasks found.</div>
              ) : (
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={55}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#003135', borderColor: '#0FA4AF', borderRadius: '10px', fontSize: '10px', color: '#fff' }} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Priority Bar Chart */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
              <h3 className="text-xs font-bold text-white mb-1">Priority Distribution</h3>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <XAxis dataKey="priority" tick={{ fill: '#AFDDE5', fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#AFDDE5', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#003135', borderColor: '#0FA4AF', borderRadius: '10px', fontSize: '10px', color: '#fff' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>

        {/* Toolbar: Search & Filters */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search task title, ID, scope..."
                className="w-full pl-9 pr-3 py-2 bg-black/20 border border-white/10 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#0FA4AF]"
              />
            </div>

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

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-black/20 px-3 py-2 rounded-xl border border-white/10 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-[#003135]">All Priorities</option>
              <option value="Low" className="bg-[#003135]">Low Priority</option>
              <option value="Medium" className="bg-[#003135]">Medium Priority</option>
              <option value="High" className="bg-[#003135]">High Priority</option>
              <option value="Critical" className="bg-[#003135]">Critical Priority</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-black/20 px-3 py-2 rounded-xl border border-white/10 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-[#003135]">All Statuses</option>
              <option value="Pending" className="bg-[#003135]">Pending</option>
              <option value="In Progress" className="bg-[#003135]">In Progress</option>
              <option value="Completed" className="bg-[#003135]">Completed</option>
              <option value="Approved" className="bg-[#003135]">Approved</option>
              <option value="Rejected" className="bg-[#003135]">Rejected</option>
            </select>
          </div>
        </div>

        {/* VIEW 1: KANBAN BOARD VIEW */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {columns.map((col) => {
              const colTasks = tasks.filter(t => t.status === col.key);

              return (
                <div key={col.key} className="space-y-4">
                  {/* Column Header */}
                  <div className="flex items-center justify-between bg-[#024950]/60 px-4 py-3 rounded-2xl border border-white/10">
                    <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
                      <span>{col.label}</span>
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white font-mono font-bold">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Column Task Cards */}
                  <div className="space-y-3">
                    {colTasks.length === 0 ? (
                      <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center text-xs text-gray-400">
                        No tasks in {col.label}
                      </div>
                    ) : (
                      colTasks.map((t) => (
                        <motion.div
                          key={t.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-2xl p-4 shadow-xl border border-gray-100 text-[#003135] space-y-3 hover:shadow-2xl transition-all cursor-pointer group"
                          onClick={() => {
                            setSelectedTaskDetails(t);
                            setIsDetailsModalOpen(true);
                          }}
                        >
                          {/* Card Header: Task ID & Priority */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                              {t.task_id}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getPriorityBadge(t.priority)}`}>
                              {t.priority}
                            </span>
                          </div>

                          {/* Title & Project */}
                          <div>
                            <h4 className="font-extrabold text-sm text-[#003135] group-hover:text-[#0FA4AF] transition-colors line-clamp-2">
                              {t.title}
                            </h4>
                            <p className="text-[10px] font-semibold text-gray-500 mt-0.5">
                              {t.project_detail?.project_code} - {t.project_detail?.project_name}
                            </p>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-gray-600">
                              <span>Progress</span>
                              <span className="text-[#0FA4AF]">{t.completion_percentage}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#024950] to-[#0FA4AF]"
                                style={{ width: `${t.completion_percentage}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Card Footer: Engineer & Due Date */}
                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                            <div className="flex items-center space-x-1.5">
                              <User className="w-3.5 h-3.5 text-[#0FA4AF]" />
                              <span className="font-bold text-[#003135] truncate max-w-[100px]">
                                {t.assigned_engineer_detail ? t.assigned_engineer_detail.first_name : 'Unassigned'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 font-mono">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span>{t.due_date}</span>
                            </div>
                          </div>

                          {/* Action Buttons inside Card */}
                          <div className="pt-1 flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                            {isEngineer && t.status === 'Pending' && (
                              <button
                                onClick={() => handleUpdateProgress(t.id, { completion_percentage: 10.0 })}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#024950] text-white flex items-center space-x-1 cursor-pointer"
                              >
                                <Play className="w-3 h-3" />
                                <span>Start Task</span>
                              </button>
                            )}

                            {isEngineer && (t.status === 'Pending' || t.status === 'In Progress') && (
                              <button
                                onClick={() => handleMarkComplete(t.id)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-600 text-white flex items-center space-x-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Complete</span>
                              </button>
                            )}

                            {isManagerOrAdmin && t.status === 'Completed' && (
                              <button
                                onClick={() => {
                                  setReviewTask(t);
                                  setIsReviewModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white shadow-sm flex items-center space-x-1 cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Review & Approve</span>
                              </button>
                            )}
                          </div>

                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 2: LIST TABLE VIEW */}
        {viewMode === 'list' && (
          <div className="glass-panel-light rounded-3xl overflow-hidden shadow-2xl border border-white/80 text-[#003135]">
            {loading ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-10 h-10 border-4 border-[#0FA4AF] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-bold text-gray-500">Loading Construction Tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <CheckSquare className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="text-sm font-bold text-[#003135]">No Tasks Found</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Try adjusting your filters or click "New Task" to initialize construction tasks.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#003135] text-[#AFDDE5] uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Task Info</th>
                      <th className="px-6 py-4">Project</th>
                      <th className="px-6 py-4">Assigned Engineer</th>
                      <th className="px-6 py-4">Priority</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Progress</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white font-medium">
                    {tasks.map((t) => (
                      <tr 
                        key={t.id} 
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedTaskDetails(t);
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        {/* Task Info */}
                        <td className="px-6 py-4">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-gray-400">
                              {t.task_id}
                            </span>
                            <h4 className="font-extrabold text-[#003135] text-sm">
                              {t.title}
                            </h4>
                            <span className="text-[10px] text-gray-400 font-mono">
                              Due: {t.due_date}
                            </span>
                          </div>
                        </td>

                        {/* Project */}
                        <td className="px-6 py-4">
                          <span className="font-bold text-[#003135]">
                            {t.project_detail?.project_code}
                          </span>
                          <p className="text-[10px] text-gray-500 truncate max-w-[120px]">
                            {t.project_detail?.project_name}
                          </p>
                        </td>

                        {/* Assigned Engineer */}
                        <td className="px-6 py-4">
                          <span className="font-bold text-[#003135]">
                            {t.assigned_engineer_detail ? t.assigned_engineer_detail.full_name : 'Unassigned'}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getPriorityBadge(t.priority)}`}>
                            {t.priority}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(t.status)}`}>
                            {t.status}
                          </span>
                        </td>

                        {/* Progress */}
                        <td className="px-6 py-4 w-36">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-[#0FA4AF]">{t.completion_percentage}%</span>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#0FA4AF]"
                                style={{ width: `${t.completion_percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-2">
                            {isManagerOrAdmin && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingTask(t);
                                    setIsTaskModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(t.id)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                                >
                                  Delete
                                </button>
                              </>
                            )}

                            {isManagerOrAdmin && t.status === 'Completed' && (
                              <button
                                onClick={() => {
                                  setReviewTask(t);
                                  setIsReviewModalOpen(true);
                                }}
                                className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                              >
                                Review
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Task Modal (Create & Edit) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleCreateOrUpdateTask}
        task={editingTask}
      />

      {/* Task Details Drawer */}
      <TaskDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        task={selectedTaskDetails}
        onUpdateProgress={handleUpdateProgress}
        onMarkComplete={handleMarkComplete}
        onOpenReviewModal={(t) => {
          setReviewTask(t);
          setIsReviewModalOpen(true);
        }}
      />

      {/* Task Review Dialog (Manager Approval / Rejection) */}
      <TaskReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        task={reviewTask}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};

export default TasksPage;
