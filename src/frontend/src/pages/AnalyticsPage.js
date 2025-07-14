import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import { Card, CardContent } from '../components/ui/Card';

const AnalyticsPage = () => {
  const { user } = useAuth();

  // Only allow teachers and admins
  if (user?.role !== 'teacher' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">🚫</div>
              <h3 className="text-xl font-medium mb-2 text-red-800">Access Denied</h3>
              <p className="text-red-700">
                Analytics are only available to teachers and administrators.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold gradient-text">
              Analytics Dashboard 📊
            </h1>
            <p className="text-muted-foreground text-lg">
              Comprehensive insights into student progress, skills, and engagement
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium capitalize">
              {user?.role}
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <AnalyticsDashboard />

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => window.location.href = '/students'}
                className="p-4 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="text-2xl mb-2">👥</div>
                <div className="font-medium">View Students</div>
                <div className="text-sm text-muted-foreground">Manage student profiles</div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/surveys'}
                className="p-4 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="text-2xl mb-2">📋</div>
                <div className="font-medium">Create Survey</div>
                <div className="text-sm text-muted-foreground">Collect student data</div>
              </button>
              
              <button 
                onClick={() => window.open('/api/analytics?type=dashboard&export_format=csv', '_blank')}
                className="p-4 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="text-2xl mb-2">📥</div>
                <div className="font-medium">Export Data</div>
                <div className="text-sm text-muted-foreground">Download analytics</div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/settings'}
                className="p-4 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="text-2xl mb-2">⚙️</div>
                <div className="font-medium">Settings</div>
                <div className="text-sm text-muted-foreground">Configure preferences</div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Understanding Your Analytics</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Key Metrics</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Profile Completion:</strong> Percentage of student profiles that are fully completed</li>
                  <li>• <strong>Skills Distribution:</strong> Most common skills across your students</li>
                  <li>• <strong>Goal Progress:</strong> Student goals by category and completion status</li>
                  <li>• <strong>Survey Responses:</strong> Participation rates in your surveys</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Using the Data</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Identify skill gaps and areas for curriculum focus</li>
                  <li>• Track student engagement and participation</li>
                  <li>• Form project groups based on complementary skills</li>
                  <li>• Monitor progress toward learning objectives</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;