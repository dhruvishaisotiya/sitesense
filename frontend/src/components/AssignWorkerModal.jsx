import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserCheck, AlertCircle, Check } from 'lucide-react';
import { getProjects } from '../api/projects';

const AssignWorkerModal = ({ isOpen, onClose, onAssign, worker, loading = false }) => {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSelectedProjectId('');
      fetchProjects();
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const data = await getProjects({ status: 'ACTIVE' });
      const projList = data.results || data;
      setProjects(projList);
      if (projList.length > 0) {
        setSelectedProjectId(projList[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch available projects for assignment:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!selectedProjectId) {
      setErrorMessage('Please select a project to assign.');
      return;
    }

    try {
      await onAssign(worker.id, Number(selectedProjectId));
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to assign worker to project.';
      setErrorMessage(errorMsg);
    }
  };

  if (!isOpen || !worker) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-white rounded-3xl p-6 text-[#003135] shadow-2xl relative border border-gray-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-[#003135] text-[#0FA4AF]">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#003135]">Assign Worker to Site</h3>
                <p className="text-xs text-gray-500 font-medium">{worker.full_name} ({worker.worker_id})</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-2">
                Select Construction Project *
              </label>

              {loadingProjects ? (
                <div className="py-6 text-center text-xs text-gray-400">Loading active projects...</div>
              ) : projects.length === 0 ? (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
                  No active projects available for assignment.
                </div>
              ) : (
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF]"
                >
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.project_code} - {proj.project_name} ({proj.building_type})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-gray-500 space-y-1">
              <p className="font-semibold text-[#003135]">Assignment Rules:</p>
              <p>• Assigning will set active status on the selected project.</p>
              <p>• Prevents duplicate active assignments on the same project.</p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || projects.length === 0}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white gradient-btn flex items-center space-x-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Assign Worker</span>
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AssignWorkerModal;
