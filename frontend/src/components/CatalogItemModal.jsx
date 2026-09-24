import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, AlertTriangle } from 'lucide-react';

const CatalogItemModal = ({ isOpen, onClose, onSave, catalogItem = null }) => {
  const isEdit = Boolean(catalogItem);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Structural',
    default_unit: 'Tons',
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (catalogItem) {
        setFormData({
          name: catalogItem.name || '',
          category: catalogItem.category || 'Structural',
          default_unit: catalogItem.default_unit || 'Tons',
          is_active: catalogItem.is_active ?? true,
        });
      } else {
        setFormData({
          name: '',
          category: 'Structural',
          default_unit: 'Tons',
          is_active: true,
        });
      }
      setErrorMsg('');
    }
  }, [isOpen, catalogItem]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category || !formData.default_unit) {
      setErrorMsg('Please fill in all catalog item fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await onSave(formData, catalogItem?.id);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.name?.[0] || err.response?.data?.detail || 'Failed to save catalog item.';
      setErrorMsg(msg);
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
          className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden text-[#003135]"
        >
          {/* Header */}
          <div className="bg-[#003135] text-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#0FA4AF]/20 border border-[#0FA4AF]/40 flex items-center justify-center text-[#0FA4AF]">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold tracking-tight">
                  {isEdit ? 'Edit Catalog Material' : 'Add Material to Catalog'}
                </h3>
                <p className="text-xs text-[#AFDDE5]">
                  Admin catalog item configuration.
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

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Material Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Reinforcement Bar Grade 60"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF] cursor-pointer"
              >
                <option value="Structural">Structural</option>
                <option value="Raw Aggregate">Raw Aggregate</option>
                <option value="Masonry">Masonry</option>
                <option value="Finishing">Finishing</option>
                <option value="Carpentry">Carpentry</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Paving & Waterproofing">Paving & Waterproofing</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Default Unit *
              </label>
              <input
                type="text"
                name="default_unit"
                required
                value={formData.default_unit}
                onChange={handleChange}
                placeholder="e.g. Tons, Bags, Cubic Meters, Sq Meters"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#0FA4AF]"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="rounded text-[#0FA4AF] focus:ring-[#0FA4AF] w-4 h-4 cursor-pointer"
              />
              <label htmlFor="is_active" className="text-xs font-bold text-[#003135] cursor-pointer">
                Active in Catalog (Visible for Site Engineers)
              </label>
            </div>

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
                  <span>{isEdit ? 'Save Changes' : 'Add to Catalog'}</span>
                )}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CatalogItemModal;
