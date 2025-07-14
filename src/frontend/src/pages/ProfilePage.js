import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ProfileForm from '../components/profile/ProfileForm';
import GoalManager from '../components/goals/GoalManager';
import SkillsManager from '../components/skills/SkillsManager';
import InterestsManager from '../components/interests/InterestsManager';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import axios from 'axios';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  const handleSaveProfile = async (profileData) => {
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.put('/api/users/profile', profileData);
      
      if (response.data.success) {
        // Update user context with new data
        updateUser(response.data.user);
        setMessage('Profile updated successfully!');
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
      
      // Clear error after 5 seconds
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold gradient-text">
              Profile Management 👤
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your personal information, goals, and skills
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium capitalize">
              {user?.role}
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-800">
                <span className="text-xl">✅</span>
                <span>{message}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <span className="text-xl">❌</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {[
            { id: 'profile', label: 'Basic Profile', icon: '👤' },
            { id: 'goals', label: 'Goals', icon: '🎯' },
            { id: 'skills', label: 'Skills', icon: '⚡' },
            { id: 'interests', label: 'Interests', icon: '🎨' }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 justify-center gap-2"
            >
              <span>{tab.icon}</span>
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'profile' && (
            <ProfileForm 
              user={user} 
              onSave={handleSaveProfile}
              isLoading={isLoading}
            />
          )}
          
          {activeTab === 'goals' && (
            <GoalManager userId={user?.id} />
          )}
          
          {activeTab === 'skills' && (
            <SkillsManager userId={user?.id} />
          )}
          
          {activeTab === 'interests' && (
            <InterestsManager userId={user?.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;