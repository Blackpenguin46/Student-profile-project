import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import SurveyBuilder from '../components/surveys/SurveyBuilder';
import SurveyTaking from '../components/surveys/SurveyTaking';

const SurveysPage = () => {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit', 'take'
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const endpoint = user?.role === 'teacher' || user?.role === 'admin' 
        ? '/api/surveys/templates' 
        : '/api/surveys';
        
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSurveys(data.templates || data.surveys || []);
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
      setError('Failed to load surveys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSurvey = async (surveyData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/surveys/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(surveyData)
      });

      if (response.ok) {
        setMessage('Survey created successfully!');
        setCurrentView('list');
        await fetchSurveys();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create survey');
      }
    } catch (error) {
      console.error('Error creating survey:', error);
      setError('Failed to create survey');
    }
  };

  const handleEditSurvey = async (surveyData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/surveys/templates?template_id=${selectedSurvey.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(surveyData)
      });

      if (response.ok) {
        setMessage('Survey updated successfully!');
        setCurrentView('list');
        await fetchSurveys();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update survey');
      }
    } catch (error) {
      console.error('Error updating survey:', error);
      setError('Failed to update survey');
    }
  };

  const handleDeleteSurvey = async (surveyId) => {
    if (!window.confirm('Are you sure you want to delete this survey?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/surveys/templates?template_id=${surveyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessage('Survey deleted successfully!');
        await fetchSurveys();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete survey');
      }
    } catch (error) {
      console.error('Error deleting survey:', error);
      setError('Failed to delete survey');
    }
  };

  const handleSubmitResponse = async (responseData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/surveys/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(responseData)
      });

      if (response.ok) {
        setMessage('Survey submitted successfully!');
        setCurrentView('list');
        await fetchSurveys();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to submit survey');
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      setError('Failed to submit survey');
    }
  };

  const handleSaveResponse = async (responseData) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/surveys/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(responseData)
      });
    } catch (error) {
      console.error('Error saving response:', error);
    }
  };

  const getStatusBadge = (survey) => {
    if (user?.role === 'student') {
      if (survey.response_id) {
        if (survey.completion_status === 'completed') {
          return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Completed</span>;
        } else {
          return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">In Progress</span>;
        }
      } else {
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Available</span>;
      }
    }
    return null;
  };

  // Render different views
  if (currentView === 'create') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold gradient-text">Create New Survey</h1>
            <Button variant="outline" onClick={() => setCurrentView('list')}>
              Back to Surveys
            </Button>
          </div>
          <SurveyBuilder 
            onSave={handleCreateSurvey}
            onCancel={() => setCurrentView('list')}
          />
        </div>
      </div>
    );
  }

  if (currentView === 'edit' && selectedSurvey) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold gradient-text">Edit Survey</h1>
            <Button variant="outline" onClick={() => setCurrentView('list')}>
              Back to Surveys
            </Button>
          </div>
          <SurveyBuilder 
            initialTemplate={selectedSurvey}
            onSave={handleEditSurvey}
            onCancel={() => setCurrentView('list')}
          />
        </div>
      </div>
    );
  }

  if (currentView === 'take' && selectedSurvey) {
    return (
      <div className="min-h-screen bg-background p-6">
        <SurveyTaking
          survey={selectedSurvey}
          onSubmit={handleSubmitResponse}
          onSave={handleSaveResponse}
          onCancel={() => setCurrentView('list')}
          existingResponses={selectedSurvey.responses ? JSON.parse(selectedSurvey.responses) : {}}
        />
      </div>
    );
  }

  // Main surveys list view
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold gradient-text">
              {user?.role === 'teacher' ? 'Survey Management' : 'Available Surveys'} 📋
            </h1>
            <p className="text-muted-foreground text-lg">
              {user?.role === 'teacher' 
                ? 'Create and manage surveys to collect student information'
                : 'Complete surveys assigned by your teachers'
              }
            </p>
          </div>
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <Button onClick={() => setCurrentView('create')}>
              Create New Survey
            </Button>
          )}
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

        {/* Surveys List */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-lg text-muted-foreground">Loading surveys...</div>
            </CardContent>
          </Card>
        ) : surveys.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-medium mb-2">No surveys available</h3>
              <p className="text-muted-foreground">
                {user?.role === 'teacher' 
                  ? 'Create your first survey to start collecting student data.'
                  : 'No surveys have been assigned to you yet.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {surveys.map((survey) => (
              <Card key={survey.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{survey.title}</CardTitle>
                        {getStatusBadge(survey)}
                      </div>
                      {survey.description && (
                        <p className="text-muted-foreground">{survey.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {user?.role === 'student' && (
                        <Button
                          onClick={() => {
                            setSelectedSurvey(survey);
                            setCurrentView('take');
                          }}
                          size="sm"
                          variant={survey.completion_status === 'completed' ? 'outline' : 'default'}
                        >
                          {survey.completion_status === 'completed' ? 'View Response' : 'Take Survey'}
                        </Button>
                      )}
                      
                      {(user?.role === 'teacher' || user?.role === 'admin') && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSurvey(survey);
                              setCurrentView('edit');
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSurvey(survey.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span>Type: {survey.template_type?.replace('_', ' ') || 'General'}</span>
                    <span>Duration: ~{survey.estimated_duration || 15} minutes</span>
                    <span>Questions: {survey.questions?.length || 0}</span>
                    {survey.first_name && survey.last_name && (
                      <span>Created by: {survey.first_name} {survey.last_name}</span>
                    )}
                    <span>Created: {new Date(survey.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveysPage;