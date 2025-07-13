-- Student Profile & Goal Tracking System Database Schema
-- Competition Entry - High Performance Design

-- Create database (if running outside Docker)
-- CREATE DATABASE IF NOT EXISTS student_profile_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE student_profile_db;

-- Enable strict mode for data integrity
SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';

-- 1. Users table - Central authentication and authorization
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('teacher', 'student', 'admin')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255) NULL,
    reset_token VARCHAR(255) NULL,
    reset_token_expires TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_verification_token (verification_token),
    INDEX idx_reset_token (reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Student Profiles table
CREATE TABLE student_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    student_id_num VARCHAR(50) UNIQUE NULL,
    year_grade VARCHAR(50) NULL,
    major_focus VARCHAR(255) NULL,
    profile_photo_url VARCHAR(255) NULL,
    bio TEXT NULL,
    contact_prefs TEXT NULL,
    profile_completion_percentage INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_student_id (student_id_num),
    INDEX idx_year_grade (year_grade),
    INDEX idx_completion (profile_completion_percentage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Goals table
CREATE TABLE goals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_profile_id INT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('short-term', 'long-term', 'academic', 'personal', 'career')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NULL CHECK (priority IN ('high', 'medium', 'low')),
    target_date DATE NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'archived')),
    progress_percentage INT DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    INDEX idx_student_profile (student_profile_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_target_date (target_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Skills table - Predefined skills catalog
CREATE TABLE skills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('technical', 'soft', 'language', 'tool', 'certification')),
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    FULLTEXT idx_fulltext_name (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Student Skills table - Many-to-many relationship with proficiency
CREATE TABLE student_skills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_profile_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency_level INT NOT NULL CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by INT NULL,
    acquired_date DATE NULL,
    source VARCHAR(50) DEFAULT 'self-reported' CHECK (source IN ('self-reported', 'resume', 'survey', 'verified')),
    notes TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_student_skill (student_profile_id, skill_id),
    INDEX idx_student_profile (student_profile_id),
    INDEX idx_skill (skill_id),
    INDEX idx_proficiency (proficiency_level),
    INDEX idx_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Interests table - Predefined interests catalog
CREATE TABLE interests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('academic', 'extracurricular', 'hobby', 'industry', 'research')),
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    FULLTEXT idx_fulltext_name (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Student Interests table - Many-to-many relationship
CREATE TABLE student_interests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_profile_id INT NOT NULL,
    interest_id INT NOT NULL,
    intensity_level INT DEFAULT 3 CHECK (intensity_level >= 1 AND intensity_level <= 5),
    source VARCHAR(50) DEFAULT 'self-reported' CHECK (source IN ('self-reported', 'resume', 'survey')),
    notes TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (interest_id) REFERENCES interests(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_interest (student_profile_id, interest_id),
    INDEX idx_student_profile (student_profile_id),
    INDEX idx_interest (interest_id),
    INDEX idx_intensity (intensity_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Survey Templates table
CREATE TABLE survey_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'beginning-term', 'mid-term', 'end-term', 'project-preferences', 'skill-assessment')),
    is_template BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT FALSE,
    total_questions INT DEFAULT 0,
    estimated_time_minutes INT DEFAULT 15,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_teacher (teacher_id),
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    INDEX idx_public (is_public),
    FULLTEXT idx_fulltext_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Survey Questions table
CREATE TABLE survey_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('multiple_choice', 'single_choice', 'rating_scale', 'text_short', 'text_long', 'yes_no', 'date', 'number')),
    options JSON NULL,
    validation_rules JSON NULL,
    is_required BOOLEAN DEFAULT FALSE,
    display_order INT NOT NULL,
    conditional_logic JSON NULL,
    help_text TEXT NULL,
    
    FOREIGN KEY (template_id) REFERENCES survey_templates(id) ON DELETE CASCADE,
    INDEX idx_template (template_id),
    INDEX idx_type (question_type),
    INDEX idx_order (display_order),
    INDEX idx_required (is_required)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Assigned Surveys table
CREATE TABLE assigned_surveys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_id INT NOT NULL,
    student_profile_id INT NOT NULL,
    assigned_by_teacher_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    instructions TEXT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    open_date DATETIME NULL,
    close_date DATETIME NULL,
    completion_status VARCHAR(50) DEFAULT 'pending' CHECK (completion_status IN ('pending', 'in-progress', 'completed', 'expired', 'cancelled')),
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    time_spent_minutes INT DEFAULT 0,
    auto_reminder_sent BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (template_id) REFERENCES survey_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by_teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (template_id, student_profile_id),
    INDEX idx_template (template_id),
    INDEX idx_student (student_profile_id),
    INDEX idx_teacher (assigned_by_teacher_id),
    INDEX idx_status (completion_status),
    INDEX idx_dates (open_date, close_date),
    INDEX idx_completed (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;