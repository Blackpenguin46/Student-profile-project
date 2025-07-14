const { query } = require('../lib/db');
const { 
    sendError, 
    sendSuccess, 
    setCorsHeaders, 
    authenticateToken 
} = require('../lib/auth');
const { getCachedUserProfile, cacheUserProfile } = require('../lib/redis');

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
            // Only teachers and admins can list all students
            if (!['teacher', 'admin'].includes(user.role)) {
                return sendError(res, 403, 'Access denied');
            }

            // Get query parameters for filtering/pagination
            const { 
                page = 1, 
                limit = 20, 
                search = '', 
                year_level = '', 
                major = '' 
            } = req.query;

            const offset = (page - 1) * limit;

            // Build query with filters
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

            // Get students with their profiles
            const studentsResult = await query(`
                SELECT 
                    u.id,
                    u.email,
                    u.first_name,
                    u.last_name,
                    u.created_at,
                    sp.student_id_num,
                    sp.year_level,
                    sp.major,
                    sp.profile_completion_percentage,
                    sp.short_term_goals,
                    sp.long_term_goals
                FROM users u
                LEFT JOIN student_profiles sp ON u.id = sp.user_id
                ${whereClause}
                AND u.role = 'student'
                ORDER BY u.last_name, u.first_name
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `, [...queryParams, limit, offset]);

            // Get total count for pagination
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

        } else {
            return sendError(res, 405, 'Method not allowed');
        }

    } catch (error) {
        console.error('Students API error:', error);
        sendError(res, 500, 'Internal server error');
    }
}