import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const RoleBasedRoute = ({ children, allowedRoles, fallbackPath = '/dashboard' }) => {
  const { user, isAuthenticated, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <LoadingSpinner text="Checking permissions..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(allowedRoles)) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card border-danger">
              <div className="card-body text-center">
                <i className="bi bi-shield-x text-danger" style={{ fontSize: '3rem' }}></i>
                <h4 className="card-title text-danger mt-3">Access Denied</h4>
                <p className="card-text">
                  You don't have permission to access this page. 
                  Required role: {Array.isArray(allowedRoles) ? allowedRoles.join(' or ') : allowedRoles}
                </p>
                <p className="text-muted">
                  Your current role: <span className="badge bg-secondary">{user?.role}</span>
                </p>
                <Navigate to={fallbackPath} replace />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleBasedRoute;