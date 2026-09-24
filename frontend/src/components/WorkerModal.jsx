import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, ShieldAlert, Check } from 'lucide-react';

const WorkerModal = ({ isOpen, onClose, onSave, worker = null, loading = false }) => {
  const [formError, setFormError] = useState('');
  const isEditing = !!worker;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      full_name: '',
      phone_number: '',
      email: '',
      gender: 'Male',
      date_of_birth: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_number: '',
      skill_category: 'General Labor',
      designation: 'General Construction Worker',
      daily_wage: 150,
      employment_type: 'Contract',
      join_date: new Date().toISOString().split('T')[0],
      status: 'Active',
      profile_photo: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setFormError('');
      if (worker) {
        setValue('full_name', worker.full_name);
        setValue('phone_number', worker.phone_number);
        setValue('email', worker.email || '');
        setValue('gender', worker.gender);
        setValue('date_of_birth', worker.date_of_birth || '');
        setValue('address', worker.address || '');
        setValue('emergency_contact_name', worker.emergency_contact_name);
        setValue('emergency_contact_number', worker.emergency_contact_number);
        setValue('skill_category', worker.skill_category);
        setValue('designation', worker.designation);
        setValue('daily_wage', worker.daily_wage);
        setValue('employment_type', worker.employment_type);
        setValue('join_date', worker.join_date);
        setValue('status', worker.status);
        setValue('profile_photo', worker.profile_photo || '');
        setValue('notes', worker.notes || '');
      } else {
        reset({
          full_name: '',
          phone_number: '',
          email: '',
          gender: 'Male',
          date_of_birth: '',
          address: '',
          emergency_contact_name: '',
          emergency_contact_number: '',
          skill_category: 'General Labor',
          designation: 'General Construction Worker',
          daily_wage: 150,
          employment_type: 'Contract',
          join_date: new Date().toISOString().split('T')[0],
          status: 'Active',
          profile_photo: '',
          notes: '',
        });
      }
    }
  }, [isOpen, worker, setValue, reset]);

  const onSubmit = async (data) => {
    setFormError('');
    const formattedData = {
      ...data,
      daily_wage: Number(data.daily_wage),
      date_of_birth: data.date_of_birth || null,
      email: data.email || null,
      profile_photo: data.profile_photo || null,
    };

    try {
      await onSave(formattedData);
    } catch (err) {
      const errorMsg =
        err.response?.data?.daily_wage?.[0] ||
        err.response?.data?.phone_number?.[0] ||
        err.response?.data?.detail ||
        'Failed to save worker profile. Please check form entries.';
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
          className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 text-[#003135] shadow-2xl relative border border-gray-100 my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-[#003135] text-[#0FA4AF]">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#003135] tracking-tight">
                  {isEditing ? 'Edit Construction Worker' : 'Register New Worker'}
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  {isEditing ? `Modifying profile for ${worker?.worker_id}` : 'Create site worker profile and skill designation'}
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

          {/* Form Level Error */}
          {formError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-3">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Full Name & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  {...register('full_name', { required: 'Full Name is required' })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                  placeholder="e.g. Robert Kowalski"
                />
                {errors.full_name && (
                  <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="text"
                  {...register('phone_number', { required: 'Phone Number is required' })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                  placeholder="+1 (555) 234-8901"
                />
                {errors.phone_number && (
                  <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.phone_number.message}</p>
                )}
              </div>
            </div>

            {/* Email & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                  placeholder="r.kowalski@sitesense.ai"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                  Gender *
                </label>
                <select
                  {...register('gender', { required: true })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Skill Category & Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                  Skill Category *
                </label>
                <select
                  {...register('skill_category', { required: true })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                >
                  <option value="Masonry">Masonry</option>
                  <option value="Carpentry">Carpentry</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Steel Fixing">Steel Fixing</option>
                  <option value="Welding">Welding</option>
                  <option value="Scaffolding">Scaffolding</option>
                  <option value="Heavy Equipment Operator">Heavy Equipment Operator</option>
                  <option value="General Labor">General Labor</option>
                  <option value="Safety Inspector">Safety Inspector</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                  Designation / Role Title *
                </label>
                <input
                  type="text"
                  {...register('designation', { required: 'Designation is required' })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                  placeholder="e.g. Master Mason / Site Electrician"
                />
                {errors.designation && (
                  <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.designation.message}</p>
                )}
              </div>
            </div>

            {/* Daily Wage, Employment Type & Status */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                  Daily Wage (₹ INR) *
                </label>
                <input
                  type="number"
                  step="5"
                  min="0"
                  {...register('daily_wage', { required: 'Daily Wage is required', min: 0 })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                />
                {errors.daily_wage && (
                  <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.daily_wage.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                  Employment Type *
                </label>
                <select
                  {...register('employment_type', { required: true })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Contract">Contract</option>
                  <option value="Daily Wage">Daily Wage</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                  Status *
                </label>
                <select
                  {...register('status', { required: true })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Emergency Contacts Grid */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Emergency Contact Details *
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-amber-800 mb-1">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    {...register('emergency_contact_name', { required: 'Emergency Contact Name is required' })}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF]"
                    placeholder="e.g. Elena Kowalski (Spouse)"
                  />
                  {errors.emergency_contact_name && (
                    <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.emergency_contact_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-amber-800 mb-1">
                    Emergency Phone Number *
                  </label>
                  <input
                    type="text"
                    {...register('emergency_contact_number', { required: 'Emergency Contact Number is required' })}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF]"
                    placeholder="+1 (555) 234-8909"
                  />
                  {errors.emergency_contact_number && (
                    <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.emergency_contact_number.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address & Photo URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                  Residential Address
                </label>
                <input
                  type="text"
                  {...register('address')}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                  placeholder="e.g. 412 Structural Ave, Chicago, IL"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider mb-1.5">
                  Profile Photo URL (Optional)
                </label>
                <input
                  type="url"
                  {...register('profile_photo')}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-[#003135] focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
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
                    <span>{isEditing ? 'Save Changes' : 'Register Worker'}</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WorkerModal;
