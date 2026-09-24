import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import Navbar from '../components/Navbar';
import {
  ShieldCheck,
  HardHat,
  UserCheck,
  CheckCircle2,
  Activity,
  LogOut,
  Calendar,
  Layers,
  FileCheck
} from 'lucide-react';
import api from '../api/axios';

const ProfileDashboard = () => {
  const { user, role, roleCapabilities, logout } = useAuth();
  const [capabilities, setCapabilities] = useState(roleCapabilities);
  const [loadingCaps, setLoadingCaps] = useState(!roleCapabilities);

  useEffect(() => {
    const fetchCaps = async () => {
      try {
        setLoadingCaps(true);
        const res = await api.get('/auth/capabilities/');
        setCapabilities(res.data.capabilities);
      } catch (err) {
        console.error('Failed to load role capabilities', err);
      } finally {
        setLoadingCaps(false);
      }
    };
    fetchCaps();
  }, [role]);

  const getRoleTheme = (userRole) => {
    switch (userRole) {
      case 'ADMIN':
        return {
          title: 'System Administrator',
          badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          accentColor: '#10B981',
          icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
        };
      case 'PROJECT_MANAGER':
        return {
          title: 'Project Manager',
          badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          accentColor: '#F59E0B',
          icon: <UserCheck className="w-6 h-6 text-amber-300" />,
        };
      case 'SITE_ENGINEER':
        return {
          title: 'Site Engineer',
          badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
          accentColor: '#06B6D4',
          icon: <HardHat className="w-6 h-6 text-cyan-300" />,
        };
      default:
        return {
          title: 'Authenticated User',
          badgeBg: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
          accentColor: '#0FA4AF',
          icon: <Activity className="w-6 h-6 text-teal-300" />,
        };
    }
  };

  const theme = getRoleTheme(role);

  return (
    <div className="min-h-screen bg-[#003135] text-white flex flex-col selection:bg-[#0FA4AF] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#0FA4AF]/30 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#0FA4AF]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center space-x-5 z-10">
            <img
              src={user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"}
              alt={user?.first_name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-[#0FA4AF] shadow-xl"
            />
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome, {user?.first_name} {user?.last_name}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${theme.badgeBg}`}>
                  {user?.role}
                </span>
              </div>
              <p className="text-sm text-[#AFDDE5]">
                {user?.department || 'Construction Operations'} • Employee ID: <span className="font-mono text-white">{user?.employee_id || 'N/A'}</span>
              </p>
              <p className="text-xs text-[#AFDDE5]/70 flex items-center gap-1 pt-1">
                <Calendar className="w-3.5 h-3.5 text-[#0FA4AF]" />
                Authenticated Session Active (JWT 256-Bit Standard)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 z-10 self-stretch md:self-auto justify-end">
            <button
              onClick={logout}
              className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center space-x-2 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </motion.div>

        {/* Capabilities & Security Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Active Capabilities Column */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-8 space-y-6"
          >
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-[#024950]">
                    {theme.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {capabilities?.title || theme.title} Privileges & Capabilities
                    </h2>
                    <p className="text-xs text-[#AFDDE5]">
                      {capabilities?.description || 'Active backend authorization policies'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] px-3 py-1 rounded-full bg-[#0FA4AF]/20 text-[#0FA4AF] font-bold border border-[#0FA4AF]/40">
                  VERIFIED BY JWT
                </span>
              </div>

              {loadingCaps ? (
                <div className="py-12 flex justify-center items-center">
                  <div className="w-8 h-8 border-4 border-[#0FA4AF] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {capabilities?.permissions?.map((perm, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="p-4 rounded-2xl bg-[#024950]/40 border border-white/5 hover:border-[#0FA4AF]/40 transition-all duration-200 flex items-start space-x-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-[#0FA4AF] shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold text-[#AFDDE5] leading-relaxed">
                        {perm}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Module Isolation Notice */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center space-x-3">
                <FileCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <p>
                  <strong className="font-bold">Module 1 Scope:</strong> Authentication and user role configuration complete. Future modules (Projects, Tasks, Materials, AI Analytics) will be unlocked in upcoming development phases as requested.
                </p>
              </div>

            </div>
          </motion.div>

          {/* User Details & JWT Token Security Details Column */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-4 space-y-6"
          >
            {/* Account Metadata Card */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0FA4AF]" />
                User Account Metadata
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400">Email Address</span>
                  <span className="font-mono text-[#AFDDE5]">{user?.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400">Phone Number</span>
                  <span className="text-[#AFDDE5]">{user?.phone_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400">Role Designation</span>
                  <span className="font-bold text-[#0FA4AF]">{user?.role}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Account Status</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Active
                  </span>
                </div>
              </div>
            </div>

          </motion.div>

        </div>

      </main>

      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-[#AFDDE5]/60 border-t border-white/5">
        <p>© 2026 SiteSense Platform. Enterprise Construction Intelligence.</p>
      </footer>
    </div>
  );
};

export default ProfileDashboard;
