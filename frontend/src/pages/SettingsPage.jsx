import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Bell,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Save,
  SlidersHorizontal,
  UserCog,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/useAuth';
import {
  changePassword,
  extractApiError,
  getSettingsOverview,
  updateOrganizationSettings,
  updatePreferences,
  updateProfile,
} from '../api/settings';

const TABS = [
  { key: 'profile', label: 'Profile', icon: UserCog },
  { key: 'security', label: 'Security', icon: KeyRound },
  { key: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  { key: 'organization', label: 'Organization', icon: Building2 },
];

const NOTIFICATION_FIELDS = [
  { key: 'notify_task_assigned', label: 'Task assigned to me', hint: 'When a Project Manager assigns you a task.' },
  { key: 'notify_task_status_change', label: 'Task approved or rejected', hint: 'When a submitted task is reviewed.' },
  { key: 'notify_attendance_summary', label: 'Daily attendance summary', hint: 'End-of-day attendance roll-up per project.' },
  { key: 'notify_material_purchase', label: 'Material purchase logged', hint: 'When a purchase creates a new expense.' },
  { key: 'notify_budget_overspend', label: 'Budget threshold crossed', hint: 'When a project passes the alert threshold.' },
  { key: 'notify_ai_risk_alert', label: 'AI risk alert', hint: 'When the AI engine flags a project as High risk.' },
  { key: 'notify_daily_log_reminder', label: 'Daily log reminder', hint: 'Reminder to submit the site log before end of day.' },
];

const Card = ({ title, description, icon: Icon, children, footer }) => (
  <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6">
    <div className="flex items-start gap-3 border-b border-white/10 pb-4">
      <div className="p-2.5 rounded-xl bg-[#024950] shrink-0">
        <Icon className="w-5 h-5 text-[#0FA4AF]" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="text-xs text-[#AFDDE5]">{description}</p>
      </div>
    </div>
    {children}
    {footer}
  </div>
);

const Field = ({ label, hint, children }) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-semibold text-[#AFDDE5]">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-[#AFDDE5]/60">{hint}</span>}
  </label>
);

const inputClass =
  'w-full px-4 py-2.5 rounded-xl bg-[#024950]/40 border border-white/10 text-sm text-white ' +
  'placeholder:text-[#AFDDE5]/40 focus:outline-none focus:border-[#0FA4AF] focus:ring-1 ' +
  'focus:ring-[#0FA4AF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const Toggle = ({ checked, onChange, label, hint, disabled = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#024950]/40 border border-white/5 hover:border-[#0FA4AF]/40 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
  >
    <span>
      <span className="block text-xs font-semibold text-white">{label}</span>
      {hint && <span className="block text-[11px] text-[#AFDDE5]/60 mt-0.5">{hint}</span>}
    </span>
    <span
      className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${
        checked ? 'bg-[#0FA4AF]' : 'bg-[#003135] border border-white/15'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </span>
  </button>
);

const SaveButton = ({ saving, disabled, children = 'Save Changes' }) => (
  <button
    type="submit"
    disabled={saving || disabled}
    className="px-5 py-2.5 rounded-xl gradient-btn text-white text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
  >
    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
    <span>{saving ? 'Saving…' : children}</span>
  </button>
);

const SettingsPage = () => {
  const { user, role, fetchUserProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [banner, setBanner] = useState(null); // { type: 'success' | 'error', text }

  const [profileForm, setProfileForm] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [choices, setChoices] = useState(null);
  const [canEditOrganization, setCanEditOrganization] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingOrganization, setSavingOrganization] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);

  const notify = (type, text) => {
    setBanner({ type, text });
    window.setTimeout(() => setBanner(null), 5000);
  };

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await getSettingsOverview();
      setProfileForm({
        first_name: data.profile.first_name || '',
        last_name: data.profile.last_name || '',
        phone_number: data.profile.phone_number || '',
        department: data.profile.department || '',
        avatar_url: data.profile.avatar_url || '',
        email: data.profile.email,
        employee_id: data.profile.employee_id || '',
        role_display: data.profile.role_display,
      });
      setPreferences(data.preferences);
      setOrganization(data.organization);
      setChoices(data.choices);
      setCanEditOrganization(Boolean(data.can_edit_organization));
    } catch (err) {
      setLoadError(extractApiError(err, 'Could not load your settings.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        phone_number: profileForm.phone_number,
        department: profileForm.department,
        avatar_url: profileForm.avatar_url,
      });
      await fetchUserProfile(); // refresh the name/avatar shown in the navbar
      notify('success', 'Profile updated successfully.');
    } catch (err) {
      notify('error', extractApiError(err, 'Could not update your profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePreferencesSubmit = async (event) => {
    event.preventDefault();
    setSavingPreferences(true);
    try {
      const saved = await updatePreferences({
        theme: preferences.theme,
        date_format: preferences.date_format,
        default_landing_page: preferences.default_landing_page,
        items_per_page: Number(preferences.items_per_page),
        compact_tables: preferences.compact_tables,
        email_notifications: preferences.email_notifications,
        in_app_notifications: preferences.in_app_notifications,
        ...Object.fromEntries(
          NOTIFICATION_FIELDS.map(({ key }) => [key, preferences[key]])
        ),
      });
      setPreferences(saved);
      notify('success', 'Preferences saved.');
    } catch (err) {
      notify('error', extractApiError(err, 'Could not save your preferences.'));
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleOrganizationSubmit = async (event) => {
    event.preventDefault();
    setSavingOrganization(true);
    try {
      const saved = await updateOrganizationSettings({
        organization_name: organization.organization_name,
        contact_email: organization.contact_email,
        contact_phone: organization.contact_phone,
        address: organization.address,
        currency_code: organization.currency_code,
        currency_symbol: organization.currency_symbol,
        timezone: organization.timezone,
        working_days_per_week: Number(organization.working_days_per_week),
        standard_shift_hours: Number(organization.standard_shift_hours),
        budget_alert_threshold: Number(organization.budget_alert_threshold),
        attendance_alert_threshold: Number(organization.attendance_alert_threshold),
        ai_high_risk_threshold: Number(organization.ai_high_risk_threshold),
      });
      setOrganization(saved);
      notify('success', 'Organization settings updated.');
    } catch (err) {
      notify('error', extractApiError(err, 'Could not update organization settings.'));
    } finally {
      setSavingOrganization(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setSavingPassword(true);
    try {
      const result = await changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      notify('success', result.message || 'Password updated successfully.');
    } catch (err) {
      notify('error', extractApiError(err, 'Could not change your password.'));
    } finally {
      setSavingPassword(false);
    }
  };

  const setPreference = (key, value) => setPreferences((prev) => ({ ...prev, [key]: value }));
  const setOrganizationField = (key, value) =>
    setOrganization((prev) => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#003135] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#0FA4AF] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#003135] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="glass-panel rounded-3xl border border-red-500/30 p-8 max-w-md text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
            <p className="text-sm text-[#AFDDE5]">{loadError}</p>
            <button
              onClick={loadSettings}
              className="px-5 py-2.5 rounded-xl gradient-btn text-white text-xs font-bold cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#003135] text-white flex flex-col selection:bg-[#0FA4AF] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#0FA4AF]/30 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#0FA4AF]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Settings</h1>
              <p className="text-sm text-[#AFDDE5] mt-1">
                Manage your profile, password, preferences and organization defaults.
              </p>
            </div>
            <span className="text-[11px] px-3 py-1 rounded-full bg-[#0FA4AF]/20 text-[#0FA4AF] border border-[#0FA4AF]/40 font-bold self-start">
              {profileForm?.role_display || role}
            </span>
          </div>
        </motion.div>

        {/* Result banner */}
        {banner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-3 p-4 rounded-2xl border text-xs font-semibold ${
              banner.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{banner.text}</span>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-[#024950]/40 p-1 rounded-2xl border border-white/5 w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === key
                  ? 'bg-[#0FA4AF] text-white shadow-md'
                  : 'text-[#AFDDE5] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* PROFILE */}
          {activeTab === 'profile' && profileForm && (
            <form onSubmit={handleProfileSubmit}>
              <Card
                title="Personal Information"
                description="Your name and contact details as they appear across the platform."
                icon={UserCog}
                footer={
                  <div className="flex justify-end pt-2 border-t border-white/10">
                    <SaveButton saving={savingProfile} />
                  </div>
                }
              >
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#024950]/40 border border-white/5">
                  <img
                    src={
                      profileForm.avatar_url ||
                      user?.avatar_url ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
                    }
                    alt={profileForm.first_name || 'User avatar'}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#0FA4AF]"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {profileForm.first_name} {profileForm.last_name}
                    </p>
                    <p className="text-xs text-[#AFDDE5] font-mono truncate">{profileForm.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="First Name">
                    <input
                      className={inputClass}
                      value={profileForm.first_name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, first_name: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="Last Name">
                    <input
                      className={inputClass}
                      value={profileForm.last_name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, last_name: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Phone Number">
                    <input
                      className={inputClass}
                      value={profileForm.phone_number}
                      placeholder="+91 90000 00000"
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, phone_number: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Department">
                    <input
                      className={inputClass}
                      value={profileForm.department}
                      placeholder="Construction Operations"
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, department: e.target.value })
                      }
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Avatar URL" hint="Must be a full http:// or https:// link.">
                      <input
                        className={inputClass}
                        value={profileForm.avatar_url}
                        placeholder="https://example.com/avatar.jpg"
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, avatar_url: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                  <Field label="Email Address" hint="Used to sign in — contact an Admin to change it.">
                    <input className={inputClass} value={profileForm.email} disabled />
                  </Field>
                  <Field label="Employee ID" hint="Assigned by an Admin.">
                    <input className={inputClass} value={profileForm.employee_id || '—'} disabled />
                  </Field>
                  <Field label="Role" hint="Set by an Admin.">
                    <input className={inputClass} value={profileForm.role_display} disabled />
                  </Field>
                </div>
              </Card>
            </form>
          )}

          {/* SECURITY */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit}>
              <Card
                title="Change Password"
                description="Choose a strong password you do not use anywhere else."
                icon={Lock}
                footer={
                  <div className="flex justify-end pt-2 border-t border-white/10">
                    <SaveButton saving={savingPassword}>Update Password</SaveButton>
                  </div>
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <Field label="Current Password">
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        className={inputClass}
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                        }
                        autoComplete="current-password"
                        required
                      />
                    </Field>
                  </div>
                  <Field
                    label="New Password"
                    hint="At least 8 characters, not entirely numeric, not a common password."
                  >
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      className={inputClass}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      autoComplete="new-password"
                      required
                    />
                  </Field>
                  <Field label="Confirm New Password">
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      className={inputClass}
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      autoComplete="new-password"
                      required
                    />
                  </Field>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPasswords((prev) => !prev)}
                  className="flex items-center gap-2 text-xs font-semibold text-[#0FA4AF] hover:text-[#AFDDE5] transition-colors cursor-pointer"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showPasswords ? 'Hide passwords' : 'Show passwords'}</span>
                </button>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    Your current session stays active after the change. Use the new password the
                    next time you sign in.
                  </p>
                </div>
              </Card>
            </form>
          )}

          {/* PREFERENCES */}
          {activeTab === 'preferences' && preferences && (
            <form onSubmit={handlePreferencesSubmit} className="space-y-6">
              <Card
                title="Display"
                description="How the platform looks and how much data each table shows."
                icon={SlidersHorizontal}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Theme">
                    <select
                      className={inputClass}
                      value={preferences.theme}
                      onChange={(e) => setPreference('theme', e.target.value)}
                    >
                      {choices?.theme?.map((option) => (
                        <option key={option.value} value={option.value} className="bg-[#024950]">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Date Format">
                    <select
                      className={inputClass}
                      value={preferences.date_format}
                      onChange={(e) => setPreference('date_format', e.target.value)}
                    >
                      {choices?.date_format?.map((option) => (
                        <option key={option.value} value={option.value} className="bg-[#024950]">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Default Landing Page" hint="Where you land after signing in.">
                    <select
                      className={inputClass}
                      value={preferences.default_landing_page}
                      onChange={(e) => setPreference('default_landing_page', e.target.value)}
                    >
                      {choices?.default_landing_page?.map((option) => (
                        <option key={option.value} value={option.value} className="bg-[#024950]">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Rows Per Page" hint="Between 5 and 100.">
                    <input
                      type="number"
                      min={5}
                      max={100}
                      className={inputClass}
                      value={preferences.items_per_page}
                      onChange={(e) => setPreference('items_per_page', e.target.value)}
                    />
                  </Field>
                </div>

                <Toggle
                  checked={preferences.compact_tables}
                  onChange={(value) => setPreference('compact_tables', value)}
                  label="Compact tables"
                  hint="Tighter row spacing so more records fit on screen."
                />
              </Card>

              <Card
                title="Notifications"
                description="Pick the channels and the events you want to hear about."
                icon={Bell}
                footer={
                  <div className="flex justify-end pt-2 border-t border-white/10">
                    <SaveButton saving={savingPreferences} />
                  </div>
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Toggle
                    checked={preferences.in_app_notifications}
                    onChange={(value) => setPreference('in_app_notifications', value)}
                    label="In-app notifications"
                    hint="Alerts inside SiteSense."
                  />
                  <Toggle
                    checked={preferences.email_notifications}
                    onChange={(value) => setPreference('email_notifications', value)}
                    label="Email notifications"
                    hint="Send the same alerts to your email."
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-white uppercase tracking-wide">Events</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {NOTIFICATION_FIELDS.map(({ key, label, hint }) => (
                      <Toggle
                        key={key}
                        checked={preferences[key]}
                        onChange={(value) => setPreference(key, value)}
                        label={label}
                        hint={hint}
                        disabled={
                          !preferences.in_app_notifications && !preferences.email_notifications
                        }
                      />
                    ))}
                  </div>
                  {!preferences.in_app_notifications && !preferences.email_notifications && (
                    <p className="text-[11px] text-amber-300/80 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Turn on at least one channel to choose which events you receive.
                    </p>
                  )}
                </div>
              </Card>
            </form>
          )}

          {/* ORGANIZATION */}
          {activeTab === 'organization' && organization && (
            <form onSubmit={handleOrganizationSubmit} className="space-y-6">
              {!canEditOrganization && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#024950]/40 border border-white/10 text-xs text-[#AFDDE5]">
                  <Lock className="w-4 h-4 text-[#0FA4AF] shrink-0" />
                  <span>
                    These are organization-wide defaults. Only an Admin can change them — you have
                    read-only access.
                  </span>
                </div>
              )}

              <Card
                title="Organization Profile"
                description="Company identity used on exported PDF and Excel reports."
                icon={Building2}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Organization Name">
                    <input
                      className={inputClass}
                      value={organization.organization_name}
                      disabled={!canEditOrganization}
                      onChange={(e) => setOrganizationField('organization_name', e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Contact Email">
                    <input
                      type="email"
                      className={inputClass}
                      value={organization.contact_email}
                      disabled={!canEditOrganization}
                      onChange={(e) => setOrganizationField('contact_email', e.target.value)}
                    />
                  </Field>
                  <Field label="Contact Phone">
                    <input
                      className={inputClass}
                      value={organization.contact_phone}
                      disabled={!canEditOrganization}
                      onChange={(e) => setOrganizationField('contact_phone', e.target.value)}
                    />
                  </Field>
                  <Field label="Timezone">
                    <input
                      className={inputClass}
                      value={organization.timezone}
                      disabled={!canEditOrganization}
                      onChange={(e) => setOrganizationField('timezone', e.target.value)}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Address">
                      <textarea
                        rows={2}
                        className={inputClass}
                        value={organization.address}
                        disabled={!canEditOrganization}
                        onChange={(e) => setOrganizationField('address', e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              </Card>

              <Card
                title="Regional & Operational Defaults"
                description="Currency and shift assumptions used across every module."
                icon={SlidersHorizontal}
              >
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                  <Field label="Currency Code">
                    <input
                      className={inputClass}
                      value={organization.currency_code}
                      disabled={!canEditOrganization}
                      onChange={(e) => setOrganizationField('currency_code', e.target.value)}
                    />
                  </Field>
                  <Field label="Currency Symbol">
                    <input
                      className={inputClass}
                      value={organization.currency_symbol}
                      disabled={!canEditOrganization}
                      onChange={(e) => setOrganizationField('currency_symbol', e.target.value)}
                    />
                  </Field>
                  <Field label="Working Days / Week" hint="1 to 7.">
                    <input
                      type="number"
                      min={1}
                      max={7}
                      className={inputClass}
                      value={organization.working_days_per_week}
                      disabled={!canEditOrganization}
                      onChange={(e) =>
                        setOrganizationField('working_days_per_week', e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Shift Hours" hint="1 to 24.">
                    <input
                      type="number"
                      step="0.5"
                      min={1}
                      max={24}
                      className={inputClass}
                      value={organization.standard_shift_hours}
                      disabled={!canEditOrganization}
                      onChange={(e) =>
                        setOrganizationField('standard_shift_hours', e.target.value)
                      }
                    />
                  </Field>
                </div>
              </Card>

              <Card
                title="Alert Thresholds"
                description="The percentages at which a project is flagged for attention."
                icon={Bell}
                footer={
                  canEditOrganization ? (
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <p className="text-[11px] text-[#AFDDE5]/60">
                        {organization.updated_by_name
                          ? `Last updated by ${organization.updated_by_name}`
                          : 'Not yet customised'}
                      </p>
                      <SaveButton saving={savingOrganization} />
                    </div>
                  ) : null
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <Field label="Budget Alert (%)" hint="Flag once this share of budget is used.">
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      className={inputClass}
                      value={organization.budget_alert_threshold}
                      disabled={!canEditOrganization}
                      onChange={(e) =>
                        setOrganizationField('budget_alert_threshold', e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Attendance Alert (%)" hint="Flag when attendance falls below this.">
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      className={inputClass}
                      value={organization.attendance_alert_threshold}
                      disabled={!canEditOrganization}
                      onChange={(e) =>
                        setOrganizationField('attendance_alert_threshold', e.target.value)
                      }
                    />
                  </Field>
                  <Field label="AI High Risk (%)" hint="Delay probability that counts as High.">
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      className={inputClass}
                      value={organization.ai_high_risk_threshold}
                      disabled={!canEditOrganization}
                      onChange={(e) =>
                        setOrganizationField('ai_high_risk_threshold', e.target.value)
                      }
                    />
                  </Field>
                </div>
              </Card>
            </form>
          )}
        </motion.div>
      </main>

      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-[#AFDDE5]/60 border-t border-white/5">
        <p>© 2026 SiteSense Platform. Enterprise Construction Intelligence.</p>
      </footer>
    </div>
  );
};

export default SettingsPage;
