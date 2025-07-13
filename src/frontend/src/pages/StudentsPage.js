import React from 'react';

const StudentsPage = () => {
  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">
          <i className="bi bi-people-fill me-2"></i>
          Students
        </h1>
        <button className="btn btn-primary" disabled>
          <i className="bi bi-plus-circle me-2"></i>
          Add Student (Coming Soon)
        </button>
      </div>
      
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-people text-muted mb-3" style={{ fontSize: '4rem' }}></i>
          <h4>Student Management</h4>
          <p className="text-muted">
            Student listing, search, and management features are being developed.
          </p>
          <p className="text-muted">Coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default StudentsPage;