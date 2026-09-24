import React, { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import Navbar from '../components/Navbar';
import WorkerModal from '../components/WorkerModal';
import WorkerDetailsModal from '../components/WorkerDetailsModal';
import AssignWorkerModal from '../components/AssignWorkerModal';
import RemoveWorkerConfirmModal from '../components/RemoveWorkerConfirmModal';
import { getWorkers, createWorker, updateWorker, assignWorker, removeWorker } from '../api/workers';
import { Users, UserPlus, Search, Grid, List as ListIcon, Building2, IndianRupee, Eye, Edit3, UserCheck, UserMinus, CheckCircle2, HardHat } from 'lucide-react';

const WorkersPage = () => {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';
  const canManage = role === 'ADMIN' || role === 'PROJECT_MANAGER';

  // State
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [empTypeFilter, setEmpTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedWorkerForEdit, setSelectedWorkerForEdit] = useState(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedWorkerForDetails, setSelectedWorkerForDetails] = useState(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedWorkerForAssign, setSelectedWorkerForAssign] = useState(null);

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [selectedWorkerForRemove, setSelectedWorkerForRemove] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  const fetchWorkersList = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (skillFilter) params.skill = skillFilter;
      if (empTypeFilter) params.employment_type = empTypeFilter;
      if (statusFilter) params.status = statusFilter;

      const data = await getWorkers(params);
      setWorkers(data.results || data);
    } catch (err) {
      console.error('Failed to fetch workers:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, skillFilter, empTypeFilter, statusFilter]);

  useEffect(() => {
    fetchWorkersList();
  }, [fetchWorkersList]);

  // Action Handlers
  const handleCreateNew = () => {
    setSelectedWorkerForEdit(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (worker) => {
    setSelectedWorkerForEdit(worker);
    setIsFormModalOpen(true);
  };

  const handleViewDetails = (worker) => {
    setSelectedWorkerForDetails(worker);
    setIsDetailsModalOpen(true);
  };

  const handleOpenAssign = (worker) => {
    setSelectedWorkerForAssign(worker);
    setIsAssignModalOpen(true);
  };

  const handleOpenRemove = (worker) => {
    setSelectedWorkerForRemove(worker);
    setIsRemoveModalOpen(true);
  };

  const handleSaveWorker = async (formData) => {
    setActionLoading(true);
    try {
      if (selectedWorkerForEdit) {
        await updateWorker(selectedWorkerForEdit.id, formData);
      } else {
        await createWorker(formData);
      }
      setIsFormModalOpen(false);
      fetchWorkersList();
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignWorker = async (workerId, projectId) => {
    setActionLoading(true);
    try {
      await assignWorker(workerId, projectId);
      setIsAssignModalOpen(false);
      fetchWorkersList();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveWorker = async () => {
    if (!selectedWorkerForRemove) return;
    setActionLoading(true);
    try {
      await removeWorker(selectedWorkerForRemove.id);
      setIsRemoveModalOpen(false);
      fetchWorkersList();
    } catch (err) {
      console.error('Failed to remove worker:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const totalWorkersCount = workers.length;
  const activeAssignedCount = workers.filter((w) => w.current_assignment?.project_detail).length;
  const permanentCount = workers.filter((w) => w.employment_type === 'Permanent').length;
  const dailyWageCount = workers.filter((w) => w.employment_type === 'Daily Wage').length;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="min-h-screen bg-[#003135] text-white flex flex-col selection:bg-[#0FA4AF] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Construction Workers Directory
              </h1>
              <span className="text-xs px-3 py-1 rounded-full bg-[#0FA4AF]/20 text-[#0FA4AF] border border-[#0FA4AF]/40 font-bold">
                MODULE 3
              </span>
            </div>
            <p className="text-xs text-[#AFDDE5] mt-1">
              {canManage
                ? 'Manage site workforce profiles, skill categories, daily wages, and active project assignments.'
                : 'Assigned site workforce roster (Read-Only access).'}
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={handleCreateNew}
              className="px-5 py-3 rounded-xl text-xs font-bold text-white gradient-btn flex items-center space-x-2 shadow-lg shadow-[#0FA4AF]/20 cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Worker</span>
            </button>
          )}
        </div>

        {/* Stats Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-[#024950] text-[#0FA4AF]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-[#AFDDE5] font-medium uppercase">Total Roster</p>
              <h3 className="text-xl font-extrabold text-white">{totalWorkersCount}</h3>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-[#AFDDE5] font-medium uppercase">Active On-Site</p>
              <h3 className="text-xl font-extrabold text-white">{activeAssignedCount}</h3>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-[#AFDDE5] font-medium uppercase">Permanent Staff</p>
              <h3 className="text-xl font-extrabold text-white">{permanentCount}</h3>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-[#0FA4AF]/20 text-[#0FA4AF] border border-[#0FA4AF]/30">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-[#AFDDE5] font-medium uppercase">Daily Wage Staff</p>
              <h3 className="text-xl font-extrabold text-white">{dailyWageCount}</h3>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters, View Modes */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#AFDDE5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search worker by name, ID, skill..."
              className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#0FA4AF] transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            
            {/* Skill Category Filter */}
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#0FA4AF]"
            >
              <option value="" className="bg-[#003135]">All Skills</option>
              <option value="Masonry" className="bg-[#003135]">Masonry</option>
              <option value="Carpentry" className="bg-[#003135]">Carpentry</option>
              <option value="Electrical" className="bg-[#003135]">Electrical</option>
              <option value="Plumbing" className="bg-[#003135]">Plumbing</option>
              <option value="Steel Fixing" className="bg-[#003135]">Steel Fixing</option>
              <option value="Welding" className="bg-[#003135]">Welding</option>
              <option value="Scaffolding" className="bg-[#003135]">Scaffolding</option>
              <option value="Heavy Equipment Operator" className="bg-[#003135]">Heavy Equipment</option>
              <option value="General Labor" className="bg-[#003135]">General Labor</option>
              <option value="Safety Inspector" className="bg-[#003135]">Safety Inspector</option>
            </select>

            {/* Employment Type Filter */}
            <select
              value={empTypeFilter}
              onChange={(e) => setEmpTypeFilter(e.target.value)}
              className="px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#0FA4AF]"
            >
              <option value="" className="bg-[#003135]">All Employment Types</option>
              <option value="Permanent" className="bg-[#003135]">Permanent</option>
              <option value="Contract" className="bg-[#003135]">Contract</option>
              <option value="Daily Wage" className="bg-[#003135]">Daily Wage</option>
            </select>

            {/* Status Toggle */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#0FA4AF]"
            >
              <option value="Active" className="bg-[#003135]">Active Workers</option>
              <option value="Inactive" className="bg-[#003135]">Inactive Workers</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#0FA4AF] text-white' : 'text-gray-400 hover:text-white'}`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-[#0FA4AF] text-white' : 'text-gray-400 hover:text-white'}`}
                title="Table View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Content Section: Grid View vs Table View */}
        {loading ? (
          /* Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                    <div className="h-3 bg-white/5 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="h-16 bg-white/5 rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : workers.length === 0 ? (
          /* Empty State */
          <div className="glass-panel rounded-3xl p-12 text-center border border-white/10 space-y-4">
            <Users className="w-12 h-12 text-[#0FA4AF] mx-auto opacity-50" />
            <h3 className="text-lg font-bold text-white">No Construction Workers Found</h3>
            <p className="text-xs text-[#AFDDE5] max-w-sm mx-auto">
              {searchQuery || skillFilter || empTypeFilter
                ? 'Try clearing search terms or active filters.'
                : 'No site workers registered yet.'}
            </p>
            {isAdmin && (
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl gradient-btn text-white text-xs font-bold shadow-lg"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register First Worker</span>
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid Cards View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workers.map((worker, index) => {
              const currentAssignment = worker.current_assignment;
              const project = currentAssignment?.project_detail;

              return (
                <motion.div
                  key={worker.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="glass-panel-light rounded-3xl p-6 text-[#003135] shadow-xl relative border border-white/80 flex flex-col justify-between hover:shadow-2xl transition-all duration-300"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-[#003135] border border-slate-200">
                        {worker.worker_id}
                      </span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#0FA4AF]/10 text-[#0FA4AF] border border-[#0FA4AF]/30">
                        {worker.skill_category}
                      </span>
                    </div>

                    {/* Profile Banner */}
                    <div className="flex items-center space-x-3 mb-4">
                      <img
                        src={worker.profile_photo || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"}
                        alt={worker.full_name}
                        className="w-12 h-12 rounded-2xl object-cover border border-[#0FA4AF]"
                      />
                      <div>
                        <h3 
                          onClick={() => handleViewDetails(worker)}
                          className="text-base font-extrabold text-[#003135] tracking-tight hover:text-[#0FA4AF] transition-colors cursor-pointer line-clamp-1"
                        >
                          {worker.full_name}
                        </h3>
                        <p className="text-xs text-gray-500 font-semibold">{worker.designation}</p>
                      </div>
                    </div>

                    {/* Wage & Employment Pill */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-center mb-4">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Daily Wage</p>
                        <p className="text-xs font-extrabold text-emerald-700">{formatCurrency(worker.daily_wage)}/day</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Employment</p>
                        <p className="text-xs font-bold text-[#003135]">{worker.employment_type}</p>
                      </div>
                    </div>

                    {/* Active Assignment Pill */}
                    <div className="mb-4">
                      {project ? (
                        <div className="p-2.5 bg-[#003135] text-white rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 truncate">
                            <Building2 className="w-4 h-4 text-[#0FA4AF] shrink-0" />
                            <span className="font-bold truncate">{project.project_name}</span>
                          </div>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#0FA4AF]/20 text-[#0FA4AF]">
                            {project.project_code}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-amber-50 text-amber-800 rounded-xl flex items-center justify-between text-xs border border-amber-200">
                          <span className="font-semibold text-[11px]">Unassigned (Available)</span>
                          {canManage && (
                            <button
                              onClick={() => handleOpenAssign(worker)}
                              className="text-[10px] font-bold text-amber-900 underline hover:text-amber-700"
                            >
                              Assign
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleViewDetails(worker)}
                      className="text-xs font-bold text-[#0FA4AF] hover:text-[#024950] flex items-center space-x-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    {canManage && (
                      <div className="flex items-center space-x-1">
                        {project ? (
                          <button
                            onClick={() => handleOpenRemove(worker)}
                            title="Remove from Project"
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAssign(worker)}
                            title="Assign to Project"
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleEdit(worker)}
                          title="Edit Worker"
                          className="p-1.5 text-gray-500 hover:text-[#003135] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Table View Layout */
          <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white">
                <thead className="bg-[#024950]/80 text-[#AFDDE5] uppercase font-bold text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4">Worker</th>
                    <th className="px-6 py-4">Skill Category</th>
                    <th className="px-6 py-4">Daily Wage</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Current Project Site</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {workers.map((worker) => {
                    const currentAssignment = worker.current_assignment;
                    const project = currentAssignment?.project_detail;

                    return (
                      <tr key={worker.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={worker.profile_photo || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"}
                              alt={worker.full_name}
                              className="w-8 h-8 rounded-full object-cover border border-[#0FA4AF]"
                            />
                            <div>
                              <span className="text-[10px] font-mono text-[#0FA4AF] font-bold">
                                {worker.worker_id}
                              </span>
                              <h4 
                                onClick={() => handleViewDetails(worker)}
                                className="font-bold text-white hover:text-[#0FA4AF] cursor-pointer"
                              >
                                {worker.full_name}
                              </h4>
                              <p className="text-[10px] text-gray-400">{worker.designation}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300 font-medium">
                          {worker.skill_category}
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-400">
                          {formatCurrency(worker.daily_wage)}/day
                        </td>
                        <td className="px-6 py-4 text-[#AFDDE5] font-mono">
                          {worker.phone_number}
                        </td>
                        <td className="px-6 py-4">
                          {project ? (
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[#0FA4AF]" />
                              {project.project_name}
                            </span>
                          ) : (
                            <span className="text-[11px] text-amber-300 font-medium">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewDetails(worker)}
                              className="p-1.5 text-[#0FA4AF] hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canManage && (
                              <>
                                {project ? (
                                  <button
                                    onClick={() => handleOpenRemove(worker)}
                                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                    title="Remove from Project"
                                  >
                                    <UserMinus className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleOpenAssign(worker)}
                                    className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                    title="Assign to Project"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEdit(worker)}
                                  className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Worker"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Modals */}
      <WorkerModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveWorker}
        worker={selectedWorkerForEdit}
        loading={actionLoading}
      />

      <WorkerDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        worker={selectedWorkerForDetails}
        onEdit={handleEdit}
        onAssign={handleOpenAssign}
        onRemove={handleOpenRemove}
        canManage={canManage}
      />

      <AssignWorkerModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={handleAssignWorker}
        worker={selectedWorkerForAssign}
        loading={actionLoading}
      />

      <RemoveWorkerConfirmModal
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onConfirm={handleRemoveWorker}
        worker={selectedWorkerForRemove}
        loading={actionLoading}
      />

    </div>
  );
};

export default WorkersPage;
