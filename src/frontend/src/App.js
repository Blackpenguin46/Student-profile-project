import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import './styles/globals.css';

// Layout Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import LoadingSpinner from './components/common/LoadingSpinner';

// Page Components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import StudentsPage from './pages/StudentsPage';
import GroupsPage from './pages/GroupsPage';
import SurveysPage from './pages/SurveysPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import ResumeUploadPage from './pages/ResumeUploadPage';
import NotFoundPage from './pages/NotFoundPage';

// Route Protection Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleBasedRoute from './components/auth/RoleBasedRoute';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <LoadingSpinner size="lg" text="Loading Student Profile System..." />
      </div>
    );
  }

  return (
    <div className="App">
      {isAuthenticated ? (
        // Authenticated Layout
        <div className="d-flex flex-column min-vh-100">
          <Navbar />
          <div className="container-fluid flex-grow-1">
            <div className="row">
              {/* Sidebar */}
              <div className="col-md-3 col-lg-2 px-0">
                <Sidebar />
              </div>
              
              {/* Main Content */}
              <main className="col-md-9 col-lg-10 px-4 py-3">
                <Routes>
                  {/* Dashboard - Default route for authenticated users */}
                  <Route 
                    path="/" 
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Profile Management */}
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Resume Upload */}
                  <Route 
                    path="/resume" 
                    element={
                      <ProtectedRoute>
                        <ResumeUploadPage />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Students - Teacher/Admin only */}
                  <Route 
                    path="/students" 
                    element={
                      <RoleBasedRoute allowedRoles={['teacher', 'admin']}>
                        <StudentsPage />
                      </RoleBasedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/students/:studentId" 
                    element={
                      <RoleBasedRoute allowedRoles={['teacher', 'admin']}>
                        <ProfilePage />
                      </RoleBasedRoute>
                    } 
                  />

                  {/* Groups - Teacher/Admin only */}
                  <Route 
                    path="/groups" 
                    element={
                      <RoleBasedRoute allowedRoles={['teacher', 'admin']}>
                        <GroupsPage />
                      </RoleBasedRoute>
                    } 
                  />

                  {/* Surveys */}
                  <Route 
                    path="/surveys" 
                    element={
                      <ProtectedRoute>
                        <SurveysPage />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Analytics - Teacher/Admin only */}
                  <Route 
                    path="/analytics" 
                    element={
                      <RoleBasedRoute allowedRoles={['teacher', 'admin']}>
                        <AnalyticsPage />
                      </RoleBasedRoute>
                    } 
                  />

                  {/* Settings */}
                  <Route 
                    path="/settings" 
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Redirect auth pages to dashboard */}
                  <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/register" element={<Navigate to="/dashboard" replace />} />

                  {/* 404 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
            </div>
          </div>
        </div>
      ) : (
        // Unauthenticated Layout
        <div className="min-vh-100">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Redirect all other routes to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      )}
    </div>
  );
}

export default App;