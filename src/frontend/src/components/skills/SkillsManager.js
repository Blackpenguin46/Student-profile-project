import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';

const SkillsManager = ({ userId }) => {
  const [availableSkills, setAvailableSkills] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState('beginner');
  const [yearsExperience, setYearsExperience] = useState(0);
  const [filterCategory, setFilterCategory] = useState('all');

  const proficiencyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
  const categories = ['technical', 'soft', 'language', 'other'];

  useEffect(() => {
    fetchAvailableSkills();
    fetchUserSkills();
  }, [userId]);

  const fetchAvailableSkills = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile-data?type=skills', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableSkills(data.skills || []);
      }
    } catch (error) {
      console.error('Error fetching available skills:', error);
    }
  };

  const fetchUserSkills = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/profile-data?type=skills${userId ? `&id=${userId}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserSkills(data.skills || []);
      }
    } catch (error) {
      console.error('Error fetching user skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = async (e) => {
    e.preventDefault();
    if (!selectedSkill) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/profile-data?type=skills${userId ? `&id=${userId}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          skill_id: parseInt(selectedSkill),
          proficiency_level: proficiencyLevel,
          years_experience: parseInt(yearsExperience)
        })
      });

      if (response.ok) {
        await fetchUserSkills();
        setSelectedSkill('');
        setProficiencyLevel('beginner');
        setYearsExperience(0);
      }
    } catch (error) {
      console.error('Error adding skill:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeSkill = async (skillId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/profile-data?type=skills&item_id=${skillId}${userId ? `&id=${userId}` : ''}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchUserSkills();
      }
    } catch (error) {
      console.error('Error removing skill:', error);
    }
  };

  const getProficiencyColor = (level) => {
    switch (level) {
      case 'beginner': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'intermediate': return 'bg-green-100 text-green-700 border-green-200';
      case 'advanced': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'expert': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'technical': return '💻';
      case 'soft': return '🤝';
      case 'language': return '🌍';
      case 'other': return '🎯';
      default: return '⚡';
    }
  };

  const filteredAvailableSkills = filterCategory === 'all' 
    ? availableSkills 
    : availableSkills.filter(skill => skill.category === filterCategory);

  const userSkillIds = userSkills.map(skill => skill.id);
  const availableToAdd = filteredAvailableSkills.filter(skill => !userSkillIds.includes(skill.id));

  const skillsByCategory = userSkills.reduce((acc, skill) => {
    const category = skill.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          Skills Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Skill Form */}
        <div className="border border-border rounded-lg p-4 bg-muted/50">
          <h4 className="font-medium mb-4">Add New Skill</h4>
          <form onSubmit={addSkill} className="space-y-4">
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
                <label className="block text-sm font-medium mb-2">Select Skill</label>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="input-modern"
                  required
                >
                  <option value="">Choose a skill...</option>
                  {availableToAdd.map(skill => (
                    <option key={skill.id} value={skill.id}>
                      {getCategoryIcon(skill.category)} {skill.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Proficiency Level</label>
                <select
                  value={proficiencyLevel}
                  onChange={(e) => setProficiencyLevel(e.target.value)}
                  className="input-modern"
                >
                  {proficiencyLevels.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  className="input-modern"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={loading} disabled={!selectedSkill}>
                Add Skill
              </Button>
            </div>
          </form>
        </div>

        {/* Skills Display */}
        {loading && userSkills.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading skills...
          </div>
        ) : userSkills.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg">No skills added yet</p>
            <p className="text-sm">Add your first skill to showcase your abilities!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(skillsByCategory).map(([category, skills]) => (
              <div key={category}>
                <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                  {getCategoryIcon(category)}
                  {category.charAt(0).toUpperCase() + category.slice(1)} Skills
                  <span className="text-sm text-muted-foreground">({skills.length})</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {skills.map((skill) => (
                    <div 
                      key={skill.id} 
                      className="border border-border rounded-lg p-3 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">{skill.name}</h5>
                          {skill.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {skill.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeSkill(skill.id)}
                          className="text-red-500 hover:text-red-700 text-sm ml-2"
                          title="Remove skill"
                        >
                          ×
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs border ${getProficiencyColor(skill.proficiency_level)}`}>
                            {skill.proficiency_level}
                          </span>
                          {skill.years_experience > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {skill.years_experience} year{skill.years_experience !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        
                        {skill.verified && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <span>✓</span>
                            <span>Verified</span>
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground">
                          Added: {new Date(skill.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills Summary */}
        {userSkills.length > 0 && (
          <div className="border border-border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium mb-3">Skills Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{userSkills.length}</div>
                <div className="text-muted-foreground">Total Skills</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {userSkills.filter(s => s.proficiency_level === 'expert').length}
                </div>
                <div className="text-muted-foreground">Expert Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {userSkills.filter(s => s.proficiency_level === 'advanced').length}
                </div>
                <div className="text-muted-foreground">Advanced</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {userSkills.filter(s => s.verified).length}
                </div>
                <div className="text-muted-foreground">Verified</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SkillsManager;