import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import GroupFormation from '../components/groups/GroupFormation';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';

const GroupsPage = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFormation, setShowFormation] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter] = useState('all');

  // Check permissions
  if (user?.role !== 'teacher' && user?.role !== 'admin') {
    return (
      <div className=\"min-h-screen bg-background p-6\">
        <div className=\"max-w-4xl mx-auto\">
          <Card className=\"border-red-200 bg-red-50\">
            <CardContent className=\"p-8 text-center\">
              <div className=\"text-6xl mb-4\">🚫</div>
              <h3 className=\"text-xl font-medium mb-2 text-red-800\">Access Denied</h3>
              <p className=\"text-red-700\">
                Group management is only available to teachers and administrators.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadGroups();
  }, [filter]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      if (filter !== 'all') {
        queryParams.append('status', filter);
      }

      const response = await fetch(`/api/groups?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
        setPagination(data.pagination);
      } else {
        console.error('Failed to load groups');
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupsCreated = (data) => {
    // Refresh the groups list
    loadGroups();
    alert(`Successfully created ${data.groups?.length || 0} groups!`);
  };

  const viewGroupDetails = async (groupId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedGroup(data.group);
        setShowGroupDetails(true);
      }
    } catch (error) {
      console.error('Error loading group details:', error);
    }
  };

  const deleteGroup = async (groupId) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        loadGroups();
        alert('Group deleted successfully');
      } else {
        alert('Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Error deleting group');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'disbanded': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (showFormation) {
    return (
      <div className=\"min-h-screen bg-background p-6\">
        <GroupFormation 
          onGroupsCreated={handleGroupsCreated}
          onClose={() => setShowFormation(false)}
        />
      </div>
    );
  }

  if (showGroupDetails && selectedGroup) {
    return (
      <div className=\"min-h-screen bg-background p-6\">
        <div className=\"max-w-6xl mx-auto space-y-6\">
          {/* Header */}
          <div className=\"flex justify-between items-start\">
            <div>
              <h1 className=\"text-3xl font-bold gradient-text\">{selectedGroup.name}</h1>
              <p className=\"text-muted-foreground text-lg\">{selectedGroup.description}</p>
            </div>
            <Button variant=\"outline\" onClick={() => setShowGroupDetails(false)}>
              ← Back to Groups
            </Button>
          </div>

          {/* Group Info */}
          <Card>
            <CardHeader>
              <CardTitle>Group Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4\">
                <div>
                  <div className=\"font-medium\">Status</div>
                  <span className={`px-2 py-1 rounded text-sm ${getStatusColor(selectedGroup.status)}`}>
                    {selectedGroup.status}
                  </span>
                </div>
                <div>
                  <div className=\"font-medium\">Size</div>
                  <div className=\"text-muted-foreground\">{selectedGroup.current_size} / {selectedGroup.max_size} members</div>
                </div>
                <div>
                  <div className=\"font-medium\">Project</div>
                  <div className=\"text-muted-foreground\">{selectedGroup.project_title || 'No project assigned'}</div>
                </div>
                <div>
                  <div className=\"font-medium\">Created</div>
                  <div className=\"text-muted-foreground\">{formatDate(selectedGroup.created_at)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Group Members */}
          <Card>
            <CardHeader>
              <CardTitle>Group Members ({selectedGroup.members?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedGroup.members && selectedGroup.members.length > 0 ? (
                <div className=\"grid gap-4\">
                  {selectedGroup.members.map((member, index) => (
                    <div key={index} className=\"p-4 border border-border rounded-lg\">
                      <div className=\"grid grid-cols-1 md:grid-cols-4 gap-4\">
                        <div>
                          <div className=\"font-medium\">{member.first_name} {member.last_name}</div>
                          <div className=\"text-sm text-muted-foreground\">{member.email}</div>
                          <div className=\"text-xs text-muted-foreground\">Role: {member.role_in_group}</div>
                        </div>
                        <div>
                          <div className=\"text-sm\">
                            <span className=\"font-medium\">Year:</span> {member.year_level || 'Not specified'}
                          </div>
                          <div className=\"text-sm\">
                            <span className=\"font-medium\">Major:</span> {member.major || 'Not specified'}
                          </div>
                        </div>
                        <div>
                          <div className=\"text-sm\">
                            <span className=\"font-medium\">Profile:</span> {member.profile_completion_percentage || 0}% complete
                          </div>
                          <div className=\"text-sm\">
                            <span className=\"font-medium\">Joined:</span> {formatDate(member.joined_at)}
                          </div>
                        </div>
                        <div>
                          {member.skills && Array.isArray(member.skills) && member.skills.length > 0 && (
                            <div className=\"text-sm\">
                              <span className=\"font-medium\">Skills:</span>
                              <div className=\"flex flex-wrap gap-1 mt-1\">
                                {member.skills.slice(0, 3).map((skill, skillIndex) => (
                                  <span key={skillIndex} className=\"px-2 py-1 bg-muted/50 rounded text-xs\">
                                    {skill.name}
                                  </span>
                                ))}
                                {member.skills.length > 3 && (
                                  <span className=\"px-2 py-1 bg-muted/50 rounded text-xs\">
                                    +{member.skills.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className=\"text-center py-8 text-muted-foreground\">
                  No members in this group yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formation Criteria */}
          {selectedGroup.formation_criteria && Object.keys(selectedGroup.formation_criteria).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Formation Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className=\"bg-muted/30 p-4 rounded\">
                  <pre className=\"text-sm overflow-auto\">
                    {JSON.stringify(selectedGroup.formation_criteria, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className=\"min-h-screen bg-background p-6\">
      <div className=\"max-w-7xl mx-auto space-y-6\">
        {/* Page Header */}
        <div className=\"flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4\">
          <div className=\"space-y-2\">
            <h1 className=\"text-3xl font-bold gradient-text\">
              👥 Group Management
            </h1>
            <p className=\"text-muted-foreground text-lg\">
              Create intelligent groups and manage student collaborations
            </p>
          </div>
          <div className=\"flex items-center gap-3\">
            <div className=\"px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium capitalize\">
              {user?.role}
            </div>
            <Button onClick={() => setShowFormation(true)}>
              🤖 Create Intelligent Groups
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <Card>
          <CardContent className=\"p-4\">
            <div className=\"flex gap-2\">
              {['all', 'active', 'inactive', 'completed', 'disbanded'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  {status === 'all' ? 'All Groups' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className=\"p-8 text-center\">
              <div className=\"animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-primary rounded-full mb-4\"></div>
              <p className=\"text-muted-foreground\">Loading groups...</p>
            </CardContent>
          </Card>
        )}

        {/* Groups List */}
        {!loading && (
          <Card>
            <CardHeader>
              <CardTitle className=\"flex items-center justify-between\">
                <span>Groups ({groups.length})</span>
                {pagination && (
                  <span className=\"text-sm font-normal text-muted-foreground\">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <div className=\"text-center py-12\">
                  <div className=\"text-6xl mb-4\">👥</div>
                  <h3 className=\"text-lg font-medium mb-2\">No groups found</h3>
                  <p className=\"text-muted-foreground mb-4\">
                    {filter === 'all' 
                      ? 'Start by creating intelligent groups for your students.'
                      : `No ${filter} groups found. Try changing the filter.`
                    }
                  </p>
                  {filter === 'all' && (
                    <Button onClick={() => setShowFormation(true)}>
                      Create Your First Groups
                    </Button>
                  )}
                </div>
              ) : (
                <div className=\"space-y-4\">
                  {groups.map((group) => (
                    <div key={group.id} className=\"border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors\">
                      <div className=\"grid grid-cols-1 lg:grid-cols-4 gap-4 items-start\">
                        {/* Group Info */}
                        <div className=\"space-y-2\">
                          <div className=\"flex items-center gap-2\">
                            <h3 className=\"font-medium text-lg\">{group.name}</h3>
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(group.status)}`}>
                              {group.status}
                            </span>
                          </div>
                          <p className=\"text-sm text-muted-foreground line-clamp-2\">{group.description}</p>
                          <div className=\"text-sm text-muted-foreground\">
                            ID: {group.id}
                          </div>
                        </div>

                        {/* Project & Size */}
                        <div className=\"space-y-1\">
                          <div className=\"text-sm\">
                            <span className=\"font-medium\">Project:</span> {group.project_title || 'None'}
                          </div>
                          <div className=\"text-sm\">
                            <span className=\"font-medium\">Size:</span> {group.current_size} / {group.max_size} members
                          </div>
                          <div className=\"text-sm\">
                            <span className=\"font-medium\">Created:</span> {formatDate(group.created_at)}
                          </div>
                        </div>

                        {/* Members Preview */}
                        <div className=\"space-y-1\">
                          <div className=\"text-sm font-medium\">Members:</div>
                          {group.members && group.members.length > 0 ? (
                            <div className=\"space-y-1\">
                              {group.members.slice(0, 3).map((member, index) => (
                                <div key={index} className=\"text-sm text-muted-foreground\">
                                  {member.name}
                                </div>
                              ))}
                              {group.members.length > 3 && (
                                <div className=\"text-xs text-muted-foreground\">
                                  +{group.members.length - 3} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className=\"text-sm text-muted-foreground\">No members</div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className=\"space-y-2\">
                          <div className=\"flex gap-2\">
                            <Button 
                              size=\"sm\" 
                              variant=\"outline\"
                              onClick={() => viewGroupDetails(group.id)}
                            >
                              View Details
                            </Button>
                            {user?.role === 'admin' && (
                              <Button 
                                size=\"sm\" 
                                variant=\"outline\"
                                onClick={() => deleteGroup(group.id)}
                                className=\"text-red-600 hover:text-red-700\"
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                          <div className=\"text-xs text-muted-foreground\">
                            Last updated: {formatDate(group.updated_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardContent className=\"p-6\">
            <h3 className=\"text-lg font-medium mb-4\">Quick Actions</h3>
            <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4\">
              <button 
                onClick={() => setShowFormation(true)}
                className=\"p-4 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors\"
              >
                <div className=\"text-2xl mb-2\">🤖</div>
                <div className=\"font-medium\">Smart Formation</div>
                <div className=\"text-sm text-muted-foreground\">Use AI algorithms</div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/students'}
                className=\"p-4 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors\"
              >
                <div className=\"text-2xl mb-2\">👤</div>
                <div className=\"font-medium\">View Students</div>
                <div className=\"text-sm text-muted-foreground\">Manage student profiles</div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/analytics'}
                className=\"p-4 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors\"
              >
                <div className=\"text-2xl mb-2\">📊</div>
                <div className=\"font-medium\">Group Analytics</div>
                <div className=\"text-sm text-muted-foreground\">View performance data</div>
              </button>
              
              <button 
                onClick={() => alert('Export functionality coming soon!')}
                className=\"p-4 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors\"
              >
                <div className=\"text-2xl mb-2\">📥</div>
                <div className=\"font-medium\">Export Groups</div>
                <div className=\"text-sm text-muted-foreground\">Download group data</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroupsPage;