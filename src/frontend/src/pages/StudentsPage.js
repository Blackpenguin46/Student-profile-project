import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdvancedSearch from '../components/search/AdvancedSearch';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';

const StudentsPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [currentFilters, setCurrentFilters] = useState({});
  const [error, setError] = useState('');

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
                Student management is only available to teachers and administrators.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Load all students initially
  useEffect(() => {
    loadStudents({});
  }, []);

  const loadStudents = async (filters) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          if (Array.isArray(value) && value.length > 0) {
            queryParams.append(key, value.join(','));
          } else if (!Array.isArray(value)) {
            queryParams.append(key, value);
          }
        }
      });

      const response = await fetch(`/api/students?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        setPagination(data.pagination);
        setCurrentFilters(data.filters || filters);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load students');
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setError('Network error while loading students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters) => {
    loadStudents(filters);
  };

  const handleClear = () => {
    setCurrentFilters({});
    loadStudents({});
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadStudents({ ...currentFilters, page: newPage });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getActivityStatus = (lastLogin) => {
    if (!lastLogin) return { text: 'Never logged in', color: 'text-gray-500' };
    
    const daysSince = Math.floor((new Date() - new Date(lastLogin)) / (1000 * 60 * 60 * 24));
    
    if (daysSince === 0) return { text: 'Active today', color: 'text-green-600' };
    if (daysSince <= 7) return { text: `${daysSince}d ago`, color: 'text-green-600' };
    if (daysSince <= 30) return { text: `${daysSince}d ago`, color: 'text-yellow-600' };
    if (daysSince <= 90) return { text: `${daysSince}d ago`, color: 'text-orange-600' };
    return { text: `${daysSince}d ago`, color: 'text-red-600' };
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold gradient-text">
              👥 Student Management
            </h1>
            <p className="text-muted-foreground text-lg">
              Search, filter, and manage student profiles and progress
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium capitalize">
              {user?.role}
            </div>
            {pagination && (
              <div className="px-3 py-1 bg-muted/50 rounded-full text-sm font-medium">
                {pagination.total} students
              </div>
            )}
          </div>
        </div>

        {/* Advanced Search Component */}
        <AdvancedSearch 
          onSearch={handleSearch}
          onClear={handleClear}
          initialFilters={currentFilters}
        />

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-center">
              <div className="text-red-600 font-medium">{error}</div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-primary rounded-full mb-4"></div>
              <p className="text-muted-foreground">Loading students...</p>
            </CardContent>
          </Card>
        )}

        {/* Students List */}
        {!loading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Student Profiles</span>
                {pagination && (
                  <span className="text-sm font-normal text-muted-foreground">
                    Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium mb-2">No students found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search filters or check back later.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {students.map((student) => {
                    const activityStatus = getActivityStatus(student.last_login);
                    return (
                      <div key={student.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                          {/* Basic Info */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-lg">
                                {student.first_name} {student.last_name}
                              </h3>
                              {student.profile_completion_percentage && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCompletionColor(student.profile_completion_percentage)}`}>
                                  {student.profile_completion_percentage}%
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                            {student.student_id_num && (
                              <p className="text-sm text-muted-foreground">ID: {student.student_id_num}</p>
                            )}
                          </div>

                          {/* Academic Info */}
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium">Year:</span> {student.year_level || 'Not specified'}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Major:</span> {student.major || 'Not specified'}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Registered:</span> {formatDate(student.created_at)}
                            </div>
                          </div>

                          {/* Activity Stats */}
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium">Skills:</span> {student.skills_count || 0}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Interests:</span> {student.interests_count || 0}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Goals:</span> {student.goals_count || 0}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Activities:</span> {student.activities_count || 0}
                            </div>
                          </div>

                          {/* Actions & Status */}
                          <div className="space-y-2">
                            <div className={`text-sm ${activityStatus.color}`}>
                              <span className="font-medium">Last Login:</span> {activityStatus.text}
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.location.href = `/profile/${student.id}`}
                              >
                                View Profile
                              </Button>
                              {user?.role === 'admin' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => window.location.href = `/admin/student/${student.id}`}
                                >
                                  Manage
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Goals Preview */}
                        {student.short_term_goals && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Goals:</span> {student.short_term_goals.substring(0, 150)}{student.short_term_goals.length > 150 ? '...' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrev}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, pagination.page - 2) + i;
                      if (pageNum > pagination.totalPages) return null;
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === pagination.page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNext}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => window.location.href = '/analytics'}
                className="p-4 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="font-medium">Analytics</div>
                <div className="text-sm text-muted-foreground">View detailed insights</div>
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
                onClick={() => {
                  const queryParams = new URLSearchParams(currentFilters);
                  window.open(`/api/students?${queryParams.toString()}&export=csv`, '_blank');
                }}
                className="p-4 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="text-2xl mb-2">📥</div>
                <div className="font-medium">Export Data</div>
                <div className="text-sm text-muted-foreground">Download student list</div>
              </button>
              
              <button 
                onClick={() => loadStudents({ ...currentFilters, profileCompletion: 'low' })}
                className="p-4 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="text-2xl mb-2">⚠️</div>
                <div className="font-medium">Incomplete Profiles</div>
                <div className="text-sm text-muted-foreground">Find students to follow up</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentsPage;