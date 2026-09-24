import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ClipboardList, Building2, CloudRain, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { getProjects } from '../api/projects';
import { getAutoFetchProjectData } from '../api/dailylogs';

const DailyLogModal = ({ isOpen, onClose, onSave, logItem = null }) => {
  const isEdit = Boolean(logItem);

  const [projects, setProjects] = useState([]);
  const [autoData, setAutoData] = useState(null);
  const [loadingAutoData, setLoadingAutoData] = useState(false);

  const [formData, setFormData] = useState({
    project: '',
    rainfall_mm: 0.0,
    rain_affected_work: false,
    construction_stage: 'Structural Steel & Superstructure',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reads no state, so the reference stays stable and the effect below can
  // depend on it without refetching the project list on every keystroke.
  const fetchProjects = useCallback(async () => {
    try {
      const data = await getProjects({ status: 'ACTIVE' });
      const list = data.results || data;
      setProjects(list);
      if (list.length > 0) {
        setFormData(prev => (prev.project ? prev : { ...prev, project: list[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      setErrorMsg('');
      if (logItem) {
        setFormData({
          project: logItem.project || logItem.project_detail?.id || '',
          rainfall_mm: logItem.rainfall_mm || 0.0,
          rain_affected_work: logItem.rain_affected_work ?? false,
          construction_stage: logItem.construction_stage || 'Structural Steel & Superstructure',
        });
      }
    }
  }, [isOpen, logItem, fetchProjects]);

  useEffect(() => {
    if (formData.project) {
      loadProjectAutoData(formData.project);
    } else {
      setAutoData(null);
    }
  }, [formData.project]);

  const loadProjectAutoData = async (projId) => {
    try {
      setLoadingAutoData(true);
      const data = await getAutoFetchProjectData(projId);
      setAutoData(data);
    } catch (err) {
      console.error('Failed to auto-fetch project metrics:', err);
    } finally {
      setLoadingAutoData(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.project || !formData.construction_stage) {
      setErrorMsg('Please select a target construction project and stage.');
      return;
    }

    if (!autoData) {
      setErrorMsg('Auto-fetched project data is loading. Please wait.');
      return;
    }

    const rain = Number(formData.rainfall_mm);
    if (rain < 0) {
      setErrorMsg('Rainfall amount cannot be negative.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Combine auto-fetched system values with site engineer's 3 editable inputs
      const payload = {
        project: Number(formData.project),
        day_number: autoData.day_number,
        building_type: autoData.building_type,
        blocks: autoData.blocks,
        floors: autoData.floors,
        area_sqft: autoData.area_sqft,
        total_budget: autoData.total_budget,
        expected_workers: autoData.expected_workers,
        current_workers: autoData.current_workers,
        attendance_percentage: autoData.attendance_percentage,
        rainfall_mm: Number(formData.rainfall_mm || 0),
        rain_affected_work: Boolean(formData.rain_affected_work),
        construction_stage: formData.construction_stage,
        progress_percentage: autoData.progress_percentage,
        budget_used: autoData.budget_used,
      };

      await onSave(payload, logItem?.id);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.day_number?.[0] || err.response?.data?.detail || err.response?.data?.error || 'Failed to save dataset record.';
      setErrorMsg(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-3xl overflow-hidden text-[#003135] my-8"
        >
          {/* Header */}
          <div className="bg-[#003135] text-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#0FA4AF]/20 border border-[#0FA4AF]/40 flex items-center justify-center text-[#0FA4AF]">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">
                  {isEdit ? 'Edit Today\'s Site Progress' : 'Record Project Daily Progress (AI Dataset)'}
                </h3>
                <p className="text-xs text-[#AFDDE5]">
                  Auto-fetches system metrics from Projects, Workers, Attendance, Tasks, & Expenses.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Target Project Dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Select Target Construction Project *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <select
                  name="project"
                  required
                  disabled={isEdit}
                  value={formData.project}
                  onChange={(e) => setFormData(prev => ({ ...prev, project: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF] cursor-pointer disabled:opacity-60"
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_code} - {p.project_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PREMIUM AUTO-FETCHED READ-ONLY SUMMARY CARDS */}
            {loadingAutoData ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                <div className="w-8 h-8 border-3 border-[#0FA4AF] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-bold text-gray-500">Auto-fetching system metrics from all modules...</p>
              </div>
            ) : autoData ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#0FA4AF]" />
                    Auto-Fetched System Metrics (Read-Only)
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Live System Sync
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                  
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold uppercase text-gray-500">Building Type</p>
                    <p className="text-xs font-extrabold text-[#003135]">{autoData.building_type}</p>
                    <p className="text-[10px] text-gray-400 font-semibold">{autoData.blocks} Blk | {autoData.floors} Flr</p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold uppercase text-gray-500">Workforce & Attendance</p>
                    <p className="text-xs font-extrabold text-[#003135]">{autoData.current_workers} Workers</p>
                    <p className="text-[10px] text-emerald-600 font-extrabold">{autoData.attendance_percentage}% Attendance</p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold uppercase text-gray-500">Budget Used / Total</p>
                    <p className="text-xs font-extrabold text-amber-600">₹{autoData.budget_used.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 font-semibold">of ₹{autoData.total_budget.toLocaleString()}</p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold uppercase text-gray-500">Progress & Timeline</p>
                    <p className="text-xs font-extrabold text-[#0FA4AF]">{autoData.progress_percentage}% Complete</p>
                    <p className="text-[10px] text-gray-500 font-bold">Day Number: {autoData.day_number}</p>
                  </div>

                </div>

                {/* Today's Completed Tasks Summary */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <p className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Today's Completed Work (Auto-Fetched Tasks Module)
                  </p>
                  {autoData.todays_completed_tasks?.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No tasks completed today.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {autoData.todays_completed_tasks.map((task) => (
                        <span key={task.id} className="text-[10px] font-bold bg-white text-[#003135] px-2.5 py-1 rounded-lg border border-gray-200 flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {task.task_id}: {task.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : null}

            {/* SMALL EDITABLE FORM (ONLY 3 INPUTS) */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#003135] flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-[#0FA4AF]" />
                Today's Site Environmental Conditions (Editable)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* 1. Rainfall (mm) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Rainfall (mm) *
                  </label>
                  <div className="relative">
                    <CloudRain className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      name="rainfall_mm"
                      required
                      value={formData.rainfall_mm}
                      onChange={(e) => setFormData(prev => ({ ...prev, rainfall_mm: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF]"
                    />
                  </div>
                </div>

                {/* 2. Rain Affected Work (Yes/No) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Rain Affected Work? *
                  </label>
                  <select
                    name="rain_affected_work"
                    value={formData.rain_affected_work ? 'YES' : 'NO'}
                    onChange={(e) => setFormData(prev => ({ ...prev, rain_affected_work: e.target.value === 'YES' }))}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF] cursor-pointer"
                  >
                    <option value="NO">No (Work Unaffected)</option>
                    <option value="YES">Yes (Work Delayed/Interrupted)</option>
                  </select>
                </div>

                {/* 3. Construction Stage */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Construction Stage *
                  </label>
                  <select
                    name="construction_stage"
                    value={formData.construction_stage}
                    onChange={(e) => setFormData(prev => ({ ...prev, construction_stage: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF] cursor-pointer"
                  >
                    <option value="Excavation & Substructure">Excavation & Substructure</option>
                    <option value="Foundation & Slab Pouring">Foundation & Slab Pouring</option>
                    <option value="Structural Steel & Superstructure">Structural Steel & Superstructure</option>
                    <option value="Masonry & External Walls">Masonry & External Walls</option>
                    <option value="MEP Rough-In">MEP Rough-In</option>
                    <option value="Interior Finishing">Interior Finishing</option>
                    <option value="Façade & Cladding">Façade & Cladding</option>
                    <option value="Landscaping & Handover">Landscaping & Handover</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !autoData}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white gradient-btn shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Save AI Dataset Record</span>
                )}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DailyLogModal;
