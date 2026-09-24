import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  Building2,
  User,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Save,
  Send,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

const TaskDetailsModal = ({ 
  isOpen, 
  onClose, 
  task, 
  onUpdateProgress, 
  onMarkComplete,
  onOpenReviewModal 
}) => {
  const { role } = useAuth();
  const isEngineer = role === 'SITE_ENGINEER';
  const isManagerOrAdmin = role === 'ADMIN' || role === 'PROJECT_MANAGER';

  const [progressPct, setProgressPct] = useState(0);
  const [actualHours, setActualHours] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (task) {
      setProgressPct(task.completion_percentage || 0);
      setActualHours(task.actual_hours || 0);
      setNotes(task.engineer_notes || '');
      setMsg({ type: '', text: '' });
    }
  }, [task]);

  if (!isOpen || !task) return null;

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

  const handleSaveProgress = async () => {
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await onUpdateProgress(task.id, {
        completion_percentage: Number(progressPct),
        actual_hours: Number(actualHours),
        engineer_notes: notes,
      });
      setMsg({ type: 'success', text: 'Task progress updated successfully!' });
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.response?.data?.error;
      setMsg({ type: 'error', text: detail || 'Failed to update progress.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await onMarkComplete(task.id);
      setMsg({ type: 'success', text: 'Task marked as Completed and submitted for PM review!' });
      setProgressPct(100);
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.response?.data?.error;
      setMsg({ type: 'error', text: detail || 'Failed to mark task as completed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden text-[#003135]"
        >
          {/* Header */}
          <div className="bg-[#003135] text-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xs px-3 py-1 rounded-full bg-[#0FA4AF]/20 text-[#0FA4AF] border border-[#0FA4AF]/40 font-mono font-bold">
                {task.task_id}
              </span>
              <h3 className="text-lg font-extrabold tracking-tight truncate max-w-md">
                {task.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

            {msg.text && (
              <div className={`p-3 rounded-xl text-xs font-bold border flex items-center space-x-2 ${
                msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-red-50 text-red-700 border-red-300'
              }`}>
                {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                <span>{msg.text}</span>
              </div>
            )}

            {/* Badges & Meta Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusBadge(task.status)}`}>
                  {task.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getPriorityBadge(task.priority)}`}>
                  {task.priority} Priority
                </span>
                {task.is_overdue && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300">
                    Overdue
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4 text-xs font-semibold text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0FA4AF]" /> Due: {task.due_date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#0FA4AF]" /> Est: {task.estimated_hours}h / Actual: {task.actual_hours}h
                </span>
              </div>
            </div>

            {/* Project & Engineer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3">
                <Building2 className="w-5 h-5 text-[#0FA4AF]" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Project</p>
                  <p className="text-xs font-extrabold text-[#003135]">
                    {task.project_detail?.project_code} - {task.project_detail?.project_name}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3">
                <User className="w-5 h-5 text-[#0FA4AF]" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Assigned Site Engineer</p>
                  <p className="text-xs font-extrabold text-[#003135]">
                    {task.assigned_engineer_detail ? task.assigned_engineer_detail.full_name : 'Unassigned'}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                Task Scope & Specifications
              </h4>
              <p className="text-xs text-gray-600 bg-gray-50 p-3.5 rounded-xl border border-gray-200 leading-relaxed font-medium">
                {task.description || 'No detailed specifications provided.'}
              </p>
            </div>

            {/* Manager Review Comments (if existing) */}
            {task.manager_review_comments && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
                <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  Manager Review Comments
                </h4>
                <p className="text-xs text-amber-800 italic">
                  "{task.manager_review_comments}"
                </p>
              </div>
            )}

            {/* Completion Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-extrabold">
                <span className="text-gray-700">Completion Progress</span>
                <span className="text-[#0FA4AF]">{task.completion_percentage}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <div 
                  className="h-full bg-gradient-to-r from-[#024950] to-[#0FA4AF] transition-all duration-300"
                  style={{ width: `${task.completion_percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Site Engineer Progress Form (for assigned engineer or PM) */}
            {isEngineer && task.status !== 'Approved' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-extrabold text-[#003135] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#0FA4AF]" />
                  Log Site Progress & Work Notes
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Completion Percentage ({progressPct}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progressPct}
                      onChange={(e) => setProgressPct(e.target.value)}
                      className="w-full cursor-pointer accent-[#0FA4AF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Actual Hours Spent
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={actualHours}
                      onChange={(e) => setActualHours(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-[#003135]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Engineer Site Notes
                  </label>
                  <textarea
                    rows="2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Log technical observations, materials used, or compaction test results..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-[#003135]"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveProgress}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#024950] hover:bg-[#0FA4AF] text-white flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Update Progress</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteTask}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white gradient-btn shadow-md flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit for Review</span>
                  </button>
                </div>
              </div>
            )}

            {/* PM Review Action Bar */}
            {isManagerOrAdmin && task.status === 'Completed' && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-emerald-900">Task Completed by Engineer</h4>
                  <p className="text-[11px] text-emerald-700">Review task specifications and approve or reject with comments.</p>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenReviewModal(task);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer"
                >
                  Review & Approve
                </button>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaskDetailsModal;
