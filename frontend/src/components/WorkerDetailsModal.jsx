import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, IndianRupee, Calendar, Wrench, Building2, UserPlus, Edit3 } from 'lucide-react';

const WorkerDetailsModal = ({ isOpen, onClose, worker, onEdit, onAssign, onRemove, canManage }) => {
  if (!isOpen || !worker) return null;

  const currentAssignment = worker.current_assignment;
  const project = currentAssignment?.project_detail;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

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
            <div className="flex items-center space-x-4">
              <img
                src={worker.profile_photo || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250"}
                alt={worker.full_name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#0FA4AF] shadow-md"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-gray-700">
                    {worker.worker_id}
                  </span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    worker.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {worker.status}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-[#003135] tracking-tight mt-1">
                  {worker.full_name}
                </h2>
                <p className="text-xs text-[#0FA4AF] font-bold">
                  {worker.designation} • ({worker.skill_category})
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Project Assignment Status Banner */}
          <div className="mb-6">
            {project ? (
              <div className="bg-gradient-to-r from-[#003135] to-[#024950] text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-[#0FA4AF]/20 text-[#0FA4AF] border border-[#0FA4AF]/30">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#0FA4AF]">Currently Assigned Site Project</p>
                    <h4 className="text-sm font-extrabold text-white">
                      {project.project_name} <span className="text-xs font-mono text-[#AFDDE5]">({project.project_code})</span>
                    </h4>
                    <p className="text-[11px] text-[#AFDDE5] mt-0.5">
                      Assigned on: {currentAssignment.assigned_date} by {currentAssignment.assigned_by_name}
                    </p>
                  </div>
                </div>

                {canManage && (
                  <button
                    onClick={() => { onClose(); onRemove(worker); }}
                    className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    Unassign Worker
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <UserPlus className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold">Unassigned Worker</p>
                    <p className="text-[11px] text-amber-700">Currently available for site assignment.</p>
                  </div>
                </div>

                {canManage && (
                  <button
                    onClick={() => { onClose(); onAssign(worker); }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Assign to Project
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <IndianRupee className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Daily Wage Rate</p>
              <p className="text-xs font-extrabold text-emerald-700">{formatCurrency(worker.daily_wage)} / day</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <Wrench className="w-5 h-5 text-[#0FA4AF] mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Employment Type</p>
              <p className="text-xs font-bold text-[#003135]">{worker.employment_type}</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <Phone className="w-5 h-5 text-[#0FA4AF] mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Phone Contact</p>
              <p className="text-xs font-bold text-[#003135]">{worker.phone_number}</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <Calendar className="w-5 h-5 text-[#0FA4AF] mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Join Date</p>
              <p className="text-xs font-bold text-[#003135]">{worker.join_date}</p>
            </div>
          </div>

          {/* Emergency Contact & Address Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Emergency Contact</p>
              <p className="font-bold text-[#003135]">{worker.emergency_contact_name}</p>
              <p className="text-gray-600 flex items-center gap-1 font-mono">
                <Phone className="w-3 h-3 text-[#0FA4AF]" /> {worker.emergency_contact_number}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Residential Address</p>
              <p className="text-gray-700 leading-relaxed font-medium">{worker.address || 'Address not provided'}</p>
            </div>
          </div>

          {/* Notes */}
          {worker.notes && (
            <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-gray-600">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Worker Notes</p>
              <p>{worker.notes}</p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-5">
            <p className="text-[11px] text-gray-400 font-mono">
              Registered: {new Date(worker.created_at).toLocaleDateString()}
            </p>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Close
              </button>

              {canManage && (
                <button
                  type="button"
                  onClick={() => { onClose(); onEdit(worker); }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white gradient-btn flex items-center space-x-1.5 shadow-md cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WorkerDetailsModal;
