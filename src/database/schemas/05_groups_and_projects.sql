-- Groups and Projects Schema for Intelligent Group Formation
-- This schema supports the intelligent group formation features

-- Projects table for organizing group work
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    required_skills JSONB DEFAULT '[]'::jsonb,
    max_groups INTEGER DEFAULT 10,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'archived')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Groups table for managing student groups
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    max_size INTEGER DEFAULT 4 CHECK (max_size > 0 AND max_size <= 10),
    formation_criteria JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'disbanded')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Group members junction table
CREATE TABLE IF NOT EXISTS group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('leader', 'member', 'mentor')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Ensure a user can only be in one active group per project
    UNIQUE(group_id, user_id)
);

-- Group formation history for tracking algorithm performance
CREATE TABLE IF NOT EXISTS group_formation_history (
    id SERIAL PRIMARY KEY,
    formation_id UUID DEFAULT gen_random_uuid(),
    algorithm_used VARCHAR(100) NOT NULL,
    parameters JSONB DEFAULT '{}'::jsonb,
    groups_created INTEGER NOT NULL,
    total_students INTEGER NOT NULL,
    average_quality_score DECIMAL(5,2),
    formation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL
);

-- Group evaluation table for tracking group performance
CREATE TABLE IF NOT EXISTS group_evaluations (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    evaluation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    collaboration_score DECIMAL(3,2) CHECK (collaboration_score >= 0 AND collaboration_score <= 10),
    productivity_score DECIMAL(3,2) CHECK (productivity_score >= 0 AND productivity_score <= 10),
    satisfaction_score DECIMAL(3,2) CHECK (satisfaction_score >= 0 AND satisfaction_score <= 10),
    notes TEXT,
    evaluated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_groups_status ON groups(status);
CREATE INDEX IF NOT EXISTS idx_groups_project_id ON groups(project_id);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_active ON group_members(group_id, user_id) WHERE left_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_group_formation_history_algorithm ON group_formation_history(algorithm_used);
CREATE INDEX IF NOT EXISTS idx_group_formation_history_project ON group_formation_history(project_id);
CREATE INDEX IF NOT EXISTS idx_group_formation_history_date ON group_formation_history(formation_date);

CREATE INDEX IF NOT EXISTS idx_group_evaluations_group_id ON group_evaluations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_evaluations_date ON group_evaluations(evaluation_date);

-- Sample projects for testing and demonstration
INSERT INTO projects (title, description, required_skills, max_groups, start_date, end_date, created_by) VALUES
('Web Development Project', 'Build a full-stack web application using modern frameworks', 
 '[{"name": "JavaScript", "level": "intermediate"}, {"name": "React", "level": "beginner"}, {"name": "Node.js", "level": "beginner"}]',
 8, CURRENT_DATE, CURRENT_DATE + INTERVAL '8 weeks', 1),

('Mobile App Development', 'Create a cross-platform mobile application with user authentication and data persistence',
 '[{"name": "React Native", "level": "beginner"}, {"name": "Mobile UI/UX", "level": "intermediate"}, {"name": "Database Design", "level": "beginner"}]',
 6, CURRENT_DATE + INTERVAL '2 weeks', CURRENT_DATE + INTERVAL '10 weeks', 1),

('Data Science Research', 'Analyze a real-world dataset and present findings with visualizations',
 '[{"name": "Python", "level": "intermediate"}, {"name": "Data Analysis", "level": "intermediate"}, {"name": "Machine Learning", "level": "beginner"}]',
 5, CURRENT_DATE + INTERVAL '1 week', CURRENT_DATE + INTERVAL '6 weeks', 1),

('Game Development Challenge', 'Design and implement a 2D game with multiple levels and scoring system',
 '[{"name": "Game Development", "level": "beginner"}, {"name": "C#", "level": "intermediate"}, {"name": "Unity", "level": "beginner"}]',
 4, CURRENT_DATE + INTERVAL '3 weeks', CURRENT_DATE + INTERVAL '12 weeks', 1),

('DevOps Pipeline Project', 'Set up CI/CD pipeline and deploy applications using cloud services',
 '[{"name": "DevOps", "level": "intermediate"}, {"name": "Docker", "level": "beginner"}, {"name": "Cloud Computing", "level": "beginner"}]',
 3, CURRENT_DATE + INTERVAL '4 weeks', CURRENT_DATE + INTERVAL '8 weeks', 1)

ON CONFLICT DO NOTHING;

-- Create a view for active group memberships
CREATE OR REPLACE VIEW active_group_memberships AS
SELECT 
    gm.id,
    gm.group_id,
    gm.user_id,
    gm.role,
    gm.joined_at,
    g.name as group_name,
    g.project_id,
    p.title as project_title,
    u.first_name,
    u.last_name,
    u.email
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
LEFT JOIN projects p ON g.project_id = p.id
JOIN users u ON gm.user_id = u.id
WHERE gm.left_at IS NULL 
  AND g.status = 'active';

-- Create a view for group statistics
CREATE OR REPLACE VIEW group_statistics AS
SELECT 
    g.id,
    g.name,
    g.project_id,
    p.title as project_title,
    g.max_size,
    COUNT(gm.user_id) as current_size,
    ROUND(AVG(sp.profile_completion_percentage), 2) as avg_profile_completion,
    COUNT(DISTINCT ss.skill_id) as unique_skills,
    COUNT(DISTINCT si.interest_id) as unique_interests,
    g.formation_criteria,
    g.status,
    g.created_at
FROM groups g
LEFT JOIN projects p ON g.project_id = p.id
LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.left_at IS NULL
LEFT JOIN student_profiles sp ON gm.user_id = sp.user_id
LEFT JOIN student_skills ss ON gm.user_id = ss.user_id
LEFT JOIN student_interests si ON gm.user_id = si.user_id
GROUP BY g.id, p.title
ORDER BY g.created_at DESC;

-- Function to calculate group compatibility score
CREATE OR REPLACE FUNCTION calculate_group_compatibility(group_id_param INTEGER)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    compatibility_score DECIMAL(5,2) := 0;
    skill_diversity_score DECIMAL(5,2);
    interest_overlap_score DECIMAL(5,2);
    experience_balance_score DECIMAL(5,2);
    member_count INTEGER;
BEGIN
    -- Get member count
    SELECT COUNT(*) INTO member_count
    FROM group_members gm
    WHERE gm.group_id = group_id_param AND gm.left_at IS NULL;
    
    IF member_count = 0 THEN
        RETURN 0;
    END IF;
    
    -- Calculate skill diversity (unique skills / total skills)
    SELECT 
        CASE 
            WHEN COUNT(ss.skill_id) > 0 THEN
                (COUNT(DISTINCT ss.skill_id)::DECIMAL / COUNT(ss.skill_id)) * 100
            ELSE 0
        END INTO skill_diversity_score
    FROM group_members gm
    LEFT JOIN student_skills ss ON gm.user_id = ss.user_id
    WHERE gm.group_id = group_id_param AND gm.left_at IS NULL;
    
    -- Calculate interest overlap (shared interests bonus)
    SELECT 
        CASE 
            WHEN COUNT(si.interest_id) > 0 THEN
                LEAST(50, (COUNT(si.interest_id) - COUNT(DISTINCT si.interest_id)) * 10)
            ELSE 0
        END INTO interest_overlap_score
    FROM group_members gm
    LEFT JOIN student_interests si ON gm.user_id = si.user_id
    WHERE gm.group_id = group_id_param AND gm.left_at IS NULL;
    
    -- Calculate experience balance (year level diversity)
    SELECT 
        (COUNT(DISTINCT sp.year_level)::DECIMAL / GREATEST(member_count, 1)) * 30 INTO experience_balance_score
    FROM group_members gm
    LEFT JOIN student_profiles sp ON gm.user_id = sp.user_id
    WHERE gm.group_id = group_id_param AND gm.left_at IS NULL;
    
    -- Combine scores with weights
    compatibility_score := 
        (COALESCE(skill_diversity_score, 0) * 0.4) +
        (COALESCE(interest_overlap_score, 0) * 0.3) +
        (COALESCE(experience_balance_score, 0) * 0.3);
    
    RETURN LEAST(100, compatibility_score);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update group updated_at timestamp
CREATE OR REPLACE FUNCTION update_group_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE groups SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.group_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_timestamp
    AFTER INSERT OR UPDATE OR DELETE ON group_members
    FOR EACH ROW EXECUTE FUNCTION update_group_timestamp();

-- Comments for documentation
COMMENT ON TABLE projects IS 'Stores project information for group assignments';
COMMENT ON TABLE groups IS 'Stores group information with formation criteria and status';
COMMENT ON TABLE group_members IS 'Junction table for group membership with roles';
COMMENT ON TABLE group_formation_history IS 'Tracks group formation events and algorithm performance';
COMMENT ON TABLE group_evaluations IS 'Stores group performance evaluations';

COMMENT ON FUNCTION calculate_group_compatibility(INTEGER) IS 'Calculates a compatibility score for a group based on member skills, interests, and experience';

-- Grant permissions (assuming roles exist)
-- These would be uncommented in a production environment with proper role management

-- GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO teachers, admins;
-- GRANT SELECT ON projects TO students;

-- GRANT SELECT, INSERT, UPDATE, DELETE ON groups TO teachers, admins;
-- GRANT SELECT ON groups TO students;

-- GRANT SELECT, INSERT, UPDATE, DELETE ON group_members TO teachers, admins;
-- GRANT SELECT ON group_members TO students;

-- GRANT SELECT ON group_formation_history TO teachers, admins;
-- GRANT SELECT ON group_evaluations TO teachers, admins;

-- GRANT SELECT ON active_group_memberships TO teachers, admins, students;
-- GRANT SELECT ON group_statistics TO teachers, admins;