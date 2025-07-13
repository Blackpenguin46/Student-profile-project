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
        const { id, interest_id } = req.query;

        if (req.method === 'GET') {
            if (id) {
                // Get specific user's interests
                const canAccess = user.role === 'teacher' || user.role === 'admin' || user.id === parseInt(id);
                if (!canAccess) {
                    return sendError(res, 403, 'Access denied');
                }

                const interestsResult = await query(`
                    SELECT 
                        i.id,
                        i.interest_name as name,
                        i.category,
                        i.description,
                        si.interest_level,
                        si.created_at
                    FROM interests i
                    JOIN student_interests si ON i.id = si.interest_id
                    WHERE si.user_id = $1
                    ORDER BY i.category, i.interest_name
                `, [id]);

                sendSuccess(res, { interests: interestsResult.rows });
            } else {
                // Get all available interests
                const interestsResult = await query(`
                    SELECT id, interest_name as name, category, description
                    FROM interests
                    ORDER BY category, interest_name
                `);

                sendSuccess(res, { interests: interestsResult.rows });
            }

        } else if (req.method === 'POST') {
            // Add interest to user
            const { interest_id, interest_level } = req.body;
            const target_user_id = id ? parseInt(id) : user.id;

            // Check if user can add interests for this user
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

            // Check if interest exists
            const interestResult = await query('SELECT id FROM interests WHERE id = $1', [interest_id]);
            if (interestResult.rows.length === 0) {
                return sendError(res, 404, 'Interest not found');
            }

            // Add or update user interest
            const userInterestResult = await query(`
                INSERT INTO student_interests (user_id, interest_id, interest_level)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id, interest_id) 
                DO UPDATE SET 
                    interest_level = $3,
                    created_at = CURRENT_TIMESTAMP
                RETURNING *
            `, [target_user_id, interest_id, interest_level]);

            sendSuccess(res, {
                message: 'Interest added successfully',
                interest: userInterestResult.rows[0]
            });

        } else if (req.method === 'PUT' && interest_id) {
            // Update user interest
            const { interest_level } = req.body;
            const target_user_id = id ? parseInt(id) : user.id;

            const canEdit = user.role === 'teacher' || user.role === 'admin' || user.id === target_user_id;
            if (!canEdit) {
                return sendError(res, 403, 'Cannot update interests for this user');
            }

            if (!interest_level) {
                return sendError(res, 400, 'Interest level is required');
            }

            const validLevels = ['low', 'medium', 'high'];
            if (!validLevels.includes(interest_level)) {
                return sendError(res, 400, 'Invalid interest level');
            }

            const updatedInterestResult = await query(`
                UPDATE student_interests 
                SET interest_level = $1, created_at = CURRENT_TIMESTAMP
                WHERE user_id = $2 AND interest_id = $3
                RETURNING *
            `, [interest_level, target_user_id, interest_id]);

            if (updatedInterestResult.rows.length === 0) {
                return sendError(res, 404, 'User interest not found');
            }

            sendSuccess(res, {
                message: 'Interest updated successfully',
                interest: updatedInterestResult.rows[0]
            });

        } else if (req.method === 'DELETE' && interest_id) {
            // Remove interest from user
            const target_user_id = id ? parseInt(id) : user.id;

            const canDelete = user.role === 'teacher' || user.role === 'admin' || user.id === target_user_id;
            if (!canDelete) {
                return sendError(res, 403, 'Cannot delete interests for this user');
            }

            const deleteResult = await query(
                'DELETE FROM student_interests WHERE user_id = $1 AND interest_id = $2 RETURNING *',
                [target_user_id, interest_id]
            );

            if (deleteResult.rows.length === 0) {
                return sendError(res, 404, 'User interest not found');
            }

            sendSuccess(res, { message: 'Interest removed successfully' });

        } else {
            return sendError(res, 405, 'Method not allowed');
        }

    } catch (error) {
        console.error('Interests API error:', error);
        sendError(res, 500, 'Internal server error');
    }
}