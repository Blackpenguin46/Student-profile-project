const { query } = require('./lib/db');
const { 
    sendError, 
    sendSuccess, 
    setCorsHeaders, 
    authenticateToken 
} = require('./lib/auth');

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        return res.status(200).end();
    }

    setCorsHeaders(res);

    try {
        // Authenticate user
        const authResult = await authenticateToken(req);
        if (!authResult.success) {
            return sendError(res, 401, authResult.message);
        }

        const { user } = authResult;
        const { id } = req.query;

        if (req.method === 'GET') {
            if (id) {
                // Get specific student
                const studentId = parseInt(id);
                const canAccess = user.role === 'teacher' || user.role === 'admin' || user.id === studentId;

                if (!canAccess) {
                    return sendError(res, 403, 'Access denied');
                }

                const studentResult = await query(`
                    SELECT 
                        u.id, u.email, u.first_name, u.last_name, u.phone, u.created_at, u.last_login,
                        sp.student_id_num, sp.year_level, sp.major, sp.date_of_birth, sp.bio,
                        sp.short_term_goals, sp.long_term_goals, sp.career_aspirations,
                        sp.linkedin_url, sp.portfolio_url, sp.github_url,
                        sp.extracurricular_activities, sp.hobbies, sp.languages,
                        sp.profile_completion_percentage, sp.updated_at as profile_updated_at
                    FROM users u
                    LEFT JOIN student_profiles sp ON u.id = sp.user_id
                    WHERE u.id = $1 AND u.role = 'student' AND u.is_active = true
                `, [studentId]);

                if (studentResult.rows.length === 0) {
                    return sendError(res, 404, 'Student not found');
                }

                const student = studentResult.rows[0];

                // Get student's skills, interests, goals, and activities
                const [skillsResult, interestsResult, goalsResult, activitiesResult] = await Promise.all([
                    query(`
                        SELECT s.id, s.skill_name as name, s.category, ss.proficiency_level, ss.created_at
                        FROM skills s
                        JOIN student_skills ss ON s.id = ss.skill_id
                        WHERE ss.user_id = $1
                        ORDER BY s.category, s.skill_name
                    `, [studentId]),
                    
                    query(`
                        SELECT i.id, i.interest_name as name, i.category, si.interest_level, si.created_at
                        FROM interests i
                        JOIN student_interests si ON i.id = si.interest_id
                        WHERE si.user_id = $1
                        ORDER BY i.category, i.interest_name
                    `, [studentId]),
                    
                    query(`
                        SELECT id, title, description, category, target_date, status, priority, created_at, updated_at
                        FROM goals
                        WHERE user_id = $1
                        ORDER BY priority DESC, target_date ASC
                    `, [studentId]),
                    
                    query(`
                        SELECT id, title, description, category, start_date, end_date, hours, created_at
                        FROM activities
                        WHERE user_id = $1
                        ORDER BY start_date DESC
                    `, [studentId])
                ]);

                const fullProfile = {
                    ...student,
                    skills: skillsResult.rows,
                    interests: interestsResult.rows,
                    goals: goalsResult.rows,
                    activities: activitiesResult.rows
                };

                sendSuccess(res, { student: fullProfile });

            } else {
                // List students
                if (!['teacher', 'admin'].includes(user.role)) {
                    return sendError(res, 403, 'Access denied');
                }

                const { page = 1, limit = 20, search = '', year_level = '', major = '' } = req.query;
                const offset = (page - 1) * limit;

                let whereClause = 'WHERE u.is_active = true';
                const queryParams = [];
                let paramIndex = 1;

                if (search) {
                    whereClause += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
                    queryParams.push(`%${search}%`);
                    paramIndex++;
                }

                if (year_level) {
                    whereClause += ` AND sp.year_level = $${paramIndex}`;
                    queryParams.push(year_level);
                    paramIndex++;
                }

                if (major) {
                    whereClause += ` AND sp.major ILIKE $${paramIndex}`;
                    queryParams.push(`%${major}%`);
                    paramIndex++;
                }

                const studentsResult = await query(`
                    SELECT 
                        u.id, u.email, u.first_name, u.last_name, u.created_at,
                        sp.student_id_num, sp.year_level, sp.major, sp.profile_completion_percentage,
                        sp.short_term_goals, sp.long_term_goals
                    FROM users u
                    LEFT JOIN student_profiles sp ON u.id = sp.user_id
                    ${whereClause}
                    AND u.role = 'student'
                    ORDER BY u.last_name, u.first_name
                    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
                `, [...queryParams, limit, offset]);

                const countResult = await query(`
                    SELECT COUNT(*) as total
                    FROM users u
                    LEFT JOIN student_profiles sp ON u.id = sp.user_id
                    ${whereClause}
                    AND u.role = 'student'
                `, queryParams);

                const total = parseInt(countResult.rows[0].total);
                const totalPages = Math.ceil(total / limit);

                sendSuccess(res, {
                    students: studentsResult.rows,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages,
                        hasNext: page < totalPages,
                        hasPrev: page > 1
                    }
                });
            }

        } else if (req.method === 'PUT' && id) {
            // Update student profile
            const studentId = parseInt(id);
            
            if (user.id !== studentId) {
                return sendError(res, 403, 'Can only update your own profile');
            }

            const {
                student_id_num, year_level, major, date_of_birth, bio,
                short_term_goals, long_term_goals, career_aspirations,
                linkedin_url, portfolio_url, github_url,
                extracurricular_activities, hobbies, languages, phone
            } = req.body;

            // Update user table
            if (phone !== undefined) {
                await query('UPDATE users SET phone = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [phone, studentId]);
            }

            // Update student profile
            const profileUpdateResult = await query(`
                INSERT INTO student_profiles (
                    user_id, student_id_num, year_level, major, date_of_birth, bio,
                    short_term_goals, long_term_goals, career_aspirations,
                    linkedin_url, portfolio_url, github_url,
                    extracurricular_activities, hobbies, languages, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id) DO UPDATE SET
                    student_id_num = COALESCE($2, student_profiles.student_id_num),
                    year_level = COALESCE($3, student_profiles.year_level),
                    major = COALESCE($4, student_profiles.major),
                    date_of_birth = COALESCE($5, student_profiles.date_of_birth),
                    bio = COALESCE($6, student_profiles.bio),
                    short_term_goals = COALESCE($7, student_profiles.short_term_goals),
                    long_term_goals = COALESCE($8, student_profiles.long_term_goals),
                    career_aspirations = COALESCE($9, student_profiles.career_aspirations),
                    linkedin_url = COALESCE($10, student_profiles.linkedin_url),
                    portfolio_url = COALESCE($11, student_profiles.portfolio_url),
                    github_url = COALESCE($12, student_profiles.github_url),
                    extracurricular_activities = COALESCE($13, student_profiles.extracurricular_activities),
                    hobbies = COALESCE($14, student_profiles.hobbies),
                    languages = COALESCE($15, student_profiles.languages),
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *
            `, [
                studentId, student_id_num, year_level, major, date_of_birth, bio,
                short_term_goals, long_term_goals, career_aspirations,
                linkedin_url, portfolio_url, github_url,
                extracurricular_activities ? JSON.stringify(extracurricular_activities) : null,
                hobbies ? JSON.stringify(hobbies) : null,
                languages ? JSON.stringify(languages) : null
            ]);

            // Calculate completion percentage
            const profile = profileUpdateResult.rows[0];
            const completionFields = [
                profile.student_id_num, profile.year_level, profile.major,
                profile.bio, profile.short_term_goals, profile.long_term_goals, profile.career_aspirations
            ];
            const completedFields = completionFields.filter(field => field && field.trim()).length;
            const completionPercentage = Math.round((completedFields / completionFields.length) * 100);

            await query('UPDATE student_profiles SET profile_completion_percentage = $1 WHERE user_id = $2', [completionPercentage, studentId]);

            sendSuccess(res, {
                message: 'Profile updated successfully',
                profile: { ...profile, profile_completion_percentage: completionPercentage }
            });

        } else {
            return sendError(res, 405, 'Method not allowed');
        }

    } catch (error) {
        console.error('Students API error:', error);
        sendError(res, 500, 'Internal server error');
    }
}