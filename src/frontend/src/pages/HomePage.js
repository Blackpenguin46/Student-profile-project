import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-vh-100 bg-light">
      {/* Hero Section */}
      <div className="bg-primary text-white">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">
                Student Profile & Goal Tracking System
              </h1>
              <p className="lead mb-4">
                A comprehensive platform for educators to track student goals, interests, 
                and skills. Empower personalized learning through data-driven insights.
              </p>
              <div className="d-flex gap-3">
                <Link to="/register" className="btn btn-light btn-lg">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-outline-light btn-lg">
                  Sign In
                </Link>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <i className="bi bi-mortarboard-fill" style={{ fontSize: '12rem', opacity: 0.8 }}></i>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container py-5">
        <div className="row text-center mb-5">
          <div className="col-12">
            <h2 className="fw-bold mb-3">Powerful Features for Modern Education</h2>
            <p className="lead text-muted">
              Everything you need to understand and support your students' journey
            </p>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body text-center p-4">
                <i className="bi bi-person-circle text-primary mb-3" style={{ fontSize: '3rem' }}></i>
                <h5 className="fw-bold">Student Profiles</h5>
                <p className="text-muted">
                  Comprehensive student profiles with goals, skills, interests, and progress tracking.
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body text-center p-4">
                <i className="bi bi-clipboard-data text-primary mb-3" style={{ fontSize: '3rem' }}></i>
                <h5 className="fw-bold">Dynamic Surveys</h5>
                <p className="text-muted">
                  Create and deploy customizable surveys to collect student information efficiently.
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body text-center p-4">
                <i className="bi bi-file-earmark-text text-primary mb-3" style={{ fontSize: '3rem' }}></i>
                <h5 className="fw-bold">Resume Parsing</h5>
                <p className="text-muted">
                  Automatically extract skills and experience from uploaded resumes.
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body text-center p-4">
                <i className="bi bi-graph-up text-primary mb-3" style={{ fontSize: '3rem' }}></i>
                <h5 className="fw-bold">Analytics Dashboard</h5>
                <p className="text-muted">
                  Visualize class-wide statistics and individual student progress.
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body text-center p-4">
                <i className="bi bi-search text-primary mb-3" style={{ fontSize: '3rem' }}></i>
                <h5 className="fw-bold">Smart Search</h5>
                <p className="text-muted">
                  Advanced filtering and search capabilities for student grouping.
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body text-center p-4">
                <i className="bi bi-download text-primary mb-3" style={{ fontSize: '3rem' }}></i>
                <h5 className="fw-bold">Data Export</h5>
                <p className="text-muted">
                  Export data in multiple formats for further analysis and reporting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-light py-5">
        <div className="container text-center">
          <h2 className="fw-bold mb-3">Ready to Get Started?</h2>
          <p className="lead mb-4">
            Join thousands of educators using our platform to enhance student learning
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Account
            </Link>
            <Link to="/login" className="btn btn-outline-primary btn-lg">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark text-white py-4">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h5 className="fw-bold">Student Profile System</h5>
              <p className="text-muted">
                Empowering educators through data-driven student insights.
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="text-muted mb-0">
                © 2024 Student Profile System. Competition Entry.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;