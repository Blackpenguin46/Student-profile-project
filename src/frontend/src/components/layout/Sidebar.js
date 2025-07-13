import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();

  const navigationItems = [
    {
      path: '/dashboard',
      icon: 'bi-house-fill',
      label: 'Dashboard',
      roles: ['student', 'teacher', 'admin']
    },
    {
      path: '/profile',
      icon: 'bi-person-circle',
      label: 'My Profile',
      roles: ['student', 'teacher', 'admin']
    },
    {
      path: '/students',
      icon: 'bi-people-fill',
      label: 'Students',
      roles: ['teacher', 'admin']
    },
    {
      path: '/surveys',
      icon: 'bi-clipboard-data',
      label: 'Surveys',
      roles: ['student', 'teacher', 'admin']
    },
    {
      path: '/analytics',
      icon: 'bi-graph-up',
      label: 'Analytics',
      roles: ['teacher', 'admin']
    },
    {
      path: '/settings',
      icon: 'bi-gear',
      label: 'Settings',
      roles: ['student', 'teacher', 'admin']
    }
  ];

  const filteredNavItems = navigationItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <div className="sidebar bg-white border-end vh-100">
      <div className="p-3">
        <h6 className="text-muted text-uppercase fw-bold mb-3">
          Navigation
        </h6>
        
        <nav className="nav flex-column">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link d-flex align-items-center py-2 px-3 rounded ${
                  isActive ? 'active bg-primary text-white' : 'text-dark'
                }`
              }
            >
              <i className={`${item.icon} me-3`}></i>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Role-specific sections */}
        {user?.role === 'teacher' && (
          <div className="mt-4">
            <h6 className="text-muted text-uppercase fw-bold mb-3">
              Teaching Tools
            </h6>
            <nav className="nav flex-column">
              <NavLink
                to="/surveys/create"
                className="nav-link d-flex align-items-center py-2 px-3 rounded text-dark"
              >
                <i className="bi bi-plus-circle me-3"></i>
                Create Survey
              </NavLink>
              <NavLink
                to="/students/groups"
                className="nav-link d-flex align-items-center py-2 px-3 rounded text-dark"
              >
                <i className="bi bi-people me-3"></i>
                Manage Groups
              </NavLink>
              <NavLink
                to="/export"
                className="nav-link d-flex align-items-center py-2 px-3 rounded text-dark"
              >
                <i className="bi bi-download me-3"></i>
                Export Data
              </NavLink>
            </nav>
          </div>
        )}

        {user?.role === 'student' && (
          <div className="mt-4">
            <h6 className="text-muted text-uppercase fw-bold mb-3">
              My Tools
            </h6>
            <nav className="nav flex-column">
              <NavLink
                to="/profile/goals"
                className="nav-link d-flex align-items-center py-2 px-3 rounded text-dark"
              >
                <i className="bi bi-target me-3"></i>
                My Goals
              </NavLink>
              <NavLink
                to="/profile/skills"
                className="nav-link d-flex align-items-center py-2 px-3 rounded text-dark"
              >
                <i className="bi bi-award me-3"></i>
                My Skills
              </NavLink>
              <NavLink
                to="/profile/resume"
                className="nav-link d-flex align-items-center py-2 px-3 rounded text-dark"
              >
                <i className="bi bi-file-earmark-text me-3"></i>
                My Resume
              </NavLink>
            </nav>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-4 p-3 bg-light rounded">
          <h6 className="text-muted text-uppercase fw-bold mb-2">
            Quick Stats
          </h6>
          <div className="small">
            {user?.role === 'student' && (
              <>
                <div className="d-flex justify-content-between">
                  <span>Profile Completion:</span>
                  <span className="fw-bold text-primary">
                    {user?.profile?.profile_completion_percentage || 0}%
                  </span>
                </div>
                <div className="progress mt-1 mb-2" style={{ height: '4px' }}>
                  <div 
                    className="progress-bar bg-primary" 
                    style={{ width: `${user?.profile?.profile_completion_percentage || 0}%` }}
                  ></div>
                </div>
              </>
            )}
            
            {user?.role === 'teacher' && (
              <>
                <div className="d-flex justify-content-between">
                  <span>Active Students:</span>
                  <span className="fw-bold text-success">--</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Pending Surveys:</span>
                  <span className="fw-bold text-warning">--</span>
                </div>
              </>
            )}
            
            <div className="d-flex justify-content-between">
              <span>Last Login:</span>
              <span className="fw-bold">
                {user?.last_login ? 
                  new Date(user.last_login).toLocaleDateString() : 
                  'Today'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-4">
          <h6 className="text-muted text-uppercase fw-bold mb-2">
            Support
          </h6>
          <div className="small">
            <a href="#" className="text-decoration-none d-block mb-1">
              <i className="bi bi-question-circle me-2"></i>
              Help Center
            </a>
            <a href="#" className="text-decoration-none d-block mb-1">
              <i className="bi bi-book me-2"></i>
              User Guide
            </a>
            <a href="#" className="text-decoration-none d-block">
              <i className="bi bi-envelope me-2"></i>
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;