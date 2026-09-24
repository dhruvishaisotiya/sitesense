import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, AlertCircle, Check, TrendingUp, UserPlus, HardHat } from 'lucide-react';
import { getAvailableManagers, getAvailableEngineers, createUser } from '../api/projects';

const ProjectModal = ({ isOpen, onClose, onSave, project = null, loading = false }) => {
  const [managers, setManagers] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [selectedEngineers, setSelectedEngineers] = useState([]);
  const [formError, setFormError] = useState('');

  // Quick User Creation Modal State
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [newUserRole, setNewUserRole] = useState('SITE_ENGINEER'); // 'PROJECT_MANAGER' | 'SITE_ENGINEER'
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserError, setCreateUserError] = useState('');
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    department: '',
    employee_id: '',
  });

  const isEditing = !!project;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      project_name: '',
      building_type: 'Commercial',
      blocks: 1,
      floors: 1,
      area_sqft: 50000,
      total_budget: 1000000,
      current_progress: 0,
      start_date: new Date().toISOString().split('T')[0],
      planned_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'PLANNING',
      assigned_manager: '',
      description: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setFormError('');
      fetchInitialData();

      if (project) {
        setValue('project_name', project.project_name);
        setValue('building_type', project.building_type);
        setValue('blocks', project.blocks);
        setValue('floors', project.floors);
        setValue('area_sqft', project.area_sqft);
        setValue('total_budget', project.total_budget);
        setValue('current_progress', project.current_progress || 0);
        setValue('start_date', project.start_date);
        setValue('planned_end_date', project.planned_end_date);
        setValue('status', project.status);
        setValue('assigned_manager', project.assigned_manager || '');
        setValue('description', project.description || '');

        const engIds = project.assigned_engineers || [];
        setSelectedEngineers(engIds);
      } else {
        setSelectedEngineers([]);
        reset({
          project_name: '',
          building_type: 'Commercial',
          blocks: 1,
          floors: 1,
          area_sqft: 50000,
          total_budget: 5000000,
          current_progress: 0,
          start_date: new Date().toISOString().split('T')[0],
          planned_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'PLANNING',
          assigned_manager: '',
          description: '',
        });
      }
    }
  }, [isOpen, project, setValue, reset]);

  const fetchInitialData = async () => {
    try {
      const [mgrData, engData] = await Promise.all([
        getAvailableManagers(),
        getAvailableEngineers(),
      ]);
      setManagers(mgrData);
      setEngineers(engData);
    } catch (err) {
      console.error('Failed to fetch available managers/engineers:', err);
    }
  };

  const toggleEngineerSelection = (engId) => {
    setSelectedEngineers((prev) =>
      prev.includes(engId) ? prev.filter((id) => id !== engId) : [...prev, engId]
    );
  };

  const handleOpenCreateUser = (roleToCreate) => {
    setNewUserRole(roleToCreate);
    setCreateUserError('');
    setNewUserData({
      email: '',
      password: 'password123',
      first_name: '',
      last_name: '',
      phone_number: '',
      department: '',
      employee_id: '',
    });
    setCreateUserModalOpen(true);
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setCreateUserError('');
    if (!newUserData.email || !newUserData.first_name || !newUserData.last_name) {
      setCreateUserError('Unique Email, First Name, and Last Name are required.');
      return;
    }

    try {
      setCreateUserLoading(true);
      const payload = {
        ...newUserData,
        role: newUserRole,
      };
      const created = await createUser(payload);
      const newUser = created.user || created;

      // Refresh list
      await fetchInitialData();

      // Auto select newly created user
      if (newUserRole === 'PROJECT_MANAGER') {
        setValue('assigned_manager', newUser.id);
      } else if (newUserRole === 'SITE_ENGINEER') {
        setSelectedEngineers((prev) => (prev.includes(newUser.id) ? prev : [...prev, newUser.id]));
      }

      setCreateUserModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to create user.';
      setCreateUserError(msg);
    } finally {
      setCreateUserLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setFormError('');
    const formattedData = {
      ...data,
      blocks: Number(data.blocks),
      floors: Number(data.floors),
      area_sqft: Number(data.area_sqft),
      total_budget: Number(data.total_budget),
      current_progress: Number(data.current_progress || 0),
      assigned_manager: data.assigned_manager ? Number(data.assigned_manager) : null,
      assigned_engineers: selectedEngineers,
    };

    try {
      await onSave(formattedData);
    } catch (err) {
      const errorMsg =
        err.response?.data?.planned_end_date?.[0] ||
        err.response?.data?.assigned_manager?.[0] ||
        err.response?.data?.assigned_engineers?.[0] ||
        err.response?.data?.detail ||
        'Failed to save project. Please check form entries.';
      setFormError(errorMsg);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-8 text-[#003135] shadow-2xl relative border border-gray-100 my-8"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-[#003135] text-[#0FA4AF]">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#003135] tracking-tight">
                  {isEditing ? 'Edit Construction Project' : 'Create New Construction Project'}
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  {isEditing ? `Modifying project ${project?.project_code}` : 'Admin project initialization and manager/engineer assignment'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Level Error */}
          {formError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Project Name */}
            <div>
              <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                Project Name *
              </label>
              <input
                type="text"
                {...register('project_name', { required: 'Project Name is required' })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                placeholder="e.g. Apex Horizon Commercial Towers"
              />
              {errors.project_name && (
                <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.project_name.message}</p>
              )}
            </div>

            {/* Overall Progress (%) for Edit Mode */}
            {isEditing && (
              <div className="bg-[#0FA4AF]/5 p-4 rounded-2xl border border-[#0FA4AF]/20">
                <label className="block text-xs font-extrabold text-[#003135] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#0FA4AF]" />
                  Overall Project Progress Percentage (%) *
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    {...register('current_progress', { required: true, min: 0, max: 100 })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] transition-all"
                    placeholder="e.g. 45"
                  />
                  <span className="text-xs font-bold text-[#0FA4AF] bg-white px-4 py-3 rounded-xl border border-[#0FA4AF]/30 shrink-0">
                    % Complete
                  </span>
                </div>
              </div>
            )}

            {/* Building Type & Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                  Building Type *
                </label>
                <select
                  {...register('building_type', { required: true })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Mixed-Use">Mixed-Use</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                  Initial Status *
                </label>
                <select
                  {...register('status', { required: true })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                >
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            {/* Blocks, Floors, Area Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                  Blocks
                </label>
                <input
                  type="number"
                  min="1"
                  {...register('blocks', { required: true, min: 1 })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                  Floors
                </label>
                <input
                  type="number"
                  min="1"
                  {...register('floors', { required: true, min: 1 })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                  Area (sqft)
                </label>
                <input
                  type="number"
                  min="0"
                  {...register('area_sqft', { required: true, min: 0 })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Budget & Project Manager Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                  Total Budget (₹ INR) *
                </label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  {...register('total_budget', { required: 'Budget is required', min: 0 })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                  placeholder="e.g. 5000000"
                />
                {errors.total_budget && (
                  <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.total_budget.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider">
                    Assign Project Manager
                  </label>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateUser('PROJECT_MANAGER')}
                    className="text-[11px] font-bold text-[#0FA4AF] hover:text-[#003135] flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ New PM</span>
                  </button>
                </div>

                <select
                  {...register('assigned_manager')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                >
                  <option value="">-- Select Project Manager --</option>
                  {managers.map((mgr) => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.full_name} ({mgr.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Site Engineers Assignment Section */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <HardHat className="w-4 h-4 text-[#0FA4AF]" />
                  <label className="text-xs font-extrabold text-[#003135] uppercase tracking-wider">
                    Assign Site Engineers
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenCreateUser('SITE_ENGINEER')}
                  className="text-[11px] font-bold text-[#0FA4AF] hover:text-[#003135] flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ New Site Engineer</span>
                </button>
              </div>

              <p className="text-[11px] text-gray-500 mb-3">
                Select one or multiple site engineers to manage site execution and daily logs for this project:
              </p>

              {engineers.length === 0 ? (
                <div className="p-3 text-center bg-white rounded-xl border border-dashed border-gray-300">
                  <p className="text-xs text-gray-400">No active Site Engineers found. Click "+ New Site Engineer" to add one.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {engineers.map((eng) => {
                    const isSelected = selectedEngineers.includes(eng.id);
                    return (
                      <div
                        key={eng.id}
                        onClick={() => toggleEngineerSelection(eng.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#0FA4AF]/10 border-[#0FA4AF] text-[#003135] font-bold'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate pr-2">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border text-white text-[10px] ${
                            isSelected ? 'bg-[#0FA4AF] border-[#0FA4AF]' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <div className="truncate">
                            <p className="text-xs truncate font-semibold">{eng.full_name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{eng.email}</p>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono shrink-0">
                          Eng
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Start Date & Planned End Date Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                  Start Date *
                </label>
                <input
                  type="date"
                  {...register('start_date', { required: 'Start Date is required' })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                  Planned End Date *
                </label>
                <input
                  type="date"
                  {...register('planned_end_date', { required: 'End Date is required' })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                />
                {errors.planned_end_date && (
                  <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.planned_end_date.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                Description / Scope
              </label>
              <textarea
                rows={3}
                {...register('description')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                placeholder="Enter project specifications, engineering scope, or architectural details..."
              ></textarea>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-3 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl text-xs font-bold text-white gradient-btn flex items-center space-x-2 shadow-lg cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isEditing ? 'Save Changes' : 'Initialize Project'}</span>
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Quick Create User Sub-Modal */}
          <AnimatePresence>
            {createUserModalOpen && (
              <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-md bg-white rounded-3xl p-6 text-[#003135] shadow-2xl relative border border-gray-100"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <UserPlus className="w-5 h-5 text-[#0FA4AF]" />
                      <h3 className="text-base font-extrabold text-[#003135]">
                        Create New {newUserRole === 'PROJECT_MANAGER' ? 'Project Manager' : 'Site Engineer'}
                      </h3>
                    </div>
                    <button
                      onClick={() => setCreateUserModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {createUserError && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{createUserError}</span>
                    </div>
                  )}

                  <form onSubmit={handleCreateUserSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#003135] mb-1">First Name *</label>
                        <input
                          type="text"
                          required
                          value={newUserData.first_name}
                          onChange={(e) => setNewUserData({ ...newUserData, first_name: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF]"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#003135] mb-1">Last Name *</label>
                        <input
                          type="text"
                          required
                          value={newUserData.last_name}
                          onChange={(e) => setNewUserData({ ...newUserData, last_name: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF]"
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#003135] mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={newUserData.email}
                        onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF]"
                        placeholder="john.doe@sitesense.ai"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#003135] mb-1">
                        Login Password (Default: password123)
                      </label>
                      <input
                        type="password"
                        required
                        value={newUserData.password}
                        onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF]"
                        placeholder="password123"
                      />
                      <p className="text-[10px] text-gray-400 mt-0.5">Use same password standard or customize for login.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#003135] mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={newUserData.phone_number}
                          onChange={(e) => setNewUserData({ ...newUserData, phone_number: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF]"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#003135] mb-1">Department</label>
                        <input
                          type="text"
                          value={newUserData.department}
                          onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF]"
                          placeholder="Civil Engineering"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setCreateUserModalOpen(false)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createUserLoading}
                        className="px-5 py-2 rounded-xl text-xs font-bold text-white gradient-btn flex items-center space-x-1 cursor-pointer"
                      >
                        {createUserLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Create & Select</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProjectModal;
