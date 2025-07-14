import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';

const SurveyBuilder = ({ onSave, onCancel, initialTemplate = null }) => {
  const [template, setTemplate] = useState({
    title: initialTemplate?.title || '',
    description: initialTemplate?.description || '',
    template_type: initialTemplate?.template_type || 'general',
    estimated_duration: initialTemplate?.estimated_duration || 15,
    questions: initialTemplate?.questions || []
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    options: [''],
    required: true,
    description: ''
  });

  const [editingIndex, setEditingIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const questionTypes = [
    { value: 'multiple_choice', label: 'Multiple Choice (Single)', icon: '⚪' },
    { value: 'multiple_select', label: 'Multiple Choice (Multiple)', icon: '☑️' },
    { value: 'text_short', label: 'Short Text', icon: '📝' },
    { value: 'text_long', label: 'Long Text', icon: '📄' },
    { value: 'rating_scale', label: 'Rating Scale (1-5)', icon: '⭐' },
    { value: 'likert_scale', label: 'Likert Scale', icon: '📊' },
    { value: 'yes_no', label: 'Yes/No', icon: '❓' },
    { value: 'date', label: 'Date', icon: '📅' },
    { value: 'number', label: 'Number', icon: '🔢' }
  ];

  const templateTypes = [
    { value: 'general', label: 'General Survey' },
    { value: 'beginning_term', label: 'Beginning of Term' },
    { value: 'mid_term', label: 'Mid-term Check-in' },
    { value: 'end_term', label: 'End of Term' },
    { value: 'skills_assessment', label: 'Skills Assessment' },
    { value: 'team_preferences', label: 'Team Preferences' }
  ];

  const handleTemplateChange = (field, value) => {
    setTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuestionChange = (field, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addOption = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const updateOption = (index, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removeOption = (index) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const addQuestion = () => {
    if (!currentQuestion.question_text.trim()) return;

    const newQuestion = {
      ...currentQuestion,
      id: Date.now() + Math.random(),
      options: ['multiple_choice', 'multiple_select'].includes(currentQuestion.question_type) 
        ? currentQuestion.options.filter(opt => opt.trim())
        : []
    };

    if (editingIndex >= 0) {
      // Update existing question
      setTemplate(prev => ({
        ...prev,
        questions: prev.questions.map((q, i) => i === editingIndex ? newQuestion : q)
      }));
      setEditingIndex(-1);
    } else {
      // Add new question
      setTemplate(prev => ({
        ...prev,
        questions: [...prev.questions, newQuestion]
      }));
    }

    // Reset form
    setCurrentQuestion({
      question_text: '',
      question_type: 'multiple_choice',
      options: [''],
      required: true,
      description: ''
    });
  };

  const editQuestion = (index) => {
    const question = template.questions[index];
    setCurrentQuestion({
      ...question,
      options: question.options.length > 0 ? question.options : ['']
    });
    setEditingIndex(index);
  };

  const removeQuestion = (index) => {
    setTemplate(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const moveQuestion = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= template.questions.length) return;

    setTemplate(prev => {
      const newQuestions = [...prev.questions];
      [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
      return { ...prev, questions: newQuestions };
    });
  };

  const handleSave = async () => {
    if (!template.title.trim() || template.questions.length === 0) {
      alert('Please provide a title and at least one question');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(template);
    } catch (error) {
      console.error('Error saving survey:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const needsOptions = ['multiple_choice', 'multiple_select'].includes(currentQuestion.question_type);

  return (
    <div className="space-y-6">
      {/* Survey Template Details */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Survey Title *</label>
              <input
                type="text"
                value={template.title}
                onChange={(e) => handleTemplateChange('title', e.target.value)}
                placeholder="e.g., Beginning of Semester Survey"
                className="input-modern"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Template Type</label>
              <select
                value={template.template_type}
                onChange={(e) => handleTemplateChange('template_type', e.target.value)}
                className="input-modern"
              >
                {templateTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={template.description}
              onChange={(e) => handleTemplateChange('description', e.target.value)}
              placeholder="Describe the purpose of this survey..."
              className="input-modern"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Estimated Duration (minutes)</label>
            <input
              type="number"
              min="1"
              max="120"
              value={template.estimated_duration}
              onChange={(e) => handleTemplateChange('estimated_duration', parseInt(e.target.value))}
              className="input-modern w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Question Builder */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingIndex >= 0 ? 'Edit Question' : 'Add New Question'}
            {template.questions.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({template.questions.length} question{template.questions.length !== 1 ? 's' : ''} added)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Question Text *</label>
            <textarea
              value={currentQuestion.question_text}
              onChange={(e) => handleQuestionChange('question_text', e.target.value)}
              placeholder="Enter your question here..."
              className="input-modern"
              rows="2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Question Type</label>
              <select
                value={currentQuestion.question_type}
                onChange={(e) => handleQuestionChange('question_type', e.target.value)}
                className="input-modern"
              >
                {questionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={currentQuestion.required}
                  onChange={(e) => handleQuestionChange('required', e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm font-medium">Required question</span>
              </label>
            </div>
          </div>

          {currentQuestion.description !== undefined && (
            <div>
              <label className="block text-sm font-medium mb-2">Help Text (Optional)</label>
              <input
                type="text"
                value={currentQuestion.description}
                onChange={(e) => handleQuestionChange('description', e.target.value)}
                placeholder="Additional instructions for this question..."
                className="input-modern"
              />
            </div>
          )}

          {/* Options for multiple choice questions */}
          {needsOptions && (
            <div>
              <label className="block text-sm font-medium mb-2">Answer Options</label>
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="input-modern flex-1"
                    />
                    {currentQuestion.options.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="px-3"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="mt-2"
                >
                  + Add Option
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={addQuestion} disabled={!currentQuestion.question_text.trim()}>
              {editingIndex >= 0 ? 'Update Question' : 'Add Question'}
            </Button>
            {editingIndex >= 0 && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingIndex(-1);
                  setCurrentQuestion({
                    question_text: '',
                    question_type: 'multiple_choice',
                    options: [''],
                    required: true,
                    description: ''
                  });
                }}
              >
                Cancel Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      {template.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Survey Questions ({template.questions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {template.questions.map((question, index) => (
                <div key={question.id || index} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">Question {index + 1}</span>
                        <span className="text-xs px-2 py-1 bg-muted rounded">
                          {questionTypes.find(t => t.value === question.question_type)?.label}
                        </span>
                        {question.required && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium mb-1">{question.question_text}</p>
                      {question.description && (
                        <p className="text-xs text-muted-foreground mb-2">{question.description}</p>
                      )}
                      {question.options && question.options.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {question.options.map((option, i) => (
                            <span key={i} className="text-xs bg-muted px-2 py-1 rounded">
                              {option}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveQuestion(index, 'up')}
                        disabled={index === 0}
                        className="px-2"
                      >
                        ↑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveQuestion(index, 'down')}
                        disabled={index === template.questions.length - 1}
                        className="px-2"
                      >
                        ↓
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editQuestion(index)}
                        className="px-2"
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                        className="px-2 text-red-600 hover:text-red-700"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          loading={isLoading}
          disabled={!template.title.trim() || template.questions.length === 0}
        >
          {initialTemplate ? 'Update Survey' : 'Create Survey'}
        </Button>
      </div>
    </div>
  );
};

export default SurveyBuilder;