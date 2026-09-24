import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { ShieldCheck, HardHat, UserCheck, LogOut, Activity, FolderKanban, Users, CalendarCheck, CheckSquare, Package, ClipboardList, Brain, BarChart3, Settings } from 'lucide-react';

const Navbar = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();

  const getRoleBadge = (userRole) => {
    switch (userRole) {
      case 'ADMIN':
        return {
          label: 'ADMIN',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />,
        };
      case 'PROJECT_MANAGER':
        return {
          label: 'PROJECT MANAGER',
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          icon: <UserCheck className="w-3.5 h-3.5 mr-1 text-amber-300" />,
        };
      case 'SITE_ENGINEER':
        return {
          label: 'SITE ENGINEER',
          bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
          icon: <HardHat className="w-3.5 h-3.5 mr-1 text-cyan-300" />,
        };
      default:
        return {
          label: userRole || 'USER',
          bg: 'bg-[#024950] text-[#AFDDE5] border-[#0FA4AF]/30',
          icon: <Activity className="w-3.5 h-3.5 mr-1 text-[#0FA4AF]" />,
        };
    }
  };

  const badge = getRoleBadge(role);

  return (
    <header className="sticky top-0 z-50 bg-[#003135]/90 backdrop-blur-md border-b border-[#024950]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-6">
            <Link to="/projects" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center shadow-lg shadow-[#0FA4AF]/20 group-hover:scale-105 transition-transform duration-200">
                <span className="font-extrabold text-[#FFFFFF] text-xl tracking-tighter">B</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg text-white tracking-tight">SiteSense</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#0FA4AF]/20 text-[#0FA4AF] border border-[#0FA4AF]/40 font-bold">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-[#AFDDE5]/70 tracking-wide font-medium hidden sm:block">
                  Smart Construction Platform
                </p>
              </div>
            </Link>

            {/* Navigation Tabs */}
            {user && (
              <nav className="hidden md:flex items-center space-x-1 bg-[#024950]/40 p-1 rounded-xl border border-white/5">
                <Link
                  to="/projects"
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    location.pathname === '/projects'
                      ? 'bg-[#0FA4AF] text-white shadow-md'
                      : 'text-[#AFDDE5] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FolderKanban className="w-4 h-4" />
                  <span>Projects</span>
                </Link>

                <Link
                  to="/workers"
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    location.pathname === '/workers'
                      ? 'bg-[#0FA4AF] text-white shadow-md'
                      : 'text-[#AFDDE5] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Workers</span>
                </Link>

                <Link
                  to="/attendance"
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    location.pathname === '/attendance'
                      ? 'bg-[#0FA4AF] text-[#003135] font-bold shadow-md'
                      : 'text-[#AFDDE5] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Attendance</span>
                </Link>

                <Link
                  to="/tasks"
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    location.pathname === '/tasks'
                      ? 'bg-[#0FA4AF] text-white shadow-md'
                      : 'text-[#AFDDE5] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Tasks</span>
                </Link>

                <Link
                  to="/materials"
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    location.pathname === '/materials'
                      ? 'bg-[#0FA4AF] text-white shadow-md'
                      : 'text-[#AFDDE5] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Materials & Expenses</span>
                </Link>

                <Link
                  to="/dailylogs"
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    location.pathname === '/dailylogs'
                      ? 'bg-[#0FA4AF] text-white shadow-md'
                      : 'text-[#AFDDE5] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Daily Logs</span>
                </Link>

                <Link
                  to="/ai"
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    location.pathname === '/ai'
                      ? 'bg-[#0FA4AF] text-white shadow-md'
                      : 'text-[#AFDDE5] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Brain className="w-4 h-4 text-[#AFDDE5]" />
                  <span>AI Engine</span>
                </Link>

                <Link
                  to="/reports"
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    location.pathname === '/reports'
                      ? 'bg-[#0FA4AF] text-white shadow-md'
                      : 'text-[#AFDDE5] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-[#AFDDE5]" />
                  <span>Reports</span>
                </Link>
              </nav>
            )}
          </div>

          {/* User Status Bar */}
          {user && (
            <div className="flex items-center space-x-4">
              
              {/* Role Pill Badge */}
              <div className={`hidden sm:flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}>
                {badge.icon}
                <span>{badge.label}</span>
              </div>

              {/* User Avatar & Info */}
              <Link to="/profile" className="flex items-center space-x-3 bg-[#024950]/50 p-1.5 pr-3 rounded-full border border-white/10 hover:border-[#0FA4AF]/50 transition-colors">
                <img
                  src={user.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"}
                  alt={user.first_name || "User"}
                  className="w-8 h-8 rounded-full object-cover border border-[#0FA4AF]"
                />
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold text-white leading-tight">
                    {user.first_name} {user.last_name}
                  </p>
                </div>
              </Link>

              {/* Settings Button */}
              <Link
                to="/settings"
                title="Settings"
                className={`p-2 rounded-xl border transition-all duration-200 ${
                  location.pathname === '/settings'
                    ? 'bg-[#0FA4AF] text-white border-[#0FA4AF]'
                    : 'bg-[#024950]/80 text-[#AFDDE5] border-transparent hover:text-white hover:border-[#0FA4AF]/40'
                }`}
              >
                <Settings className="w-4 h-4" />
              </Link>

              {/* Logout Button */}
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-xl text-gray-300 hover:text-white bg-[#024950]/80 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-all duration-200"
              >
                <LogOut className="w-4 h-4 text-red-400" />
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

export default Navbar;
