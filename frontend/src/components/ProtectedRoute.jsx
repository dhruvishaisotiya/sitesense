import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#003135] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#0FA4AF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#AFDDE5] font-medium tracking-wide text-sm">Validating SiteSense Credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen bg-[#003135] flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full glass-panel rounded-2xl p-8 text-center border border-red-500/30">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
          <p className="text-gray-300 text-sm mb-6">
            Your current role (<span className="text-[#0FA4AF] font-semibold">{role}</span>) does not have authorization to view this enterprise module.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2.5 rounded-xl bg-[#024950] text-white hover:bg-[#0FA4AF] transition-all duration-300 text-sm font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
