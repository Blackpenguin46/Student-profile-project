import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';

const GroupFormation = ({ onGroupsCreated, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [algorithms, setAlgorithms] = useState({});
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    algorithm: 'balanced_skills',
    groupSize: 4,
    projectId: '',
    includeStudents: [],
    excludeStudents: []
  });
  const [suggestions, setSuggestions] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [customGroupNames, setCustomGroupNames] = useState([]);

  useEffect(() => {
    loadAlgorithmsAndProjects();
  }, []);

  const loadAlgorithmsAndProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/groups/algorithms', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAlgorithms(data.algorithms || {});
        setProjects(data.availableProjects || []);
      }
    } catch (error) {
      console.error('Error loading algorithms and projects:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        algorithm: formData.algorithm,
        groupSize: formData.groupSize.toString(),
        ...(formData.projectId && { projectId: formData.projectId })
      });

      const response = await fetch(`/api/groups/suggest?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setSelectedGroups(data.suggestedGroups || []);
        setCustomGroupNames(data.suggestedGroups?.map((_, i) => `Group ${i + 1}`) || []);
        setStep(2);
      } else {
        alert('Failed to generate group suggestions');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      alert('Error generating suggestions');
    } finally {
      setLoading(false);
    }
  };

  const createGroups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/groups/create-intelligent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: formData.projectId || null,
          algorithm: formData.algorithm,
          groupSize: formData.groupSize,
          groupNames: customGroupNames,
          groups: selectedGroups
        })
      });

      if (response.ok) {
        const data = await response.json();
        onGroupsCreated(data);
        onClose();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to create groups');
      }
    } catch (error) {
      console.error('Error creating groups:', error);
      alert('Error creating groups');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroupSelection = (groupIndex) => {
    setSelectedGroups(prev => {
      const newSelection = [...prev];
      if (newSelection.includes(suggestions.suggestedGroups[groupIndex])) {
        return newSelection.filter(g => g !== suggestions.suggestedGroups[groupIndex]);
      } else {
        newSelection.push(suggestions.suggestedGroups[groupIndex]);
        return newSelection;
      }
    });
  };

  const updateGroupName = (index, name) => {
    setCustomGroupNames(prev => {
      const newNames = [...prev];
      newNames[index] = name;
      return newNames;
    });
  };

  const regenerateSuggestions = () => {
    setSuggestions(null);
    setSelectedGroups([]);
    setCustomGroupNames([]);
    generateSuggestions();
  };

  const getQualityColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getQualityLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  if (step === 1) {
    return (
      <Card className=\"w-full max-w-4xl mx-auto\">
        <CardHeader>
          <CardTitle className=\"flex items-center gap-2\">
            <span className=\"text-2xl\">🤖</span>
            Intelligent Group Formation
          </CardTitle>
        </CardHeader>
        <CardContent className=\"space-y-6\">
          {/* Algorithm Selection */}
          <div>
            <label className=\"block text-sm font-medium mb-3\">Formation Algorithm</label>
            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
              {Object.entries(algorithms).map(([key, algorithm]) => (
                <div 
                  key={key}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.algorithm === key 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => handleInputChange('algorithm', key)}
                >
                  <div className=\"flex items-center gap-2 mb-2\">
                    <input
                      type=\"radio\"
                      checked={formData.algorithm === key}
                      onChange={() => handleInputChange('algorithm', key)}
                      className=\"text-primary\"
                    />
                    <h4 className=\"font-medium\">{algorithm.name}</h4>
                  </div>
                  <p className=\"text-sm text-muted-foreground mb-2\">{algorithm.description}</p>
                  <div className=\"text-xs text-muted-foreground\">
                    <div>Optimal size: {algorithm.optimal_size}</div>
                    <div>Criteria: {algorithm.criteria?.join(', ')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group Size */}
          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
            <div>
              <label className=\"block text-sm font-medium mb-2\">Group Size</label>
              <select
                value={formData.groupSize}
                onChange={(e) => handleInputChange('groupSize', parseInt(e.target.value))}
                className=\"input-modern\"
              >
                <option value={2}>2 members</option>
                <option value={3}>3 members</option>
                <option value={4}>4 members (recommended)</option>
                <option value={5}>5 members</option>
                <option value={6}>6 members</option>
              </select>
            </div>

            <div>
              <label className=\"block text-sm font-medium mb-2\">Project (Optional)</label>
              <select
                value={formData.projectId}
                onChange={(e) => handleInputChange('projectId', e.target.value)}
                className=\"input-modern\"
              >
                <option value=\"\">No specific project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Algorithm Details */}
          {formData.algorithm && algorithms[formData.algorithm] && (
            <Card className=\"bg-muted/30\">
              <CardContent className=\"p-4\">
                <h4 className=\"font-medium mb-2\">Algorithm Details</h4>
                <div className=\"space-y-2 text-sm\">
                  <div>
                    <span className=\"font-medium\">Considerations:</span>
                    <ul className=\"list-disc list-inside ml-4 mt-1 text-muted-foreground\">
                      {algorithms[formData.algorithm].considerations?.map((consideration, i) => (
                        <li key={i}>{consideration}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className=\"flex justify-between\">
            <Button variant=\"outline\" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={generateSuggestions}
              disabled={loading}
              className=\"min-w-32\"
            >
              {loading ? (
                <div className=\"flex items-center gap-2\">
                  <div className=\"animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full\"></div>
                  Generating...
                </div>
              ) : (
                'Generate Groups'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 2 && suggestions) {
    return (
      <Card className=\"w-full max-w-6xl mx-auto\">
        <CardHeader>
          <div className=\"flex justify-between items-start\">
            <div>
              <CardTitle className=\"flex items-center gap-2\">
                <span className=\"text-2xl\">👥</span>
                Group Suggestions
              </CardTitle>
              <p className=\"text-sm text-muted-foreground mt-1\">
                Review and customize the suggested groups before creating them
              </p>
            </div>
            <div className=\"text-sm text-right\">
              <div className=\"font-medium\">{suggestions.totalStudents} students</div>
              <div className=\"text-muted-foreground\">{suggestions.suggestedGroups?.length} groups</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className=\"space-y-6\">
          {/* Overall Analysis */}
          {suggestions.groupAnalysis && (
            <Card className=\"bg-muted/30\">
              <CardContent className=\"p-4\">
                <h4 className=\"font-medium mb-3\">Formation Analysis</h4>
                <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 text-sm\">
                  <div>
                    <div className=\"font-medium\">Average Quality</div>
                    <div className={`px-2 py-1 rounded text-xs ${getQualityColor(suggestions.groupAnalysis.averageQualityScore)}`}>
                      {suggestions.groupAnalysis.averageQualityScore}% - {getQualityLabel(suggestions.groupAnalysis.averageQualityScore)}
                    </div>
                  </div>
                  <div>
                    <div className=\"font-medium\">Avg Group Size</div>
                    <div className=\"text-muted-foreground\">{suggestions.groupAnalysis.averageGroupSize} members</div>
                  </div>
                  <div>
                    <div className=\"font-medium\">High Quality Groups</div>
                    <div className=\"text-green-600\">{suggestions.groupAnalysis.qualityDistribution?.high || 0}</div>
                  </div>
                  <div>
                    <div className=\"font-medium\">Algorithm Used</div>
                    <div className=\"text-muted-foreground capitalize\">{suggestions.algorithm.replace('_', ' ')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Group List */}
          <div className=\"space-y-4\">
            <div className=\"flex justify-between items-center\">
              <h4 className=\"font-medium\">Suggested Groups ({suggestions.suggestedGroups?.length})</h4>
              <div className=\"flex gap-2\">
                <Button variant=\"outline\" size=\"sm\" onClick={regenerateSuggestions}>
                  🔄 Regenerate
                </Button>
                <Button
                  variant=\"outline\"
                  size=\"sm\"
                  onClick={() => setSelectedGroups([...suggestions.suggestedGroups])}
                >
                  Select All
                </Button>
                <Button
                  variant=\"outline\"
                  size=\"sm\"
                  onClick={() => setSelectedGroups([])}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className=\"grid gap-4\">
              {suggestions.suggestedGroups?.map((group, groupIndex) => {
                const isSelected = selectedGroups.includes(group);
                return (
                  <Card 
                    key={groupIndex}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleGroupSelection(groupIndex)}
                  >
                    <CardContent className=\"p-4\">
                      <div className=\"flex items-start justify-between mb-3\">
                        <div className=\"flex items-center gap-3\">
                          <input
                            type=\"checkbox\"
                            checked={isSelected}
                            onChange={() => toggleGroupSelection(groupIndex)}
                            className=\"rounded\"
                          />
                          <div>
                            <input
                              type=\"text\"
                              value={customGroupNames[groupIndex] || `Group ${groupIndex + 1}`}
                              onChange={(e) => updateGroupName(groupIndex, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className=\"font-medium bg-transparent border-0 p-0 focus:ring-0 focus:border-0\"
                              style={{ minWidth: '120px' }}
                            />
                            <div className=\"text-sm text-muted-foreground\">{group.members?.length} members</div>
                          </div>
                        </div>
                        <div className=\"text-right\">
                          <div className={`px-2 py-1 rounded text-xs ${getQualityColor(group.qualityScore || 0)}`}>
                            Quality: {group.qualityScore || 0}%
                          </div>
                        </div>
                      </div>

                      {/* Members */}
                      <div className=\"grid grid-cols-2 md:grid-cols-4 gap-3\">
                        {group.members?.map((member, memberIndex) => (
                          <div key={memberIndex} className=\"p-2 bg-muted/50 rounded text-sm\">
                            <div className=\"font-medium\">{member.first_name} {member.last_name}</div>
                            <div className=\"text-xs text-muted-foreground\">{member.year_level || 'N/A'}</div>
                            <div className=\"text-xs text-muted-foreground\">{member.major || 'No major'}</div>
                            {member.skills && Array.isArray(member.skills) && (
                              <div className=\"text-xs text-muted-foreground mt-1\">
                                {member.skills.slice(0, 2).map(skill => skill.name).join(', ')}
                                {member.skills.length > 2 && ` +${member.skills.length - 2}`}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Group Analysis */}
                      {group.analysis && (
                        <div className=\"mt-3 pt-3 border-t border-border\">
                          <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 text-xs\">
                            <div>
                              <span className=\"font-medium\">Skills:</span> {group.analysis.totalSkills || 0}
                            </div>
                            <div>
                              <span className=\"font-medium\">Interests:</span> {group.analysis.totalInterests || 0}
                            </div>
                            <div>
                              <span className=\"font-medium\">Avg Completion:</span> {group.analysis.averageProfileCompletion || 0}%
                            </div>
                            <div>
                              <span className=\"font-medium\">Year Levels:</span> {Object.keys(group.analysis.yearLevelDistribution || {}).length}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className=\"flex justify-between\">
            <Button variant=\"outline\" onClick={() => setStep(1)}>
              Back to Settings
            </Button>
            <div className=\"flex gap-2\">
              <Button variant=\"outline\" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={createGroups}
                disabled={loading || selectedGroups.length === 0}
                className=\"min-w-32\"
              >
                {loading ? (
                  <div className=\"flex items-center gap-2\">
                    <div className=\"animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full\"></div>
                    Creating...
                  </div>
                ) : (
                  `Create ${selectedGroups.length} Groups`
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default GroupFormation;