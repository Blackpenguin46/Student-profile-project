import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="container-fluid d-flex align-items-center justify-content-center min-vh-100">
      <div className="text-center">
        <div className="mb-4">
          <i className="bi bi-question-circle text-muted" style={{ fontSize: '6rem' }}></i>
        </div>
        <h1 className="display-1 fw-bold text-muted">404</h1>
        <h2 className="mb-3">Page Not Found</h2>
        <p className="text-muted mb-4">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="d-flex justify-content-center gap-3">
          <Link to="/dashboard" className="btn btn-primary">
            <i className="bi bi-house me-2"></i>
            Go to Dashboard
          </Link>
          <Link to="/" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>
            Go Back
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;