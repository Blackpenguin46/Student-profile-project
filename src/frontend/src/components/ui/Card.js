import React from 'react';

export const Card = ({ 
  children, 
  className = '', 
  hover = false, 
  gradient = false,
  glass = false,
  ...props 
}) => {
  const baseClasses = 'card';
  const hoverClasses = hover ? 'hover-scale' : '';
  const gradientClasses = gradient ? 'stats-card' : '';
  const glassClasses = glass ? 'glass-effect' : '';
  
  const classes = `${baseClasses} ${hoverClasses} ${gradientClasses} ${glassClasses} ${className}`.trim();
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`p-4 pb-2 ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 pt-2 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`p-4 pt-2 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold mb-2 ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-muted-foreground ${className}`}>
    {children}
  </p>
);