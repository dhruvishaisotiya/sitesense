import React, { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import Navbar from '../components/Navbar';
import ProjectModal from '../components/ProjectModal';
import ProjectDetailsModal from '../components/ProjectDetailsModal';
import ArchiveConfirmModal from '../components/ArchiveConfirmModal';
import { getProjects, createProject, updateProject, archiveProject, restoreProject, deleteProject } from '../api/projects';
import { Plus, Search, Grid, List as ListIcon, Archive, Building2, IndianRupee, Clock, Eye, Edit3, RotateCcw, FolderKanban, CheckCircle2 } from 'lucide-react';

const ProjectsPage = () => {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  // State Management
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [buildingTypeFilter, setBuildingTypeFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedProjectForConfirm, setSelectedProjectForConfirm] = useState(null);
  const [confirmActionType, setConfirmActionType] = useState('ARCHIVE');

  const [actionLoading, setActionLoading] = useState(false);

  const fetchProjectsList = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      if (buildingTypeFilter) params.building_type = buildingTypeFilter;
      if (showArchived) params.is_archived = 'true';

      const data = await getProjects(params);
      setProjects(data.results || data);
    } catch (err) {
      console.error('Failed to fetch projects list:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, buildingTypeFilter, showArchived]);

  useEffect(() => {
    fetchProjectsList();
  }, [fetchProjectsList]);

  // Actions
  const handleCreateNew = () => {
    setSelectedProjectForEdit(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (project) => {
    setSelectedProjectForEdit(project);
    setIsFormModalOpen(true);
  };

  const handleViewDetails = (project) => {
    setSelectedProjectForDetails(project);
    setIsDetailsModalOpen(true);
  };

  const handleOpenConfirm = (project, actionType) => {
    setSelectedProjectForConfirm(project);
    setConfirmActionType(actionType);
    setIsConfirmModalOpen(true);
  };

  const handleSaveProject = async (formData) => {
    setActionLoading(true);
    try {
      if (selectedProjectForEdit) {
        await updateProject(selectedProjectForEdit.id, formData);
      } else {
        await createProject(formData);
      }
      setIsFormModalOpen(false);
      fetchProjectsList();
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedProjectForConfirm) return;
    setActionLoading(true);
    try {
      if (confirmActionType === 'ARCHIVE') {
        await archiveProject(selectedProjectForConfirm.id);
      } else if (confirmActionType === 'RESTORE') {
        await restoreProject(selectedProjectForConfirm.id);
      } else if (confirmActionType === 'DELETE') {
        await deleteProject(selectedProjectForConfirm.id);
      }
      setIsConfirmModalOpen(false);
      fetchProjectsList();
    } catch (err) {
      console.error('Failed confirm action:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics Calculations
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === 'ACTIVE').length;
  const planningProjects = projects.filter((p) => p.status === 'PLANNING').length;
  const totalBudgetSum = projects.reduce((acc, p) => acc + Number(p.total_budget || 0), 0);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const getStatusBadgeClass = (status) => {
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

  return (
    <div className="min-h-screen bg-[#003135] text-white flex flex-col selection:bg-[#0FA4AF] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {showArchived ? 'Archived Construction Projects' : 'Construction Projects Directory'}
              </h1>
              <span className="text-xs px-3 py-1 rounded-full bg-[#0FA4AF]/20 text-[#0FA4AF] border border-[#0FA4AF]/40 font-bold">
                MODULE 2
              </span>
            </div>
            <p className="text-xs text-[#AFDDE5] mt-1">
              {isAdmin
                ? 'Manage enterprise projects, building specifications, timelines, and Project Manager assignments.'
                : 'Assigned construction projects dashboard (Read-Only access).'}
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={handleCreateNew}
              className="px-5 py-3 rounded-xl text-xs font-bold text-white gradient-btn flex items-center space-x-2 shadow-lg shadow-[#0FA4AF]/20 cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Initialize New Project</span>
            </button>
          )}
        </div>

        {/* Stats Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-[#024950] text-[#0FA4AF]">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-[#AFDDE5] font-medium uppercase">Total Projects</p>
              <h3 className="text-xl font-extrabold text-white">{totalProjects}</h3>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-[#AFDDE5] font-medium uppercase">Active Sites</p>
              <h3 className="text-xl font-extrabold text-white">{activeProjects}</h3>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-[#AFDDE5] font-medium uppercase">Planning Phase</p>
              <h3 className="text-xl font-extrabold text-white">{planningProjects}</h3>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-[#0FA4AF]/20 text-[#0FA4AF] border border-[#0FA4AF]/30">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-[#AFDDE5] font-medium uppercase">Total Allocated Budget</p>
              <h3 className="text-lg font-extrabold text-[#AFDDE5] truncate">{formatCurrency(totalBudgetSum)}</h3>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters, View Modes */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#AFDDE5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, name, type..."
              className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#0FA4AF] transition-colors"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            
            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#0FA4AF]"
            >
              <option value="" className="bg-[#003135]">All Statuses</option>
              <option value="PLANNING" className="bg-[#003135]">Planning</option>
              <option value="ACTIVE" className="bg-[#003135]">Active</option>
              <option value="ON_HOLD" className="bg-[#003135]">On Hold</option>
              <option value="COMPLETED" className="bg-[#003135]">Completed</option>
            </select>

            {/* Building Type Dropdown */}
            <select
              value={buildingTypeFilter}
              onChange={(e) => setBuildingTypeFilter(e.target.value)}
              className="px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#0FA4AF]"
            >
              <option value="" className="bg-[#003135]">All Building Types</option>
              <option value="Residential" className="bg-[#003135]">Residential</option>
              <option value="Commercial" className="bg-[#003135]">Commercial</option>
              <option value="Industrial" className="bg-[#003135]">Industrial</option>
              <option value="Infrastructure" className="bg-[#003135]">Infrastructure</option>
              <option value="Mixed-Use" className="bg-[#003135]">Mixed-Use</option>
            </select>

            {/* Archive Toggle Button (Admin only) */}
            {isAdmin && (
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 cursor-pointer ${
                  showArchived
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-black/20 text-gray-300 border-white/10 hover:border-white/20'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{showArchived ? 'Showing Archived' : 'Archived'}</span>
              </button>
            )}

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
          /* Loading Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4 animate-pulse">
                <div className="h-5 bg-white/10 rounded w-1/3"></div>
                <div className="h-6 bg-white/10 rounded w-3/4"></div>
                <div className="h-20 bg-white/5 rounded-2xl"></div>
                <div className="h-10 bg-white/10 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          /* Empty State */
          <div className="glass-panel rounded-3xl p-12 text-center border border-white/10 space-y-4">
            <Building2 className="w-12 h-12 text-[#0FA4AF] mx-auto opacity-50" />
            <h3 className="text-lg font-bold text-white">No Construction Projects Found</h3>
            <p className="text-xs text-[#AFDDE5] max-w-sm mx-auto">
              {searchQuery || statusFilter || buildingTypeFilter
                ? 'Try clearing active search or filters to locate projects.'
                : 'No construction projects initialized yet.'}
            </p>
            {isAdmin && !showArchived && (
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl gradient-btn text-white text-xs font-bold shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Project</span>
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => {
              const manager = project.assigned_manager_detail;

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="glass-panel-light rounded-3xl p-6 text-[#003135] shadow-xl relative border border-white/80 flex flex-col justify-between hover:shadow-2xl transition-all duration-300"
                >
                  <div>
                    {/* Header: Code & Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-[#003135] border border-slate-200">
                        {project.project_code}
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${getStatusBadgeClass(project.status)}`}>
                        {project.status_display || project.status}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 
                      onClick={() => handleViewDetails(project)}
                      className="text-lg font-extrabold text-[#003135] tracking-tight hover:text-[#0FA4AF] transition-colors cursor-pointer line-clamp-1 mb-1"
                    >
                      {project.project_name}
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold mb-4">
                      {project.building_type} Construction
                    </p>

                    {/* Specifications Grid */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center mb-4">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Blocks/Flrs</p>
                        <p className="text-xs font-bold text-[#003135]">{project.blocks} Blk / {project.floors} Flr</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Area</p>
                        <p className="text-xs font-bold text-[#003135]">{Number(project.area_sqft).toLocaleString()} sqft</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Budget</p>
                        <p className="text-xs font-extrabold text-emerald-700">{formatCurrency(project.total_budget)}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-gray-500">Progress</span>
                        <span className="text-[#0FA4AF]">{project.current_progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#0FA4AF] rounded-full"
                          style={{ width: `${Math.max(project.current_progress, 3)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Assigned Manager Pill */}
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-5">
                      <div className="flex items-center space-x-2">
                        <img
                          src={manager?.avatar_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150"}
                          alt={manager?.full_name || "Manager"}
                          className="w-6 h-6 rounded-full object-cover border border-[#0FA4AF]"
                        />
                        <div className="text-left">
                          <p className="text-[10px] text-gray-400 font-bold uppercase leading-none">Project Mgr</p>
                          <p className="text-xs font-bold text-[#003135] leading-tight">
                            {manager ? manager.full_name : 'Unassigned'}
                          </p>
                        </div>
                      </div>
                      {project.assigned_engineers_detail && project.assigned_engineers_detail.length > 0 && (
                        <span className="text-[10px] font-bold text-[#0FA4AF] bg-[#0FA4AF]/10 px-2 py-0.5 rounded-full border border-[#0FA4AF]/20">
                          {project.assigned_engineers_detail.length} Eng
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleViewDetails(project)}
                      className="text-xs font-bold text-[#0FA4AF] hover:text-[#024950] flex items-center space-x-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>

                    {isAdmin && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(project)}
                          title="Edit Project"
                          className="p-1.5 text-gray-500 hover:text-[#003135] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenConfirm(project, showArchived ? 'RESTORE' : 'ARCHIVE')}
                          title={showArchived ? "Restore Project" : "Archive Project"}
                          className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        >
                          {showArchived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
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
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4">Building Type</th>
                    <th className="px-6 py-4">Specs</th>
                    <th className="px-6 py-4">Budget</th>
                    <th className="px-6 py-4">Assigned PM</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {projects.map((project) => {
                    const manager = project.assigned_manager_detail;

                    return (
                      <tr key={project.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <span className="text-[10px] font-mono text-[#0FA4AF] font-bold">
                              {project.project_code}
                            </span>
                            <h4 
                              onClick={() => handleViewDetails(project)}
                              className="font-bold text-white hover:text-[#0FA4AF] cursor-pointer"
                            >
                              {project.project_name}
                            </h4>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300 font-medium">
                          {project.building_type}
                        </td>
                        <td className="px-6 py-4 text-[#AFDDE5]">
                          {project.blocks} Blks • {project.floors} Flrs • {Number(project.area_sqft).toLocaleString()} sqft
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-400">
                          {formatCurrency(project.total_budget)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <img
                              src={manager?.avatar_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150"}
                              alt={manager?.full_name || "Manager"}
                              className="w-5 h-5 rounded-full object-cover border border-[#0FA4AF]"
                            />
                            <span className="text-gray-200 font-medium">{manager ? manager.full_name : 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${getStatusBadgeClass(project.status)}`}>
                            {project.status_display || project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewDetails(project)}
                              className="p-1.5 text-[#0FA4AF] hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => handleEdit(project)}
                                  className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Project"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenConfirm(project, showArchived ? 'RESTORE' : 'ARCHIVE')}
                                  className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                  title={showArchived ? "Restore Project" : "Archive Project"}
                                >
                                  {showArchived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
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

      {/* Modals & Confirmation Dialogs */}
      <ProjectModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveProject}
        project={selectedProjectForEdit}
        loading={actionLoading}
      />

      <ProjectDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        project={selectedProjectForDetails}
        onEdit={handleEdit}
        onArchive={(p) => handleOpenConfirm(p, p.status === 'ARCHIVED' ? 'RESTORE' : 'ARCHIVE')}
        isAdmin={isAdmin}
      />

      <ArchiveConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmAction}
        project={selectedProjectForConfirm}
        actionType={confirmActionType}
        loading={actionLoading}
      />

    </div>
  );
};

export default ProjectsPage;
