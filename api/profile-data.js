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
        const { type, id, item_id } = req.query;

        // Route based on type
        if (type === 'skills') {
            return await handleSkills(req, res, user, { id, item_id });
        } else if (type === 'interests') {
            return await handleInterests(req, res, user, { id, item_id });
        } else if (type === 'activities') {
            return await handleActivities(req, res, user, { id, item_id });
        } else {
            return sendError(res, 400, 'Invalid type. Use: skills, interests, or activities');
        }

    } catch (error) {
        console.error('Profile data API error:', error);
        sendError(res, 500, 'Internal server error');
    }
}

// Skills handler
async function handleSkills(req, res, user, { id, item_id }) {
    if (req.method === 'GET') {
        if (id) {
            // Get specific user's skills
            const canAccess = user.role === 'teacher' || user.role === 'admin' || user.id === parseInt(id);
            if (!canAccess) {
                return sendError(res, 403, 'Access denied');
            }

            const skillsResult = await query(`
                SELECT s.id, s.skill_name as name, s.category, s.description,
                       ss.proficiency_level, ss.years_experience, ss.verified, ss.created_at
                FROM skills s
                JOIN student_skills ss ON s.id = ss.skill_id
                WHERE ss.user_id = $1
                ORDER BY s.category, s.skill_name
            `, [id]);

            return sendSuccess(res, { skills: skillsResult.rows });
        } else {
            // Get all available skills
            const skillsResult = await query(`
                SELECT id, skill_name as name, category, description
                FROM skills ORDER BY category, skill_name
            `);
            return sendSuccess(res, { skills: skillsResult.rows });
        }
    } else if (req.method === 'POST') {
        // Add skill to user
        const { skill_id, proficiency_level, years_experience = 0 } = req.body;
        const target_user_id = id ? parseInt(id) : user.id;

        const canEdit = user.role === 'teacher' || user.role === 'admin' || user.id === target_user_id;
        if (!canEdit) {
            return sendError(res, 403, 'Cannot add skills for this user');
        }

        if (!skill_id || !proficiency_level) {
            return sendError(res, 400, 'Skill ID and proficiency level are required');
        }

        const validProficiency = ['beginner', 'intermediate', 'advanced', 'expert'];
        if (!validProficiency.includes(proficiency_level)) {
            return sendError(res, 400, 'Invalid proficiency level');
        }

        const userSkillResult = await query(`
            INSERT INTO student_skills (user_id, skill_id, proficiency_level, years_experience)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, skill_id) 
            DO UPDATE SET proficiency_level = $3, years_experience = $4, created_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [target_user_id, skill_id, proficiency_level, years_experience]);

        return sendSuccess(res, { message: 'Skill added successfully', skill: userSkillResult.rows[0] });
    } else if (req.method === 'DELETE' && item_id) {
        // Remove skill from user
        const target_user_id = id ? parseInt(id) : user.id;
        const canDelete = user.role === 'teacher' || user.role === 'admin' || user.id === target_user_id;
        if (!canDelete) {
            return sendError(res, 403, 'Cannot delete skills for this user');
        }

        const deleteResult = await query(
            'DELETE FROM student_skills WHERE user_id = $1 AND skill_id = $2 RETURNING *',
            [target_user_id, item_id]
        );

        if (deleteResult.rows.length === 0) {
            return sendError(res, 404, 'User skill not found');
        }

        return sendSuccess(res, { message: 'Skill removed successfully' });
    }
}

// Interests handler
async function handleInterests(req, res, user, { id, item_id }) {
    if (req.method === 'GET') {
        if (id) {
            // Get specific user's interests
            const canAccess = user.role === 'teacher' || user.role === 'admin' || user.id === parseInt(id);
            if (!canAccess) {
                return sendError(res, 403, 'Access denied');
            }

            const interestsResult = await query(`
                SELECT i.id, i.interest_name as name, i.category, i.description,
                       si.interest_level, si.created_at
                FROM interests i
                JOIN student_interests si ON i.id = si.interest_id
                WHERE si.user_id = $1
                ORDER BY i.category, i.interest_name
            `, [id]);

            return sendSuccess(res, { interests: interestsResult.rows });
        } else {
            // Get all available interests
            const interestsResult = await query(`
                SELECT id, interest_name as name, category, description
                FROM interests ORDER BY category, interest_name
            `);
            return sendSuccess(res, { interests: interestsResult.rows });
        }
    } else if (req.method === 'POST') {
        // Add interest to user
        const { interest_id, interest_level } = req.body;
        const target_user_id = id ? parseInt(id) : user.id;

        const canEdit = user.role === 'teacher' || user.role === 'admin' || user.id === target_user_id;
        if (!canEdit) {
            return sendError(res, 403, 'Cannot add interests for this user');
        }

        if (!interest_id || !interest_level) {
            return sendError(res, 400, 'Interest ID and interest level are required');
        }

        const validLevels = ['low', 'medium', 'high'];
        if (!validLevels.includes(interest_level)) {
            return sendError(res, 400, 'Invalid interest level');
        }

        const userInterestResult = await query(`
            INSERT INTO student_interests (user_id, interest_id, interest_level)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, interest_id) 
            DO UPDATE SET interest_level = $3, created_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [target_user_id, interest_id, interest_level]);

        return sendSuccess(res, { message: 'Interest added successfully', interest: userInterestResult.rows[0] });
    } else if (req.method === 'DELETE' && item_id) {
        // Remove interest from user
        const target_user_id = id ? parseInt(id) : user.id;
        const canDelete = user.role === 'teacher' || user.role === 'admin' || user.id === target_user_id;
        if (!canDelete) {
            return sendError(res, 403, 'Cannot delete interests for this user');
        }

        const deleteResult = await query(
            'DELETE FROM student_interests WHERE user_id = $1 AND interest_id = $2 RETURNING *',
            [target_user_id, item_id]
        );

        if (deleteResult.rows.length === 0) {
            return sendError(res, 404, 'User interest not found');
        }

        return sendSuccess(res, { message: 'Interest removed successfully' });
    }
}

// Activities handler  
async function handleActivities(req, res, user, { id, item_id }) {
    if (req.method === 'GET') {
        if (item_id) {
            // Get specific activity
            const activityResult = await query(`
                SELECT a.*, u.first_name, u.last_name
                FROM activities a
                JOIN users u ON a.user_id = u.id
                WHERE a.id = $1
            `, [item_id]);

            if (activityResult.rows.length === 0) {
                return sendError(res, 404, 'Activity not found');
            }

            const activity = activityResult.rows[0];
            const canAccess = user.role === 'teacher' || user.role === 'admin' || user.id === activity.user_id;
            if (!canAccess) {
                return sendError(res, 403, 'Access denied');
            }

            return sendSuccess(res, { activity: activityResult.rows[0] });
        } else {
            // Get user's activities
            const target_user_id = id ? parseInt(id) : user.id;
            const canAccess = user.role === 'teacher' || user.role === 'admin' || user.id === target_user_id;
            if (!canAccess) {
                return sendError(res, 403, 'Access denied');
            }

            const activitiesResult = await query(`
                SELECT id, title, description, category, start_date, end_date, 
                       hours, organization, position, achievements, is_current, 
                       created_at, updated_at
                FROM activities
                WHERE user_id = $1
                ORDER BY start_date DESC, created_at DESC
            `, [target_user_id]);

            return sendSuccess(res, { activities: activitiesResult.rows });
        }
    } else if (req.method === 'POST') {
        // Create new activity
        const { title, description, category, start_date, end_date, hours = 0,
                organization, position, achievements, is_current = false } = req.body;

        const target_user_id = id ? parseInt(id) : user.id;
        const canCreate = user.role === 'teacher' || user.role === 'admin' || user.id === target_user_id;
        if (!canCreate) {
            return sendError(res, 403, 'Cannot create activities for this user');
        }

        if (!title || !category) {
            return sendError(res, 400, 'Title and category are required');
        }

        const validCategories = ['academic', 'sports', 'volunteer', 'work', 'creative', 'leadership', 'other'];
        if (!validCategories.includes(category)) {
            return sendError(res, 400, 'Invalid category');
        }

        const activityResult = await query(`
            INSERT INTO activities (
                user_id, title, description, category, start_date, end_date, 
                hours, organization, position, achievements, is_current
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [target_user_id, title, description, category, start_date, end_date,
            hours, organization, position, achievements, is_current]);

        return sendSuccess(res, { message: 'Activity created successfully', activity: activityResult.rows[0] });
    } else if (req.method === 'DELETE' && item_id) {
        // Delete activity
        const activityResult = await query('SELECT * FROM activities WHERE id = $1', [item_id]);
        if (activityResult.rows.length === 0) {
            return sendError(res, 404, 'Activity not found');
        }

        const activity = activityResult.rows[0];
        const canDelete = user.role === 'teacher' || user.role === 'admin' || user.id === activity.user_id;
        if (!canDelete) {
            return sendError(res, 403, 'Cannot delete this activity');
        }

        await query('DELETE FROM activities WHERE id = $1', [item_id]);
        return sendSuccess(res, { message: 'Activity deleted successfully' });
    }
}