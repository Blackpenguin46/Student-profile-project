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
                // Get specific goal
                const goalResult = await query(`
                    SELECT g.*, u.first_name, u.last_name, u.email
                    FROM goals g
                    JOIN users u ON g.user_id = u.id
                    WHERE g.id = $1
                `, [id]);

                if (goalResult.rows.length === 0) {
                    return sendError(res, 404, 'Goal not found');
                }

                const goal = goalResult.rows[0];
                const canAccess = user.role === 'teacher' || user.role === 'admin' || user.id === goal.user_id;

                if (!canAccess) {
                    return sendError(res, 403, 'Access denied');
                }

                sendSuccess(res, { goal: goalResult.rows[0] });
            } else {
                // List goals
                let goalsQuery;
                let queryParams;

                if (user.role === 'teacher' || user.role === 'admin') {
                    const { student_id } = req.query;
                    
                    if (student_id) {
                        goalsQuery = `
                            SELECT g.*, u.first_name, u.last_name, u.email
                            FROM goals g
                            JOIN users u ON g.user_id = u.id
                            WHERE g.user_id = $1
                            ORDER BY g.priority DESC, g.target_date ASC
                        `;
                        queryParams = [student_id];
                    } else {
                        goalsQuery = `
                            SELECT g.*, u.first_name, u.last_name, u.email
                            FROM goals g
                            JOIN users u ON g.user_id = u.id
                            ORDER BY g.priority DESC, g.target_date ASC
                        `;
                        queryParams = [];
                    }
                } else {
                    goalsQuery = `
                        SELECT * FROM goals
                        WHERE user_id = $1
                        ORDER BY priority DESC, target_date ASC
                    `;
                    queryParams = [user.id];
                }

                const goalsResult = await query(goalsQuery, queryParams);
                sendSuccess(res, { goals: goalsResult.rows });
            }

        } else if (req.method === 'POST') {
            // Create new goal
            const { title, description, category, target_date, priority = 'medium', student_id } = req.body;

            if (!title || !description || !category) {
                return sendError(res, 400, 'Title, description, and category are required');
            }

            let targetUserId = user.id;
            if (student_id && (user.role === 'teacher' || user.role === 'admin')) {
                targetUserId = student_id;
            } else if (student_id && user.role === 'student') {
                return sendError(res, 403, 'Students can only create goals for themselves');
            }

            const validCategories = ['academic', 'career', 'personal', 'skill', 'project'];
            if (!validCategories.includes(category)) {
                return sendError(res, 400, 'Invalid category');
            }

            const goalResult = await query(`
                INSERT INTO goals (user_id, title, description, category, target_date, priority, status, created_by) 
                VALUES ($1, $2, $3, $4, $5, $6, 'active', $7)
                RETURNING *
            `, [targetUserId, title, description, category, target_date, priority, user.id]);

            sendSuccess(res, { message: 'Goal created successfully', goal: goalResult.rows[0] });

        } else if (req.method === 'PUT' && id) {
            // Update goal
            const { title, description, category, target_date, priority, status, progress_notes } = req.body;

            const goalResult = await query('SELECT * FROM goals WHERE id = $1', [id]);
            if (goalResult.rows.length === 0) {
                return sendError(res, 404, 'Goal not found');
            }

            const goal = goalResult.rows[0];
            const canEdit = user.role === 'teacher' || user.role === 'admin' || user.id === goal.user_id;
            if (!canEdit) {
                return sendError(res, 403, 'Cannot edit this goal');
            }

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
            values.push(id);

            const updateQuery = `UPDATE goals SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
            const updatedGoalResult = await query(updateQuery, values);

            sendSuccess(res, { message: 'Goal updated successfully', goal: updatedGoalResult.rows[0] });

        } else if (req.method === 'DELETE' && id) {
            // Delete goal
            const goalResult = await query('SELECT * FROM goals WHERE id = $1', [id]);
            if (goalResult.rows.length === 0) {
                return sendError(res, 404, 'Goal not found');
            }

            const goal = goalResult.rows[0];
            const canDelete = user.role === 'teacher' || user.role === 'admin' || user.id === goal.user_id;
            if (!canDelete) {
                return sendError(res, 403, 'Cannot delete this goal');
            }

            await query('DELETE FROM goals WHERE id = $1', [id]);
            sendSuccess(res, { message: 'Goal deleted successfully' });

        } else {
            return sendError(res, 405, 'Method not allowed');
        }

    } catch (error) {
        console.error('Goals API error:', error);
        sendError(res, 500, 'Internal server error');
    }
}