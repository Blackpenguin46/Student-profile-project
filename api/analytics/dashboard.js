const { query } = require('../lib/db');
const { 
    sendError, 
    sendSuccess, 
    setCorsHeaders, 
    authenticateToken 
} = require('../lib/auth');
const { get, set } = require('../lib/redis');

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        return res.status(200).end();
    }

    setCorsHeaders(res);

    if (req.method !== 'GET') {
        return sendError(res, 405, 'Method not allowed');
    }

    try {
        // Authenticate user
        const authResult = await authenticateToken(req);
        if (!authResult.success) {
            return sendError(res, 401, authResult.message);
        }

        const { user } = authResult;

        // Only teachers and admins can access analytics
        if (!['teacher', 'admin'].includes(user.role)) {
            return sendError(res, 403, 'Access denied');
        }

        // Try to get cached analytics first
        const cacheKey = `analytics:dashboard:${user.role}`;
        const cached = await get(cacheKey);
        if (cached) {
            return sendSuccess(res, JSON.parse(cached));
        }

        // Get basic statistics
        const [
            totalStudentsResult,
            activeGoalsResult,
            completedGoalsResult,
            totalFilesResult,
            recentActivityResult,
            profileCompletionResult,
            goalsCategoryResult,
            skillsDistributionResult
        ] = await Promise.all([
            // Total students
            query(`
                SELECT COUNT(*) as total 
                FROM users 
                WHERE role = 'student' AND is_active = true
            `),

            // Active goals
            query(`
                SELECT COUNT(*) as total 
                FROM goals g
                JOIN users u ON g.user_id = u.id
                WHERE g.status = 'active' AND u.role = 'student'
            `),

            // Completed goals
            query(`
                SELECT COUNT(*) as total 
                FROM goals g
                JOIN users u ON g.user_id = u.id
                WHERE g.status = 'completed' AND u.role = 'student'
            `),

            // Total files uploaded
            query(`
                SELECT COUNT(*) as total, SUM(file_size) as total_size
                FROM uploaded_files uf
                JOIN users u ON uf.user_id = u.id
                WHERE u.role = 'student'
            `),

            // Recent activity (last 7 days)
            query(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as activity_count
                FROM activity_logs al
                JOIN users u ON al.user_id = u.id
                WHERE al.created_at >= CURRENT_DATE - INTERVAL '7 days'
                AND u.role = 'student'
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `),

            // Profile completion distribution
            query(`
                SELECT 
                    CASE 
                        WHEN profile_completion_percentage = 0 THEN 'Not Started'
                        WHEN profile_completion_percentage < 25 THEN 'Just Started'
                        WHEN profile_completion_percentage < 50 THEN 'In Progress'
                        WHEN profile_completion_percentage < 75 THEN 'Nearly Complete'
                        WHEN profile_completion_percentage < 100 THEN 'Almost Done'
                        ELSE 'Complete'
                    END as completion_level,
                    COUNT(*) as student_count
                FROM student_profiles sp
                JOIN users u ON sp.user_id = u.id
                WHERE u.role = 'student' AND u.is_active = true
                GROUP BY 
                    CASE 
                        WHEN profile_completion_percentage = 0 THEN 'Not Started'
                        WHEN profile_completion_percentage < 25 THEN 'Just Started'
                        WHEN profile_completion_percentage < 50 THEN 'In Progress'
                        WHEN profile_completion_percentage < 75 THEN 'Nearly Complete'
                        WHEN profile_completion_percentage < 100 THEN 'Almost Done'
                        ELSE 'Complete'
                    END
                ORDER BY MIN(profile_completion_percentage)
            `),

            // Goals by category
            query(`
                SELECT 
                    category,
                    COUNT(*) as goal_count,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
                FROM goals g
                JOIN users u ON g.user_id = u.id
                WHERE u.role = 'student'
                GROUP BY category
                ORDER BY goal_count DESC
            `),

            // Top skills
            query(`
                SELECT 
                    s.name,
                    s.category,
                    COUNT(*) as student_count,
                    AVG(ss.proficiency_level::numeric) as avg_proficiency
                FROM skills s
                JOIN student_skills ss ON s.id = ss.skill_id
                JOIN users u ON ss.user_id = u.id
                WHERE u.role = 'student'
                GROUP BY s.id, s.name, s.category
                ORDER BY student_count DESC
                LIMIT 10
            `)
        ]);

        const analytics = {
            overview: {
                totalStudents: parseInt(totalStudentsResult.rows[0].total),
                activeGoals: parseInt(activeGoalsResult.rows[0].total),
                completedGoals: parseInt(completedGoalsResult.rows[0].total),
                totalFiles: parseInt(totalFilesResult.rows[0].total),
                totalFileSize: parseInt(totalFilesResult.rows[0].total_size || 0)
            },
            
            recentActivity: recentActivityResult.rows,
            
            profileCompletion: profileCompletionResult.rows,
            
            goalsByCategory: goalsCategoryResult.rows,
            
            topSkills: skillsDistributionResult.rows.map(row => ({
                ...row,
                avg_proficiency: parseFloat(row.avg_proficiency).toFixed(1)
            })),
            
            insights: {
                goalCompletionRate: totalStudentsResult.rows[0].total > 0 ? 
                    ((completedGoalsResult.rows[0].total / (activeGoalsResult.rows[0].total + completedGoalsResult.rows[0].total)) * 100).toFixed(1) : 0,
                averageProfileCompletion: profileCompletionResult.rows.length > 0 ?
                    profileCompletionResult.rows.reduce((sum, row) => sum + (row.student_count * 50), 0) / totalStudentsResult.rows[0].total : 0
            }
        };

        // Cache for 15 minutes
        await set(cacheKey, JSON.stringify(analytics), 900);

        sendSuccess(res, analytics);

    } catch (error) {
        console.error('Analytics API error:', error);
        sendError(res, 500, 'Internal server error');
    }
}