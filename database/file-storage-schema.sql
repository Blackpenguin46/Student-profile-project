-- Additional tables for file storage and enhanced functionality

-- Uploaded files table for storing files in database
CREATE TABLE IF NOT EXISTS uploaded_files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_data BYTEA NOT NULL,
    category VARCHAR(50) DEFAULT 'document' CHECK (category IN ('document', 'resume', 'profile_photo', 'transcript', 'certificate')),
    upload_ip INET,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for uploaded_files
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user ON uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_category ON uploaded_files(category);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_created ON uploaded_files(created_at);

-- Add profile_photo_id to student_profiles if not exists
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS profile_photo_id INTEGER REFERENCES uploaded_files(id) ON DELETE SET NULL;

-- Update goals table structure to match API expectations
ALTER TABLE goals 
DROP COLUMN IF EXISTS student_id,
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
DROP COLUMN IF EXISTS goal_type,
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'personal' CHECK (category IN ('academic', 'career', 'personal', 'skill', 'project')),
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS progress_notes TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Update goals status values
ALTER TABLE goals 
DROP CONSTRAINT IF EXISTS goals_status_check,
ADD CONSTRAINT goals_status_check CHECK (status IN ('active', 'completed', 'paused', 'cancelled'));

-- Create indexes for updated goals table
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_created_by ON goals(created_by);

-- Student interests table - fix column name
ALTER TABLE student_interests 
DROP COLUMN IF EXISTS student_id,
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Fix unique constraint
ALTER TABLE student_interests 
DROP CONSTRAINT IF EXISTS student_interests_student_id_interest_id_key,
ADD CONSTRAINT student_interests_user_interest_unique UNIQUE(user_id, interest_id);

-- Update column name in student_interests
ALTER TABLE student_interests 
DROP COLUMN IF EXISTS level_of_interest,
ADD COLUMN IF NOT EXISTS interest_level VARCHAR(20) DEFAULT 'medium' CHECK (interest_level IN ('low', 'medium', 'high'));

-- Student skills table - fix column name to match goals pattern
ALTER TABLE student_skills 
DROP COLUMN IF EXISTS student_id,
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Fix unique constraint for student_skills
ALTER TABLE student_skills 
DROP CONSTRAINT IF EXISTS student_skills_student_id_skill_id_key,
ADD CONSTRAINT student_skills_user_skill_unique UNIQUE(user_id, skill_id);

-- Activities table for extracurricular activities
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'other' CHECK (category IN ('academic', 'sports', 'volunteer', 'work', 'creative', 'leadership', 'other')),
    start_date DATE,
    end_date DATE,
    hours INTEGER DEFAULT 0,
    organization VARCHAR(255),
    position VARCHAR(255),
    achievements TEXT,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for activities
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_start_date ON activities(start_date);

-- Update activity_logs to use JSONB for better performance
ALTER TABLE activity_logs 
ALTER COLUMN details TYPE JSONB USING details::JSONB;