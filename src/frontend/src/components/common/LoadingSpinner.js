import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  text = 'Loading...', 
  variant = 'primary',
  className = '' 
}) => {
  const sizeClass = size === 'sm' ? 'spinner-border-sm' : '';
  
  return (
    <div className={`d-flex flex-column align-items-center ${className}`}>
      <div 
        className={`spinner-border text-${variant} ${sizeClass}`} 
        role="status"
        aria-hidden="true"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {text && (
        <div className="mt-2 text-muted">
          {text}
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;