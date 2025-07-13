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

        if (req.method === 'GET') {
            // Get user's goals or all goals for teachers
            let goalsQuery;
            let queryParams;

            if (user.role === 'teacher' || user.role === 'admin') {
                const { student_id } = req.query;
                
                if (student_id) {
                    // Get specific student's goals
                    goalsQuery = `
                        SELECT g.*, u.first_name, u.last_name, u.email
                        FROM goals g
                        JOIN users u ON g.user_id = u.id
                        WHERE g.user_id = $1
                        ORDER BY g.priority DESC, g.target_date ASC
                    `;
                    queryParams = [student_id];
                } else {
                    // Get all students' goals
                    goalsQuery = `
                        SELECT g.*, u.first_name, u.last_name, u.email
                        FROM goals g
                        JOIN users u ON g.user_id = u.id
                        ORDER BY g.priority DESC, g.target_date ASC
                    `;
                    queryParams = [];
                }
            } else {
                // Students can only see their own goals
                goalsQuery = `
                    SELECT * FROM goals
                    WHERE user_id = $1
                    ORDER BY priority DESC, target_date ASC
                `;
                queryParams = [user.id];
            }

            const goalsResult = await query(goalsQuery, queryParams);

            sendSuccess(res, { goals: goalsResult.rows });

        } else if (req.method === 'POST') {
            // Create new goal
            const {
                title,
                description,
                category,
                target_date,
                priority = 'medium',
                student_id
            } = req.body;

            // Validation
            if (!title || !description || !category) {
                return sendError(res, 400, 'Title, description, and category are required');
            }

            // Determine target user
            let targetUserId = user.id;
            
            if (student_id && (user.role === 'teacher' || user.role === 'admin')) {
                // Teachers can create goals for students
                targetUserId = student_id;
            } else if (student_id && user.role === 'student') {
                return sendError(res, 403, 'Students can only create goals for themselves');
            }

            // Validate category
            const validCategories = ['academic', 'career', 'personal', 'skill', 'project'];
            if (!validCategories.includes(category)) {
                return sendError(res, 400, 'Invalid category');
            }

            // Validate priority
            const validPriorities = ['low', 'medium', 'high', 'urgent'];
            if (!validPriorities.includes(priority)) {
                return sendError(res, 400, 'Invalid priority');
            }

            const goalResult = await query(`
                INSERT INTO goals (
                    user_id, title, description, category, target_date, priority, status, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, 'active', $7)
                RETURNING *
            `, [targetUserId, title, description, category, target_date, priority, user.id]);

            // Invalidate user profile cache
            await invalidateUserProfile(targetUserId);

            sendSuccess(res, {
                message: 'Goal created successfully',
                goal: goalResult.rows[0]
            });

        } else {
            return sendError(res, 405, 'Method not allowed');
        }

    } catch (error) {
        console.error('Goals API error:', error);
        sendError(res, 500, 'Internal server error');
    }
}