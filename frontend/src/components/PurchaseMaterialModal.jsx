import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Building2, Truck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getProjects } from '../api/projects';
import { getMaterialCatalog, getBudgetSummary } from '../api/materials';

const PurchaseMaterialModal = ({ isOpen, onClose, onPurchaseSuccess }) => {
  const [projects, setProjects] = useState([]);
  const [catalog, setCatalog] = useState([]);

  const [formData, setFormData] = useState({
    project: '',
    material: '',
    custom_material_name: '',
    quantity: 10,
    unit: 'Units',
    unit_price: 50.0,
    supplier: '',
    invoice_number: '',
    notes: '',
  });

  const [remainingBudget, setRemainingBudget] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const computedTotalCost = (Number(formData.quantity || 0) * Number(formData.unit_price || 0)).toFixed(2);
  const isOverBudget = Number(computedTotalCost) > Number(remainingBudget) && Number(remainingBudget) > 0;

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      setErrorMsg('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.project) {
      fetchProjectBudget(formData.project);
    }
  }, [formData.project]);

  const fetchInitialData = async () => {
    try {
      const [projData, catData] = await Promise.all([
        getProjects({ status: 'ACTIVE' }),
        getMaterialCatalog({ is_active: 'true' })
      ]);
      const projList = projData.results || projData;
      setProjects(projList);

      const catList = catData.results || catData;
      setCatalog(catList);

      if (projList.length > 0) {
        setFormData(prev => ({ ...prev, project: projList[0].id }));
      }
      if (catList.length > 0) {
        setFormData(prev => ({
          ...prev,
          material: catList[0].id,
          unit: catList[0].default_unit,
        }));
      }
    } catch (err) {
      console.error('Failed to load purchase modal dropdowns:', err);
    }
  };

  const fetchProjectBudget = async (projId) => {
    try {
      const summary = await getBudgetSummary({ project_id: projId });
      setRemainingBudget(summary.remaining_budget);
    } catch (err) {
      console.error('Failed to fetch project remaining budget:', err);
    }
  };

  const handleMaterialChange = (e) => {
    const val = e.target.value;
    if (val === 'OTHER') {
      setFormData(prev => ({
        ...prev,
        material: '',
        custom_material_name: '',
        unit: 'Units',
      }));
    } else {
      const selectedItem = catalog.find(item => String(item.id) === String(val));
      setFormData(prev => ({
        ...prev,
        material: val,
        custom_material_name: '',
        unit: selectedItem ? selectedItem.default_unit : 'Units',
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.project || !formData.supplier || Number(formData.quantity) <= 0 || Number(formData.unit_price) <= 0) {
      setErrorMsg('Please fill in valid quantity, unit price, and supplier information.');
      return;
    }

    if (!formData.material && !formData.custom_material_name.trim()) {
      setErrorMsg('Please select a material from the catalog or specify a custom material name.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        project: Number(formData.project),
        material: formData.material ? Number(formData.material) : null,
        custom_material_name: formData.custom_material_name,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        unit_price: Number(formData.unit_price),
        supplier: formData.supplier,
        invoice_number: formData.invoice_number,
        notes: formData.notes,
      };

      await onPurchaseSuccess(payload);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.total_cost?.[0] || err.response?.data?.detail || err.response?.data?.error || 'Failed to submit material purchase.';
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
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">
                  Purchase Construction Material
                </h3>
                <p className="text-xs text-[#AFDDE5]">
                  Auto-generates linked expense record and deducts from remaining budget.
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

            {/* Target Project */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Target Construction Project *
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
              <p className="text-[10px] text-gray-500 mt-1">
                Remaining Project Budget: <span className="font-bold text-[#0FA4AF]">₹{Number(remainingBudget).toLocaleString()}</span>
              </p>
            </div>

            {/* Material Catalog Dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Select Catalog Material *
                </label>
                <select
                  value={formData.material || (formData.custom_material_name ? 'OTHER' : '')}
                  onChange={handleMaterialChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF] cursor-pointer"
                >
                  {catalog.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.category})
                    </option>
                  ))}
                  <option value="OTHER">Other (Custom Material Entry)</option>
                </select>
              </div>

              {!formData.material && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Custom Material Name *
                  </label>
                  <input
                    type="text"
                    name="custom_material_name"
                    required={!formData.material}
                    value={formData.custom_material_name}
                    onChange={handleChange}
                    placeholder="e.g. High-Tensile HDPE Trench Conduit"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF]"
                  />
                </div>
              )}
            </div>

            {/* Quantity, Unit & Unit Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="quantity"
                  required
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Unit *
                </label>
                <input
                  type="text"
                  name="unit"
                  required
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="e.g. Bags, Tons, Meters"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Unit Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="unit_price"
                  required
                  value={formData.unit_price}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF]"
                />
              </div>
            </div>

            {/* Computed Total Cost & Budget Banner */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isOverBudget ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-500">Auto-Calculated Total Cost</p>
                <h4 className="text-xl font-extrabold">₹{Number(computedTotalCost).toLocaleString()}</h4>
              </div>

              {isOverBudget ? (
                <div className="text-right">
                  <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Exceeds Remaining Budget!
                  </span>
                  <p className="text-[10px] text-red-500">Purchase will be rejected by backend.</p>
                </div>
              ) : (
                <div className="text-right text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Budget Available
                </div>
              )}
            </div>

            {/* Supplier & Invoice Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Supplier / Vendor Name *
                </label>
                <div className="relative">
                  <Truck className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="supplier"
                    required
                    value={formData.supplier}
                    onChange={handleChange}
                    placeholder="e.g. Apex Building Supplies Corp."
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Invoice / Receipt No. (Optional)
                </label>
                <input
                  type="text"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleChange}
                  placeholder="e.g. INV-2026-8812"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF]"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Purchase Notes / Site Purpose
              </label>
              <textarea
                name="notes"
                rows="2"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Log material grade, delivery batch details, or site installation purpose..."
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0FA4AF]"
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
                disabled={loading || isOverBudget}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white gradient-btn shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Submit Material Purchase</span>
                )}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PurchaseMaterialModal;
