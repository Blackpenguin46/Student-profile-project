const { query } = require('../lib/db');
const { 
    sendError, 
    sendSuccess, 
    setCorsHeaders, 
    authenticateToken 
} = require('../lib/auth');
const { invalidateUserProfile } = require('../lib/redis');

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

        // Validate goal ID
        if (!id || isNaN(parseInt(id))) {
            return sendError(res, 400, 'Invalid goal ID');
        }

        const goalId = parseInt(id);

        // Get goal and check permissions
        const goalResult = await query(
            'SELECT * FROM goals WHERE id = $1',
            [goalId]
        );

        if (goalResult.rows.length === 0) {
            return sendError(res, 404, 'Goal not found');
        }

        const goal = goalResult.rows[0];

        // Check access permissions
        const canAccess = user.role === 'teacher' || 
                         user.role === 'admin' || 
                         user.id === goal.user_id;

        if (!canAccess) {
            return sendError(res, 403, 'Access denied');
        }

        if (req.method === 'GET') {
            // Get goal with user info
            const goalWithUserResult = await query(`
                SELECT g.*, u.first_name, u.last_name, u.email
                FROM goals g
                JOIN users u ON g.user_id = u.id
                WHERE g.id = $1
            `, [goalId]);

            sendSuccess(res, { goal: goalWithUserResult.rows[0] });

        } else if (req.method === 'PUT') {
            // Update goal
            const {
                title,
                description,
                category,
                target_date,
                priority,
                status,
                progress_notes
            } = req.body;

            // Only goal owner or teachers can update
            const canEdit = user.role === 'teacher' || 
                           user.role === 'admin' || 
                           user.id === goal.user_id;

            if (!canEdit) {
                return sendError(res, 403, 'Cannot edit this goal');
            }

            // Validate status if provided
            if (status) {
                const validStatuses = ['active', 'completed', 'paused', 'cancelled'];
                if (!validStatuses.includes(status)) {
                    return sendError(res, 400, 'Invalid status');
                }
            }

            // Validate priority if provided
            if (priority) {
                const validPriorities = ['low', 'medium', 'high', 'urgent'];
                if (!validPriorities.includes(priority)) {
                    return sendError(res, 400, 'Invalid priority');
                }
            }

            // Validate category if provided
            if (category) {
                const validCategories = ['academic', 'career', 'personal', 'skill', 'project'];
                if (!validCategories.includes(category)) {
                    return sendError(res, 400, 'Invalid category');
                }
            }

            // Build update query dynamically
            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (title !== undefined) {
                updates.push(`title = $${paramIndex}`);
                values.push(title);
                paramIndex++;
            }

            if (description !== undefined) {
                updates.push(`description = $${paramIndex}`);
                values.push(description);
                paramIndex++;
            }

            if (category !== undefined) {
                updates.push(`category = $${paramIndex}`);
                values.push(category);
                paramIndex++;
            }

            if (target_date !== undefined) {
                updates.push(`target_date = $${paramIndex}`);
                values.push(target_date);
                paramIndex++;
            }

            if (priority !== undefined) {
                updates.push(`priority = $${paramIndex}`);
                values.push(priority);
                paramIndex++;
            }

            if (status !== undefined) {
                updates.push(`status = $${paramIndex}`);
                values.push(status);
                paramIndex++;

                // Set completion date if completed
                if (status === 'completed') {
                    updates.push(`completed_at = CURRENT_TIMESTAMP`);
                }
            }

            if (progress_notes !== undefined) {
                updates.push(`progress_notes = $${paramIndex}`);
                values.push(progress_notes);
                paramIndex++;
            }

            if (updates.length === 0) {
                return sendError(res, 400, 'No valid fields to update');
            }

            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(goalId);

            const updateQuery = `
                UPDATE goals 
                SET ${updates.join(', ')} 
                WHERE id = $${paramIndex}
                RETURNING *
            `;

            const updatedGoalResult = await query(updateQuery, values);

            // Invalidate user profile cache
            await invalidateUserProfile(goal.user_id);

            sendSuccess(res, {
                message: 'Goal updated successfully',
                goal: updatedGoalResult.rows[0]
            });

        } else if (req.method === 'DELETE') {
            // Delete goal
            const canDelete = user.role === 'teacher' || 
                             user.role === 'admin' || 
                             user.id === goal.user_id;

            if (!canDelete) {
                return sendError(res, 403, 'Cannot delete this goal');
            }

            await query('DELETE FROM goals WHERE id = $1', [goalId]);

            // Invalidate user profile cache
            await invalidateUserProfile(goal.user_id);

            sendSuccess(res, { message: 'Goal deleted successfully' });

        } else {
            return sendError(res, 405, 'Method not allowed');
        }

    } catch (error) {
        console.error('Goal API error:', error);
        sendError(res, 500, 'Internal server error');
    }
}