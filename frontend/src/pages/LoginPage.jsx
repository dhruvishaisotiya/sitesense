import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import { 
  ShieldCheck, 
  HardHat, 
  UserCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const LoginPage = () => {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [authError, setAuthError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: 'admin@sitesense.ai',
      password: 'password123',
    },
  });

  const DEMO_ACCOUNTS = {
    ADMIN: {
      email: 'admin@sitesense.ai',
      password: 'password123',
      name: 'Alexander Vance',
      roleTitle: 'Administrator',
      roleBadge: 'Full System Control',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      accounts: [
        { name: 'Alexander Vance', email: 'admin@sitesense.ai' }
      ],
      features: [
        'Create & manage all construction projects',
        'Assign Project Managers & inspect workforce',
        'View global AI predictions, risk & financial reports'
      ]
    },
    PROJECT_MANAGER: {
      email: 'manager@sitesense.ai',
      password: 'password123',
      name: 'Sarah Jenkins',
      roleTitle: 'Project Manager',
      roleBadge: 'Assigned Project Controller',
      badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      icon: <UserCheck className="w-5 h-5 text-amber-300" />,
      accounts: [
        { name: 'Sarah Jenkins', email: 'manager@sitesense.ai' },
        { name: 'Robert Taylor', email: 'manager2@sitesense.ai' },
        { name: 'Test Manager', email: 'pm_test@sitesense.ai' }
      ],
      features: [
        'Manage site workers & task assignments',
        'Manually update overall project progress',
        'Monitor site attendance, expenses & AI risk scores'
      ]
    },
    SITE_ENGINEER: {
      email: 'engineer@sitesense.ai',
      password: 'password123',
      name: 'Marcus Chen',
      roleTitle: 'Site Engineer',
      roleBadge: 'Field & Materials Engineer',
      badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      icon: <HardHat className="w-5 h-5 text-cyan-300" />,
      accounts: [
        { name: 'Marcus Chen', email: 'engineer@sitesense.ai' },
        { name: 'Alex Engineer', email: 'site_eng1@sitesense.ai' },
        { name: 'David Miller', email: 'site_eng2@sitesense.ai' }
      ],
      features: [
        'Mark assigned daily tasks as completed',
        'Take worker attendance & record site log',
        'Purchase materials & log downtime/rainfall'
      ]
    }
  };

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    setValue('email', DEMO_ACCOUNTS[roleKey].email);
    setValue('password', DEMO_ACCOUNTS[roleKey].password);
    setAuthError('');
  };

  const onSubmit = async (data) => {
    setAuthError('');
    const result = await login(data.email, data.password);
    if (result.success) {
      navigate('/profile');
    } else {
      setAuthError(result.error);
    }
  };

  const currentRoleInfo = DEMO_ACCOUNTS[selectedRole];

  return (
    <div className="min-h-screen bg-[#003135] text-white flex flex-col justify-between overflow-hidden relative selection:bg-[#0FA4AF] selection:text-white">
      
      {/* Background Animated Ambient Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#024950] rounded-full blur-[140px] opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-[#0FA4AF] rounded-full blur-[180px] opacity-25 pointer-events-none"></div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#024950_1px,transparent_1px),linear-gradient(to_bottom,#024950_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

      {/* Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl gradient-btn flex items-center justify-center shadow-lg shadow-[#0FA4AF]/25">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-2xl tracking-tight text-white">SiteSense</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0FA4AF]/20 text-[#0FA4AF] border border-[#0FA4AF]/40 font-bold">
                AI PLATFORM
              </span>
            </div>
            <p className="text-xs text-[#AFDDE5]/80 font-medium">Smart Construction & Predictive Analytics</p>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-2 bg-[#024950]/50 px-4 py-2 rounded-full border border-white/10 text-xs text-[#AFDDE5]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Module 1 Active: Authentication & RBAC</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10 flex-1 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Enterprise Hero Showcase & Role Feature Preview */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full glass-panel text-[#AFDDE5] text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-[#0FA4AF]" />
              <span>Enterprise Role-Based Access Architecture</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Construction Management <br />
              <span className="gradient-text">Powered by Predictive AI.</span>
            </h1>

            <p className="text-[#AFDDE5]/90 text-base leading-relaxed max-w-xl font-normal">
              SiteSense streamlines project workflows, worker operations, material expenditures, and risk analytics across Admin, Project Manager, and Site Engineer roles.
            </p>

            {/* Quick Demo Credentials Pill Switcher */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#AFDDE5]">
                Select Role to Test Credentials (1-Click Auto-Fill)
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                {Object.keys(DEMO_ACCOUNTS).map((roleKey) => {
                  const roleData = DEMO_ACCOUNTS[roleKey];
                  const isSelected = selectedRole === roleKey;

                  return (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => handleRoleSelect(roleKey)}
                      className={`p-3 rounded-2xl border transition-all duration-300 text-left flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#024950] border-[#0FA4AF] shadow-lg shadow-[#0FA4AF]/20 ring-1 ring-[#0FA4AF]'
                          : 'glass-panel border-white/10 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 rounded-lg bg-black/20">
                          {roleData.icon}
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#0FA4AF]"></span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-white truncate">{roleData.roleTitle}</p>
                      <p className="text-[10px] text-[#AFDDE5] truncate">{roleData.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Role Capabilities Preview Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedRole}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="p-5 rounded-2xl glass-panel border border-[#0FA4AF]/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {currentRoleInfo.icon}
                    <h3 className="font-bold text-sm text-white">{currentRoleInfo.roleTitle} Privileges</h3>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${currentRoleInfo.badgeColor}`}>
                    {currentRoleInfo.roleBadge}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {currentRoleInfo.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-xs text-[#AFDDE5]">
                      <CheckCircle2 className="w-4 h-4 text-[#0FA4AF] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

          </motion.div>

          {/* Right Column: High-Contrast SaaS Login Card (White Card Design) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-6 flex justify-center"
          >
            <div className="w-full max-w-md glass-panel-light rounded-3xl p-8 sm:p-10 text-[#003135] shadow-2xl relative border border-white/80">
              
              {/* Top Card Accent Bar */}
              <div className="h-1.5 w-24 bg-[#0FA4AF] rounded-full mx-auto mb-6"></div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-extrabold tracking-tight text-[#003135]">
                  Enterprise Sign In
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your credentials or use the role switcher to test.
                </p>
              </div>

              {/* Error Banner */}
              {(authError || error) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Authentication Failed</p>
                    <p className="text-red-600 mt-0.5">{authError || error}</p>
                  </div>
                </motion.div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                
                {/* Email Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider">
                      Email Address
                    </label>
                    {DEMO_ACCOUNTS[selectedRole]?.accounts && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            setValue('email', e.target.value);
                            setValue('password', 'password123');
                            setAuthError('');
                          }
                        }}
                        className="text-[11px] bg-slate-100 border border-slate-300 rounded-lg px-2 py-0.5 font-semibold text-[#003135] focus:outline-none focus:ring-1 focus:ring-[#0FA4AF] cursor-pointer"
                      >
                        <option value="">Quick Select Account...</option>
                        {DEMO_ACCOUNTS[selectedRole].accounts.map((acc) => (
                          <option key={acc.email} value={acc.email}>
                            {acc.name} ({acc.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4 text-[#024950]" />
                    </div>
                    <input
                      type="email"
                      {...register('email', {
                        required: 'Email address is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all duration-200"
                      placeholder="name@sitesense.ai"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.email.message}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-[#003135] uppercase tracking-wider">
                      Password
                    </label>
                    <span className="text-[11px] text-[#0FA4AF] font-semibold cursor-pointer hover:underline">
                      Default: password123
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4 text-[#024950]" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-[#003135] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:bg-white transition-all duration-200"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#003135] transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.password.message}</p>
                  )}
                </div>

                {/* Selected Role Tag in Form */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Signing in as role:</span>
                  <span className="font-bold text-[#003135] flex items-center gap-1.5">
                    {currentRoleInfo.icon}
                    {currentRoleInfo.roleTitle}
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl text-white font-bold text-sm gradient-btn flex items-center justify-center space-x-2 shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Authenticating JWT...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Platform</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

              </form>

              {/* Bottom Security Info */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                <span className="flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                  256-Bit JWT Encrypted
                </span>
                <span>Version 1.0.0</span>
              </div>

            </div>
          </motion.div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-[#AFDDE5]/60 z-10 border-t border-white/5">
        <p>© 2026 SiteSense Platform. Enterprise Construction Intelligence. All rights reserved.</p>
      </footer>

    </div>
  );
};

export default LoginPage;
