const { query, getClient } = require('../lib/db');
const { 
    extractUser, 
    sendError, 
    sendSuccess,
    setCorsHeaders,
    validateEmail,
    validateName
} = require('../lib/auth');

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        return res.status(200).end();
    }

    const decoded = extractUser(req);
    if (!decoded) {
        return sendError(res, 401, 'Authentication required');
    }

    if (req.method === 'GET') {
        return handleGetProfile(req, res, decoded);
    } else if (req.method === 'PUT') {
        return handleUpdateProfile(req, res, decoded);
    } else {
        return sendError(res, 405, 'Method not allowed');
    }
}

async function handleGetProfile(req, res, decoded) {
    try {
        // Get user basic info
        const userResult = await query(
            'SELECT id, first_name, last_name, email, role, phone, created_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return sendError(res, 404, 'User not found');
        }

        const user = userResult.rows[0];

        // Get detailed profile if student
        if (user.role === 'student') {
            const profileResult = await query(
                'SELECT * FROM student_profiles WHERE user_id = $1',
                [decoded.userId]
            );

            if (profileResult.rows.length > 0) {
                const profile = profileResult.rows[0];

                // Get skills
                const skillsResult = await query(
                    `SELECT s.skill_name, ss.proficiency_level, s.category 
                     FROM student_skills ss 
                     JOIN skills s ON ss.skill_id = s.id 
                     WHERE ss.student_id = $1`,
                    [decoded.userId]
                );

                // Get interests
                const interestsResult = await query(
                    `SELECT i.interest_name 
                     FROM student_interests si 
                     JOIN interests i ON si.interest_id = i.id 
                     WHERE si.student_id = $1`,
                    [decoded.userId]
                );

                user.profile = {
                    ...profile,
                    technical_skills: skillsResult.rows
                        .filter(s => s.category === 'technical')
                        .map(s => ({ name: s.skill_name, proficiency: s.proficiency_level })),
                    soft_skills: skillsResult.rows
                        .filter(s => s.category === 'soft')
                        .map(s => ({ name: s.skill_name, proficiency: s.proficiency_level })),
                    interests: interestsResult.rows.map(i => i.interest_name)
                };
            }
        }

        sendSuccess(res, { user });

    } catch (error) {
        console.error('Get profile error:', error);
        sendError(res, 500, 'Failed to retrieve profile');
    }
}

async function handleUpdateProfile(req, res, decoded) {
    const client = await getClient();

    try {
        await client.query('BEGIN');

        const {
            first_name, last_name, email, phone, date_of_birth,
            year_level, major, short_term_goals, long_term_goals,
            career_aspirations, bio, linkedin_url, portfolio_url,
            github_url, technical_skills, soft_skills, interests,
            extracurricular_activities, hobbies, languages
        } = req.body;

        // Validation
        if (!validateEmail(email)) {
            return sendError(res, 400, 'Invalid email format');
        }

        if (!validateName(first_name)) {
            return sendError(res, 400, 'Invalid first name');
        }

        if (!validateName(last_name)) {
            return sendError(res, 400, 'Invalid last name');
        }

        // Update basic user info
        await client.query(
            `UPDATE users SET 
             first_name = $1, last_name = $2, email = $3, 
             phone = $4, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $5`,
            [first_name, last_name, email, phone, decoded.userId]
        );

        // Update or create student profile
        if (decoded.role === 'student') {
            // Check if profile exists
            const existingProfile = await client.query(
                'SELECT user_id FROM student_profiles WHERE user_id = $1',
                [decoded.userId]
            );

            const profileData = [
                year_level, major, short_term_goals, long_term_goals,
                career_aspirations, bio, linkedin_url, portfolio_url,
                github_url, date_of_birth,
                JSON.stringify(extracurricular_activities || []),
                JSON.stringify(hobbies || []),
                JSON.stringify(languages || [])
            ];

            if (existingProfile.rows.length > 0) {
                // Update existing profile
                await client.query(
                    `UPDATE student_profiles SET 
                     year_level = $1, major = $2, short_term_goals = $3, long_term_goals = $4,
                     career_aspirations = $5, bio = $6, linkedin_url = $7, portfolio_url = $8,
                     github_url = $9, date_of_birth = $10, extracurricular_activities = $11,
                     hobbies = $12, languages = $13, updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $14`,
                    [...profileData, decoded.userId]
                );
            } else {
                // Create new profile
                await client.query(
                    `INSERT INTO student_profiles 
                     (user_id, year_level, major, short_term_goals, long_term_goals,
                      career_aspirations, bio, linkedin_url, portfolio_url, github_url,
                      date_of_birth, extracurricular_activities, hobbies, languages) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                    [decoded.userId, ...profileData]
                );
            }

            // Update skills
            if (technical_skills || soft_skills) {
                // Remove existing skills
                await client.query(
                    'DELETE FROM student_skills WHERE student_id = $1',
                    [decoded.userId]
                );

                // Add technical skills
                if (technical_skills && technical_skills.length > 0) {
                    for (const skill of technical_skills) {
                        // Insert or get skill
                        await client.query(
                            'INSERT INTO skills (skill_name, category) VALUES ($1, $2) ON CONFLICT (skill_name) DO NOTHING',
                            [skill.name, 'technical']
                        );

                        const skillResult = await client.query(
                            'SELECT id FROM skills WHERE skill_name = $1 AND category = $2',
                            [skill.name, 'technical']
                        );

                        if (skillResult.rows.length > 0) {
                            await client.query(
                                'INSERT INTO student_skills (student_id, skill_id, proficiency_level) VALUES ($1, $2, $3)',
                                [decoded.userId, skillResult.rows[0].id, skill.proficiency]
                            );
                        }
                    }
                }

                // Add soft skills
                if (soft_skills && soft_skills.length > 0) {
                    for (const skill of soft_skills) {
                        // Insert or get skill
                        await client.query(
                            'INSERT INTO skills (skill_name, category) VALUES ($1, $2) ON CONFLICT (skill_name) DO NOTHING',
                            [skill.name, 'soft']
                        );

                        const skillResult = await client.query(
                            'SELECT id FROM skills WHERE skill_name = $1 AND category = $2',
                            [skill.name, 'soft']
                        );

                        if (skillResult.rows.length > 0) {
                            await client.query(
                                'INSERT INTO student_skills (student_id, skill_id, proficiency_level) VALUES ($1, $2, $3)',
                                [decoded.userId, skillResult.rows[0].id, skill.proficiency]
                            );
                        }
                    }
                }
            }

            // Update interests
            if (interests) {
                // Remove existing interests
                await client.query(
                    'DELETE FROM student_interests WHERE student_id = $1',
                    [decoded.userId]
                );

                // Add new interests
                for (const interest of interests) {
                    // Insert or get interest
                    await client.query(
                        'INSERT INTO interests (interest_name) VALUES ($1) ON CONFLICT (interest_name) DO NOTHING',
                        [interest]
                    );

                    const interestResult = await client.query(
                        'SELECT id FROM interests WHERE interest_name = $1',
                        [interest]
                    );

                    if (interestResult.rows.length > 0) {
                        await client.query(
                            'INSERT INTO student_interests (student_id, interest_id) VALUES ($1, $2)',
                            [decoded.userId, interestResult.rows[0].id]
                        );
                    }
                }
            }

            // Calculate and update profile completion
            const completionPercentage = calculateProfileCompletion({
                first_name, last_name, email, year_level, major,
                short_term_goals, long_term_goals, bio,
                technical_skills, soft_skills, interests
            });

            await client.query(
                'UPDATE student_profiles SET profile_completion_percentage = $1 WHERE user_id = $2',
                [completionPercentage, decoded.userId]
            );
        }

        await client.query('COMMIT');

        // Get updated user data
        const updatedUser = await client.query(
            'SELECT id, first_name, last_name, email, role FROM users WHERE id = $1',
            [decoded.userId]
        );

        // Log activity
        await query(
            `INSERT INTO activity_logs (user_id, action, details) 
             VALUES ($1, $2, $3)`,
            [decoded.userId, 'profile_update', { completion_percentage: decoded.role === 'student' ? completionPercentage : null }]
        );

        sendSuccess(res, {
            user: updatedUser.rows[0]
        }, 'Profile updated successfully');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update profile error:', error);
        sendError(res, 500, 'Failed to update profile');
    } finally {
        client.release();
    }
}

// Helper function to calculate profile completion
function calculateProfileCompletion(data) {
    const requiredFields = [
        data.first_name, data.last_name, data.email,
        data.year_level, data.major, data.short_term_goals,
        data.long_term_goals, data.bio
    ];

    const completedFields = requiredFields.filter(field => field && field.trim()).length;
    const basePercentage = (completedFields / requiredFields.length) * 80;

    const skillsBonus = (data.technical_skills?.length > 0 || data.soft_skills?.length > 0) ? 10 : 0;
    const interestsBonus = (data.interests?.length > 0) ? 10 : 0;

    return Math.min(Math.round(basePercentage + skillsBonus + interestsBonus), 100);
}