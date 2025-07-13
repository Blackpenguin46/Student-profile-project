-- Student Profile System - PostgreSQL Schema for Neon Database
-- Migration from MariaDB to PostgreSQL

-- Enable UUID extension for better IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('teacher', 'student', 'admin')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_verification_token ON users(verification_token);
CREATE INDEX idx_users_reset_token ON users(reset_token);

-- Student profiles table
CREATE TABLE student_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id_num VARCHAR(50) UNIQUE,
    year_level VARCHAR(50),
    major VARCHAR(255),
    date_of_birth DATE,
    bio TEXT,
    short_term_goals TEXT,
    long_term_goals TEXT,
    career_aspirations TEXT,
    linkedin_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    github_url VARCHAR(255),
    extracurricular_activities JSONB DEFAULT '[]'::jsonb,
    hobbies JSONB DEFAULT '[]'::jsonb,
    languages JSONB DEFAULT '[]'::jsonb,
    profile_completion_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for student_profiles
CREATE INDEX idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX idx_student_profiles_year_level ON student_profiles(year_level);
CREATE INDEX idx_student_profiles_major ON student_profiles(major);
CREATE INDEX idx_student_profiles_completion ON student_profiles(profile_completion_percentage);

-- Skills table
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    skill_name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('technical', 'soft', 'language', 'other')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for skills
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_name ON skills(skill_name);

-- Student skills junction table
CREATE TABLE student_skills (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(20) NOT NULL CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    years_experience INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, skill_id)
);

-- Create indexes for student_skills
CREATE INDEX idx_student_skills_student ON student_skills(student_id);
CREATE INDEX idx_student_skills_skill ON student_skills(skill_id);
CREATE INDEX idx_student_skills_proficiency ON student_skills(proficiency_level);

-- Interests table
CREATE TABLE interests (
    id SERIAL PRIMARY KEY,
    interest_name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for interests
CREATE INDEX idx_interests_category ON interests(category);

-- Student interests junction table
CREATE TABLE student_interests (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interest_id INTEGER NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
    level_of_interest VARCHAR(20) DEFAULT 'medium' CHECK (level_of_interest IN ('low', 'medium', 'high')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, interest_id)
);

-- Create indexes for student_interests
CREATE INDEX idx_student_interests_student ON student_interests(student_id);
CREATE INDEX idx_student_interests_interest ON student_interests(interest_id);

-- Goals table
CREATE TABLE goals (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type VARCHAR(20) NOT NULL CHECK (goal_type IN ('short_term', 'long_term', 'academic', 'career', 'personal')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused', 'cancelled')),
    target_date DATE,
    completion_date DATE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for goals
CREATE INDEX idx_goals_student ON goals(student_id);
CREATE INDEX idx_goals_type ON goals(goal_type);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_priority ON goals(priority);

-- Survey templates table
CREATE TABLE survey_templates (
    id SERIAL PRIMARY KEY,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    template_type VARCHAR(50) DEFAULT 'general',
    estimated_duration INTEGER, -- in minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for survey_templates
CREATE INDEX idx_survey_templates_creator ON survey_templates(created_by);
CREATE INDEX idx_survey_templates_active ON survey_templates(is_active);
CREATE INDEX idx_survey_templates_type ON survey_templates(template_type);

-- Survey responses table
CREATE TABLE survey_responses (
    id SERIAL PRIMARY KEY,
    survey_template_id INTEGER NOT NULL REFERENCES survey_templates(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    responses JSONB NOT NULL DEFAULT '{}'::jsonb,
    completion_status VARCHAR(20) DEFAULT 'in_progress' CHECK (completion_status IN ('not_started', 'in_progress', 'completed')),
    completion_percentage INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    time_spent_minutes INTEGER DEFAULT 0,
    UNIQUE(survey_template_id, student_id)
);

-- Create indexes for survey_responses
CREATE INDEX idx_survey_responses_template ON survey_responses(survey_template_id);
CREATE INDEX idx_survey_responses_student ON survey_responses(student_id);
CREATE INDEX idx_survey_responses_status ON survey_responses(completion_status);

-- Uploaded files table (for resumes and documents)
CREATE TABLE uploaded_files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    file_url VARCHAR(500), -- For external storage URLs
    file_data BYTEA, -- For direct database storage
    file_hash VARCHAR(64),
    upload_purpose VARCHAR(50) DEFAULT 'general', -- 'resume', 'portfolio', 'assignment', etc.
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    extracted_text TEXT,
    extracted_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for uploaded_files
CREATE INDEX idx_uploaded_files_user ON uploaded_files(user_id);
CREATE INDEX idx_uploaded_files_type ON uploaded_files(file_type);
CREATE INDEX idx_uploaded_files_purpose ON uploaded_files(upload_purpose);
CREATE INDEX idx_uploaded_files_hash ON uploaded_files(file_hash);
CREATE INDEX idx_uploaded_files_status ON uploaded_files(processing_status);

-- Resume parsing data table
CREATE TABLE parsed_resume_data (
    id SERIAL PRIMARY KEY,
    file_id INTEGER NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    extracted_skills JSONB DEFAULT '[]'::jsonb,
    extracted_experience JSONB DEFAULT '[]'::jsonb,
    extracted_education JSONB DEFAULT '[]'::jsonb,
    extracted_contact JSONB DEFAULT '{}'::jsonb,
    confidence_scores JSONB DEFAULT '{}'::jsonb,
    parsing_version VARCHAR(20) DEFAULT '1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for parsed_resume_data
CREATE INDEX idx_parsed_resume_file ON parsed_resume_data(file_id);
CREATE INDEX idx_parsed_resume_student ON parsed_resume_data(student_id);

-- Activity logs table
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for activity_logs
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- Insert some default skills
INSERT INTO skills (skill_name, category, description) VALUES 
-- Technical Skills
('JavaScript', 'technical', 'Programming language for web development'),
('Python', 'technical', 'Programming language for data science and web development'),
('React', 'technical', 'JavaScript library for building user interfaces'),
('Node.js', 'technical', 'JavaScript runtime for server-side development'),
('SQL', 'technical', 'Database query language'),
('Git', 'technical', 'Version control system'),
('HTML/CSS', 'technical', 'Web markup and styling languages'),
('Java', 'technical', 'Object-oriented programming language'),
('C++', 'technical', 'System programming language'),
('MongoDB', 'technical', 'NoSQL database'),
('PostgreSQL', 'technical', 'Relational database management system'),
('Docker', 'technical', 'Containerization platform'),

-- Soft Skills
('Communication', 'soft', 'Ability to convey information effectively'),
('Leadership', 'soft', 'Ability to guide and motivate others'),
('Problem Solving', 'soft', 'Analytical thinking and solution finding'),
('Teamwork', 'soft', 'Collaborative working skills'),
('Time Management', 'soft', 'Efficient use of time and prioritization'),
('Critical Thinking', 'soft', 'Objective analysis and evaluation'),
('Creativity', 'soft', 'Innovative thinking and idea generation'),
('Adaptability', 'soft', 'Flexibility in changing situations'),
('Project Management', 'soft', 'Planning and executing projects'),
('Public Speaking', 'soft', 'Presenting to audiences effectively');

-- Insert some default interests
INSERT INTO interests (interest_name, category, description) VALUES 
('Web Development', 'technology', 'Building websites and web applications'),
('Data Science', 'technology', 'Analyzing and interpreting data'),
('Machine Learning', 'technology', 'AI and predictive modeling'),
('Mobile Development', 'technology', 'Creating mobile applications'),
('Cybersecurity', 'technology', 'Protecting digital systems and data'),
('Game Development', 'technology', 'Creating video games'),
('Photography', 'creative', 'Capturing and editing images'),
('Music', 'creative', 'Playing instruments or music production'),
('Writing', 'creative', 'Creative or technical writing'),
('Design', 'creative', 'Graphic or UX/UI design'),
('Sports', 'physical', 'Athletic activities and fitness'),
('Travel', 'lifestyle', 'Exploring new places and cultures'),
('Volunteering', 'social', 'Community service and helping others'),
('Reading', 'intellectual', 'Books and continuous learning'),
('Entrepreneurship', 'business', 'Starting and running businesses');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON student_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_survey_templates_updated_at BEFORE UPDATE ON survey_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create demo users
INSERT INTO users (email, password_hash, role, first_name, last_name, email_verified) VALUES
('teacher@demo.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9U2wZP4/JC', 'teacher', 'Demo', 'Teacher', true),
('student1@demo.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9U2wZP4/JC', 'student', 'John', 'Student', true),
('admin@demo.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9U2wZP4/JC', 'admin', 'Admin', 'User', true);

-- Create demo student profiles
INSERT INTO student_profiles (user_id, year_level, major, bio, short_term_goals, long_term_goals, profile_completion_percentage)
SELECT u.id, 'Junior', 'Computer Science', 
       'Passionate about web development and creating innovative solutions.',
       'Complete my degree with honors and secure an internship at a tech company.',
       'Become a full-stack developer and eventually start my own tech company.',
       75
FROM users u WHERE u.email = 'student1@demo.com';

-- Add some demo skills to the student
INSERT INTO student_skills (student_id, skill_id, proficiency_level)
SELECT u.id, s.id, 'intermediate'
FROM users u, skills s 
WHERE u.email = 'student1@demo.com' 
AND s.skill_name IN ('JavaScript', 'React', 'HTML/CSS', 'Communication', 'Problem Solving');

-- Add some demo interests to the student
INSERT INTO student_interests (student_id, interest_id, level_of_interest)
SELECT u.id, i.id, 'high'
FROM users u, interests i
WHERE u.email = 'student1@demo.com'
AND i.interest_name IN ('Web Development', 'Machine Learning', 'Photography');