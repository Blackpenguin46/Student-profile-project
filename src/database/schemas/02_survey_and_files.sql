-- Survey Responses and File Management Tables

-- 11. Survey Responses table
CREATE TABLE survey_responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assigned_survey_id INT NOT NULL,
    question_id INT NOT NULL,
    response_text TEXT NULL,
    response_value INT NULL,
    response_json JSON NULL,
    is_skipped BOOLEAN DEFAULT FALSE,
    confidence_level INT DEFAULT 3 CHECK (confidence_level >= 1 AND confidence_level <= 5),
    responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assigned_survey_id) REFERENCES assigned_surveys(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES survey_questions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_response (assigned_survey_id, question_id),
    INDEX idx_assigned_survey (assigned_survey_id),
    INDEX idx_question (question_id),
    INDEX idx_responded_at (responded_at),
    FULLTEXT idx_fulltext_response (response_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Uploaded Resumes table - BLOB storage for competition simplicity
CREATE TABLE uploaded_resumes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_profile_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword')),
    file_size INT NOT NULL CHECK (file_size <= 10485760), -- 10MB limit
    file_data LONGBLOB NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_primary BOOLEAN DEFAULT FALSE,
    is_processed BOOLEAN DEFAULT FALSE,
    processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_error TEXT NULL,
    
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    INDEX idx_student_profile (student_profile_id),
    INDEX idx_file_type (file_type),
    INDEX idx_file_hash (file_hash),
    INDEX idx_primary (is_primary),
    INDEX idx_processing_status (processing_status),
    INDEX idx_upload_date (upload_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Parsed Resume Data table
CREATE TABLE parsed_resume_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uploaded_resume_id INT UNIQUE NOT NULL,
    extracted_text LONGTEXT NULL,
    extracted_skills JSON NULL,
    extracted_experience JSON NULL,
    extracted_education JSON NULL,
    extracted_contact JSON NULL,
    extracted_certifications JSON NULL,
    extracted_projects JSON NULL,
    parsing_confidence DECIMAL(5,2) DEFAULT 0.00 CHECK (parsing_confidence >= 0 AND parsing_confidence <= 100),
    discrepancies TEXT NULL,
    manual_review_required BOOLEAN DEFAULT FALSE,
    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL,
    integration_status VARCHAR(50) DEFAULT 'pending' CHECK (integration_status IN ('pending', 'integrated', 'conflicts', 'rejected')),
    parsed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (uploaded_resume_id) REFERENCES uploaded_resumes(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_resume (uploaded_resume_id),
    INDEX idx_confidence (parsing_confidence),
    INDEX idx_review_required (manual_review_required),
    INDEX idx_integration_status (integration_status),
    FULLTEXT idx_fulltext_text (extracted_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Classes/Groups table for teacher organization
CREATE TABLE classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    class_code VARCHAR(20) UNIQUE NOT NULL,
    semester VARCHAR(50) NULL,
    year INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    max_students INT DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_teacher (teacher_id),
    INDEX idx_class_code (class_code),
    INDEX idx_active (is_active),
    INDEX idx_semester_year (semester, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Class Enrollments table
CREATE TABLE class_enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    student_profile_id INT NOT NULL,
    enrollment_status VARCHAR(50) DEFAULT 'active' CHECK (enrollment_status IN ('active', 'inactive', 'withdrawn', 'completed')),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    withdrawn_at TIMESTAMP NULL,
    final_grade VARCHAR(10) NULL,
    
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (class_id, student_profile_id),
    INDEX idx_class (class_id),
    INDEX idx_student (student_profile_id),
    INDEX idx_status (enrollment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Activity Log table for audit trail
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INT NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. System Settings table
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT NULL,
    is_editable BOOLEAN DEFAULT TRUE,
    updated_by INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_key (setting_key),
    INDEX idx_editable (is_editable)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;