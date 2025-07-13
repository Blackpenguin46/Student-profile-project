import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Progress from '../components/ui/Progress';
import StatsCard from '../components/ui/StatsCard';
import '../styles/globals.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 42,
    completedSurveys: 28,
    profileCompletion: 75,
    pendingSurveys: 3,
    monthlyGrowth: 12.5,
    activeGoals: 8
  });

  // Animation delay for staggered card appearances
  const [visibleCards, setVisibleCards] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleCards(prev => prev + 1);
    }, 150);
    
    return () => clearInterval(timer);
  }, []);

  const getTeacherDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className={visibleCards >= 1 ? 'animate-fade-in' : 'opacity-0'}>
        <StatsCard
          title="Total Students"
          value={stats.totalStudents}
          subtitle="Across all classes"
          trend={`+${stats.monthlyGrowth}%`}
          trendDirection="up"
          icon="👥"
        />
      </div>
      
      <div className={visibleCards >= 2 ? 'animate-fade-in' : 'opacity-0'}>
        <StatsCard
          title="Completed Surveys"
          value={stats.completedSurveys}
          subtitle="This month"
          trend="+8"
          trendDirection="up"
          icon="✅"
        />
      </div>
      
      <div className={visibleCards >= 3 ? 'animate-fade-in' : 'opacity-0'}>
        <StatsCard
          title="Avg. Profile Completion"
          value={`${stats.profileCompletion}%`}
          subtitle="Class average"
          trend="+5%"
          trendDirection="up"
          icon="📊"
        />
      </div>
      
      <div className={visibleCards >= 4 ? 'animate-fade-in' : 'opacity-0'}>
        <StatsCard
          title="Active Goals"
          value={stats.activeGoals}
          subtitle="Student goals in progress"
          icon="🎯"
        />
      </div>
    </div>
  );

  const getStudentDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div className={visibleCards >= 1 ? 'animate-fade-in' : 'opacity-0'}>
        <Card className="hover-scale">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">👤</span>
              Profile Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress 
              value={user?.profile?.profile_completion_percentage || stats.profileCompletion} 
              showLabel={true}
              color="primary"
              size="lg"
            />
            <p className="text-sm text-muted-foreground mt-3">
              Complete your profile to unlock personalized features
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className={visibleCards >= 2 ? 'animate-fade-in' : 'opacity-0'}>
        <StatsCard
          title="Pending Surveys"
          value={stats.pendingSurveys}
          subtitle="Complete by Friday"
          icon="📋"
        />
      </div>
      
      <div className={visibleCards >= 3 ? 'animate-fade-in' : 'opacity-0'}>
        <StatsCard
          title="Active Goals"
          value={stats.activeGoals}
          subtitle="Keep pushing forward!"
          icon="🎯"
        />
      </div>
    </div>
  );

  const getDashboardContent = () => {
    switch (user?.role) {
      case 'teacher':
        return getTeacherDashboard();
      case 'student':
        return getStudentDashboard();
      default:
        return (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">🎓</div>
              <h3 className="text-2xl font-bold mb-2">Welcome to Your Dashboard!</h3>
              <p className="text-muted-foreground">
                Your personalized dashboard content will appear here based on your role.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Modern Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold gradient-text">
            Welcome back, {user?.first_name}! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            Here's what's happening with your {user?.role === 'teacher' ? 'classes' : 'profile'} today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium capitalize">
            {user?.role}
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      {getDashboardContent()}

      {/* Modern Quick Actions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Quick Actions</h2>
          <div className="text-sm text-muted-foreground">
            Streamline your workflow
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center hover-scale group cursor-pointer">
            <CardContent className="p-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-content-center text-2xl group-hover:scale-110 transition-transform">
                👤
              </div>
              <h3 className="font-semibold mb-2">Update Profile</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Keep your information current
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => window.location.href = '/profile'}
              >
                Go to Profile
              </Button>
            </CardContent>
          </Card>

          {user?.role === 'student' && (
            <Card className="text-center hover-scale group cursor-pointer">
              <CardContent className="p-6">
                <div className="w-12 h-12 mx-auto mb-4 bg-green-500/10 rounded-lg flex items-center justify-content-center text-2xl group-hover:scale-110 transition-transform">
                  📄
                </div>
                <h3 className="font-semibold mb-2">Upload Resume</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your latest resume
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Upload File
                </Button>
              </CardContent>
            </Card>
          )}

          {user?.role === 'teacher' && (
            <Card className="text-center hover-scale group cursor-pointer">
              <CardContent className="p-6">
                <div className="w-12 h-12 mx-auto mb-4 bg-green-500/10 rounded-lg flex items-center justify-content-center text-2xl group-hover:scale-110 transition-transform">
                  📋
                </div>
                <h3 className="font-semibold mb-2">Create Survey</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Build a new survey
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Create Survey
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="text-center hover-scale group cursor-pointer">
            <CardContent className="p-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-blue-500/10 rounded-lg flex items-center justify-content-center text-2xl group-hover:scale-110 transition-transform">
                📊
              </div>
              <h3 className="font-semibold mb-2">View Analytics</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Check your progress
              </p>
              <Button variant="outline" size="sm" className="w-full">
                View Stats
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;