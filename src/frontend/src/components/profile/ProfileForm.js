import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Progress from '../ui/Progress';

const ProfileForm = ({ user, onSave, isLoading = false }) => {
  const [formData, setFormData] = useState({
    // Basic Information
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    year_level: '',
    major: '',
    
    // Academic Goals
    short_term_goals: '',
    long_term_goals: '',
    career_aspirations: '',
    
    // Skills Inventory
    technical_skills: [],
    soft_skills: [],
    languages: [],
    
    // Interests & Activities
    interests: [],
    extracurricular_activities: [],
    hobbies: [],
    
    // Additional Information
    bio: '',
    linkedin_url: '',
    portfolio_url: '',
    github_url: ''
  });
  
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 'beginner', category: 'technical' });
  const [newInterest, setNewInterest] = useState('');
  const [newActivity, setNewActivity] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '',
        year_level: user.year_level || '',
        major: user.major || '',
        short_term_goals: user.short_term_goals || '',
        long_term_goals: user.long_term_goals || '',
        career_aspirations: user.career_aspirations || '',
        technical_skills: user.technical_skills || [],
        soft_skills: user.soft_skills || [],
        languages: user.languages || [],
        interests: user.interests || [],
        extracurricular_activities: user.extracurricular_activities || [],
        hobbies: user.hobbies || [],
        bio: user.bio || '',
        linkedin_url: user.linkedin_url || '',
        portfolio_url: user.portfolio_url || '',
        github_url: user.github_url || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addSkill = () => {
    if (newSkill.name.trim()) {
      const skillArray = newSkill.category === 'technical' ? 'technical_skills' : 'soft_skills';
      setFormData(prev => ({
        ...prev,
        [skillArray]: [...prev[skillArray], newSkill]
      }));
      setNewSkill({ name: '', proficiency: 'beginner', category: 'technical' });
    }
  };

  const removeSkill = (index, category) => {
    const skillArray = category === 'technical' ? 'technical_skills' : 'soft_skills';
    setFormData(prev => ({
      ...prev,
      [skillArray]: prev[skillArray].filter((_, i) => i !== index)
    }));
  };

  const addInterest = () => {
    if (newInterest.trim()) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (index) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  const addActivity = () => {
    if (newActivity.trim()) {
      setFormData(prev => ({
        ...prev,
        extracurricular_activities: [...prev.extracurricular_activities, newActivity.trim()]
      }));
      setNewActivity('');
    }
  };

  const removeActivity = (index) => {
    setFormData(prev => ({
      ...prev,
      extracurricular_activities: prev.extracurricular_activities.filter((_, i) => i !== index)
    }));
  };

  const calculateCompletion = () => {
    const fields = [
      formData.first_name, formData.last_name, formData.email,
      formData.year_level, formData.major, formData.short_term_goals,
      formData.long_term_goals, formData.bio
    ];
    const completedFields = fields.filter(field => field && field.trim()).length;
    const totalFields = fields.length;
    const skillsBonus = (formData.technical_skills.length + formData.soft_skills.length) > 0 ? 10 : 0;
    const interestsBonus = formData.interests.length > 0 ? 10 : 0;
    
    return Math.min(Math.round((completedFields / totalFields) * 80 + skillsBonus + interestsBonus), 100);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const proficiencyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
  const yearLevels = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'PhD'];

  return (
    <div className="space-y-6">
      {/* Profile Completion */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress 
            value={calculateCompletion()} 
            showLabel={true}
            label="Complete your profile to unlock all features"
          />
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">👤</span>
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="input-modern"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="input-modern"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-modern"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input-modern"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Year Level *</label>
                <select
                  name="year_level"
                  value={formData.year_level}
                  onChange={handleInputChange}
                  className="input-modern"
                  required
                >
                  <option value="">Select Year Level</option>
                  {yearLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Major/Focus Area *</label>
                <input
                  type="text"
                  name="major"
                  value={formData.major}
                  onChange={handleInputChange}
                  className="input-modern"
                  placeholder="e.g., Computer Science, Business"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="input-modern"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="input-modern"
                rows="3"
                placeholder="Tell us about yourself..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Academic & Career Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Academic & Career Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Short-term Goals *</label>
              <textarea
                name="short_term_goals"
                value={formData.short_term_goals}
                onChange={handleInputChange}
                className="input-modern"
                rows="3"
                placeholder="What do you want to achieve in the next 1-2 years?"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Long-term Goals *</label>
              <textarea
                name="long_term_goals"
                value={formData.long_term_goals}
                onChange={handleInputChange}
                className="input-modern"
                rows="3"
                placeholder="What are your 5-10 year career aspirations?"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Career Aspirations</label>
              <textarea
                name="career_aspirations"
                value={formData.career_aspirations}
                onChange={handleInputChange}
                className="input-modern"
                rows="2"
                placeholder="What type of career or industry interests you?"
              />
            </div>
          </CardContent>
        </Card>

        {/* Skills Inventory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              Skills Inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add New Skill */}
            <div className="border border-border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-3">Add New Skill</h4>
              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Skill name"
                  className="input-modern flex-1 min-w-40"
                />
                <select
                  value={newSkill.category}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
                  className="input-modern"
                >
                  <option value="technical">Technical</option>
                  <option value="soft">Soft Skills</option>
                </select>
                <select
                  value={newSkill.proficiency}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, proficiency: e.target.value }))}
                  className="input-modern"
                >
                  {proficiencyLevels.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
                <Button type="button" onClick={addSkill} variant="outline">
                  Add Skill
                </Button>
              </div>
            </div>

            {/* Technical Skills */}
            {formData.technical_skills.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Technical Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.technical_skills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      <span>{skill.name}</span>
                      <span className="text-xs opacity-75">({skill.proficiency})</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(index, 'technical')}
                        className="ml-1 text-primary hover:text-primary/80"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Soft Skills */}
            {formData.soft_skills.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Soft Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.soft_skills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-2 bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-sm">
                      <span>{skill.name}</span>
                      <span className="text-xs opacity-75">({skill.proficiency})</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(index, 'soft')}
                        className="ml-1 text-green-600 hover:text-green-600/80"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interests & Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              Interests & Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Interest */}
            <div className="border border-border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-3">Add Interest</h4>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="e.g., Photography, AI, Music"
                  className="input-modern flex-1"
                />
                <Button type="button" onClick={addInterest} variant="outline">
                  Add Interest
                </Button>
              </div>
            </div>

            {/* Display Interests */}
            {formData.interests.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.interests.map((interest, index) => (
                    <div key={index} className="flex items-center gap-2 bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full text-sm">
                      <span>{interest}</span>
                      <button
                        type="button"
                        onClick={() => removeInterest(index)}
                        className="ml-1 text-blue-600 hover:text-blue-600/80"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Activity */}
            <div className="border border-border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-3">Add Extracurricular Activity</h4>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  placeholder="e.g., Student Government, Debate Club, Volunteer Work"
                  className="input-modern flex-1"
                />
                <Button type="button" onClick={addActivity} variant="outline">
                  Add Activity
                </Button>
              </div>
            </div>

            {/* Display Activities */}
            {formData.extracurricular_activities.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Extracurricular Activities</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.extracurricular_activities.map((activity, index) => (
                    <div key={index} className="flex items-center gap-2 bg-purple-500/10 text-purple-600 px-3 py-1 rounded-full text-sm">
                      <span>{activity}</span>
                      <button
                        type="button"
                        onClick={() => removeActivity(index)}
                        className="ml-1 text-purple-600 hover:text-purple-600/80"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🔗</span>
              Professional Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">LinkedIn Profile</label>
                <input
                  type="url"
                  name="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={handleInputChange}
                  className="input-modern"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Portfolio Website</label>
                <input
                  type="url"
                  name="portfolio_url"
                  value={formData.portfolio_url}
                  onChange={handleInputChange}
                  className="input-modern"
                  placeholder="https://yourportfolio.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">GitHub Profile</label>
                <input
                  type="url"
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleInputChange}
                  className="input-modern"
                  placeholder="https://github.com/..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="submit" loading={isLoading} className="px-8">
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;