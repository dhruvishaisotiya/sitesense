import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Layers, Maximize2, IndianRupee, Archive, Edit3, ShieldCheck, Clock, Mail, Phone } from 'lucide-react';

const ProjectDetailsModal = ({ isOpen, onClose, project, onEdit, onArchive, isAdmin }) => {
  if (!isOpen || !project) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'PLANNING':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'ON_HOLD':
        return 'bg-orange-500/10 text-orange-300 border-orange-500/30';
      case 'COMPLETED':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'ARCHIVED':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
      default:
        return 'bg-teal-500/10 text-teal-300 border-teal-500/30';
    }
  };

  const manager = project.assigned_manager_detail;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 text-[#003135] shadow-2xl relative border border-gray-100 my-8"
        >
          {/* Header Action Bar */}
          <div className="flex items-start justify-between border-b border-gray-100 pb-5 mb-6">
            <div className="space-y-1 pr-6">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {project.project_code}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border ${getStatusBadge(project.status)}`}>
                  {project.status_display || project.status}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#003135] tracking-tight mt-1">
                {project.project_name}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {project.building_type_display || project.building_type} Construction Project
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          {project.description && (
            <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-xs text-gray-600 leading-relaxed">
                {project.description}
              </p>
            </div>
          )}

          {/* Core Building Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <Building2 className="w-5 h-5 text-[#0FA4AF] mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Building Type</p>
              <p className="text-xs font-bold text-[#003135]">{project.building_type}</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <Layers className="w-5 h-5 text-[#0FA4AF] mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Blocks / Floors</p>
              <p className="text-xs font-bold text-[#003135]">{project.blocks} Blk / {project.floors} Flr</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <Maximize2 className="w-5 h-5 text-[#0FA4AF] mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Total Area</p>
              <p className="text-xs font-bold text-[#003135]">{Number(project.area_sqft).toLocaleString()} sqft</p>
            </div>

            <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-center">
              <IndianRupee className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-[10px] text-emerald-600 font-semibold uppercase">Total Budget</p>
              <p className="text-xs font-extrabold text-emerald-700">{formatCurrency(project.total_budget)}</p>
            </div>
          </div>

          {/* Timeline & Progress Indicator */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 font-bold text-[#003135]">
                <Clock className="w-4 h-4 text-[#0FA4AF]" />
                <span>Project Timeline & Schedule</span>
              </div>
              <span className="text-gray-500 font-medium">
                Start: <strong className="text-[#003135]">{project.start_date}</strong> → End: <strong className="text-[#003135]">{project.planned_end_date}</strong>
              </span>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs font-semibold text-gray-600">
                <span>Current Progress (Manual Update Standard)</span>
                <span className="text-[#0FA4AF] font-bold">{project.current_progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#0FA4AF] to-[#024950] rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(project.current_progress, 3)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Assigned Project Manager Info Card */}
          <div className="bg-gradient-to-r from-[#003135] to-[#024950] text-white p-5 rounded-2xl shadow-md mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={manager?.avatar_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150"}
                alt={manager?.full_name || "Manager"}
                className="w-12 h-12 rounded-xl object-cover border-2 border-[#0FA4AF]"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#0FA4AF]">Assigned Project Manager</p>
                </div>
                <h4 className="text-sm font-extrabold text-white">
                  {manager ? manager.full_name : 'Unassigned (Admin to Assign)'}
                </h4>
                {manager && (
                  <p className="text-[11px] text-[#AFDDE5] flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-[#0FA4AF]" /> {manager.email}</span>
                    {manager.phone_number && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-[#0FA4AF]" /> {manager.phone_number}</span>}
                  </p>
                )}
              </div>
            </div>

            <ShieldCheck className="w-8 h-8 text-[#0FA4AF] opacity-40 hidden sm:block" />
          </div>

          {/* Assigned Site Engineers Info Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#003135] mb-2">
              Assigned Site Engineers ({project.assigned_engineers_detail?.length || 0})
            </p>
            {project.assigned_engineers_detail && project.assigned_engineers_detail.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {project.assigned_engineers_detail.map((eng) => (
                  <div key={eng.id} className="flex items-center space-x-3 p-2 bg-white rounded-xl border border-gray-200">
                    <img
                      src={eng.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"}
                      alt={eng.full_name}
                      className="w-8 h-8 rounded-lg object-cover border border-[#0FA4AF]"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#003135] truncate">{eng.full_name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{eng.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No Site Engineers assigned yet.</p>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-5">
            <p className="text-[11px] text-gray-400 font-mono">
              Created: {new Date(project.created_at).toLocaleDateString()}
            </p>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Close
              </button>

              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => { onClose(); onArchive(project); }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Archive className="w-4 h-4" />
                    <span>{project.status === 'ARCHIVED' ? 'Restore' : 'Archive'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { onClose(); onEdit(project); }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white gradient-btn flex items-center space-x-1.5 shadow-md cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Project</span>
                  </button>
                </>
              )}
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProjectDetailsModal;
