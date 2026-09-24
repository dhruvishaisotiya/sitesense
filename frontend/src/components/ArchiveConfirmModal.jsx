import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, RotateCcw, Trash2, AlertTriangle, X } from 'lucide-react';

const ArchiveConfirmModal = ({ isOpen, onClose, onConfirm, project, actionType, loading }) => {
  if (!isOpen || !project) return null;

  const getConfig = () => {
    switch (actionType) {
      case 'ARCHIVE':
        return {
          title: 'Archive Project',
          description: `Are you sure you want to archive "${project.project_name}" (${project.project_code})? The project will be hidden from active lists but can be restored later.`,
          icon: <Archive className="w-6 h-6 text-amber-500" />,
          btnText: 'Archive Project',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      case 'RESTORE':
        return {
          title: 'Restore Project',
          description: `Restore "${project.project_name}" (${project.project_code}) back to active project management?`,
          icon: <RotateCcw className="w-6 h-6 text-[#0FA4AF]" />,
          btnText: 'Restore Project',
          btnBg: 'bg-[#0FA4AF] hover:bg-[#024950] text-white',
        };
      case 'DELETE':
        return {
          title: 'Delete Project Permanently',
          description: `This action cannot be undone. "${project.project_name}" (${project.project_code}) will be permanently deleted from the database.`,
          icon: <Trash2 className="w-6 h-6 text-red-500" />,
          btnText: 'Delete Permanently',
          btnBg: 'bg-red-600 hover:bg-red-700 text-white',
        };
      default:
        return {
          title: 'Confirm Action',
          description: `Confirm action for "${project.project_name}".`,
          icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
          btnText: 'Confirm',
          btnBg: 'bg-[#0FA4AF] text-white',
        };
    }
  };

  const config = getConfig();

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
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
              {config.icon}
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#003135]">{config.title}</h3>
              <p className="text-xs text-gray-500 font-mono">{project.project_code}</p>
            </div>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed mb-6 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
            {config.description}
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
              className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center space-x-2 ${config.btnBg}`}
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              <span>{config.btnText}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ArchiveConfirmModal;
