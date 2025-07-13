import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();

  const getDashboardContent = () => {
    switch (user?.role) {
      case 'teacher':
        return (
          <div className="row">
            <div className="col-md-4">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-people-fill me-2"></i>
                    Total Students
                  </h5>
                  <h2 className="mb-0">--</h2>
                  <small>Coming soon</small>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-clipboard-check me-2"></i>
                    Completed Surveys
                  </h5>
                  <h2 className="mb-0">--</h2>
                  <small>Coming soon</small>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-info text-white">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-graph-up me-2"></i>
                    Profile Completion
                  </h5>
                  <h2 className="mb-0">--%</h2>
                  <small>Coming soon</small>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'student':
        return (
          <div className="row">
            <div className="col-md-6">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-person-circle me-2"></i>
                    Profile Completion
                  </h5>
                  <div className="progress mb-2">
                    <div 
                      className="progress-bar bg-primary" 
                      style={{ width: `${user?.profile?.profile_completion_percentage || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-muted mb-0">
                    {user?.profile?.profile_completion_percentage || 0}% complete
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-clipboard-data me-2"></i>
                    Pending Surveys
                  </h5>
                  <h2 className="text-warning mb-0">--</h2>
                  <small className="text-muted">Coming soon</small>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="alert alert-info">
            <h4>Welcome to the Dashboard!</h4>
            <p>Dashboard content will be customized based on your role.</p>
          </div>
        );
    }
  };

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-muted mb-0">
            Here's what's happening with your {user?.role === 'teacher' ? 'classes' : 'profile'} today.
          </p>
        </div>
        <div>
          <span className="badge bg-primary text-capitalize">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Dashboard Content */}
      {getDashboardContent()}

      {/* Quick Actions */}
      <div className="mt-5">
        <h4 className="mb-3">Quick Actions</h4>
        <div className="row">
          <div className="col-md-3">
            <div className="card text-center h-100">
              <div className="card-body">
                <i className="bi bi-person-circle text-primary mb-2" style={{ fontSize: '2rem' }}></i>
                <h6 className="card-title">Update Profile</h6>
                <p className="card-text small text-muted">
                  Keep your information current
                </p>
                <a href="/profile" className="btn btn-outline-primary btn-sm">
                  Go to Profile
                </a>
              </div>
            </div>
          </div>

          {user?.role === 'student' && (
            <div className="col-md-3">
              <div className="card text-center h-100">
                <div className="card-body">
                  <i className="bi bi-file-earmark-text text-success mb-2" style={{ fontSize: '2rem' }}></i>
                  <h6 className="card-title">Upload Resume</h6>
                  <p className="card-text small text-muted">
                    Add your latest resume
                  </p>
                  <button className="btn btn-outline-success btn-sm">
                    Upload File
                  </button>
                </div>
              </div>
            </div>
          )}

          {user?.role === 'teacher' && (
            <div className="col-md-3">
              <div className="card text-center h-100">
                <div className="card-body">
                  <i className="bi bi-clipboard-plus text-success mb-2" style={{ fontSize: '2rem' }}></i>
                  <h6 className="card-title">Create Survey</h6>
                  <p className="card-text small text-muted">
                    Build a new survey
                  </p>
                  <button className="btn btn-outline-success btn-sm">
                    Create Survey
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="col-md-3">
            <div className="card text-center h-100">
              <div className="card-body">
                <i className="bi bi-graph-up text-info mb-2" style={{ fontSize: '2rem' }}></i>
                <h6 className="card-title">View Analytics</h6>
                <p className="card-text small text-muted">
                  Check your progress
                </p>
                <button className="btn btn-outline-info btn-sm">
                  View Stats
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;