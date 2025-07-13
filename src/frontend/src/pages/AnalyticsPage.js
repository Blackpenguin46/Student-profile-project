import React from 'react';

const AnalyticsPage = () => {
  return (
    <div className="container-fluid">
      <h1 className="h3 mb-4">
        <i className="bi bi-graph-up me-2"></i>
        Analytics Dashboard
      </h1>
      
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-graph-up text-muted mb-3" style={{ fontSize: '4rem' }}></i>
          <h4>Data Analytics</h4>
          <p className="text-muted">
            Comprehensive analytics and visualizations for class insights.
          </p>
          <p className="text-muted">Coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;