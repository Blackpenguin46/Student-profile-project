import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';

const AutoFillProfile = ({ parsedData, fileId, onAutoFillComplete }) => {
  const [selectedData, setSelectedData] = useState({
    contact: [],
    skills: [],
    goals: []
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSelectionChange = (category, item, isChecked) => {
    setSelectedData(prev => ({
      ...prev,
      [category]: isChecked 
        ? [...prev[category], item]
        : prev[category].filter(i => i !== item)
    }));
  };

  const handleSelectAll = (category, items) => {
    setSelectedData(prev => ({
      ...prev,
      [category]: items
    }));
  };

  const handleClearAll = (category) => {
    setSelectedData(prev => ({
      ...prev,
      [category]: []
    }));
  };

  const handleAutoFill = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resume-parser?action=auto-fill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          file_id: fileId,
          selected_data: selectedData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Auto-fill failed');
      }

      const data = await response.json();
      setMessage(`Auto-fill completed! ${data.results.skills_added} skills added, ${data.results.goals_created} goals created.`);
      
      if (onAutoFillComplete) {
        onAutoFillComplete(data.results);
      }

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const hasSelections = Object.values(selectedData).some(arr => arr.length > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Auto-Fill Your Profile</CardTitle>
          <p className="text-muted-foreground">
            Select the information you'd like to automatically add to your profile from your resume.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contact Information */}
          {parsedData.parsedData.contact && Object.keys(parsedData.parsedData.contact).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Contact Information</h4>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll('contact', ['phone', 'linkedin', 'github', 'portfolio'].filter(
                      field => parsedData.parsedData.contact[field]
                    ))}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleClearAll('contact')}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="grid gap-3">
                {parsedData.parsedData.contact.phone && (
                  <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={selectedData.contact.includes('phone')}
                      onChange={(e) => handleSelectionChange('contact', 'phone', e.target.checked)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Phone Number</div>
                      <div className="text-sm text-muted-foreground">{parsedData.parsedData.contact.phone}</div>
                    </div>
                  </label>
                )}
                
                {parsedData.parsedData.contact.linkedin && (
                  <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={selectedData.contact.includes('linkedin')}
                      onChange={(e) => handleSelectionChange('contact', 'linkedin', e.target.checked)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium">LinkedIn Profile</div>
                      <div className="text-sm text-muted-foreground">{parsedData.parsedData.contact.linkedin}</div>
                    </div>
                  </label>
                )}
                
                {parsedData.parsedData.contact.github && (
                  <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={selectedData.contact.includes('github')}
                      onChange={(e) => handleSelectionChange('contact', 'github', e.target.checked)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium">GitHub Profile</div>
                      <div className="text-sm text-muted-foreground">{parsedData.parsedData.contact.github}</div>
                    </div>
                  </label>
                )}
                
                {parsedData.parsedData.contact.portfolio && (
                  <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={selectedData.contact.includes('portfolio')}
                      onChange={(e) => handleSelectionChange('contact', 'portfolio', e.target.checked)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Portfolio Website</div>
                      <div className="text-sm text-muted-foreground">{parsedData.parsedData.contact.portfolio}</div>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Skills */}
          {parsedData.parsedData.skills && parsedData.parsedData.skills.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Skills ({parsedData.parsedData.skills.length} found)</h4>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll('skills', parsedData.parsedData.skills.map(s => s.name))}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleClearAll('skills')}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {parsedData.parsedData.skills.map((skill, index) => (
                  <label 
                    key={index} 
                    className="flex items-center space-x-3 cursor-pointer p-2 border rounded hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedData.skills.includes(skill.name)}
                      onChange={(e) => handleSelectionChange('skills', skill.name, e.target.checked)}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{skill.name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          skill.category === 'technical' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {skill.category}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          skill.proficiency === 'expert' ? 'bg-purple-100 text-purple-700' :
                          skill.proficiency === 'advanced' ? 'bg-orange-100 text-orange-700' :
                          skill.proficiency === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {skill.proficiency}
                        </span>
                      </div>
                      {skill.context && (
                        <div className="text-xs text-muted-foreground truncate">
                          {skill.context}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Goals */}
          {parsedData.suggestions && parsedData.suggestions.goals.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Suggested Goals</h4>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll('goals', parsedData.suggestions.goals)}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleClearAll('goals')}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="grid gap-3">
                {parsedData.suggestions.goals.map((goal, index) => (
                  <label 
                    key={index} 
                    className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedData.goals.includes(goal)}
                      onChange={(e) => handleSelectionChange('goals', goal, e.target.checked)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {goal === 'career_growth' && 'Career Growth Goal'}
                        {goal === 'skill_development' && 'Skill Development Goal'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {goal === 'career_growth' && 'Create a goal to advance in your current role based on your experience'}
                        {goal === 'skill_development' && 'Create a goal to continue developing your technical skills'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {message && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <span className="text-xl">✅</span>
                <span>{message}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <span className="text-xl">❌</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {Object.values(selectedData).flat().length} items selected
            </div>
            <Button 
              onClick={handleAutoFill}
              disabled={!hasSelections || loading}
              loading={loading}
              className="px-8"
            >
              Auto-Fill Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoFillProfile;