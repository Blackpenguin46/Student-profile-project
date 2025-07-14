import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';

const AdvancedSearch = ({ onSearch, onClear, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    searchTerm: '',
    skills: [],
    skillProficiency: '',
    interests: [],
    goals: [],
    yearLevel: '',
    major: '',
    profileCompletion: '',
    lastActivity: '',
    sortBy: 'name',
    sortOrder: 'asc',
    ...initialFilters
  });

  const [availableSkills, setAvailableSkills] = useState([]);
  const [availableInterests, setAvailableInterests] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [savedFilters, setSavedFilters] = useState([]);

  useEffect(() => {
    fetchSkillsAndInterests();
    loadSavedFilters();
  }, []);

  const fetchSkillsAndInterests = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch skills
      const skillsResponse = await fetch('/api/profile-data?type=skills', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (skillsResponse.ok) {
        const skillsData = await skillsResponse.json();
        setAvailableSkills(skillsData.skills || []);
      }

      // Fetch interests
      const interestsResponse = await fetch('/api/profile-data?type=interests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (interestsResponse.ok) {
        const interestsData = await interestsResponse.json();
        setAvailableInterests(interestsData.interests || []);
      }
    } catch (error) {
      console.error('Error fetching skills and interests:', error);
    }
  };

  const loadSavedFilters = () => {
    const saved = localStorage.getItem('savedSearchFilters');
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }
  };

  const saveCurrentFilter = () => {
    const filterName = prompt('Enter a name for this filter:');
    if (!filterName) return;

    const newFilter = {
      id: Date.now(),
      name: filterName,
      filters: { ...filters },
      createdAt: new Date().toISOString()
    };

    const updatedFilters = [...savedFilters, newFilter];
    setSavedFilters(updatedFilters);
    localStorage.setItem('savedSearchFilters', JSON.stringify(updatedFilters));
  };

  const loadSavedFilter = (savedFilter) => {
    setFilters(savedFilter.filters);
    onSearch(savedFilter.filters);
  };

  const deleteSavedFilter = (filterId) => {
    const updatedFilters = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updatedFilters);
    localStorage.setItem('savedSearchFilters', JSON.stringify(updatedFilters));
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleMultiSelectChange = (key, value, checked) => {
    const currentValues = filters[key] || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    handleFilterChange(key, newValues);
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    const clearedFilters = {
      searchTerm: '',
      skills: [],
      skillProficiency: '',
      interests: [],
      goals: [],
      yearLevel: '',
      major: '',
      profileCompletion: '',
      lastActivity: '',
      sortBy: 'name',
      sortOrder: 'asc'
    };
    setFilters(clearedFilters);
    onClear();
  };

  const hasActiveFilters = () => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'sortBy' || key === 'sortOrder') return false;
      if (Array.isArray(value)) return value.length > 0;
      return value !== '';
    });
  };

  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'sortBy' || key === 'sortOrder') return false;
      if (Array.isArray(value)) return value.length > 0;
      return value !== '';
    }).length;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🔍</span>
            Advanced Search & Filter
            {hasActiveFilters() && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {getActiveFilterCount()} active
              </span>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            {hasActiveFilters() && (
              <Button
                variant="outline"
                size="sm"
                onClick={saveCurrentFilter}
              >
                Save Filter
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Search */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search Students</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                placeholder="Search by name, email, or student ID..."
                className="input-modern flex-1"
              />
              <Button onClick={handleSearch}>Search</Button>
              {hasActiveFilters() && (
                <Button variant="outline" onClick={handleClear}>Clear</Button>
              )}
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="input-modern"
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="year_level">Year Level</option>
                <option value="major">Major</option>
                <option value="profile_completion">Profile Completion</option>
                <option value="last_login">Last Activity</option>
                <option value="created_at">Registration Date</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sort Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="input-modern"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="space-y-6 border-t pt-6">
            {/* Basic Info Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Year Level</label>
                <select
                  value={filters.yearLevel}
                  onChange={(e) => handleFilterChange('yearLevel', e.target.value)}
                  className="input-modern"
                >
                  <option value="">All Year Levels</option>
                  <option value="Freshman">Freshman</option>
                  <option value="Sophomore">Sophomore</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                  <option value="Graduate">Graduate</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Major</label>
                <input
                  type="text"
                  value={filters.major}
                  onChange={(e) => handleFilterChange('major', e.target.value)}
                  placeholder="e.g., Computer Science"
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Profile Completion</label>
                <select
                  value={filters.profileCompletion}
                  onChange={(e) => handleFilterChange('profileCompletion', e.target.value)}
                  className="input-modern"
                >
                  <option value="">Any Completion</option>
                  <option value="high">High (80%+)</option>
                  <option value="medium">Medium (50-79%)</option>
                  <option value="low">Low (&lt;50%)</option>
                </select>
              </div>
            </div>

            {/* Skills Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Skills</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="max-h-40 overflow-y-auto border border-border rounded p-3 space-y-2">
                    {availableSkills.map((skill) => (
                      <label key={skill.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.skills.includes(skill.id)}
                          onChange={(e) => handleMultiSelectChange('skills', skill.id, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">{skill.name}</span>
                        <span className="text-xs text-muted-foreground">({skill.category})</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Minimum Proficiency</label>
                  <select
                    value={filters.skillProficiency}
                    onChange={(e) => handleFilterChange('skillProficiency', e.target.value)}
                    className="input-modern"
                  >
                    <option value="">Any Level</option>
                    <option value="beginner">Beginner+</option>
                    <option value="intermediate">Intermediate+</option>
                    <option value="advanced">Advanced+</option>
                    <option value="expert">Expert Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Interests Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Interests</label>
              <div className="max-h-40 overflow-y-auto border border-border rounded p-3 space-y-2">
                {availableInterests.map((interest) => (
                  <label key={interest.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.interests.includes(interest.id)}
                      onChange={(e) => handleMultiSelectChange('interests', interest.id, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">{interest.name}</span>
                    {interest.category && (
                      <span className="text-xs text-muted-foreground">({interest.category})</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Activity Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Last Activity</label>
              <select
                value={filters.lastActivity}
                onChange={(e) => handleFilterChange('lastActivity', e.target.value)}
                className="input-modern"
              >
                <option value="">Any Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="inactive">Inactive (3+ months)</option>
              </select>
            </div>
          </div>
        )}

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <div className="border-t pt-6">
            <h4 className="font-medium mb-3">Saved Filters</h4>
            <div className="flex flex-wrap gap-2">
              {savedFilters.map((savedFilter) => (
                <div key={savedFilter.id} className="flex items-center gap-1 bg-muted/50 rounded px-3 py-1">
                  <button
                    onClick={() => loadSavedFilter(savedFilter)}
                    className="text-sm hover:text-primary"
                  >
                    {savedFilter.name}
                  </button>
                  <button
                    onClick={() => deleteSavedFilter(savedFilter.id)}
                    className="text-red-500 hover:text-red-700 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <div className="border-t pt-6">
          <h4 className="font-medium mb-3">Quick Filters</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newFilters = { ...filters, profileCompletion: 'low' };
                setFilters(newFilters);
                onSearch(newFilters);
              }}
            >
              Incomplete Profiles
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newFilters = { ...filters, lastActivity: 'inactive' };
                setFilters(newFilters);
                onSearch(newFilters);
              }}
            >
              Inactive Students
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newFilters = { ...filters, yearLevel: 'Freshman' };
                setFilters(newFilters);
                onSearch(newFilters);
              }}
            >
              New Students
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newFilters = { ...filters, skillProficiency: 'expert' };
                setFilters(newFilters);
                onSearch(newFilters);
              }}
            >
              Expert Skills
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedSearch;