import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserMinus, X } from 'lucide-react';

const RemoveWorkerConfirmModal = ({ isOpen, onClose, onConfirm, worker, loading = false }) => {
  if (!isOpen || !worker) return null;

  const currentAssignment = worker.current_assignment;
  const project = currentAssignment?.project_detail;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-white rounded-3xl p-6 text-[#003135] shadow-2xl relative border border-gray-100"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-2xl bg-red-50 text-red-500 border border-red-100">
              <UserMinus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#003135]">Unassign Worker</h3>
              <p className="text-xs text-gray-500 font-mono">{worker.worker_id} - {worker.full_name}</p>
            </div>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            Are you sure you want to remove <strong className="text-[#003135]">{worker.full_name}</strong> from project <strong className="text-[#003135]">{project?.project_name || 'Active Project'}</strong>? The worker will become unassigned and available for new site assignments.
          </p>

          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md transition-all cursor-pointer flex items-center space-x-2"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <span>Remove from Project</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RemoveWorkerConfirmModal;
