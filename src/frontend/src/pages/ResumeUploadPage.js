import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import FileUpload from '../components/files/FileUpload';
import AutoFillProfile from '../components/resume/AutoFillProfile';

const ResumeUploadPage = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Parse Results, 3: Auto-fill
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [autoFillResults, setAutoFillResults] = useState(null);

  const handleUploadSuccess = (file) => {
    setUploadedFile(file);
    if (file.category !== 'resume') {
      // If not a resume, stay on step 1
      return;
    }
  };

  const handleParseSuccess = (data) => {
    setParsedData(data);
    setCurrentStep(2);
  };

  const handleAutoFillComplete = (results) => {
    setAutoFillResults(results);
    setCurrentStep(3);
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setParsedData(null);
    setAutoFillResults(null);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-8 mb-8">
      {[
        { step: 1, label: 'Upload Resume', icon: '📄' },
        { step: 2, label: 'Review Results', icon: '🔍' },
        { step: 3, label: 'Complete', icon: '✅' }
      ].map(({ step, label, icon }) => (
        <div key={step} className="flex items-center space-x-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-colors ${
            currentStep >= step 
              ? 'bg-primary text-white border-primary' 
              : 'bg-muted text-muted-foreground border-border'
          }`}>
            {currentStep > step ? '✓' : icon}
          </div>
          <span className={`text-sm font-medium ${
            currentStep >= step ? 'text-foreground' : 'text-muted-foreground'
          }`}>
            {label}
          </span>
          {step < 3 && (
            <div className={`w-8 h-0.5 ml-4 ${
              currentStep > step ? 'bg-primary' : 'bg-border'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold gradient-text">
            Resume Upload & Analysis 📄
          </h1>
          <p className="text-muted-foreground text-lg">
            Upload your resume to automatically extract and populate your profile information
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step 1: File Upload */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <FileUpload
              onUploadSuccess={handleUploadSuccess}
              onParseSuccess={handleParseSuccess}
              allowedTypes={['pdf', 'doc', 'docx']}
              maxSize={5}
              category="resume"
              showPreview={true}
              autoParseResumes={true}
            />

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How it works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl">📤</div>
                    <h4 className="font-medium">1. Upload</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload your resume in PDF, DOC, or DOCX format
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-3xl">🤖</div>
                    <h4 className="font-medium">2. Parse</h4>
                    <p className="text-sm text-muted-foreground">
                      Our system extracts skills, experience, and contact info
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-3xl">✨</div>
                    <h4 className="font-medium">3. Auto-fill</h4>
                    <p className="text-sm text-muted-foreground">
                      Review and select data to automatically fill your profile
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Parse Results & Auto-fill */}
        {currentStep === 2 && parsedData && uploadedFile && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Resume Analysis Complete</CardTitle>
                  <Button variant="outline" onClick={handleStartOver}>
                    Upload Different Resume
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <span className="text-3xl">📄</span>
                  <div className="flex-1">
                    <h4 className="font-medium">{uploadedFile.filename}</h4>
                    <p className="text-sm text-muted-foreground">
                      Analysis completed with high confidence scores
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {Math.round(Object.values(parsedData.confidence).reduce((a, b) => a + b, 0) / Object.keys(parsedData.confidence).length * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Overall Confidence</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <AutoFillProfile
              parsedData={parsedData}
              fileId={uploadedFile.id}
              onAutoFillComplete={handleAutoFillComplete}
            />
          </div>
        )}

        {/* Step 3: Completion */}
        {currentStep === 3 && autoFillResults && (
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg text-green-800">Profile Auto-fill Complete! 🎉</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-green-700">
                    Your profile has been successfully updated with information from your resume.
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    {autoFillResults.profile_updated && (
                      <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-600">✓</div>
                        <div className="font-medium">Profile Updated</div>
                        <div className="text-sm text-muted-foreground">Contact info added</div>
                      </div>
                    )}
                    
                    <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{autoFillResults.skills_added}</div>
                      <div className="font-medium">Skills Added</div>
                      <div className="text-sm text-muted-foreground">To your skills inventory</div>
                    </div>
                    
                    <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{autoFillResults.goals_created}</div>
                      <div className="font-medium">Goals Created</div>
                      <div className="text-sm text-muted-foreground">Based on your experience</div>
                    </div>
                  </div>

                  {autoFillResults.errors && autoFillResults.errors.length > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">Notes:</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {autoFillResults.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-center space-x-4 pt-4">
                    <Button 
                      onClick={() => window.location.href = '/profile'}
                      className="px-8"
                    >
                      View My Profile
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleStartOver}
                      className="px-8"
                    >
                      Upload Another Resume
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What's Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">Complete Your Profile</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Review and refine auto-filled information</li>
                      <li>• Add your academic goals and aspirations</li>
                      <li>• Set proficiency levels for your skills</li>
                      <li>• Add interests and extracurricular activities</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">Take Surveys</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Complete any assigned surveys from teachers</li>
                      <li>• Provide additional insights about your learning style</li>
                      <li>• Help teachers understand your goals and preferences</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUploadPage;