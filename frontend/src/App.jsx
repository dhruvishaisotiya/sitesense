import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ProfileDashboard from './pages/ProfileDashboard';
import ProjectsPage from './pages/ProjectsPage';
import WorkersPage from './pages/WorkersPage';
import AttendancePage from './pages/AttendancePage';
import TasksPage from './pages/TasksPage';
import MaterialsPage from './pages/MaterialsPage';
import DailyLogsPage from './pages/DailyLogsPage';
import AiPredictionPage from './pages/AiPredictionPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#003135] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0FA4AF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  return isAuthenticated ? <Navigate to="/projects" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/projects"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER']}>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workers"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER']}>
                <WorkersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER']}>
                <AttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER']}>
                <TasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/materials"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER']}>
                <MaterialsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dailylogs"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER']}>
                <DailyLogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER']}>
                <AiPredictionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER']}>
                <ProfileDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
