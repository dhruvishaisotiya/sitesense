import React, { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import Navbar from '../components/Navbar';
import { getProjects } from '../api/projects';
import { getWorkers } from '../api/workers';
import { 
  getAttendance, 
  bulkSubmitAttendance, 
  exportAttendanceCSV 
} from '../api/attendance';

// Recharts Import
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

import { 
  Building2, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserX, 
  Download, 
  Save, 
  Search, 
  AlertCircle, 
  ShieldAlert,
  Percent,
  Sparkles,
  Users
} from 'lucide-react';

const AttendancePage = () => {
  const { role } = useAuth();
  const isEngineer = role === 'SITE_ENGINEER';
  const isAdmin = role === 'ADMIN';

  const todayStr = new Date().toISOString().split('T')[0];

  // State
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState('');

  // Attendance Sheet state (array of items being edited)
  // The header counters are derived live from this sheet further down, so no
  // separate server-side summary is kept in state.
  const [attendanceSheet, setAttendanceSheet] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  const isToday = selectedDate === todayStr;
  const canEdit = isEngineer && isToday;

  const fetchInitialProjects = useCallback(async () => {
    try {
      const data = await getProjects();
      const list = data.results || data;
      setProjects(list);
      if (list.length > 0) {
        // Functional update keeps this callback free of `selectedProjectId`,
        // so it stays stable and the mount effect runs exactly once.
        setSelectedProjectId((prev) => prev || list[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch projects for attendance:', err);
    }
  }, []);

  const fetchSheetData = useCallback(async () => {
    if (!selectedProjectId) return;

    try {
      setLoading(true);
      setFeedbackMsg({ type: '', text: '' });

      const workerParams = { project_id: selectedProjectId };
      const attParams = { project_id: selectedProjectId, date: selectedDate };

      // Fetch workers assigned strictly to this project
      const [workersData, attendanceData] = await Promise.all([
        getWorkers(workerParams),
        getAttendance(attParams)
      ]);

      const assignedWorkers = (workersData.results || workersData).filter(w => {
        if (!w.project_assignments || w.project_assignments.length === 0) return true;
        return w.project_assignments.some(pa => pa.project === Number(selectedProjectId) && pa.active_status);
      });
      const existingAttendance = attendanceData.results || attendanceData;

      // Build attendance sheet rows combining assigned workers with existing attendance records
      const sheetRows = assignedWorkers.map((w) => {
        const existingRecord = existingAttendance.find((att) => att.worker === w.id || att.worker_detail?.id === w.id);

        return {
          worker_id: w.id,
          worker_code: w.worker_id,
          full_name: w.full_name,
          skill_category: w.skill_category,
          designation: w.designation,
          status: existingRecord ? existingRecord.status : 'Present',
          check_in_time: existingRecord?.check_in_time || '08:00',
          check_out_time: existingRecord?.check_out_time || '17:00',
          overtime_hours: existingRecord ? Number(existingRecord.overtime_hours) : 0,
          remarks: existingRecord ? existingRecord.remarks : '',
        };
      });

      setAttendanceSheet(sheetRows);
    } catch (err) {
      console.error('Failed to load attendance sheet:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, selectedDate]);

  useEffect(() => {
    fetchInitialProjects();
  }, [fetchInitialProjects]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchSheetData();
    }
  }, [selectedProjectId, fetchSheetData]);

  // Live Reactive Status Counter Updates
  const currentPresentCount = attendanceSheet.filter(i => i.status === 'Present').length;
  const currentAbsentCount = attendanceSheet.filter(i => i.status === 'Absent').length;
  const currentHalfDayCount = attendanceSheet.filter(i => i.status === 'Half Day').length;
  const currentLeaveCount = attendanceSheet.filter(i => i.status === 'Leave').length;
  const totalAssigned = attendanceSheet.length;

  const effectivePresent = currentPresentCount + (currentHalfDayCount * 0.5);
  const livePercentage = totalAssigned > 0 ? roundOneDecimal((effectivePresent / totalAssigned) * 100) : 0;

  function roundOneDecimal(num) {
    return Math.round(num * 10) / 10;
  }

  // Row update handlers
  const handleRowChange = (workerId, field, value) => {
    if (!canEdit) return;
    setAttendanceSheet(prev =>
      prev.map(row => (row.worker_id === workerId ? { ...row, [field]: value } : row))
    );
  };

  // Bulk Quick Actions
  const handleBulkMarkStatus = (targetStatus) => {
    if (!canEdit) return;
    setAttendanceSheet(prev =>
      prev.map(row => ({ ...row, status: targetStatus }))
    );
  };

  const handleSaveAll = async () => {
    if (!canEdit) return;
    setSaving(true);
    setFeedbackMsg({ type: '', text: '' });

    const payload = {
      project_id: Number(selectedProjectId),
      date: selectedDate,
      items: attendanceSheet.map(item => ({
        worker_id: item.worker_id,
        status: item.status,
        check_in_time: item.check_in_time || null,
        check_out_time: item.check_out_time || null,
        overtime_hours: Number(item.overtime_hours || 0),
        remarks: item.remarks || '',
      }))
    };

    try {
      const res = await bulkSubmitAttendance(payload);
      setFeedbackMsg({ type: 'success', text: res.message || 'Daily attendance saved successfully!' });
      fetchSheetData();
    } catch (err) {
      const errText = err.response?.data?.error || 'Failed to save attendance records.';
      setFeedbackMsg({ type: 'error', text: errText });
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportAttendanceCSV({ project_id: selectedProjectId, date: selectedDate });
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  // Filtered rows for search query
  const filteredSheet = attendanceSheet.filter(row =>
    row.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.worker_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.skill_category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Chart Data for Recharts
  const pieChartData = [
    { name: 'Present', value: currentPresentCount, color: '#10B981' },
    { name: 'Absent', value: currentAbsentCount, color: '#EF4444' },
    { name: 'Half Day', value: currentHalfDayCount, color: '#F59E0B' },
    { name: 'Leave', value: currentLeaveCount, color: '#06B6D4' },
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-[#003135] text-white flex flex-col selection:bg-[#0FA4AF] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Daily Attendance & Workforce Analytics
              </h1>
              <span className="text-xs px-3 py-1 rounded-full bg-[#0FA4AF]/20 text-[#0FA4AF] border border-[#0FA4AF]/40 font-bold">
                MODULE 4
              </span>
            </div>
            <p className="text-xs text-[#AFDDE5] mt-1">
              {isEngineer
                ? "Record and edit today's site worker attendance, check-in/out times, and overtime."
                : "View enterprise daily attendance records, summaries, and CSV exports (Read-Only mode)."}
            </p>
          </div>

          <div className="flex items-center space-x-3 self-stretch sm:self-auto">
            {isAdmin && (
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#024950] hover:bg-[#0FA4AF] text-white border border-[#0FA4AF]/30 flex items-center space-x-2 transition-all shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#0FA4AF]" />
                <span>Export CSV Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Analytics Section: Metrics Cards & Recharts Pie Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Metrics Summary Cards */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-[#024950] text-[#0FA4AF]">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-[#AFDDE5] font-medium uppercase">Assigned Workers</p>
                <h3 className="text-xl font-extrabold text-white">{totalAssigned}</h3>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-[#AFDDE5] font-medium uppercase">Present On-Site</p>
                <h3 className="text-xl font-extrabold text-emerald-400">{currentPresentCount}</h3>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-[#AFDDE5] font-medium uppercase">Absent</p>
                <h3 className="text-xl font-extrabold text-red-400">{currentAbsentCount}</h3>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-[#AFDDE5] font-medium uppercase">Half Day</p>
                <h3 className="text-xl font-extrabold text-amber-300">{currentHalfDayCount}</h3>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-[#AFDDE5] font-medium uppercase">Authorized Leave</p>
                <h3 className="text-xl font-extrabold text-cyan-300">{currentLeaveCount}</h3>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4 bg-gradient-to-r from-[#003135] to-[#024950]">
              <div className="p-3 rounded-xl bg-[#0FA4AF]/20 text-[#0FA4AF]">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-[#AFDDE5] font-medium uppercase">Attendance Rate</p>
                <h3 className="text-xl font-extrabold text-[#0FA4AF]">{livePercentage}%</h3>
              </div>
            </div>
          </div>

          {/* Recharts Pie Chart Panel */}
          <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#0FA4AF]" />
                Visual Attendance Breakdown
              </h3>
              <span className="text-[10px] text-[#AFDDE5] font-mono">{selectedDate}</span>
            </div>

            {pieChartData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-gray-400">
                No attendance status recorded for chart rendering.
              </div>
            ) : (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#003135', borderColor: '#0FA4AF', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>

        {/* Controls Toolbar: Project Dropdown, Date Picker, Search & Bulk Actions */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Project Dropdown */}
            <div className="flex items-center space-x-2 bg-black/20 px-3 py-2 rounded-xl border border-white/10">
              <Building2 className="w-4 h-4 text-[#0FA4AF]" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id} className="bg-[#003135]">
                    {proj.project_code} - {proj.project_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div className="flex items-center space-x-2 bg-black/20 px-3 py-2 rounded-xl border border-white/10">
              <Calendar className="w-4 h-4 text-[#0FA4AF]" />
              <input
                type="date"
                max={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              />
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search worker..."
                className="w-full pl-9 pr-3 py-2 bg-black/20 border border-white/10 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#0FA4AF]"
              />
            </div>
          </div>

          {/* Bulk Action Buttons (Site Engineer only when Date == Today) */}
          {canEdit ? (
            <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleBulkMarkStatus('Present')}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all cursor-pointer"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleBulkMarkStatus('Absent')}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all cursor-pointer"
              >
                Mark All Absent
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white gradient-btn shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save All</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-[#AFDDE5] bg-black/30 px-3 py-2 rounded-xl border border-white/10">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {!isToday
                  ? "Past Date Selected (Read-Only Mode)"
                  : "Read-Only Access (Attendance Marking Reserved for Site Engineers)"}
              </span>
            </div>
          )}

        </div>

        {/* Feedback Alert Banner */}
        {feedbackMsg.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl text-xs flex items-center space-x-3 border ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-red-500/10 text-red-300 border-red-500/30'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span className="font-semibold">{feedbackMsg.text}</span>
          </motion.div>
        )}

        {/* Enterprise Daily Attendance Sheet Table */}
        <div className="glass-panel-light rounded-3xl overflow-hidden shadow-2xl border border-white/80 text-[#003135]">
          {loading ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-10 h-10 border-4 border-[#0FA4AF] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-gray-500">Loading Enterprise Attendance Sheet...</p>
            </div>
          ) : filteredSheet.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Users className="w-10 h-10 text-gray-400 mx-auto" />
              <p className="text-sm font-bold text-[#003135]">No Workers Assigned to Selected Site Project</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Use the Workers Management module to assign active workers to this project site first.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#003135] text-[#AFDDE5] uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Worker Info</th>
                    <th className="px-6 py-4">Designation</th>
                    <th className="px-6 py-4">Status *</th>
                    <th className="px-6 py-4">Check In</th>
                    <th className="px-6 py-4">Check Out</th>
                    <th className="px-6 py-4">Overtime (hrs)</th>
                    <th className="px-6 py-4">Remarks / Site Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white font-medium">
                  {filteredSheet.map((row) => (
                    <tr key={row.worker_id} className="hover:bg-slate-50 transition-colors">
                      
                      {/* Worker Info */}
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-gray-400">
                            {row.worker_code}
                          </span>
                          <h4 className="font-extrabold text-[#003135] text-sm">
                            {row.full_name}
                          </h4>
                          <span className="text-[10px] text-[#0FA4AF] font-bold">
                            {row.skill_category}
                          </span>
                        </div>
                      </td>

                      {/* Designation */}
                      <td className="px-6 py-4 text-gray-600 font-semibold">
                        {row.designation}
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-6 py-4">
                        {canEdit ? (
                          <select
                            value={row.status}
                            onChange={(e) => handleRowChange(row.worker_id, 'status', e.target.value)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer ${
                              row.status === 'Present'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : row.status === 'Absent'
                                ? 'bg-red-50 text-red-700 border-red-300'
                                : row.status === 'Half Day'
                                ? 'bg-amber-50 text-amber-700 border-amber-300'
                                : 'bg-cyan-50 text-cyan-700 border-cyan-300'
                            }`}
                          >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Half Day">Half Day</option>
                            <option value="Leave">Leave</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                            row.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : row.status === 'Absent'
                              ? 'bg-red-50 text-red-700 border-red-300'
                              : row.status === 'Half Day'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : 'bg-cyan-50 text-cyan-700 border-cyan-300'
                          }`}>
                            {row.status}
                          </span>
                        )}
                      </td>

                      {/* Check In Time */}
                      <td className="px-6 py-4">
                        {canEdit ? (
                          <input
                            type="time"
                            value={row.check_in_time}
                            onChange={(e) => handleRowChange(row.worker_id, 'check_in_time', e.target.value)}
                            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-[#003135] focus:outline-none focus:ring-1 focus:ring-[#0FA4AF]"
                          />
                        ) : (
                          <span className="font-mono text-gray-700">{row.check_in_time || 'N/A'}</span>
                        )}
                      </td>

                      {/* Check Out Time */}
                      <td className="px-6 py-4">
                        {canEdit ? (
                          <input
                            type="time"
                            value={row.check_out_time}
                            onChange={(e) => handleRowChange(row.worker_id, 'check_out_time', e.target.value)}
                            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-[#003135] focus:outline-none focus:ring-1 focus:ring-[#0FA4AF]"
                          />
                        ) : (
                          <span className="font-mono text-gray-700">{row.check_out_time || 'N/A'}</span>
                        )}
                      </td>

                      {/* Overtime Hours */}
                      <td className="px-6 py-4">
                        {canEdit ? (
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={row.overtime_hours}
                            onChange={(e) => handleRowChange(row.worker_id, 'overtime_hours', e.target.value)}
                            className="w-16 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#003135] focus:outline-none focus:ring-1 focus:ring-[#0FA4AF]"
                          />
                        ) : (
                          <span className="font-bold text-[#003135]">{row.overtime_hours} hrs</span>
                        )}
                      </td>

                      {/* Remarks */}
                      <td className="px-6 py-4">
                        {canEdit ? (
                          <input
                            type="text"
                            value={row.remarks}
                            onChange={(e) => handleRowChange(row.worker_id, 'remarks', e.target.value)}
                            placeholder="Add site remarks..."
                            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-[#003135] focus:outline-none focus:ring-1 focus:ring-[#0FA4AF]"
                          />
                        ) : (
                          <span className="text-gray-600 italic text-xs">{row.remarks || '—'}</span>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default AttendancePage;
