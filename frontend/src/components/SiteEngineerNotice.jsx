import React from 'react';
import Navbar from './Navbar';
import { HardHat, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const SiteEngineerNotice = () => {
  return (
    <div className="min-h-screen bg-[#003135] text-white flex flex-col selection:bg-[#0FA4AF] selection:text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full glass-panel rounded-3xl p-8 text-center border border-[#0FA4AF]/30 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#0FA4AF]/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="w-16 h-16 bg-[#024950] text-[#0FA4AF] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#0FA4AF]/30 shadow-lg shadow-[#0FA4AF]/20">
            <HardHat className="w-8 h-8 text-[#0FA4AF]" />
          </div>

          <span className="text-[10px] px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold uppercase tracking-wider">
            Site Engineer Role Access
          </span>

          <h2 className="text-2xl font-extrabold tracking-tight text-white mt-4 mb-2">
            Project Operations Restricted
          </h2>

          <p className="text-xs text-[#AFDDE5] leading-relaxed mb-6">
            As a <strong className="text-white">Site Engineer</strong>, project creation, budget editing, and Project Manager assignments are reserved for Administrators and Project Managers.
          </p>

          <div className="p-4 rounded-2xl bg-[#024950]/50 border border-white/10 text-left space-y-2 mb-6">
            <p className="text-[11px] font-bold text-[#0FA4AF] uppercase tracking-wider mb-1">
              Your Permitted Engineer Privileges:
            </p>
            <div className="flex items-center space-x-2 text-xs text-[#AFDDE5]">
              <CheckCircle2 className="w-4 h-4 text-[#0FA4AF] shrink-0" />
              <span>View assigned daily site tasks</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-[#AFDDE5]">
              <CheckCircle2 className="w-4 h-4 text-[#0FA4AF] shrink-0" />
              <span>Record daily worker attendance & site logs</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-[#AFDDE5]">
              <CheckCircle2 className="w-4 h-4 text-[#0FA4AF] shrink-0" />
              <span>Purchase construction materials & log machine downtime</span>
            </div>
          </div>

          <Link
            to="/profile"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl gradient-btn text-white text-xs font-bold shadow-lg shadow-[#0FA4AF]/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to User Profile</span>
          </Link>

        </div>
      </main>
    </div>
  );
};

export default SiteEngineerNotice;
