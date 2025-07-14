import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { StatsCard } from '../ui/StatsCard';
import AnalyticsChart from './AnalyticsChart';

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics('dashboard');
  }, []);

  const fetchAnalytics = async (type = 'dashboard') => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analytics?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== 'overview') {
      fetchAnalytics(tab);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-800">
            <span className="text-xl">❌</span>
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'skills', label: 'Skills', icon: '⚡' },
          { id: 'goals', label: 'Goals', icon: '🎯' },
          { id: 'surveys', label: 'Surveys', icon: '📋' },
          { id: 'trends', label: 'Trends', icon: '📈' }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => handleTabChange(tab.id)}
            className="flex-1 justify-center gap-2"
            disabled={loading}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Students"
              value={analytics.overview?.total_students || 0}
              icon="👥"
              trend="+5%"
              trendColor="text-green-600"
            />
            <StatsCard
              title="Profile Completion"
              value={`${analytics.overview?.avg_profile_completion || 0}%`}
              icon="📝"
              trend={analytics.overview?.high_completion_profiles > analytics.overview?.low_completion_profiles ? '+2%' : '-1%'}
              trendColor={analytics.overview?.high_completion_profiles > analytics.overview?.low_completion_profiles ? "text-green-600" : "text-red-600"}
            />
            <StatsCard
              title="Goals Completed"
              value={`${analytics.overview?.completed_goals || 0}/${analytics.overview?.total_goals || 0}`}
              icon="🎯"
              trend={analytics.overview?.completed_goals > 0 ? '+3%' : '0%'}
              trendColor="text-green-600"
            />
            <StatsCard
              title="Survey Responses"
              value={analytics.overview?.survey_responses || 0}
              icon="📋"
              trend="+8%"
              trendColor="text-green-600"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Top Skills Across Students</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.top_skills && analytics.top_skills.length > 0 ? (
                  <AnalyticsChart
                    type="bar"
                    data={analytics.top_skills.slice(0, 8).map(skill => ({
                      label: skill.skill_name,
                      value: skill.student_count,
                      category: skill.category
                    }))}
                    xKey="label"
                    yKey="value"
                    height={250}
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No skills data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Goal Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Goals by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.goal_progress && analytics.goal_progress.length > 0 ? (
                  <AnalyticsChart
                    type="pie"
                    data={analytics.goal_progress.map(goal => ({
                      label: goal.category,
                      value: goal.total_goals
                    }))}
                    xKey="label"
                    yKey="value"
                    height={250}
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No goals data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Survey Completion Status */}
          <Card>
            <CardHeader>
              <CardTitle>Survey Completion Status</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.survey_completion && analytics.survey_completion.length > 0 ? (
                <div className="space-y-4">
                  {analytics.survey_completion.map((survey, index) => {
                    const completionRate = survey.total_responses > 0 
                      ? Math.round((survey.completed_responses / survey.total_responses) * 100)
                      : 0;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{survey.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {survey.template_type} • {survey.completed_responses}/{survey.total_responses} responses
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{completionRate}%</div>
                            <div className="text-sm text-muted-foreground">Complete</div>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No surveys created yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Student Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.recent_activity && analytics.recent_activity.length > 0 ? (
                <div className="space-y-3">
                  {analytics.recent_activity.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm">
                          <strong>{activity.first_name} {activity.last_name}</strong> {activity.action}
                          {activity.entity_type && ` ${activity.entity_type}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString()} • {activity.count} times
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No recent activity
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Skills Tab */}
      {activeTab === 'skills' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Skills Distribution by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.skill_distribution ? (
                  <AnalyticsChart
                    type="bar"
                    data={analytics.skill_distribution.map(item => ({
                      label: item.category,
                      value: item.student_count
                    }))}
                    xKey="label"
                    yKey="value"
                    height={200}
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-8">Loading skills data...</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trending Skills (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.trending_skills ? (
                  <AnalyticsChart
                    type="bar"
                    data={analytics.trending_skills.map(item => ({
                      label: item.skill_name,
                      value: item.recent_additions
                    }))}
                    xKey="label"
                    yKey="value"
                    height={200}
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-8">Loading trending data...</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Overall Completion Rate"
              value={`${analytics.goal_completion_rate || 0}%`}
              icon="🎯"
              trend="+2%"
              trendColor="text-green-600"
            />
            <StatsCard
              title="Active Goals"
              value={analytics.goals_by_category?.reduce((sum, cat) => sum + cat.active, 0) || 0}
              icon="🔄"
              trend="+5"
              trendColor="text-blue-600"
            />
            <StatsCard
              title="Completed Goals"
              value={analytics.goals_by_category?.reduce((sum, cat) => sum + cat.completed, 0) || 0}
              icon="✅"
              trend="+3"
              trendColor="text-green-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Goals by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.goals_by_category ? (
                  <AnalyticsChart
                    type="pie"
                    data={analytics.goals_by_category.map(item => ({
                      label: item.category,
                      value: item.total
                    }))}
                    xKey="label"
                    yKey="value"
                    height={250}
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-8">Loading goals data...</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Goals by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.goals_by_priority ? (
                  <AnalyticsChart
                    type="bar"
                    data={analytics.goals_by_priority.map(item => ({
                      label: item.priority,
                      value: item.total
                    }))}
                    xKey="label"
                    yKey="value"
                    height={200}
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-8">Loading priority data...</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Loading indicator for tab switches */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="text-lg text-muted-foreground">Loading {activeTab} analytics...</div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;