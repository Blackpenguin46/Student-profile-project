import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DataExport from '../components/export/DataExport';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';

const ExportPage = () => {
  const { user } = useAuth();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [recentExports, setRecentExports] = useState([
    {
      id: 1,
      type: 'students',
      format: 'csv',
      date: '2024-07-14',
      size: '2.3 MB',
      records: 150,
      status: 'completed'
    },
    {
      id: 2,
      type: 'groups',
      format: 'json',
      date: '2024-07-13',
      size: '850 KB',
      records: 45,
      status: 'completed'
    },
    {
      id: 3,
      type: 'analytics',
      format: 'csv',
      date: '2024-07-12',
      size: '1.1 MB',
      records: 200,
      status: 'completed'
    }
  ]);

  // Check permissions
  if (user?.role !== 'teacher' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">🚫</div>
              <h3 className="text-xl font-medium mb-2 text-red-800">Access Denied</h3>
              <p className="text-red-700">
                Data export functionality is only available to teachers and administrators.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showExportDialog) {
    return (
      <div className="min-h-screen bg-background p-6">
        <DataExport onClose={() => setShowExportDialog(false)} />
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      students: '👥',
      groups: '🤝',
      analytics: '📊',
      skills: '🛠️',
      goals: '🎯',
      surveys: '📋',
      comprehensive: '📦'
    };
    return icons[type] || '📄';
  };

  const getFormatIcon = (format) => {
    return format === 'csv' ? '📊' : '💻';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold gradient-text">
              📥 Data Export
            </h1>
            <p className="text-muted-foreground text-lg">
              Export your data for analysis, reporting, or backup purposes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium capitalize">
              {user?.role}
            </div>
            <Button onClick={() => setShowExportDialog(true)}>
              📤 New Export
            </Button>
          </div>
        </div>

        {/* Quick Export Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowExportDialog(true)}>
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-3">👥</div>
              <h3 className="font-medium mb-1">Student Data</h3>
              <p className="text-sm text-muted-foreground mb-3">Export all student profiles and progress</p>
              <Button size="sm" variant="outline" className="w-full">
                Export Students
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowExportDialog(true)}>
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-3">🤝</div>
              <h3 className="font-medium mb-1">Group Data</h3>
              <p className="text-sm text-muted-foreground mb-3">Export group formations and assignments</p>
              <Button size="sm" variant="outline" className="w-full">
                Export Groups
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowExportDialog(true)}>
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-medium mb-1">Analytics</h3>
              <p className="text-sm text-muted-foreground mb-3">Export performance metrics and insights</p>
              <Button size="sm" variant="outline" className="w-full">
                Export Analytics
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowExportDialog(true)}>
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-3">📦</div>
              <h3 className="font-medium mb-1">Full Backup</h3>
              <p className="text-sm text-muted-foreground mb-3">Export comprehensive system backup</p>
              <Button size="sm" variant="outline" className="w-full">
                Full Export
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Export Features */}
        <Card>
          <CardHeader>
            <CardTitle>Export Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  Selective Exports
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Filter by student criteria</li>
                  <li>• Export specific date ranges</li>
                  <li>• Choose data fields to include</li>
                  <li>• Group by categories or status</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  Multiple Formats
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• CSV for spreadsheet analysis</li>
                  <li>• JSON for programming tools</li>
                  <li>• Optimized file sizes</li>
                  <li>• Cross-platform compatibility</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <span className="text-xl">🔒</span>
                  Security & Privacy
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Automatic data anonymization</li>
                  <li>• Role-based access control</li>
                  <li>• Audit trail for all exports</li>
                  <li>• GDPR compliance features</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Exports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Exports</span>
              <span className="text-sm font-normal text-muted-foreground">
                Last 30 days
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentExports.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-lg font-medium mb-2">No recent exports</h3>
                <p className="text-muted-foreground mb-4">
                  Start by creating your first data export.
                </p>
                <Button onClick={() => setShowExportDialog(true)}>
                  Create Export
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentExports.map((export_item) => (
                  <div key={export_item.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
                      {/* Type & Format */}
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getTypeIcon(export_item.type)}</span>
                        <div>
                          <div className="font-medium capitalize">{export_item.type}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            {getFormatIcon(export_item.format)}
                            {export_item.format.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(export_item.status)}`}>
                          {export_item.status}
                        </span>
                      </div>

                      {/* Size & Records */}
                      <div className="text-sm">
                        <div className="font-medium">{export_item.size}</div>
                        <div className="text-muted-foreground">{export_item.records} records</div>
                      </div>

                      {/* Date */}
                      <div className="text-sm">
                        <div className="font-medium">Exported</div>
                        <div className="text-muted-foreground">{formatDate(export_item.date)}</div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 lg:col-span-2 justify-end">
                        <Button size="sm" variant="outline" disabled>
                          📥 Download
                        </Button>
                        <Button size="sm" variant="outline" disabled>
                          📋 Details
                        </Button>
                        {user?.role === 'admin' && (
                          <Button size="sm" variant="outline" disabled>
                            🗑️ Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Export Guidelines & Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">📋 Before Exporting</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Review data privacy policies and compliance requirements</li>
                  <li>• Ensure you have necessary permissions for the data</li>
                  <li>• Consider the purpose and scope of your export</li>
                  <li>• Choose appropriate filters to limit sensitive information</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">🔧 Technical Tips</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use CSV format for Excel and Google Sheets compatibility</li>
                  <li>• Choose JSON format for programming and data analysis</li>
                  <li>• Large exports may take several minutes to process</li>
                  <li>• Download files immediately as they expire after 24 hours</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600">⚠️</span>
                <div>
                  <h4 className="font-medium text-yellow-800">Important Notice</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    All data exports are logged for security purposes. Ensure exported data is handled according to your institution's privacy policies and applicable regulations (GDPR, FERPA, etc.).
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => setShowExportDialog(true)}
                className="p-4 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="font-medium">Custom Export</div>
                <div className="text-sm text-muted-foreground">Choose data and filters</div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/students'}
                className="p-4 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="text-2xl mb-2">👥</div>
                <div className="font-medium">Manage Students</div>
                <div className="text-sm text-muted-foreground">View and filter students</div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/groups'}
                className="p-4 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="text-2xl mb-2">🤝</div>
                <div className="font-medium">Manage Groups</div>
                <div className="text-sm text-muted-foreground">Create and organize groups</div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/analytics'}
                className="p-4 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="text-2xl mb-2">📈</div>
                <div className="font-medium">View Analytics</div>
                <div className="text-sm text-muted-foreground">Performance insights</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExportPage;