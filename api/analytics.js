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
        const { type, class_id, student_id, export_format } = req.query;

        // Only teachers and admins can access analytics
        if (user.role !== 'teacher' && user.role !== 'admin') {
            return sendError(res, 403, 'Access denied. Analytics are for teachers and administrators only.');
        }

        if (req.method === 'GET') {
            switch (type) {
                case 'dashboard':
                    return await getDashboardAnalytics(req, res, user);
                case 'skills':
                    return await getSkillsAnalytics(req, res, user, { class_id });
                case 'goals':
                    return await getGoalsAnalytics(req, res, user, { class_id });
                case 'surveys':
                    return await getSurveyAnalytics(req, res, user, { class_id });
                case 'students':
                    return await getStudentAnalytics(req, res, user, { class_id, student_id });
                case 'trends':
                    return await getTrendsAnalytics(req, res, user, { class_id });
                default:
                    return await getDashboardAnalytics(req, res, user);
            }
        } else {
            return sendError(res, 405, 'Method not allowed');
        }

    } catch (error) {
        console.error('Analytics API error:', error);
        sendError(res, 500, 'Internal server error');
    }
}

// Dashboard overview analytics
async function getDashboardAnalytics(req, res, user) {
    try {
        const analytics = {
            overview: {},
            recent_activity: [],
            top_skills: [],
            goal_progress: {},
            survey_completion: {}
        };

        // Overview statistics
        const overviewQuery = await query(`
            SELECT 
                COUNT(DISTINCT u.id) as total_students,
                COUNT(DISTINCT sp.id) as profiles_created,
                COUNT(DISTINCT g.id) as total_goals,
                COUNT(DISTINCT CASE WHEN g.status = 'completed' THEN g.id END) as completed_goals,
                COUNT(DISTINCT ss.id) as total_skills,
                COUNT(DISTINCT sr.id) as survey_responses,
                COUNT(DISTINCT st.id) as survey_templates
            FROM users u
            LEFT JOIN student_profiles sp ON u.id = sp.user_id
            LEFT JOIN goals g ON u.id = g.user_id
            LEFT JOIN student_skills ss ON u.id = ss.user_id
            LEFT JOIN survey_responses sr ON u.id = sr.student_id
            LEFT JOIN survey_templates st ON st.created_by = $1
            WHERE u.role = 'student'
        `, [user.id]);

        analytics.overview = overviewQuery.rows[0];

        // Profile completion rate
        const completionQuery = await query(`
            SELECT 
                AVG(sp.profile_completion_percentage) as avg_completion,
                COUNT(CASE WHEN sp.profile_completion_percentage >= 80 THEN 1 END) as high_completion,
                COUNT(CASE WHEN sp.profile_completion_percentage < 50 THEN 1 END) as low_completion
            FROM student_profiles sp
            JOIN users u ON sp.user_id = u.id
            WHERE u.role = 'student'
        `);

        analytics.overview.avg_profile_completion = Math.round(completionQuery.rows[0].avg_completion || 0);
        analytics.overview.high_completion_profiles = completionQuery.rows[0].high_completion || 0;
        analytics.overview.low_completion_profiles = completionQuery.rows[0].low_completion || 0;

        // Recent activity (last 30 days)
        const activityQuery = await query(`
            SELECT 
                al.action,
                al.entity_type,
                al.created_at,
                u.first_name,
                u.last_name,
                COUNT(*) as count
            FROM activity_logs al
            JOIN users u ON al.user_id = u.id
            WHERE al.created_at >= NOW() - INTERVAL '30 days'
            AND u.role = 'student'
            GROUP BY al.action, al.entity_type, al.created_at, u.first_name, u.last_name
            ORDER BY al.created_at DESC
            LIMIT 20
        `);

        analytics.recent_activity = activityQuery.rows;

        // Top skills across all students
        const skillsQuery = await query(`
            SELECT 
                s.skill_name,
                s.category,
                COUNT(ss.id) as student_count,
                AVG(CASE 
                    WHEN ss.proficiency_level = 'expert' THEN 4
                    WHEN ss.proficiency_level = 'advanced' THEN 3
                    WHEN ss.proficiency_level = 'intermediate' THEN 2
                    ELSE 1
                END) as avg_proficiency
            FROM skills s
            JOIN student_skills ss ON s.id = ss.skill_id
            JOIN users u ON ss.user_id = u.id
            WHERE u.role = 'student'
            GROUP BY s.id, s.skill_name, s.category
            ORDER BY student_count DESC, avg_proficiency DESC
            LIMIT 15
        `);

        analytics.top_skills = skillsQuery.rows;

        // Goal progress by category
        const goalsQuery = await query(`
            SELECT 
                g.category,
                COUNT(*) as total_goals,
                COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN g.status = 'active' THEN 1 END) as active,
                COUNT(CASE WHEN g.status = 'paused' THEN 1 END) as paused
            FROM goals g
            JOIN users u ON g.user_id = u.id
            WHERE u.role = 'student'
            GROUP BY g.category
            ORDER BY total_goals DESC
        `);

        analytics.goal_progress = goalsQuery.rows;

        // Survey completion rates
        const surveyQuery = await query(`
            SELECT 
                st.title,
                st.template_type,
                COUNT(sr.id) as total_responses,
                COUNT(CASE WHEN sr.completion_status = 'completed' THEN 1 END) as completed_responses,
                AVG(sr.completion_percentage) as avg_completion
            FROM survey_templates st
            LEFT JOIN survey_responses sr ON st.id = sr.survey_template_id
            WHERE st.created_by = $1 AND st.is_active = true
            GROUP BY st.id, st.title, st.template_type
            ORDER BY st.created_at DESC
            LIMIT 10
        `, [user.id]);

        analytics.survey_completion = surveyQuery.rows;

        return sendSuccess(res, analytics);

    } catch (error) {
        console.error('Dashboard analytics error:', error);
        return sendError(res, 500, 'Failed to fetch dashboard analytics');
    }
}

// Skills distribution analytics
async function getSkillsAnalytics(req, res, user, { class_id }) {
    try {
        const analytics = {
            skill_distribution: [],
            proficiency_levels: {},
            skill_gaps: [],
            trending_skills: []
        };

        // Skills distribution by category
        const distributionQuery = await query(`
            SELECT 
                s.category,
                COUNT(DISTINCT ss.user_id) as student_count,
                COUNT(ss.id) as total_skills,
                AVG(CASE 
                    WHEN ss.proficiency_level = 'expert' THEN 4
                    WHEN ss.proficiency_level = 'advanced' THEN 3
                    WHEN ss.proficiency_level = 'intermediate' THEN 2
                    ELSE 1
                END) as avg_proficiency
            FROM skills s
            JOIN student_skills ss ON s.id = ss.skill_id
            JOIN users u ON ss.user_id = u.id
            WHERE u.role = 'student'
            GROUP BY s.category
            ORDER BY student_count DESC
        `);

        analytics.skill_distribution = distributionQuery.rows;

        // Proficiency level breakdown
        const proficiencyQuery = await query(`
            SELECT 
                ss.proficiency_level,
                COUNT(*) as count,
                s.category
            FROM student_skills ss
            JOIN skills s ON ss.skill_id = s.id
            JOIN users u ON ss.user_id = u.id
            WHERE u.role = 'student'
            GROUP BY ss.proficiency_level, s.category
            ORDER BY ss.proficiency_level, s.category
        `);

        analytics.proficiency_levels = proficiencyQuery.rows.reduce((acc, row) => {
            if (!acc[row.category]) acc[row.category] = {};
            acc[row.category][row.proficiency_level] = row.count;
            return acc;
        }, {});

        // Skills added in last 30 days (trending)
        const trendingQuery = await query(`
            SELECT 
                s.skill_name,
                s.category,
                COUNT(ss.id) as recent_additions
            FROM skills s
            JOIN student_skills ss ON s.id = ss.skill_id
            JOIN users u ON ss.user_id = u.id
            WHERE u.role = 'student' 
            AND ss.created_at >= NOW() - INTERVAL '30 days'
            GROUP BY s.id, s.skill_name, s.category
            ORDER BY recent_additions DESC
            LIMIT 10
        `);

        analytics.trending_skills = trendingQuery.rows;

        return sendSuccess(res, analytics);

    } catch (error) {
        console.error('Skills analytics error:', error);
        return sendError(res, 500, 'Failed to fetch skills analytics');
    }
}

// Goals analytics
async function getGoalsAnalytics(req, res, user, { class_id }) {
    try {
        const analytics = {
            goal_completion_rate: 0,
            goals_by_category: [],
            goals_by_priority: [],
            completion_trends: []
        };

        // Goal completion rate
        const completionQuery = await query(`
            SELECT 
                COUNT(*) as total_goals,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_goals
            FROM goals g
            JOIN users u ON g.user_id = u.id
            WHERE u.role = 'student'
        `);

        const total = completionQuery.rows[0].total_goals || 1;
        const completed = completionQuery.rows[0].completed_goals || 0;
        analytics.goal_completion_rate = Math.round((completed / total) * 100);

        // Goals by category
        const categoryQuery = await query(`
            SELECT 
                g.category,
                COUNT(*) as total,
                COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN g.status = 'active' THEN 1 END) as active
            FROM goals g
            JOIN users u ON g.user_id = u.id
            WHERE u.role = 'student'
            GROUP BY g.category
            ORDER BY total DESC
        `);

        analytics.goals_by_category = categoryQuery.rows;

        // Goals by priority
        const priorityQuery = await query(`
            SELECT 
                g.priority,
                COUNT(*) as total,
                COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as completed
            FROM goals g
            JOIN users u ON g.user_id = u.id
            WHERE u.role = 'student'
            GROUP BY g.priority
            ORDER BY 
                CASE g.priority 
                    WHEN 'high' THEN 1 
                    WHEN 'medium' THEN 2 
                    WHEN 'low' THEN 3 
                END
        `);

        analytics.goals_by_priority = priorityQuery.rows;

        // Completion trends (last 6 months)
        const trendsQuery = await query(`
            SELECT 
                DATE_TRUNC('month', g.completed_at) as month,
                COUNT(*) as completed_goals
            FROM goals g
            JOIN users u ON g.user_id = u.id
            WHERE u.role = 'student' 
            AND g.completed_at >= NOW() - INTERVAL '6 months'
            AND g.status = 'completed'
            GROUP BY DATE_TRUNC('month', g.completed_at)
            ORDER BY month
        `);

        analytics.completion_trends = trendsQuery.rows;

        return sendSuccess(res, analytics);

    } catch (error) {
        console.error('Goals analytics error:', error);
        return sendError(res, 500, 'Failed to fetch goals analytics');
    }
}

// Survey analytics
async function getSurveyAnalytics(req, res, user, { class_id }) {
    try {
        const analytics = {
            response_rates: [],
            completion_times: [],
            question_analysis: []
        };

        // Response rates by survey
        const responseQuery = await query(`
            SELECT 
                st.title,
                st.template_type,
                st.estimated_duration,
                COUNT(sr.id) as total_responses,
                COUNT(CASE WHEN sr.completion_status = 'completed' THEN 1 END) as completed,
                AVG(sr.completion_percentage) as avg_completion,
                AVG(sr.time_spent_minutes) as avg_time_spent
            FROM survey_templates st
            LEFT JOIN survey_responses sr ON st.id = sr.survey_template_id
            WHERE st.created_by = $1 AND st.is_active = true
            GROUP BY st.id, st.title, st.template_type, st.estimated_duration
            ORDER BY st.created_at DESC
        `, [user.id]);

        analytics.response_rates = responseQuery.rows;

        return sendSuccess(res, analytics);

    } catch (error) {
        console.error('Survey analytics error:', error);
        return sendError(res, 500, 'Failed to fetch survey analytics');
    }
}

// Individual student analytics
async function getStudentAnalytics(req, res, user, { class_id, student_id }) {
    try {
        if (!student_id) {
            return sendError(res, 400, 'Student ID is required');
        }

        const analytics = {
            profile: {},
            skills: [],
            goals: [],
            activities: [],
            survey_responses: []
        };

        // Student profile information
        const profileQuery = await query(`
            SELECT 
                u.first_name,
                u.last_name,
                u.email,
                sp.*
            FROM users u
            LEFT JOIN student_profiles sp ON u.id = sp.user_id
            WHERE u.id = $1 AND u.role = 'student'
        `, [student_id]);

        if (profileQuery.rows.length === 0) {
            return sendError(res, 404, 'Student not found');
        }

        analytics.profile = profileQuery.rows[0];

        // Student skills
        const skillsQuery = await query(`
            SELECT 
                s.skill_name,
                s.category,
                ss.proficiency_level,
                ss.years_experience,
                ss.verified,
                ss.created_at
            FROM student_skills ss
            JOIN skills s ON ss.skill_id = s.id
            WHERE ss.user_id = $1
            ORDER BY s.category, s.skill_name
        `, [student_id]);

        analytics.skills = skillsQuery.rows;

        // Student goals
        const goalsQuery = await query(`
            SELECT *
            FROM goals
            WHERE user_id = $1
            ORDER BY 
                CASE priority 
                    WHEN 'high' THEN 1 
                    WHEN 'medium' THEN 2 
                    WHEN 'low' THEN 3 
                END,
                created_at DESC
        `, [student_id]);

        analytics.goals = goalsQuery.rows;

        // Student activities
        const activitiesQuery = await query(`
            SELECT *
            FROM activities
            WHERE user_id = $1
            ORDER BY start_date DESC
        `, [student_id]);

        analytics.activities = activitiesQuery.rows;

        // Survey responses
        const responsesQuery = await query(`
            SELECT 
                sr.*,
                st.title as survey_title,
                st.template_type
            FROM survey_responses sr
            JOIN survey_templates st ON sr.survey_template_id = st.id
            WHERE sr.student_id = $1
            ORDER BY sr.started_at DESC
        `, [student_id]);

        analytics.survey_responses = responsesQuery.rows;

        return sendSuccess(res, analytics);

    } catch (error) {
        console.error('Student analytics error:', error);
        return sendError(res, 500, 'Failed to fetch student analytics');
    }
}

// Trends analytics
async function getTrendsAnalytics(req, res, user, { class_id }) {
    try {
        const analytics = {
            profile_completion_trend: [],
            skill_acquisition_trend: [],
            goal_completion_trend: [],
            survey_participation_trend: []
        };

        // Profile completion over time
        const profileTrendQuery = await query(`
            SELECT 
                DATE_TRUNC('week', sp.updated_at) as week,
                AVG(sp.profile_completion_percentage) as avg_completion
            FROM student_profiles sp
            JOIN users u ON sp.user_id = u.id
            WHERE u.role = 'student'
            AND sp.updated_at >= NOW() - INTERVAL '3 months'
            GROUP BY DATE_TRUNC('week', sp.updated_at)
            ORDER BY week
        `);

        analytics.profile_completion_trend = profileTrendQuery.rows;

        // Skill acquisition trend
        const skillTrendQuery = await query(`
            SELECT 
                DATE_TRUNC('week', ss.created_at) as week,
                COUNT(*) as skills_added
            FROM student_skills ss
            JOIN users u ON ss.user_id = u.id
            WHERE u.role = 'student'
            AND ss.created_at >= NOW() - INTERVAL '3 months'
            GROUP BY DATE_TRUNC('week', ss.created_at)
            ORDER BY week
        `);

        analytics.skill_acquisition_trend = skillTrendQuery.rows;

        return sendSuccess(res, analytics);

    } catch (error) {
        console.error('Trends analytics error:', error);
        return sendError(res, 500, 'Failed to fetch trends analytics');
    }
}