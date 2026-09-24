import React, { useCallback, useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import Navbar from '../components/Navbar';
import PurchaseMaterialModal from '../components/PurchaseMaterialModal';
import CatalogItemModal from '../components/CatalogItemModal';
import { getProjects } from '../api/projects';
import { 
  getMaterialCatalog, 
  createCatalogItem, 
  updateCatalogItem, 
  getMaterialPurchases, 
  purchaseMaterial, 
  getExpenses, 
  getBudgetSummary 
} from '../api/materials';

// Recharts Import
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

import { 
  Package, 
  IndianRupee, 
  Building2, 
  ShoppingCart, 
  Receipt, 
  Tag, 
  Search, 
  Plus, 
  Percent, 
  TrendingUp, 
  CheckCircle2,
  Sparkles,
  PieChart as PieChartIcon
} from 'lucide-react';

const MaterialsPage = () => {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  // Active Tab: 'purchases' | 'expenses' | 'catalog' | 'budget'
  const [activeTab, setActiveTab] = useState('purchases');

  // Data state
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [projects, setProjects] = useState([]);

  const [summary, setSummary] = useState({
    total_budget: 0,
    total_expenses: 0,
    remaining_budget: 0,
    budget_used_percentage: 0,
    total_purchases_count: 0,
    today_purchases_count: 0,
    today_spend: 0,
    material_distribution: [],
  });

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [editingCatalogItem, setEditingCatalogItem] = useState(null);

  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await getProjects({ status: 'ACTIVE' });
      setProjects(data.results || data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  }, []);

  const fetchAllModuleData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedProjectId) params.project_id = selectedProjectId;
      if (searchQuery) params.search = searchQuery;

      const [purchasesData, expensesData, catalogData, summaryData] = await Promise.all([
        getMaterialPurchases(params),
        getExpenses(params),
        getMaterialCatalog({ search: searchQuery }),
        getBudgetSummary({ project_id: selectedProjectId })
      ]);

      setPurchases(purchasesData.results || purchasesData);
      setExpenses(expensesData.results || expensesData);
      setCatalog(catalogData.results || catalogData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to fetch materials data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, searchQuery]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // `activeTab` stays in the deps so switching tabs still refreshes the data,
  // matching the behaviour before this effect depended on the callback.
  useEffect(() => {
    fetchAllModuleData();
  }, [activeTab, fetchAllModuleData]);

  const handlePurchaseSubmit = async (payload) => {
    await purchaseMaterial(payload);
    fetchAllModuleData();
  };

  const handleSaveCatalogItem = async (formData, catId) => {
    if (catId) {
      await updateCatalogItem(catId, formData);
    } else {
      await createCatalogItem(formData);
    }
    fetchAllModuleData();
  };

  // Recharts Data
  const budgetPieData = [
    { name: 'Spent / Expenses', value: summary.total_expenses, color: '#0FA4AF' },
    { name: 'Remaining Budget', value: summary.remaining_budget, color: '#024950' },
  ].filter(item => item.value > 0);

  const materialCatPieData = (summary.material_distribution || []).map((item, idx) => {
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
    return {
      name: item.category,
      value: item.amount,
      color: colors[idx % colors.length]
    };
  });

  return (
    <div className="min-h-screen bg-[#003135] text-white flex flex-col selection:bg-[#0FA4AF] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Materials & Expenses ERP Management
              </h1>
              <span className="text-xs px-3 py-1 rounded-full bg-[#0FA4AF]/20 text-[#0FA4AF] border border-[#0FA4AF]/40 font-bold">
                MODULE 6
              </span>
            </div>
            <p className="text-xs text-[#AFDDE5] mt-1">
              Purchase site construction materials with automated expense creation, catalog management, and real-time budget guards.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-stretch sm:self-auto">
            {/* Purchase Material Button */}
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white gradient-btn shadow-lg shadow-[#0FA4AF]/20 flex items-center space-x-2 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Purchase Material</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  setEditingCatalogItem(null);
                  setIsCatalogModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#024950] hover:bg-[#0FA4AF] text-white border border-[#0FA4AF]/30 flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#0FA4AF]" />
                <span>New Catalog Material</span>
              </button>
            )}
          </div>
        </div>

        {/* Executive Budget & ERP Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          
          <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center space-x-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-[#024950] text-[#0FA4AF] shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[#AFDDE5] font-medium uppercase truncate">Total Budget</p>
              <h3 className="text-xs sm:text-sm lg:text-base font-extrabold text-white truncate" title={`₹${summary.total_budget.toLocaleString()}`}>
                ₹{summary.total_budget.toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center space-x-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-[#0FA4AF]/20 text-[#0FA4AF] border border-[#0FA4AF]/30 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[#AFDDE5] font-medium uppercase truncate">Total Expenses</p>
              <h3 className="text-xs sm:text-sm lg:text-base font-extrabold text-[#0FA4AF] truncate" title={`₹${summary.total_expenses.toLocaleString()}`}>
                ₹{summary.total_expenses.toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center space-x-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[#AFDDE5] font-medium uppercase truncate">Remaining Budget</p>
              <h3 className="text-xs sm:text-sm lg:text-base font-extrabold text-emerald-400 truncate" title={`₹${summary.remaining_budget.toLocaleString()}`}>
                ₹{summary.remaining_budget.toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center space-x-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/20 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[#AFDDE5] font-medium uppercase truncate">Total Purchases</p>
              <h3 className="text-xs sm:text-sm lg:text-base font-extrabold text-blue-300 truncate">{summary.total_purchases_count}</h3>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center space-x-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
              <Percent className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[#AFDDE5] font-medium uppercase truncate">Budget Used</p>
              <h3 className="text-xs sm:text-sm lg:text-base font-extrabold text-amber-300 truncate">{summary.budget_used_percentage}%</h3>
            </div>
          </div>

        </div>

        {/* Recharts Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Budget Progress Ring / Pie Chart */}
          <div className="lg:col-span-6 glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#0FA4AF]" />
                Project Budget Utilization
              </h3>
              <span className="text-[10px] text-[#0FA4AF] font-mono font-bold">{summary.budget_used_percentage}% Used</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={budgetPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {budgetPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} contentStyle={{ backgroundColor: '#003135', borderColor: '#0FA4AF', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Material Category Distribution Chart */}
          <div className="lg:col-span-6 glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4 text-[#0FA4AF]" />
                Material Category Spending Distribution
              </h3>
              <span className="text-[10px] text-[#AFDDE5] font-mono">Real-time ERP</span>
            </div>

            {materialCatPieData.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-gray-400">
                No material purchase records logged yet.
              </div>
            ) : (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={materialCatPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {materialCatPieData.map((entry, index) => (
                        <Cell key={`cat-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} contentStyle={{ backgroundColor: '#003135', borderColor: '#0FA4AF', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>

        {/* View Tabs Bar & Filters */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 bg-[#024950] p-1 rounded-xl border border-white/10 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'purchases' ? 'bg-[#0FA4AF] text-white shadow-md' : 'text-[#AFDDE5] hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Purchase History ({purchases.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'expenses' ? 'bg-[#0FA4AF] text-white shadow-md' : 'text-[#AFDDE5] hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Expense Ledger ({expenses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'catalog' ? 'bg-[#0FA4AF] text-white shadow-md' : 'text-[#AFDDE5] hover:text-white'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Material Catalog ({catalog.length})</span>
            </button>
          </div>

          {/* Controls: Search & Project Filter */}
          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            <div className="flex items-center space-x-2 bg-black/20 px-3 py-2 rounded-xl border border-white/10">
              <Building2 className="w-4 h-4 text-[#0FA4AF]" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-[#003135]">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#003135]">
                    {p.project_code} - {p.project_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search material, vendor, invoice..."
                className="w-full pl-9 pr-3 py-2 bg-black/20 border border-white/10 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#0FA4AF]"
              />
            </div>
          </div>

        </div>

        {/* TAB 1: MATERIAL PURCHASE HISTORY TABLE */}
        {activeTab === 'purchases' && (
          <div className="glass-panel-light rounded-3xl overflow-hidden shadow-2xl border border-white/80 text-[#003135]">
            {loading ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-10 h-10 border-4 border-[#0FA4AF] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-bold text-gray-500">Loading Material Purchases...</p>
              </div>
            ) : purchases.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <ShoppingCart className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="text-sm font-bold text-[#003135]">No Material Purchases Recorded</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Click "Purchase Material" to record site material procurement.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#003135] text-[#AFDDE5] uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Purchase ID</th>
                      <th className="px-6 py-4">Project</th>
                      <th className="px-6 py-4">Material Name</th>
                      <th className="px-6 py-4">Qty & Unit Price</th>
                      <th className="px-6 py-4">Total Cost</th>
                      <th className="px-6 py-4">Supplier & Invoice</th>
                      <th className="px-6 py-4">Date & Purchaser</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white font-medium">
                    {purchases.map((pur) => (
                      <tr key={pur.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono font-bold text-[#0FA4AF] bg-[#0FA4AF]/10 px-2.5 py-1 rounded-md border border-[#0FA4AF]/20">
                            {pur.purchase_id}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-[#003135]">
                            {pur.project_detail?.project_code}
                          </span>
                          <p className="text-[10px] text-gray-500 truncate max-w-[120px]">
                            {pur.project_detail?.project_name}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <h4 className="font-extrabold text-[#003135] text-sm">
                            {pur.material_name}
                          </h4>
                          {pur.material_detail?.category && (
                            <span className="text-[10px] text-gray-400 font-bold">
                              {pur.material_detail.category}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-[#003135]">
                            {Number(pur.quantity).toLocaleString()} {pur.unit}
                          </span>
                          <p className="text-[10px] text-gray-500">
                            @ ₹{Number(pur.unit_price).toLocaleString()} / {pur.unit}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-extrabold text-emerald-600 text-sm">
                            ₹{Number(pur.total_cost).toLocaleString()}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-[#003135]">
                            {pur.supplier}
                          </span>
                          <p className="text-[10px] text-gray-400 font-mono">
                            {pur.invoice_number ? `Inv: ${pur.invoice_number}` : 'No Invoice'}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-gray-700">
                            {pur.purchase_date}
                          </span>
                          <p className="text-[10px] text-gray-500 font-semibold">
                            By: {pur.purchased_by_detail ? pur.purchased_by_detail.full_name : 'System'}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AUTOMATIC EXPENSE LEDGER TABLE */}
        {activeTab === 'expenses' && (
          <div className="glass-panel-light rounded-3xl overflow-hidden shadow-2xl border border-white/80 text-[#003135]">
            {loading ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-10 h-10 border-4 border-[#0FA4AF] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-bold text-gray-500">Loading Expense Ledger...</p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Receipt className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="text-sm font-bold text-[#003135]">No Expense Records Found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#003135] text-[#AFDDE5] uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Expense ID</th>
                      <th className="px-6 py-4">Project</th>
                      <th className="px-6 py-4">Expense Category</th>
                      <th className="px-6 py-4">Description / Purpose</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Linked Material Purchase</th>
                      <th className="px-6 py-4">Logged By & Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white font-medium">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono font-bold text-[#003135] bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            {exp.expense_id}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-[#003135]">
                            {exp.project_detail?.project_code}
                          </span>
                          <p className="text-[10px] text-gray-500 truncate max-w-[120px]">
                            {exp.project_detail?.project_name}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#0FA4AF]/10 text-[#0FA4AF] border border-[#0FA4AF]/20 uppercase">
                            {exp.expense_category}
                          </span>
                        </td>

                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-xs text-[#003135] font-semibold truncate">
                            {exp.description}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-extrabold text-[#0FA4AF] text-sm">
                            ₹{Number(exp.amount).toLocaleString()}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {exp.linked_material_purchase ? (
                            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Linked Purchase
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-[#003135]">
                            {exp.created_by_detail ? exp.created_by_detail.full_name : 'System'}
                          </span>
                          <p className="text-[10px] text-gray-400 font-mono">
                            {new Date(exp.created_at).toLocaleDateString()}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MATERIAL CATALOG GRID (ADMIN CONFIG) */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {catalog.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 text-[#003135] flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0FA4AF]/10 text-[#0FA4AF] px-2.5 py-0.5 rounded-full border border-[#0FA4AF]/20">
                      {cat.category}
                    </span>
                    <span className={`w-2.5 h-2.5 rounded-full ${cat.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-[#003135]">{cat.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Default Unit: <span className="font-bold text-[#003135]">{cat.default_unit}</span>
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-end">
                      <button
                        onClick={() => {
                          setEditingCatalogItem(cat);
                          setIsCatalogModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        Edit Item
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Purchase Material Modal */}
      <PurchaseMaterialModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onPurchaseSuccess={handlePurchaseSubmit}
      />

      {/* Catalog Item Modal (Admin) */}
      <CatalogItemModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        onSave={handleSaveCatalogItem}
        catalogItem={editingCatalogItem}
      />
    </div>
  );
};

export default MaterialsPage;
