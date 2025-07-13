-- Seed Data for Student Profile & Goal Tracking System
-- Competition Entry - Pre-populated data for demo

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable) VALUES
('app_name', 'Student Profile & Goal Tracking System', 'string', 'Application name', TRUE),
('max_file_size_mb', '10', 'number', 'Maximum file upload size in MB', TRUE),
('session_timeout_hours', '24', 'number', 'Session timeout in hours', TRUE),
('allow_student_self_registration', 'false', 'boolean', 'Allow students to self-register', TRUE),
('email_verification_required', 'true', 'boolean', 'Require email verification for new accounts', TRUE),
('default_profile_photo', '/assets/default-avatar.png', 'string', 'Default profile photo path', TRUE),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', TRUE);

-- Insert predefined skills with categories
INSERT INTO skills (name, category, description) VALUES
-- Technical Skills
('JavaScript', 'technical', 'Programming language for web development'),
('Python', 'technical', 'General-purpose programming language'),
('Java', 'technical', 'Object-oriented programming language'),
('C++', 'technical', 'System programming language'),
('HTML/CSS', 'technical', 'Web markup and styling languages'),
('React', 'technical', 'JavaScript library for building user interfaces'),
('Node.js', 'technical', 'JavaScript runtime for server-side development'),
('SQL', 'technical', 'Database query language'),
('Git', 'technical', 'Version control system'),
('Docker', 'technical', 'Containerization platform'),
('AWS', 'technical', 'Amazon Web Services cloud platform'),
('Machine Learning', 'technical', 'AI and data science techniques'),
('Data Analysis', 'technical', 'Statistical analysis and interpretation'),
('Cybersecurity', 'technical', 'Information security practices'),
('Mobile Development', 'technical', 'iOS and Android app development'),

-- Soft Skills
('Leadership', 'soft', 'Ability to guide and motivate teams'),
('Communication', 'soft', 'Effective verbal and written communication'),
('Problem Solving', 'soft', 'Analytical thinking and solution finding'),
('Teamwork', 'soft', 'Collaborative work and cooperation'),
('Time Management', 'soft', 'Efficient organization and prioritization'),
('Critical Thinking', 'soft', 'Logical analysis and evaluation'),
('Creativity', 'soft', 'Innovative thinking and idea generation'),
('Adaptability', 'soft', 'Flexibility in changing environments'),
('Presentation Skills', 'soft', 'Public speaking and presentation abilities'),
('Project Management', 'soft', 'Planning and executing projects'),
('Negotiation', 'soft', 'Conflict resolution and deal-making'),
('Emotional Intelligence', 'soft', 'Understanding and managing emotions'),

-- Language Skills
('English', 'language', 'English language proficiency'),
('Spanish', 'language', 'Spanish language proficiency'),
('French', 'language', 'French language proficiency'),
('German', 'language', 'German language proficiency'),
('Mandarin', 'language', 'Mandarin Chinese language proficiency'),
('Japanese', 'language', 'Japanese language proficiency'),

-- Tools & Software
('Microsoft Office', 'tool', 'Office productivity suite'),
('Adobe Creative Suite', 'tool', 'Design and multimedia software'),
('Figma', 'tool', 'Design and prototyping tool'),
('Slack', 'tool', 'Team communication platform'),
('Jira', 'tool', 'Project management and issue tracking'),
('Tableau', 'tool', 'Data visualization software'),
('Excel Advanced', 'tool', 'Advanced spreadsheet analysis'),
('AutoCAD', 'tool', 'Computer-aided design software'),

-- Certifications
('PMP', 'certification', 'Project Management Professional certification'),
('AWS Certified', 'certification', 'Amazon Web Services certification'),
('Google Analytics', 'certification', 'Web analytics certification'),
('Scrum Master', 'certification', 'Agile project management certification'),
('CompTIA Security+', 'certification', 'IT security certification');

-- Insert predefined interests with categories
INSERT INTO interests (name, category, description) VALUES
-- Academic Interests
('Computer Science', 'academic', 'Study of computational systems and design'),
('Data Science', 'academic', 'Analysis and interpretation of complex data'),
('Artificial Intelligence', 'academic', 'Machine learning and AI systems'),
('Business Administration', 'academic', 'Management and organizational studies'),
('Psychology', 'academic', 'Study of mind and behavior'),
('Engineering', 'academic', 'Applied sciences and technology'),
('Mathematics', 'academic', 'Mathematical theory and applications'),
('Biology', 'academic', 'Life sciences and biological systems'),
('Environmental Science', 'academic', 'Environmental systems and sustainability'),
('Economics', 'academic', 'Economic theory and market analysis'),

-- Industry Interests
('Technology', 'industry', 'Tech industry and innovation'),
('Healthcare', 'industry', 'Medical and health services'),
('Finance', 'industry', 'Financial services and banking'),
('Education', 'industry', 'Teaching and educational institutions'),
('Non-Profit', 'industry', 'Social impact organizations'),
('Consulting', 'industry', 'Business advisory services'),
('Startups', 'industry', 'Entrepreneurship and new ventures'),
('Government', 'industry', 'Public sector and policy'),
('Entertainment', 'industry', 'Media and entertainment industry'),
('Retail', 'industry', 'Consumer goods and services'),

-- Extracurricular Activities
('Student Government', 'extracurricular', 'Student leadership and governance'),
('Debate Team', 'extracurricular', 'Competitive debating and public speaking'),
('Robotics Club', 'extracurricular', 'Engineering and programming competitions'),
('Volunteer Work', 'extracurricular', 'Community service and social impact'),
('Sports', 'extracurricular', 'Athletic activities and competitions'),
('Music', 'extracurricular', 'Musical performance and composition'),
('Drama/Theater', 'extracurricular', 'Theatrical performance and production'),
('Writing/Journalism', 'extracurricular', 'Creative writing and news reporting'),
('Art/Design', 'extracurricular', 'Visual arts and graphic design'),
('Chess Club', 'extracurricular', 'Strategic thinking and competition'),

-- Research Interests
('Machine Learning Research', 'research', 'Advanced AI and ML algorithms'),
('Environmental Research', 'research', 'Climate change and sustainability studies'),
('Medical Research', 'research', 'Biomedical and clinical research'),
('Social Sciences Research', 'research', 'Human behavior and society studies'),
('Technology Innovation', 'research', 'Emerging technology development'),

-- Hobbies
('Reading', 'hobby', 'Literature and continuous learning'),
('Gaming', 'hobby', 'Video games and interactive entertainment'),
('Photography', 'hobby', 'Visual storytelling and art'),
('Cooking', 'hobby', 'Culinary arts and food preparation'),
('Travel', 'hobby', 'Cultural exploration and adventure'),
('Fitness', 'hobby', 'Physical health and wellness'),
('Gardening', 'hobby', 'Plant cultivation and sustainable living'),
('DIY Projects', 'hobby', 'Crafting and building'),
('Podcasting', 'hobby', 'Audio content creation'),
('Blogging', 'hobby', 'Written content creation');

-- Insert sample survey templates
INSERT INTO survey_templates (teacher_id, title, description, category, is_public, estimated_time_minutes) VALUES
(1, 'Beginning of Term Assessment', 'Initial student profile and goal setting survey', 'beginning-term', TRUE, 20),
(1, 'Mid-Term Check-in', 'Progress review and goal adjustment', 'mid-term', TRUE, 15),
(1, 'Project Team Preferences', 'Skills and collaboration preferences for team formation', 'project-preferences', TRUE, 10),
(1, 'Skills Self-Assessment', 'Comprehensive skills inventory and proficiency rating', 'skill-assessment', TRUE, 25),
(1, 'End of Term Reflection', 'Goal achievement and learning outcomes review', 'end-term', TRUE, 20);

-- Create a demo teacher account (password: "teacher123")
INSERT INTO users (email, password_hash, role, first_name, last_name, email_verified) VALUES
('teacher@demo.com', '$2b$10$rOGGhGm5Q5sTb0D0QN5z7.GjVHPsY2x3yXzWqJg7PXqO5mKpNJHwe', 'teacher', 'Jane', 'Smith', TRUE);

-- Create demo student accounts (password: "student123")
INSERT INTO users (email, password_hash, role, first_name, last_name, email_verified) VALUES
('student1@demo.com', '$2b$10$rOGGhGm5Q5sTb0D0QN5z7.GjVHPsY2x3yXzWqJg7PXqO5mKpNJHwe', 'student', 'John', 'Doe', TRUE),
('student2@demo.com', '$2b$10$rOGGhGm5Q5sTb0D0QN5z7.GjVHPsY2x3yXzWqJg7PXqO5mKpNJHwe', 'student', 'Alice', 'Johnson', TRUE),
('student3@demo.com', '$2b$10$rOGGhGm5Q5sTb0D0QN5z7.GjVHPsY2x3yXzWqJg7PXqO5mKpNJHwe', 'student', 'Bob', 'Wilson', TRUE);

-- Create admin account (password: "admin123")
INSERT INTO users (email, password_hash, role, first_name, last_name, email_verified) VALUES
('admin@demo.com', '$2b$10$rOGGhGm5Q5sTb0D0QN5z7.GjVHPsY2x3yXzWqJg7PXqO5mKpNJHwe', 'admin', 'System', 'Administrator', TRUE);

-- Update survey template teacher_id to reference the demo teacher
UPDATE survey_templates SET teacher_id = (SELECT id FROM users WHERE email = 'teacher@demo.com');

-- Create student profiles for demo students
INSERT INTO student_profiles (user_id, student_id_num, year_grade, major_focus, bio) VALUES
((SELECT id FROM users WHERE email = 'student1@demo.com'), 'STU001', 'Junior', 'Computer Science', 'Passionate about web development and AI'),
((SELECT id FROM users WHERE email = 'student2@demo.com'), 'STU002', 'Senior', 'Data Science', 'Interested in machine learning and data analytics'),
((SELECT id FROM users WHERE email = 'student3@demo.com'), 'STU003', 'Sophomore', 'Business Administration', 'Focus on entrepreneurship and technology management');

-- Create a demo class
INSERT INTO classes (teacher_id, name, description, class_code, semester, year) VALUES
((SELECT id FROM users WHERE email = 'teacher@demo.com'), 'Introduction to Software Engineering', 'Fundamentals of software development and project management', 'CS101-2024', 'Fall', 2024);

-- Enroll demo students in the class
INSERT INTO class_enrollments (class_id, student_profile_id) VALUES
((SELECT id FROM classes WHERE class_code = 'CS101-2024'), (SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student1@demo.com'))),
((SELECT id FROM classes WHERE class_code = 'CS101-2024'), (SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student2@demo.com'))),
((SELECT id FROM classes WHERE class_code = 'CS101-2024'), (SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student3@demo.com')));

-- Add some demo goals
INSERT INTO goals (student_profile_id, type, title, description, priority, target_date, status) VALUES
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student1@demo.com')), 'short-term', 'Complete React Project', 'Build a full-stack web application using React and Node.js', 'high', '2024-12-15', 'in-progress'),
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student1@demo.com')), 'long-term', 'Become Full-Stack Developer', 'Master both frontend and backend development technologies', 'high', '2025-06-01', 'pending'),
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student2@demo.com')), 'short-term', 'Learn Machine Learning', 'Complete online ML course and implement 3 projects', 'medium', '2024-11-30', 'in-progress'),
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student3@demo.com')), 'career', 'Start Tech Startup', 'Launch a technology-based business venture', 'high', '2026-01-01', 'pending');

-- Add some demo skills for students
INSERT INTO student_skills (student_profile_id, skill_id, proficiency_level, source) VALUES
-- Student 1 skills
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student1@demo.com')), (SELECT id FROM skills WHERE name = 'JavaScript'), 4, 'self-reported'),
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student1@demo.com')), (SELECT id FROM skills WHERE name = 'React'), 3, 'self-reported'),
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student1@demo.com')), (SELECT id FROM skills WHERE name = 'Node.js'), 3, 'self-reported'),
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student1@demo.com')), (SELECT id FROM skills WHERE name = 'Communication'), 4, 'self-reported'),

-- Student 2 skills
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student2@demo.com')), (SELECT id FROM skills WHERE name = 'Python'), 5, 'self-reported'),
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student2@demo.com')), (SELECT id FROM skills WHERE name = 'Machine Learning'), 4, 'self-reported'),
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student2@demo.com')), (SELECT id FROM skills WHERE name = 'Data Analysis'), 5, 'self-reported'),
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student2@demo.com')), (SELECT id FROM skills WHERE name = 'Problem Solving'), 5, 'self-reported'),

-- Student 3 skills
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student3@demo.com')), (SELECT id FROM skills WHERE name = 'Leadership'), 4, 'self-reported'),
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student3@demo.com')), (SELECT id FROM skills WHERE name = 'Project Management'), 3, 'self-reported'),
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student3@demo.com')), (SELECT id FROM skills WHERE name = 'Presentation Skills'), 5, 'self-reported');

-- Add some demo interests for students
INSERT INTO student_interests (student_profile_id, interest_id, intensity_level) VALUES
-- Student 1 interests
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student1@demo.com')), (SELECT id FROM interests WHERE name = 'Technology'), 5),
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student1@demo.com')), (SELECT id FROM interests WHERE name = 'Robotics Club'), 4),
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student1@demo.com')), (SELECT id FROM interests WHERE name = 'Gaming'), 3),

-- Student 2 interests
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student2@demo.com')), (SELECT id FROM interests WHERE name = 'Data Science'), 5),
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student2@demo.com')), (SELECT id FROM interests WHERE name = 'Machine Learning Research'), 5),
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student2@demo.com')), (SELECT id FROM interests WHERE name = 'Reading'), 4),

-- Student 3 interests
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student3@demo.com')), (SELECT id FROM interests WHERE name = 'Business Administration'), 5),
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student3@demo.com')), (SELECT id FROM interests WHERE name = 'Startups'), 5),
((SELECT id FROM student_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'student3@demo.com')), (SELECT id FROM interests WHERE name = 'Student Government'), 4);