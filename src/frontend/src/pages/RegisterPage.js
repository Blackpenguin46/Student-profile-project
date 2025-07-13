import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'student'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password';
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    // Class code validation for students

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const result = await register(formData);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setErrors({ general: result.message });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            {/* Header */}
            <div className="text-center mb-4">
              <Link to="/" className="text-decoration-none">
                <h2 className="fw-bold text-primary">
                  <i className="bi bi-mortarboard-fill me-2"></i>
                  Student Profile System
                </h2>
              </Link>
              <p className="text-muted">Create your account to get started</p>
            </div>

            {/* Registration Form */}
            <div className="card shadow-sm">
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  {/* General Error */}
                  {errors.general && (
                    <div className="alert alert-danger" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {errors.general}
                    </div>
                  )}

                  {/* Name Fields */}
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="first_name" className="form-label">
                        First Name
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Enter your first name"
                        disabled={isLoading}
                      />
                      {errors.first_name && (
                        <div className="invalid-feedback">{errors.first_name}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="last_name" className="form-label">
                        Last Name
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.last_name ? 'is-invalid' : ''}`}
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Enter your last name"
                        disabled={isLoading}
                      />
                      {errors.last_name && (
                        <div className="invalid-feedback">{errors.last_name}</div>
                      )}
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-envelope"></i>
                      </span>
                      <input
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        autoComplete="email"
                        disabled={isLoading}
                      />
                      {errors.email && (
                        <div className="invalid-feedback">{errors.email}</div>
                      )}
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="mb-3">
                    <label className="form-label">Account Type</label>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="role"
                            id="roleStudent"
                            value="student"
                            checked={formData.role === 'student'}
                            onChange={handleChange}
                            disabled={isLoading}
                          />
                          <label className="form-check-label" htmlFor="roleStudent">
                            <i className="bi bi-person-fill me-2"></i>
                            Student
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="role"
                            id="roleTeacher"
                            value="teacher"
                            checked={formData.role === 'teacher'}
                            onChange={handleChange}
                            disabled={isLoading}
                          />
                          <label className="form-check-label" htmlFor="roleTeacher">
                            <i className="bi bi-mortarboard me-2"></i>
                            Teacher
                          </label>
                        </div>
                      </div>
                    </div>
                    {errors.role && (
                      <div className="text-danger small mt-1">{errors.role}</div>
                    )}
                  </div>


                  {/* Password Fields */}
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="password" className="form-label">
                        Password
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-lock"></i>
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Create a password"
                          autoComplete="new-password"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                        </button>
                        {errors.password && (
                          <div className="invalid-feedback">{errors.password}</div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="confirm_password" className="form-label">
                        Confirm Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`form-control ${errors.confirm_password ? 'is-invalid' : ''}`}
                        id="confirm_password"
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        disabled={isLoading}
                      />
                      {errors.confirm_password && (
                        <div className="invalid-feedback">{errors.confirm_password}</div>
                      )}
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="form-check mb-3">
                    <input className="form-check-input" type="checkbox" id="terms" required disabled={isLoading} />
                    <label className="form-check-label text-muted" htmlFor="terms">
                      I agree to the <button type="button" className="btn btn-link text-decoration-none p-0 border-0">Terms of Service</button> and{' '}
                      <button type="button" className="btn btn-link text-decoration-none p-0 border-0">Privacy Policy</button>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-primary w-100 mb-3"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="me-2" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-plus me-2"></i>
                        Create Account
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center mt-4">
              <p className="text-muted">
                Already have an account?{' '}
                <Link to="/login" className="text-decoration-none">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;