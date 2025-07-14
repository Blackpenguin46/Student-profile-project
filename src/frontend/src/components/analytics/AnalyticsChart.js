import React from 'react';

// Simple chart component using CSS and HTML (avoiding external chart library dependency)
const AnalyticsChart = ({ 
  type = 'bar', 
  data = [], 
  title = '',
  xKey = 'label',
  yKey = 'value',
  height = 200,
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => Number(item[yKey]) || 0));
  const minValue = Math.min(...data.map(item => Number(item[yKey]) || 0));
  const range = maxValue - minValue || 1;

  if (type === 'bar') {
    return (
      <div className="space-y-4">
        {title && <h4 className="font-medium text-center">{title}</h4>}
        <div className="space-y-3" style={{ height: `${height}px` }}>
          {data.map((item, index) => {
            const value = Number(item[yKey]) || 0;
            const percentage = ((value - minValue) / range) * 100;
            const color = colors[index % colors.length];
            
            return (
              <div key={index} className="flex items-center gap-3">
                <div className="w-20 text-sm text-right truncate" title={item[xKey]}>
                  {String(item[xKey]).substring(0, 10)}
                </div>
                <div className="flex-1 relative">
                  <div 
                    className="h-6 rounded transition-all duration-500 flex items-center px-2"
                    style={{ 
                      width: `${Math.max(percentage, 5)}%`,
                      backgroundColor: color + '20',
                      borderLeft: `3px solid ${color}`
                    }}
                  >
                    <span className="text-xs font-medium" style={{ color }}>
                      {value}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'pie') {
    const total = data.reduce((sum, item) => sum + (Number(item[yKey]) || 0), 0);
    let currentAngle = 0;
    
    return (
      <div className="space-y-4">
        {title && <h4 className="font-medium text-center">{title}</h4>}
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg width="160" height="160" className="transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="transparent"
                stroke="#e5e7eb"
                strokeWidth="20"
              />
              {data.map((item, index) => {
                const value = Number(item[yKey]) || 0;
                const percentage = value / total;
                const strokeDasharray = `${percentage * 440} 440`;
                const strokeDashoffset = -currentAngle * 440 / 360;
                const color = colors[index % colors.length];
                
                currentAngle += percentage * 360;
                
                return (
                  <circle
                    key={index}
                    cx="80"
                    cy="80"
                    r="70"
                    fill="transparent"
                    stroke={color}
                    strokeWidth="20"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {data.map((item, index) => {
            const color = colors[index % colors.length];
            const value = Number(item[yKey]) || 0;
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span className="truncate" title={item[xKey]}>
                  {String(item[xKey]).substring(0, 15)} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'line') {
    const width = 300;
    const chartHeight = height - 40;
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * width;
      const value = Number(item[yKey]) || 0;
      const y = chartHeight - ((value - minValue) / range) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="space-y-4">
        {title && <h4 className="font-medium text-center">{title}</h4>}
        <div className="flex justify-center">
          <svg width={width} height={height} className="border rounded">
            <polyline
              fill="none"
              stroke={colors[0]}
              strokeWidth="2"
              points={points}
            />
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * width;
              const value = Number(item[yKey]) || 0;
              const y = chartHeight - ((value - minValue) / range) * chartHeight;
              
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={colors[0]}
                  className="hover:r-6 transition-all"
                  title={`${item[xKey]}: ${value}`}
                />
              );
            })}
          </svg>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{data[0]?.[xKey]}</span>
          <span>{data[data.length - 1]?.[xKey]}</span>
        </div>
      </div>
    );
  }

  return <div>Unsupported chart type: {type}</div>;
};

export default AnalyticsChart;