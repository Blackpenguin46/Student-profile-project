import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    return `${user.first_name} ${user.last_name}`;
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'teacher':
        return 'bi-mortarboard';
      case 'student':
        return 'bi-person-fill';
      case 'admin':
        return 'bi-shield-check';
      default:
        return 'bi-person';
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom">
      <div className="container-fluid">
        {/* Brand */}
        <Link className="navbar-brand fw-bold text-primary" to="/dashboard">
          <i className="bi bi-mortarboard-fill me-2"></i>
          Student Profile System
        </Link>

        {/* Mobile Toggle */}
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation Items */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/dashboard">
                <i className="bi bi-house-fill me-1"></i>
                Dashboard
              </Link>
            </li>
            
            {user?.role === 'teacher' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/students">
                    <i className="bi bi-people-fill me-1"></i>
                    Students
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/analytics">
                    <i className="bi bi-graph-up me-1"></i>
                    Analytics
                  </Link>
                </li>
              </>
            )}
            
            <li className="nav-item">
              <Link className="nav-link" to="/surveys">
                <i className="bi bi-clipboard-data me-1"></i>
                Surveys
              </Link>
            </li>
          </ul>

          {/* User Menu */}
          <ul className="navbar-nav">
            <li className="nav-item dropdown">
              <button 
                className="nav-link dropdown-toggle d-flex align-items-center btn btn-link border-0" 
                id="userDropdown" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <i className={`${getRoleIcon()} me-2`}></i>
                <span className="d-none d-md-inline">{getUserDisplayName()}</span>
                <span className="badge bg-secondary ms-2 text-capitalize">
                  {user?.role}
                </span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                <li>
                  <h6 className="dropdown-header">
                    <i className={`${getRoleIcon()} me-2`}></i>
                    {getUserDisplayName()}
                  </h6>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <Link className="dropdown-item" to="/profile">
                    <i className="bi bi-person-circle me-2"></i>
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/settings">
                    <i className="bi bi-gear me-2"></i>
                    Settings
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button 
                    className="dropdown-item text-danger" 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;