import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';

const InterestsManager = ({ userId }) => {
  const [availableInterests, setAvailableInterests] = useState([]);
  const [userInterests, setUserInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState('');
  const [interestLevel, setInterestLevel] = useState('medium');
  const [filterCategory, setFilterCategory] = useState('all');

  const interestLevels = ['low', 'medium', 'high'];

  useEffect(() => {
    fetchAvailableInterests();
    fetchUserInterests();
  }, [userId]);

  const fetchAvailableInterests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile-data?type=interests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableInterests(data.interests || []);
      }
    } catch (error) {
      console.error('Error fetching available interests:', error);
    }
  };

  const fetchUserInterests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/profile-data?type=interests${userId ? `&id=${userId}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserInterests(data.interests || []);
      }
    } catch (error) {
      console.error('Error fetching user interests:', error);
    } finally {
      setLoading(false);
    }
  };

  const addInterest = async (e) => {
    e.preventDefault();
    if (!selectedInterest) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/profile-data?type=interests${userId ? `&id=${userId}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          interest_id: parseInt(selectedInterest),
          interest_level: interestLevel
        })
      });

      if (response.ok) {
        await fetchUserInterests();
        setSelectedInterest('');
        setInterestLevel('medium');
      }
    } catch (error) {
      console.error('Error adding interest:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeInterest = async (interestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/profile-data?type=interests&item_id=${interestId}${userId ? `&id=${userId}` : ''}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchUserInterests();
      }
    } catch (error) {
      console.error('Error removing interest:', error);
    }
  };

  const getInterestLevelColor = (level) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'technology': return '💻';
      case 'creative': return '🎨';
      case 'physical': return '🏃';
      case 'social': return '👥';
      case 'intellectual': return '📚';
      case 'business': return '💼';
      case 'lifestyle': return '🌱';
      default: return '🎯';
    }
  };

  const categories = [...new Set(availableInterests.map(interest => interest.category).filter(Boolean))];
  
  const filteredAvailableInterests = filterCategory === 'all' 
    ? availableInterests 
    : availableInterests.filter(interest => interest.category === filterCategory);

  const userInterestIds = userInterests.map(interest => interest.id);
  const availableToAdd = filteredAvailableInterests.filter(interest => !userInterestIds.includes(interest.id));

  const interestsByCategory = userInterests.reduce((acc, interest) => {
    const category = interest.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(interest);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🎨</span>
          Interests Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Interest Form */}
        <div className="border border-border rounded-lg p-4 bg-muted/50">
          <h4 className="font-medium mb-4">Add New Interest</h4>
          <form onSubmit={addInterest} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Filter by Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="input-modern"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Select Interest</label>
                <select
                  value={selectedInterest}
                  onChange={(e) => setSelectedInterest(e.target.value)}
                  className="input-modern"
                  required
                >
                  <option value="">Choose an interest...</option>
                  {availableToAdd.map(interest => (
                    <option key={interest.id} value={interest.id}>
                      {getCategoryIcon(interest.category)} {interest.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Interest Level</label>
                <select
                  value={interestLevel}
                  onChange={(e) => setInterestLevel(e.target.value)}
                  className="input-modern"
                >
                  {interestLevels.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" loading={loading} disabled={!selectedInterest} className="w-full">
                  Add Interest
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Interests Display */}
        {loading && userInterests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading interests...
          </div>
        ) : userInterests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg">No interests added yet</p>
            <p className="text-sm">Add your interests to help teachers understand your passions!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(interestsByCategory).map(([category, interests]) => (
              <div key={category}>
                <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                  {getCategoryIcon(category)}
                  {category.charAt(0).toUpperCase() + category.slice(1)} Interests
                  <span className="text-sm text-muted-foreground">({interests.length})</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {interests.map((interest) => (
                    <div 
                      key={interest.id} 
                      className="border border-border rounded-lg p-3 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">{interest.name}</h5>
                          {interest.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {interest.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeInterest(interest.id)}
                          className="text-red-500 hover:text-red-700 text-sm ml-2"
                          title="Remove interest"
                        >
                          ×
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <span className={`px-2 py-1 rounded-full text-xs border ${getInterestLevelColor(interest.interest_level)}`}>
                          {interest.interest_level} interest
                        </span>
                        
                        <div className="text-xs text-muted-foreground">
                          Added: {new Date(interest.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Interests Summary */}
        {userInterests.length > 0 && (
          <div className="border border-border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium mb-3">Interests Overview</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{userInterests.length}</div>
                <div className="text-muted-foreground">Total Interests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {userInterests.filter(i => i.interest_level === 'high').length}
                </div>
                <div className="text-muted-foreground">High Interest</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {userInterests.filter(i => i.interest_level === 'medium').length}
                </div>
                <div className="text-muted-foreground">Medium Interest</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Object.keys(interestsByCategory).length}
                </div>
                <div className="text-muted-foreground">Categories</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InterestsManager;