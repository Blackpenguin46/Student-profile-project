const { query } = require('../lib/db');
const { 
    extractUser, 
    sendError, 
    sendSuccess,
    setCorsHeaders
} = require('../lib/auth');

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return sendError(res, 405, 'Method not allowed');
    }

    try {
        const decoded = extractUser(req);
        if (!decoded) {
            return sendError(res, 401, 'Authentication required');
        }

        // Get user details
        const userResult = await query(
            `SELECT id, email, role, first_name, last_name, is_active, created_at
             FROM users WHERE id = $1`,
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return sendError(res, 401, 'User not found');
        }

        const user = userResult.rows[0];

        if (!user.is_active) {
            return sendError(res, 401, 'Account is deactivated');
        }

        // Get additional profile data for students
        let profileData = null;
        if (user.role === 'student') {
            const profileResult = await query(
                `SELECT * FROM student_profiles WHERE user_id = $1`,
                [user.id]
            );
            if (profileResult.rows.length > 0) {
                profileData = profileResult.rows[0];

                // Get skills
                const skillsResult = await query(
                    `SELECT s.skill_name, ss.proficiency_level, s.category 
                     FROM student_skills ss 
                     JOIN skills s ON ss.skill_id = s.id 
                     WHERE ss.student_id = $1`,
                    [user.id]
                );

                // Get interests
                const interestsResult = await query(
                    `SELECT i.interest_name 
                     FROM student_interests si 
                     JOIN interests i ON si.interest_id = i.id 
                     WHERE si.student_id = $1`,
                    [user.id]
                );

                profileData.technical_skills = skillsResult.rows.filter(s => s.category === 'technical');
                profileData.soft_skills = skillsResult.rows.filter(s => s.category === 'soft');
                profileData.interests = interestsResult.rows.map(i => i.interest_name);
            }
        }

        sendSuccess(res, {
            authenticated: true,
            user: {
                ...user,
                profile: profileData
            }
        }, 'User authenticated');

    } catch (error) {
        console.error('Authentication check error:', error);
        sendError(res, 500, 'Authentication check failed');
    }
}