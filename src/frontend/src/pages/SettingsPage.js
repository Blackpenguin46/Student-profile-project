import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="container-fluid">
      <h1 className="h3 mb-4">
        <i className="bi bi-gear me-2"></i>
        Settings
      </h1>
      
      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Account Settings</h5>
              <p className="card-text">
                Manage your account preferences and security settings.
              </p>
              
              <div className="mb-3">
                <strong>Current Role:</strong> 
                <span className="badge bg-primary text-capitalize ms-2">{user?.role}</span>
              </div>
              
              <button className="btn btn-primary me-2" disabled>
                Change Password (Coming Soon)
              </button>
              <button className="btn btn-outline-secondary" disabled>
                Update Preferences (Coming Soon)
              </button>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h6 className="card-title">Quick Info</h6>
              <p className="small text-muted">
                Settings and preferences management is being developed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;