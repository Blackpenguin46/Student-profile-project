import React from 'react';
import { Card, CardContent } from './Card';

const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend = null,
  trendDirection = 'up',
  className = '',
  gradient = true,
  children
}) => {
  const trendColor = trendDirection === 'up' ? 'text-green-600' : 'text-red-600';
  const trendIcon = trendDirection === 'up' ? '↗' : '↘';
  
  return (
    <Card className={`stats-card animate-fade-in ${className}`} gradient={gradient}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">
                {value}
              </h3>
              {trend && (
                <span className={`text-sm font-medium ${trendColor} flex items-center gap-1`}>
                  <span>{trendIcon}</span>
                  {trend}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0 ml-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary text-xl">
                {icon}
              </div>
            </div>
          )}
        </div>
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;