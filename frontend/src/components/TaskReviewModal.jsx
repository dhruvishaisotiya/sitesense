import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle, MessageSquare, AlertTriangle } from 'lucide-react';

const TaskReviewModal = ({ isOpen, onClose, task, onApprove, onReject }) => {
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !task) return null;

  const handleApprove = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await onApprove(task.id, { manager_review_comments: comments });
      onClose();
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.response?.data?.error;
      setErrorMsg(detail || 'Failed to approve task.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      setErrorMsg('Please provide rejection feedback comments for the site engineer.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await onReject(task.id, { manager_review_comments: comments });
      onClose();
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.response?.data?.error;
      setErrorMsg(detail || 'Failed to reject task.');
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
          className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden text-[#003135]"
        >
          {/* Header */}
          <div className="bg-[#003135] text-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#0FA4AF]/20 text-[#0FA4AF] font-mono font-bold">
                {task.task_id}
              </span>
              <h3 className="text-base font-extrabold tracking-tight truncate max-w-xs">
                Review Task Completion
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <h4 className="text-xs font-bold text-[#003135]">{task.title}</h4>
              <p className="text-[11px] text-gray-500">
                Assigned Engineer: <span className="font-bold text-[#003135]">{task.assigned_engineer_detail?.full_name || 'N/A'}</span>
              </p>
              {task.engineer_notes && (
                <p className="text-[11px] text-gray-600 italic bg-white p-2 rounded-lg border border-gray-200 mt-2">
                  Engineer Note: "{task.engineer_notes}"
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-[#0FA4AF]" />
                Manager Review Comments & Feedback
              </label>
              <textarea
                rows="3"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Enter quality audit feedback, approval sign-off, or reasons for rejection..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0FA4AF]"
              ></textarea>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleReject}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 text-red-600" />
                <span>Reject Task</span>
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Task</span>
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaskReviewModal;
