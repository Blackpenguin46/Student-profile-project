import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const SurveysPage = () => {
  const { user } = useAuth();

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">
          <i className="bi bi-clipboard-data me-2"></i>
          Surveys
        </h1>
        {user?.role === 'teacher' && (
          <button className="btn btn-primary" disabled>
            <i className="bi bi-plus-circle me-2"></i>
            Create Survey (Coming Soon)
          </button>
        )}
      </div>
      
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-clipboard-data text-muted mb-3" style={{ fontSize: '4rem' }}></i>
          <h4>Survey System</h4>
          <p className="text-muted">
            {user?.role === 'teacher' 
              ? 'Create and manage surveys to collect student information.'
              : 'Complete surveys assigned by your teachers.'
            }
          </p>
          <p className="text-muted">Coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default SurveysPage;