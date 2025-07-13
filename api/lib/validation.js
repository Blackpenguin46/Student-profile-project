// Comprehensive validation utilities for the Student Profile System

// Date validation
function validateDate(dateString) {
    if (!dateString) return true; // Optional dates are valid
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}

function validateDateRange(startDate, endDate) {
    if (!startDate || !endDate) return true;
    return new Date(startDate) <= new Date(endDate);
}

// URL validation
function validateUrl(url) {
    if (!url) return true; // Optional URLs are valid
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Text validation
function validateText(text, minLength = 0, maxLength = 1000) {
    if (!text) return minLength === 0;
    return text.length >= minLength && text.length <= maxLength;
}

// Number validation
function validateNumber(num, min = 0, max = Number.MAX_SAFE_INTEGER) {
    if (num === null || num === undefined) return true; // Optional numbers
    const parsed = parseInt(num);
    return !isNaN(parsed) && parsed >= min && parsed <= max;
}

// Student profile validation
function validateStudentProfile(profileData) {
    const errors = [];

    if (profileData.student_id_num && (profileData.student_id_num.length < 3 || profileData.student_id_num.length > 20)) {
        errors.push('Student ID must be 3-20 characters');
    }

    if (profileData.year_level && !['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'].includes(profileData.year_level)) {
        errors.push('Invalid year level');
    }

    if (profileData.major && (profileData.major.length < 2 || profileData.major.length > 100)) {
        errors.push('Major must be 2-100 characters');
    }

    if (profileData.date_of_birth && !validateDate(profileData.date_of_birth)) {
        errors.push('Invalid date of birth format (YYYY-MM-DD)');
    }

    if (profileData.bio && !validateText(profileData.bio, 0, 1000)) {
        errors.push('Bio must be 0-1000 characters');
    }

    if (profileData.short_term_goals && !validateText(profileData.short_term_goals, 0, 500)) {
        errors.push('Short term goals must be 0-500 characters');
    }

    if (profileData.long_term_goals && !validateText(profileData.long_term_goals, 0, 500)) {
        errors.push('Long term goals must be 0-500 characters');
    }

    if (profileData.career_aspirations && !validateText(profileData.career_aspirations, 0, 500)) {
        errors.push('Career aspirations must be 0-500 characters');
    }

    if (profileData.linkedin_url && !validateUrl(profileData.linkedin_url)) {
        errors.push('Invalid LinkedIn URL');
    }

    if (profileData.portfolio_url && !validateUrl(profileData.portfolio_url)) {
        errors.push('Invalid portfolio URL');
    }

    if (profileData.github_url && !validateUrl(profileData.github_url)) {
        errors.push('Invalid GitHub URL');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Goal validation
function validateGoal(goalData) {
    const errors = [];

    if (!goalData.title || !validateText(goalData.title, 3, 255)) {
        errors.push('Title must be 3-255 characters');
    }

    if (!goalData.description || !validateText(goalData.description, 10, 1000)) {
        errors.push('Description must be 10-1000 characters');
    }

    if (!goalData.category || !['academic', 'career', 'personal', 'skill', 'project'].includes(goalData.category)) {
        errors.push('Invalid category');
    }

    if (goalData.target_date && !validateDate(goalData.target_date)) {
        errors.push('Invalid target date format (YYYY-MM-DD)');
    }

    if (goalData.priority && !['low', 'medium', 'high', 'urgent'].includes(goalData.priority)) {
        errors.push('Invalid priority');
    }

    if (goalData.status && !['active', 'completed', 'paused', 'cancelled'].includes(goalData.status)) {
        errors.push('Invalid status');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Activity validation
function validateActivity(activityData) {
    const errors = [];

    if (!activityData.title || !validateText(activityData.title, 3, 255)) {
        errors.push('Title must be 3-255 characters');
    }

    if (!activityData.category || !['academic', 'sports', 'volunteer', 'work', 'creative', 'leadership', 'other'].includes(activityData.category)) {
        errors.push('Invalid category');
    }

    if (activityData.description && !validateText(activityData.description, 0, 1000)) {
        errors.push('Description must be 0-1000 characters');
    }

    if (activityData.start_date && !validateDate(activityData.start_date)) {
        errors.push('Invalid start date format (YYYY-MM-DD)');
    }

    if (activityData.end_date && !validateDate(activityData.end_date)) {
        errors.push('Invalid end date format (YYYY-MM-DD)');
    }

    if (activityData.start_date && activityData.end_date && !validateDateRange(activityData.start_date, activityData.end_date)) {
        errors.push('Start date cannot be after end date');
    }

    if (activityData.hours && !validateNumber(activityData.hours, 0, 10000)) {
        errors.push('Hours must be between 0 and 10000');
    }

    if (activityData.organization && !validateText(activityData.organization, 0, 255)) {
        errors.push('Organization must be 0-255 characters');
    }

    if (activityData.position && !validateText(activityData.position, 0, 255)) {
        errors.push('Position must be 0-255 characters');
    }

    if (activityData.achievements && !validateText(activityData.achievements, 0, 1000)) {
        errors.push('Achievements must be 0-1000 characters');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// File validation
function validateFileUpload(file, maxSize = 5 * 1024 * 1024) { // 5MB default
    const errors = [];

    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/jpg'
    ];

    if (!file.fileType || !allowedTypes.includes(file.fileType)) {
        errors.push('File type not allowed. Allowed: PDF, DOC, DOCX, JPG, PNG');
    }

    if (!file.fileSize || file.fileSize > maxSize) {
        errors.push(`File too large. Maximum size: ${Math.round(maxSize / (1024 * 1024))}MB`);
    }

    if (!file.fileName || file.fileName.length > 255) {
        errors.push('File name must be 1-255 characters');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Sanitization functions
function sanitizeText(text) {
    if (!text) return text;
    return text.trim().replace(/\s+/g, ' '); // Remove extra whitespace
}

function sanitizeUrl(url) {
    if (!url) return url;
    try {
        const parsed = new URL(url);
        return parsed.toString();
    } catch {
        return null;
    }
}

function sanitizeProfile(profileData) {
    const sanitized = {};
    
    if (profileData.student_id_num) sanitized.student_id_num = sanitizeText(profileData.student_id_num);
    if (profileData.year_level) sanitized.year_level = sanitizeText(profileData.year_level);
    if (profileData.major) sanitized.major = sanitizeText(profileData.major);
    if (profileData.date_of_birth) sanitized.date_of_birth = profileData.date_of_birth;
    if (profileData.bio) sanitized.bio = sanitizeText(profileData.bio);
    if (profileData.short_term_goals) sanitized.short_term_goals = sanitizeText(profileData.short_term_goals);
    if (profileData.long_term_goals) sanitized.long_term_goals = sanitizeText(profileData.long_term_goals);
    if (profileData.career_aspirations) sanitized.career_aspirations = sanitizeText(profileData.career_aspirations);
    if (profileData.linkedin_url) sanitized.linkedin_url = sanitizeUrl(profileData.linkedin_url);
    if (profileData.portfolio_url) sanitized.portfolio_url = sanitizeUrl(profileData.portfolio_url);
    if (profileData.github_url) sanitized.github_url = sanitizeUrl(profileData.github_url);
    if (profileData.phone) sanitized.phone = sanitizeText(profileData.phone);

    return sanitized;
}

module.exports = {
    validateDate,
    validateDateRange,
    validateUrl,
    validateText,
    validateNumber,
    validateStudentProfile,
    validateGoal,
    validateActivity,
    validateFileUpload,
    sanitizeText,
    sanitizeUrl,
    sanitizeProfile
};