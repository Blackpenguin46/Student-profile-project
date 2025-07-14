import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';

const GoalManager = ({ userId }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'academic',
    priority: 'medium',
    target_date: '',
    status: 'active'
  });
  const [showForm, setShowForm] = useState(false);

  const categories = ['academic', 'career', 'personal', 'skill', 'project'];
  const priorities = ['low', 'medium', 'high'];
  const statuses = ['active', 'completed', 'paused', 'cancelled'];

  useEffect(() => {
    fetchGoals();
  }, [userId]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/goals${userId ? `?id=${userId}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGoal(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/goals${userId ? `?id=${userId}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newGoal)
      });

      if (response.ok) {
        await fetchGoals();
        setNewGoal({
          title: '',
          description: '',
          category: 'academic',
          priority: 'medium',
          target_date: '',
          status: 'active'
        });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error adding goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGoalStatus = async (goalId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/goals?id=${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await fetchGoals();
      }
    } catch (error) {
      console.error('Error updating goal status:', error);
    }
  };

  const deleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/goals?id=${goalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchGoals();
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'academic': return '📚';
      case 'career': return '💼';
      case 'personal': return '🌱';
      case 'skill': return '⚡';
      case 'project': return '🚀';
      default: return '🎯';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Goals Management
          </CardTitle>
          <Button 
            onClick={() => setShowForm(!showForm)} 
            variant={showForm ? "outline" : "default"}
            size="sm"
          >
            {showForm ? 'Cancel' : 'Add Goal'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Goal Form */}
        {showForm && (
          <form onSubmit={addGoal} className="border border-border rounded-lg p-4 bg-muted/50 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Goal Title *</label>
                <input
                  type="text"
                  name="title"
                  value={newGoal.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Complete Data Science Course"
                  className="input-modern"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Target Date</label>
                <input
                  type="date"
                  name="target_date"
                  value={newGoal.target_date}
                  onChange={handleInputChange}
                  className="input-modern"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={newGoal.description}
                onChange={handleInputChange}
                placeholder="Describe your goal and how you plan to achieve it..."
                className="input-modern"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  name="category"
                  value={newGoal.category}
                  onChange={handleInputChange}
                  className="input-modern"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  name="priority"
                  value={newGoal.priority}
                  onChange={handleInputChange}
                  className="input-modern"
                >
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  name="status"
                  value={newGoal.status}
                  onChange={handleInputChange}
                  className="input-modern"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setShowForm(false)} variant="outline">
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Add Goal
              </Button>
            </div>
          </form>
        )}

        {/* Goals List */}
        {loading && goals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading goals...
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg">No goals yet</p>
            <p className="text-sm">Add your first goal to start tracking your progress!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div key={goal.id} className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getCategoryIcon(goal.category)}</span>
                      <h4 className="font-medium">{goal.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(goal.priority)}`}>
                        {goal.priority}
                      </span>
                    </div>
                    
                    {goal.description && (
                      <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Category: {goal.category}</span>
                      {goal.target_date && (
                        <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                      )}
                      <span>Created: {new Date(goal.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <select
                      value={goal.status}
                      onChange={(e) => updateGoalStatus(goal.id, e.target.value)}
                      className="text-xs border border-border rounded px-2 py-1"
                    >
                      {statuses.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                    
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="text-red-500 hover:text-red-700 text-sm px-2 py-1"
                      title="Delete goal"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalManager;