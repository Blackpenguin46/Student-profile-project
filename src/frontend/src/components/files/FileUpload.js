import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Progress from '../ui/Progress';

const FileUpload = ({ 
  onUploadSuccess, 
  onParseSuccess, 
  allowedTypes = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
  maxSize = 5,
  category = 'document',
  showPreview = true,
  autoParseResumes = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const validateFile = (file) => {
    // Check file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      throw new Error(`File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      throw new Error(`File size ${fileSizeMB.toFixed(1)}MB exceeds maximum of ${maxSize}MB`);
    }

    return true;
  };

  const handleFileUpload = async (file) => {
    try {
      setError('');
      setSuccess('');
      setUploadProgress(0);
      
      // Validate file
      validateFile(file);

      setUploading(true);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload file
      const token = localStorage.getItem('token');
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      setUploadedFile(data.file);
      setSuccess('File uploaded successfully!');
      setUploadProgress(100);
      
      if (onUploadSuccess) {
        onUploadSuccess(data.file);
      }

      // Auto-parse resume files
      if (autoParseResumes && data.file.category === 'resume') {
        await handleResumeParser(data.file.id);
      }

    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleResumeParser = async (fileId) => {
    try {
      setParsing(true);
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resume-parser?action=parse&file_id=${fileId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Resume parsing failed');
      }

      const data = await response.json();
      setParsedData(data);
      
      if (onParseSuccess) {
        onParseSuccess(data);
      }

    } catch (error) {
      setError(`Resume parsing error: ${error.message}`);
    } finally {
      setParsing(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      default: return '📎';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card className={`border-2 border-dashed transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border'
      }`}>
        <CardContent 
          className="p-8"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center space-y-4">
            <div className="text-6xl">📁</div>
            <div>
              <h3 className="text-lg font-medium mb-2">
                {category === 'resume' ? 'Upload Your Resume' : 'Upload File'}
              </h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop your file here, or click to browse
              </p>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || parsing}
                variant="outline"
              >
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={allowedTypes.map(type => `.${type}`).join(',')}
                onChange={handleFileSelect}
                disabled={uploading || parsing}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Supported formats: {allowedTypes.join(', ')} • Max size: {maxSize}MB
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {(uploading || parsing) && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {uploading ? 'Uploading...' : 'Parsing resume...'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {uploading ? `${uploadProgress}%` : ''}
                </span>
              </div>
              <Progress 
                value={uploading ? uploadProgress : 50} 
                className="w-full"
                animated={true}
              />
              {parsing && (
                <p className="text-sm text-muted-foreground">
                  Extracting information from your resume...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-800">
              <span className="text-xl">✅</span>
              <span>{success}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <span className="text-xl">❌</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded File Info */}
      {uploadedFile && showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uploaded File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-3xl">{getFileTypeIcon(uploadedFile.filename)}</span>
              <div className="flex-1">
                <h4 className="font-medium">{uploadedFile.filename}</h4>
                <div className="text-sm text-muted-foreground space-x-4">
                  <span>Size: {formatFileSize(uploadedFile.file_size)}</span>
                  <span>Type: {uploadedFile.file_type}</span>
                  <span>Category: {uploadedFile.category}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(uploadedFile.download_url, '_blank')}
                >
                  View
                </Button>
                {uploadedFile.category === 'resume' && !parsedData && (
                  <Button
                    size="sm"
                    onClick={() => handleResumeParser(uploadedFile.id)}
                    loading={parsing}
                  >
                    Parse Resume
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parsed Resume Data Preview */}
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resume Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Confidence Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(parsedData.confidence.contact * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Contact Info</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(parsedData.confidence.skills * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Skills</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(parsedData.confidence.experience * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Experience</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(parsedData.confidence.education * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Education</div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">{parsedData.parsedData.skills.length}</span> skills found
                </div>
                <div>
                  <span className="font-medium">{parsedData.parsedData.experience.length}</span> work experiences
                </div>
                <div>
                  <span className="font-medium">{parsedData.parsedData.education.length}</span> education entries
                </div>
              </div>
            </div>

            {/* Auto-fill suggestions */}
            {parsedData.suggestions && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Auto-fill Suggestions</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  We can automatically fill your profile with the following information:
                </p>
                <div className="space-y-2">
                  {parsedData.suggestions.contact.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Contact:</span> {parsedData.suggestions.contact.join(', ')}
                    </div>
                  )}
                  {parsedData.suggestions.skills.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Skills:</span> {parsedData.suggestions.skills.slice(0, 5).join(', ')}
                      {parsedData.suggestions.skills.length > 5 && ` +${parsedData.suggestions.skills.length - 5} more`}
                    </div>
                  )}
                  {parsedData.suggestions.goals.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Goals:</span> {parsedData.suggestions.goals.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUpload;