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
        const { id, activity_id } = req.query;

        if (req.method === 'GET') {
            if (activity_id) {
                // Get specific activity
                const activityResult = await query(`
                    SELECT a.*, u.first_name, u.last_name
                    FROM activities a
                    JOIN users u ON a.user_id = u.id
                    WHERE a.id = $1
                `, [activity_id]);

                if (activityResult.rows.length === 0) {
                    return sendError(res, 404, 'Activity not found');
                }

                const activity = activityResult.rows[0];
                const canAccess = user.role === 'teacher' || user.role === 'admin' || user.id === activity.user_id;

                if (!canAccess) {
                    return sendError(res, 403, 'Access denied');
                }

                sendSuccess(res, { activity: activityResult.rows[0] });

            } else if (id) {
                // Get specific user's activities
                const canAccess = user.role === 'teacher' || user.role === 'admin' || user.id === parseInt(id);
                if (!canAccess) {
                    return sendError(res, 403, 'Access denied');
                }

                const activitiesResult = await query(`
                    SELECT 
                        id, title, description, category, start_date, end_date, 
                        hours, organization, position, achievements, is_current, 
                        created_at, updated_at
                    FROM activities
                    WHERE user_id = $1
                    ORDER BY start_date DESC, created_at DESC
                `, [id]);

                sendSuccess(res, { activities: activitiesResult.rows });

            } else {
                // Get current user's activities
                const activitiesResult = await query(`
                    SELECT 
                        id, title, description, category, start_date, end_date, 
                        hours, organization, position, achievements, is_current, 
                        created_at, updated_at
                    FROM activities
                    WHERE user_id = $1
                    ORDER BY start_date DESC, created_at DESC
                `, [user.id]);

                sendSuccess(res, { activities: activitiesResult.rows });
            }

        } else if (req.method === 'POST') {
            // Create new activity
            const {
                title, description, category, start_date, end_date, hours = 0,
                organization, position, achievements, is_current = false
            } = req.body;

            const target_user_id = id ? parseInt(id) : user.id;

            // Check if user can create activities for this user
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

            // Validate dates
            if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
                return sendError(res, 400, 'Start date cannot be after end date');
            }

            const activityResult = await query(`
                INSERT INTO activities (
                    user_id, title, description, category, start_date, end_date, 
                    hours, organization, position, achievements, is_current
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `, [
                target_user_id, title, description, category, start_date, end_date,
                hours, organization, position, achievements, is_current
            ]);

            sendSuccess(res, {
                message: 'Activity created successfully',
                activity: activityResult.rows[0]
            });

        } else if (req.method === 'PUT' && activity_id) {
            // Update activity
            const {
                title, description, category, start_date, end_date, hours,
                organization, position, achievements, is_current
            } = req.body;

            // Get activity to check ownership
            const activityResult = await query('SELECT * FROM activities WHERE id = $1', [activity_id]);
            if (activityResult.rows.length === 0) {
                return sendError(res, 404, 'Activity not found');
            }

            const activity = activityResult.rows[0];
            const canEdit = user.role === 'teacher' || user.role === 'admin' || user.id === activity.user_id;
            if (!canEdit) {
                return sendError(res, 403, 'Cannot edit this activity');
            }

            // Validate category if provided
            if (category) {
                const validCategories = ['academic', 'sports', 'volunteer', 'work', 'creative', 'leadership', 'other'];
                if (!validCategories.includes(category)) {
                    return sendError(res, 400, 'Invalid category');
                }
            }

            // Validate dates if provided
            const newStartDate = start_date || activity.start_date;
            const newEndDate = end_date || activity.end_date;
            if (newStartDate && newEndDate && new Date(newStartDate) > new Date(newEndDate)) {
                return sendError(res, 400, 'Start date cannot be after end date');
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
            if (start_date !== undefined) {
                updates.push(`start_date = $${paramIndex}`);
                values.push(start_date);
                paramIndex++;
            }
            if (end_date !== undefined) {
                updates.push(`end_date = $${paramIndex}`);
                values.push(end_date);
                paramIndex++;
            }
            if (hours !== undefined) {
                updates.push(`hours = $${paramIndex}`);
                values.push(hours);
                paramIndex++;
            }
            if (organization !== undefined) {
                updates.push(`organization = $${paramIndex}`);
                values.push(organization);
                paramIndex++;
            }
            if (position !== undefined) {
                updates.push(`position = $${paramIndex}`);
                values.push(position);
                paramIndex++;
            }
            if (achievements !== undefined) {
                updates.push(`achievements = $${paramIndex}`);
                values.push(achievements);
                paramIndex++;
            }
            if (is_current !== undefined) {
                updates.push(`is_current = $${paramIndex}`);
                values.push(is_current);
                paramIndex++;
            }

            if (updates.length === 0) {
                return sendError(res, 400, 'No valid fields to update');
            }

            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(activity_id);

            const updateQuery = `
                UPDATE activities 
                SET ${updates.join(', ')} 
                WHERE id = $${paramIndex}
                RETURNING *
            `;

            const updatedActivityResult = await query(updateQuery, values);

            sendSuccess(res, {
                message: 'Activity updated successfully',
                activity: updatedActivityResult.rows[0]
            });

        } else if (req.method === 'DELETE' && activity_id) {
            // Delete activity
            const activityResult = await query('SELECT * FROM activities WHERE id = $1', [activity_id]);
            if (activityResult.rows.length === 0) {
                return sendError(res, 404, 'Activity not found');
            }

            const activity = activityResult.rows[0];
            const canDelete = user.role === 'teacher' || user.role === 'admin' || user.id === activity.user_id;
            if (!canDelete) {
                return sendError(res, 403, 'Cannot delete this activity');
            }

            await query('DELETE FROM activities WHERE id = $1', [activity_id]);

            sendSuccess(res, { message: 'Activity deleted successfully' });

        } else {
            return sendError(res, 405, 'Method not allowed');
        }

    } catch (error) {
        console.error('Activities API error:', error);
        sendError(res, 500, 'Internal server error');
    }
}