import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <h1 className="h3 mb-4">
            <i className="bi bi-person-circle me-2"></i>
            Profile Management
          </h1>
          
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Profile Information</h5>
              <p className="card-text">
                Profile management features are being developed. Coming soon!
              </p>
              
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Name:</strong> {user?.first_name} {user?.last_name}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Role:</strong> <span className="badge bg-primary text-capitalize">{user?.role}</span></p>
                </div>
              </div>
              
              <button className="btn btn-primary" disabled>
                Edit Profile (Coming Soon)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;