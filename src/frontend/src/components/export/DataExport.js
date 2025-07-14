import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';

const DataExport = ({ onClose }) => {
  const [exportType, setExportType] = useState('students');
  const [format, setFormat] = useState('csv');
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [customFilters, setCustomFilters] = useState({
    students: {},
    groups: {},
    analytics: {}
  });

  const exportTypes = {
    students: {
      name: 'Student Data',
      description: 'Export comprehensive student profiles, skills, and progress data',
      icon: '👥',
      filters: [
        { key: 'searchTerm', label: 'Search Term', type: 'text', placeholder: 'Name, email, or ID' },
        { key: 'yearLevel', label: 'Year Level', type: 'select', options: ['', 'Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'PhD'] },
        { key: 'major', label: 'Major', type: 'text', placeholder: 'e.g., Computer Science' },
        { key: 'profileCompletion', label: 'Profile Completion', type: 'select', options: ['', 'high', 'medium', 'low'] }
      ]
    },
    groups: {
      name: 'Group Data',
      description: 'Export group formations, member assignments, and collaboration data',
      icon: '🤝',
      filters: [
        { key: 'status', label: 'Group Status', type: 'select', options: ['', 'active', 'inactive', 'completed', 'disbanded'] },
        { key: 'projectId', label: 'Project ID', type: 'text', placeholder: 'Specific project ID' }
      ]
    },
    analytics: {
      name: 'Analytics Data',
      description: 'Export aggregated analytics, statistics, and performance metrics',
      icon: '📊',
      filters: []
    },
    skills: {
      name: 'Skills Data',
      description: 'Export skills distribution, proficiency levels, and trends',
      icon: '🛠️',
      filters: []
    },
    goals: {
      name: 'Goals Data',
      description: 'Export student goals, progress tracking, and achievement data',
      icon: '🎯',
      filters: []
    },
    surveys: {
      name: 'Surveys Data',
      description: 'Export survey responses, completion rates, and feedback data',
      icon: '📋',
      filters: []
    },
    comprehensive: {
      name: 'Comprehensive Export',
      description: 'Export all data types in a single comprehensive file',
      icon: '📦',
      filters: []
    }
  };

  const formatOptions = {
    csv: {
      name: 'CSV (Comma Separated)',
      description: 'Best for spreadsheet applications like Excel',
      icon: '📊',
      fileSize: 'Small'
    },
    json: {
      name: 'JSON (JavaScript Object)',
      description: 'Best for programming and data analysis',
      icon: '💻',
      fileSize: 'Medium'
    }
  };

  const handleFilterChange = (key, value) => {
    setCustomFilters(prev => ({
      ...prev,
      [exportType]: {
        ...prev[exportType],
        [key]: value
      }
    }));
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        type: exportType,
        format,
        filters: JSON.stringify(customFilters[exportType] || {})
      });

      const response = await fetch(`/api/export?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Get filename from response headers
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `export_${exportType}_${new Date().toISOString().split('T')[0]}.${format}`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert('Export completed successfully!');
        onClose();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed due to network error');
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedSize = () => {
    const baseSize = {
      students: 50,    // KB per 100 students
      groups: 20,      // KB per 100 groups
      analytics: 10,   // KB for analytics
      skills: 15,      // KB for skills
      goals: 30,       // KB per 100 goals
      surveys: 25,     // KB per 100 surveys
      comprehensive: 150 // KB for comprehensive
    };

    const multiplier = format === 'json' ? 1.5 : 1;
    return Math.round(baseSize[exportType] * multiplier);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📥</span>
          Data Export
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Export your data in various formats for analysis, reporting, or backup purposes
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">Select Data Type</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(exportTypes).map(([key, type]) => (
              <div 
                key={key}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  exportType === key 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => setExportType(key)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="radio"
                    checked={exportType === key}
                    onChange={() => setExportType(key)}
                    className="text-primary"
                  />
                  <span className="text-xl">{type.icon}</span>
                  <h4 className="font-medium">{type.name}</h4>
                </div>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">Export Format</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(formatOptions).map(([key, formatOption]) => (
              <div 
                key={key}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  format === key 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => setFormat(key)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="radio"
                    checked={format === key}
                    onChange={() => setFormat(key)}
                    className="text-primary"
                  />
                  <span className="text-xl">{formatOption.icon}</span>
                  <h4 className="font-medium">{formatOption.name}</h4>
                  <span className={`px-2 py-1 rounded text-xs ${
                    formatOption.fileSize === 'Small' ? 'bg-green-100 text-green-600' :
                    formatOption.fileSize === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {formatOption.fileSize}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{formatOption.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        {exportTypes[exportType].filters && exportTypes[exportType].filters.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-3">Filters (Optional)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exportTypes[exportType].filters.map(filter => (
                <div key={filter.key}>
                  <label className="block text-xs font-medium mb-1">{filter.label}</label>
                  {filter.type === 'select' ? (
                    <select
                      value={customFilters[exportType]?.[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      className="input-modern text-sm"
                    >
                      {filter.options.map(option => (
                        <option key={option} value={option}>
                          {option || 'All'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={filter.type}
                      value={customFilters[exportType]?.[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      placeholder={filter.placeholder}
                      className="input-modern text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Preview */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Export Preview</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Data Type:</span>
                <div className="text-muted-foreground">{exportTypes[exportType].name}</div>
              </div>
              <div>
                <span className="font-medium">Format:</span>
                <div className="text-muted-foreground">{formatOptions[format].name}</div>
              </div>
              <div>
                <span className="font-medium">Est. Size:</span>
                <div className="text-muted-foreground">~{getEstimatedSize()} KB</div>
              </div>
              <div>
                <span className="font-medium">Filters:</span>
                <div className="text-muted-foreground">
                  {Object.keys(customFilters[exportType] || {}).length || 'None'}
                </div>
              </div>
            </div>
            
            {Object.keys(customFilters[exportType] || {}).length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <span className="font-medium text-sm">Active Filters:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(customFilters[exportType] || {}).map(([key, value]) => (
                    value && (
                      <span key={key} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                        {key}: {value}
                      </span>
                    )
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Guidelines */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2 text-blue-800">📋 Export Guidelines</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Large exports may take several minutes to process</li>
              <li>• CSV files are compatible with Excel, Google Sheets, and other spreadsheet software</li>
              <li>• JSON files are ideal for programming and data analysis tools</li>
              <li>• Exported data includes current information at the time of export</li>
              <li>• Sensitive information is automatically filtered for privacy protection</li>
              <li>• All exports are logged for security and audit purposes</li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={loading}
            className="min-w-32"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                Exporting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>📥</span>
                Export Data
              </div>
            )}
          </Button>
        </div>

        {/* Quick Export Options */}
        <div className="border-t border-border pt-6">
          <h4 className="font-medium mb-3">Quick Export Options</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setExportType('students');
                setFormat('csv');
                setCustomFilters({ students: {}, groups: {}, analytics: {} });
              }}
            >
              📊 All Students CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setExportType('groups');
                setFormat('csv');
                setCustomFilters({ students: {}, groups: { status: 'active' }, analytics: {} });
              }}
            >
              👥 Active Groups CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setExportType('analytics');
                setFormat('json');
                setCustomFilters({ students: {}, groups: {}, analytics: {} });
              }}
            >
              📈 Analytics JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setExportType('comprehensive');
                setFormat('json');
                setCustomFilters({ students: {}, groups: {}, analytics: {} });
              }}
            >
              📦 Full Backup
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataExport;