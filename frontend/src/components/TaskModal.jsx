import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckSquare, Building2, User, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { getProjects } from '../api/projects';
import { getAvailableEngineers } from '../api/tasks';

const TaskModal = ({ isOpen, onClose, onSave, task = null }) => {
  const isEdit = Boolean(task);

  const [projects, setProjects] = useState([]);
  const [engineers, setEngineers] = useState([]);

  const [formData, setFormData] = useState({
    project: '',
    assigned_engineer: '',
    title: '',
    description: '',
    priority: 'Medium',
    due_date: new Date().toISOString().split('T')[0],
    estimated_hours: 16.0,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Depends only on `task`, which the effect below already tracks, so adding
  // it to that effect's deps causes no extra fetches.
  const fetchDropdowns = useCallback(async () => {
    try {
      const [projData, engData] = await Promise.all([
        getProjects({ status: 'ACTIVE' }),
        getAvailableEngineers()
      ]);
      const projList = projData.results || projData;
      setProjects(projList);
      setEngineers(engData.results || engData);

      if (!task && projList.length > 0) {
        setFormData(prev => ({ ...prev, project: projList[0].id }));
      }
    } catch (err) {
      console.error('Failed to load task modal dropdowns:', err);
    }
  }, [task]);

  useEffect(() => {
    if (isOpen) {
      fetchDropdowns();
      if (task) {
        setFormData({
          project: task.project || task.project_detail?.id || '',
          assigned_engineer: task.assigned_engineer || task.assigned_engineer_detail?.id || '',
          title: task.title || '',
          description: task.description || '',
          priority: task.priority || 'Medium',
          due_date: task.due_date || new Date().toISOString().split('T')[0],
          estimated_hours: task.estimated_hours || 16.0,
        });
      } else {
        setFormData({
          project: '',
          assigned_engineer: '',
          title: '',
          description: '',
          priority: 'Medium',
          due_date: new Date().toISOString().split('T')[0],
          estimated_hours: 16.0,
        });
      }
      setErrorMsg('');
    }
  }, [isOpen, task, fetchDropdowns]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.project || !formData.due_date) {
      setErrorMsg('Please fill in all required task fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        ...formData,
        project: Number(formData.project),
        assigned_engineer: formData.assigned_engineer ? Number(formData.assigned_engineer) : null,
        estimated_hours: Number(formData.estimated_hours || 0),
      };

      await onSave(payload, task?.id);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Failed to save task.';
      setErrorMsg(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-xl overflow-hidden text-[#003135]"
        >
          {/* Header */}
          <div className="bg-[#003135] text-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#0FA4AF]/20 border border-[#0FA4AF]/40 flex items-center justify-center text-[#0FA4AF]">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">
                  {isEdit ? `Edit Task (${task.task_id})` : 'Create Construction Task'}
                </h3>
                <p className="text-xs text-[#AFDDE5]">
                  Assign site engineers, set priorities, and establish due dates.
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Task Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Foundation Concrete Pouring & Quality Audit"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF] focus:ring-1 focus:ring-[#0FA4AF]"
              />
            </div>

            {/* Project & Assigned Engineer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Target Project *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <select
                    name="project"
                    required
                    value={formData.project}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF] cursor-pointer"
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Assign Site Engineer
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <select
                    name="assigned_engineer"
                    value={formData.assigned_engineer}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF] cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {engineers.map((eng) => (
                      <option key={eng.id} value={eng.id}>
                        {eng.full_name} ({eng.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Priority, Due Date, Estimated Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF] cursor-pointer"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Due Date *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="date"
                    name="due_date"
                    required
                    value={formData.due_date}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Est. Hours
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    name="estimated_hours"
                    value={formData.estimated_hours}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF]"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Task Specifications / Scope
              </label>
              <textarea
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide task scope details, specifications, and safety guidelines..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0FA4AF]"
              ></textarea>
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
                disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white gradient-btn shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>{isEdit ? 'Save Changes' : 'Create Task'}</span>
                )}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaskModal;
