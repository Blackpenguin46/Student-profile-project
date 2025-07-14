import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Progress from '../ui/Progress';

const SurveyTaking = ({ survey, onSubmit, onSave, onCancel, existingResponses = {} }) => {
  const [responses, setResponses] = useState(existingResponses || {});
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const questions = survey.questions || [];
  const questionsPerPage = 5;
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const currentQuestions = questions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  );

  useEffect(() => {
    // Auto-save every 30 seconds
    const autoSaveInterval = setInterval(() => {
      if (Object.keys(responses).length > 0) {
        handleSave();
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [responses]);

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear error for this question
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: null
      }));
    }
  };

  const validatePage = () => {
    const pageErrors = {};
    
    currentQuestions.forEach((question, index) => {
      const questionId = question.id || index;
      const response = responses[questionId];
      
      if (question.required) {
        if (!response || (Array.isArray(response) && response.length === 0) || 
            (typeof response === 'string' && !response.trim())) {
          pageErrors[questionId] = 'This question is required';
        }
      }
    });

    setErrors(pageErrors);
    return Object.keys(pageErrors).length === 0;
  };

  const handleNext = () => {
    if (validatePage()) {
      setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave({
        survey_template_id: survey.id,
        responses,
        completion_status: 'in_progress'
      });
    } catch (error) {
      console.error('Error saving responses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate all questions
    const allErrors = {};
    
    questions.forEach((question, index) => {
      const questionId = question.id || index;
      const response = responses[questionId];
      
      if (question.required) {
        if (!response || (Array.isArray(response) && response.length === 0) || 
            (typeof response === 'string' && !response.trim())) {
          allErrors[questionId] = 'This question is required';
        }
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      // Navigate to first page with errors
      const errorQuestionIndex = questions.findIndex((q, i) => allErrors[q.id || i]);
      if (errorQuestionIndex >= 0) {
        setCurrentPage(Math.floor(errorQuestionIndex / questionsPerPage));
      }
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        survey_template_id: survey.id,
        responses,
        completion_status: 'completed'
      });
    } catch (error) {
      console.error('Error submitting survey:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCompletionPercentage = () => {
    const answeredQuestions = questions.filter((q, i) => {
      const questionId = q.id || i;
      const response = responses[questionId];
      return response && (typeof response !== 'string' || response.trim());
    }).length;
    
    return Math.round((answeredQuestions / questions.length) * 100);
  };

  const renderQuestion = (question, index) => {
    const questionId = question.id || index;
    const response = responses[questionId];
    const error = errors[questionId];

    const questionNumber = currentPage * questionsPerPage + index + 1;

    return (
      <div key={questionId} className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
            {questionNumber}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium">{question.question_text}</h3>
              {question.required && (
                <span className="text-red-500 text-sm">*</span>
              )}
            </div>
            
            {question.description && (
              <p className="text-sm text-muted-foreground mb-3">{question.description}</p>
            )}

            {/* Render different input types */}
            {question.question_type === 'multiple_choice' && (
              <div className="space-y-2">
                {question.options?.map((option, i) => (
                  <label key={i} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`question_${questionId}`}
                      value={option}
                      checked={response === option}
                      onChange={(e) => handleResponseChange(questionId, e.target.value)}
                      className="text-primary"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.question_type === 'multiple_select' && (
              <div className="space-y-2">
                {question.options?.map((option, i) => (
                  <label key={i} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      value={option}
                      checked={Array.isArray(response) && response.includes(option)}
                      onChange={(e) => {
                        const currentValues = Array.isArray(response) ? response : [];
                        if (e.target.checked) {
                          handleResponseChange(questionId, [...currentValues, option]);
                        } else {
                          handleResponseChange(questionId, currentValues.filter(v => v !== option));
                        }
                      }}
                      className="text-primary"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.question_type === 'text_short' && (
              <input
                type="text"
                value={response || ''}
                onChange={(e) => handleResponseChange(questionId, e.target.value)}
                placeholder="Enter your answer..."
                className="input-modern"
              />
            )}

            {question.question_type === 'text_long' && (
              <textarea
                value={response || ''}
                onChange={(e) => handleResponseChange(questionId, e.target.value)}
                placeholder="Enter your detailed answer..."
                className="input-modern"
                rows="4"
              />
            )}

            {question.question_type === 'rating_scale' && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">1 (Poor)</span>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <label key={rating} className="cursor-pointer">
                      <input
                        type="radio"
                        name={`question_${questionId}`}
                        value={rating}
                        checked={parseInt(response) === rating}
                        onChange={(e) => handleResponseChange(questionId, parseInt(e.target.value))}
                        className="sr-only"
                      />
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        parseInt(response) === rating 
                          ? 'border-primary bg-primary text-white' 
                          : 'border-border hover:border-primary'
                      }`}>
                        {rating}
                      </div>
                    </label>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">5 (Excellent)</span>
              </div>
            )}

            {question.question_type === 'likert_scale' && (
              <div className="space-y-2">
                {['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'].map((option, i) => (
                  <label key={i} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`question_${questionId}`}
                      value={option}
                      checked={response === option}
                      onChange={(e) => handleResponseChange(questionId, e.target.value)}
                      className="text-primary"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.question_type === 'yes_no' && (
              <div className="flex space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`question_${questionId}`}
                    value="yes"
                    checked={response === 'yes'}
                    onChange={(e) => handleResponseChange(questionId, e.target.value)}
                    className="text-primary"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`question_${questionId}`}
                    value="no"
                    checked={response === 'no'}
                    onChange={(e) => handleResponseChange(questionId, e.target.value)}
                    className="text-primary"
                  />
                  <span>No</span>
                </label>
              </div>
            )}

            {question.question_type === 'date' && (
              <input
                type="date"
                value={response || ''}
                onChange={(e) => handleResponseChange(questionId, e.target.value)}
                className="input-modern"
              />
            )}

            {question.question_type === 'number' && (
              <input
                type="number"
                value={response || ''}
                onChange={(e) => handleResponseChange(questionId, e.target.value)}
                placeholder="Enter a number..."
                className="input-modern"
              />
            )}

            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Survey Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{survey.title}</CardTitle>
              {survey.description && (
                <p className="text-muted-foreground mt-2">{survey.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                Estimated time: {survey.estimated_duration || 15} minutes
              </div>
              <div className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress 
            value={getCompletionPercentage()} 
            showLabel={true}
            label={`${getCompletionPercentage()}% Complete`}
          />
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardContent className="space-y-8 py-8">
          {currentQuestions.map((question, index) => renderQuestion(question, index))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Exit Survey
          </Button>
          <Button variant="outline" onClick={handleSave} loading={isLoading}>
            Save Progress
          </Button>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          
          {currentPage < totalPages - 1 ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={isLoading}>
              Submit Survey
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyTaking;