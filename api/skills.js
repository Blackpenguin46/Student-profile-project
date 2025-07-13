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
        const { id, skill_id } = req.query;

        if (req.method === 'GET') {
            if (id) {
                // Get specific user's skills
                const canAccess = user.role === 'teacher' || user.role === 'admin' || user.id === parseInt(id);
                if (!canAccess) {
                    return sendError(res, 403, 'Access denied');
                }

                const skillsResult = await query(`
                    SELECT 
                        s.id,
                        s.skill_name as name,
                        s.category,
                        s.description,
                        ss.proficiency_level,
                        ss.years_experience,
                        ss.verified,
                        ss.created_at
                    FROM skills s
                    JOIN student_skills ss ON s.id = ss.skill_id
                    WHERE ss.user_id = $1
                    ORDER BY s.category, s.skill_name
                `, [id]);

                sendSuccess(res, { skills: skillsResult.rows });
            } else {
                // Get all available skills
                const skillsResult = await query(`
                    SELECT id, skill_name as name, category, description
                    FROM skills
                    ORDER BY category, skill_name
                `);

                sendSuccess(res, { skills: skillsResult.rows });
            }

        } else if (req.method === 'POST') {
            // Add skill to user
            const { skill_id, proficiency_level, years_experience = 0 } = req.body;
            const target_user_id = id ? parseInt(id) : user.id;

            // Check if user can add skills for this user
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

            // Check if skill exists
            const skillResult = await query('SELECT id FROM skills WHERE id = $1', [skill_id]);
            if (skillResult.rows.length === 0) {
                return sendError(res, 404, 'Skill not found');
            }

            // Add or update user skill
            const userSkillResult = await query(`
                INSERT INTO student_skills (user_id, skill_id, proficiency_level, years_experience)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id, skill_id) 
                DO UPDATE SET 
                    proficiency_level = $3,
                    years_experience = $4,
                    created_at = CURRENT_TIMESTAMP
                RETURNING *
            `, [target_user_id, skill_id, proficiency_level, years_experience]);

            sendSuccess(res, {
                message: 'Skill added successfully',
                skill: userSkillResult.rows[0]
            });

        } else if (req.method === 'PUT' && skill_id) {
            // Update user skill
            const { proficiency_level, years_experience, verified } = req.body;
            const target_user_id = id ? parseInt(id) : user.id;

            const canEdit = user.role === 'teacher' || user.role === 'admin' || user.id === target_user_id;
            if (!canEdit) {
                return sendError(res, 403, 'Cannot update skills for this user');
            }

            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (proficiency_level !== undefined) {
                const validProficiency = ['beginner', 'intermediate', 'advanced', 'expert'];
                if (!validProficiency.includes(proficiency_level)) {
                    return sendError(res, 400, 'Invalid proficiency level');
                }
                updates.push(`proficiency_level = $${paramIndex}`);
                values.push(proficiency_level);
                paramIndex++;
            }

            if (years_experience !== undefined) {
                updates.push(`years_experience = $${paramIndex}`);
                values.push(years_experience);
                paramIndex++;
            }

            if (verified !== undefined && (user.role === 'teacher' || user.role === 'admin')) {
                updates.push(`verified = $${paramIndex}`);
                values.push(verified);
                paramIndex++;
            }

            if (updates.length === 0) {
                return sendError(res, 400, 'No valid fields to update');
            }

            values.push(target_user_id, skill_id);

            const updateQuery = `
                UPDATE student_skills 
                SET ${updates.join(', ')}, created_at = CURRENT_TIMESTAMP
                WHERE user_id = $${paramIndex} AND skill_id = $${paramIndex + 1}
                RETURNING *
            `;

            const updatedSkillResult = await query(updateQuery, values);

            if (updatedSkillResult.rows.length === 0) {
                return sendError(res, 404, 'User skill not found');
            }

            sendSuccess(res, {
                message: 'Skill updated successfully',
                skill: updatedSkillResult.rows[0]
            });

        } else if (req.method === 'DELETE' && skill_id) {
            // Remove skill from user
            const target_user_id = id ? parseInt(id) : user.id;

            const canDelete = user.role === 'teacher' || user.role === 'admin' || user.id === target_user_id;
            if (!canDelete) {
                return sendError(res, 403, 'Cannot delete skills for this user');
            }

            const deleteResult = await query(
                'DELETE FROM student_skills WHERE user_id = $1 AND skill_id = $2 RETURNING *',
                [target_user_id, skill_id]
            );

            if (deleteResult.rows.length === 0) {
                return sendError(res, 404, 'User skill not found');
            }

            sendSuccess(res, { message: 'Skill removed successfully' });

        } else {
            return sendError(res, 405, 'Method not allowed');
        }

    } catch (error) {
        console.error('Skills API error:', error);
        sendError(res, 500, 'Internal server error');
    }
}