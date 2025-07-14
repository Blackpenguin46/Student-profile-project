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

        // Only teachers and admins can export data
        if (!['teacher', 'admin'].includes(user.role)) {
            return sendError(res, 403, 'Access denied');
        }

        if (req.method === 'GET') {
            const { type, format = 'csv', filters = '{}' } = req.query;

            try {
                const parsedFilters = JSON.parse(filters);
                return await exportData(req, res, user, type, format, parsedFilters);
            } catch (parseError) {
                return sendError(res, 400, 'Invalid filters format');
            }

        } else {
            return sendError(res, 405, 'Method not allowed');
        }

    } catch (error) {
        console.error('Export API error:', error);
        sendError(res, 500, 'Internal server error');
    }
}

// Main export function
async function exportData(req, res, user, type, format, filters) {
    try {
        let data, filename, headers;

        switch (type) {
            case 'students':
                ({ data, filename, headers } = await exportStudents(filters, format));
                break;
            case 'groups':
                ({ data, filename, headers } = await exportGroups(filters, format));
                break;
            case 'analytics':
                ({ data, filename, headers } = await exportAnalytics(filters, format));
                break;
            case 'skills':
                ({ data, filename, headers } = await exportSkills(filters, format));
                break;
            case 'goals':
                ({ data, filename, headers } = await exportGoals(filters, format));
                break;
            case 'surveys':
                ({ data, filename, headers } = await exportSurveys(filters, format));
                break;
            case 'comprehensive':
                ({ data, filename, headers } = await exportComprehensive(filters, format));
                break;
            default:
                return sendError(res, 400, 'Invalid export type');
        }

        // Set response headers for file download
        res.setHeader('Content-Type', getContentType(format));
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-cache');

        // Send the data
        res.status(200).send(data);

    } catch (error) {
        console.error('Export data error:', error);
        return sendError(res, 500, 'Failed to export data');
    }
}

// Export students data
async function exportStudents(filters, format) {
    const {
        searchTerm = '',
        yearLevel = '',
        major = '',
        profileCompletion = '',
        lastActivity = '',
        skills = '',
        interests = ''
    } = filters;

    let whereClause = 'WHERE u.role = \\'student\\' AND u.is_active = true';
    const queryParams = [];
    let paramIndex = 1;
    let joinClauses = '';

    // Apply filters (similar to advanced search)
    if (searchTerm) {
        whereClause += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
        queryParams.push(`%${searchTerm}%`);
        paramIndex++;
    }

    if (yearLevel) {
        whereClause += ` AND sp.year_level = $${paramIndex}`;
        queryParams.push(yearLevel);
        paramIndex++;
    }

    if (major) {
        whereClause += ` AND sp.major ILIKE $${paramIndex}`;
        queryParams.push(`%${major}%`);
        paramIndex++;
    }

    if (profileCompletion) {
        let completionCondition = '';
        switch (profileCompletion) {
            case 'high':
                completionCondition = 'sp.profile_completion_percentage >= 80';
                break;
            case 'medium':
                completionCondition = 'sp.profile_completion_percentage >= 50 AND sp.profile_completion_percentage < 80';
                break;
            case 'low':
                completionCondition = 'sp.profile_completion_percentage < 50';
                break;
        }
        if (completionCondition) {
            whereClause += ` AND ${completionCondition}`;
        }
    }

    const studentsQuery = `
        SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.phone,
            u.created_at as registration_date,
            u.last_login,
            sp.student_id_num,
            sp.year_level,
            sp.major,
            sp.date_of_birth,
            sp.bio,
            sp.short_term_goals,
            sp.long_term_goals,
            sp.career_aspirations,
            sp.linkedin_url,
            sp.portfolio_url,
            sp.github_url,
            sp.profile_completion_percentage,
            sp.updated_at as profile_updated,
            -- Aggregate skills
            COALESCE(
                (SELECT STRING_AGG(s.skill_name || ' (' || ss.proficiency_level || ')', '; ')
                 FROM student_skills ss 
                 JOIN skills s ON ss.skill_id = s.id 
                 WHERE ss.user_id = u.id), ''
            ) as skills_list,
            -- Aggregate interests
            COALESCE(
                (SELECT STRING_AGG(i.interest_name, '; ')
                 FROM student_interests si 
                 JOIN interests i ON si.interest_id = i.id 
                 WHERE si.user_id = u.id), ''
            ) as interests_list,
            -- Goals count
            (SELECT COUNT(*) FROM goals WHERE user_id = u.id) as goals_count,
            -- Activities count
            (SELECT COUNT(*) FROM activities WHERE user_id = u.id) as activities_count
        FROM users u
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        ${joinClauses}
        ${whereClause}
        ORDER BY u.last_name, u.first_name
    `;

    const result = await query(studentsQuery, queryParams);
    const students = result.rows;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `students_export_${timestamp}.${format}`;

    if (format === 'json') {
        return {
            data: JSON.stringify({
                exportType: 'students',
                exportDate: new Date().toISOString(),
                totalRecords: students.length,
                filters: filters,
                data: students
            }, null, 2),
            filename,
            headers: ['Content-Type: application/json']
        };
    } else if (format === 'csv') {
        const csvData = convertToCSV(students, [
            'id', 'first_name', 'last_name', 'email', 'phone', 'student_id_num',
            'year_level', 'major', 'registration_date', 'last_login',
            'profile_completion_percentage', 'short_term_goals', 'long_term_goals',
            'career_aspirations', 'linkedin_url', 'portfolio_url', 'github_url',
            'skills_list', 'interests_list', 'goals_count', 'activities_count'
        ]);
        return { data: csvData, filename, headers: ['Content-Type: text/csv'] };
    }
}

// Export groups data
async function exportGroups(filters, format) {
    const { status = '', projectId = '' } = filters;

    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (status) {
        whereClause += ` AND g.status = $${paramIndex}`;
        queryParams.push(status);
        paramIndex++;
    }

    if (projectId) {
        whereClause += ` AND g.project_id = $${paramIndex}`;
        queryParams.push(parseInt(projectId));
        paramIndex++;
    }

    const groupsQuery = `
        SELECT 
            g.id,
            g.name,
            g.description,
            g.max_size,
            g.status,
            g.created_at,
            g.updated_at,
            p.title as project_title,
            COUNT(gm.user_id) as current_size,
            STRING_AGG(
                u.first_name || ' ' || u.last_name || ' (' || gm.role || ')',
                '; '
            ) as members_list,
            -- Quality score calculation
            COALESCE(
                (SELECT calculate_group_compatibility(g.id)), 0
            ) as compatibility_score,
            -- Skills distribution
            COALESCE(
                (SELECT STRING_AGG(DISTINCT s.skill_name, '; ')
                 FROM group_members gm2
                 JOIN student_skills ss ON gm2.user_id = ss.user_id
                 JOIN skills s ON ss.skill_id = s.id
                 WHERE gm2.group_id = g.id), ''
            ) as group_skills,
            -- Formation criteria
            g.formation_criteria::text as formation_details
        FROM groups g
        LEFT JOIN projects p ON g.project_id = p.id
        LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.left_at IS NULL
        LEFT JOIN users u ON gm.user_id = u.id
        ${whereClause}
        GROUP BY g.id, p.title
        ORDER BY g.created_at DESC
    `;

    const result = await query(groupsQuery, queryParams);
    const groups = result.rows;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `groups_export_${timestamp}.${format}`;

    if (format === 'json') {
        return {
            data: JSON.stringify({
                exportType: 'groups',
                exportDate: new Date().toISOString(),
                totalRecords: groups.length,
                filters: filters,
                data: groups
            }, null, 2),
            filename,
            headers: ['Content-Type: application/json']
        };
    } else if (format === 'csv') {
        const csvData = convertToCSV(groups, [
            'id', 'name', 'description', 'status', 'max_size', 'current_size',
            'project_title', 'compatibility_score', 'created_at', 'updated_at',
            'members_list', 'group_skills', 'formation_details'
        ]);
        return { data: csvData, filename, headers: ['Content-Type: text/csv'] };
    }
}

// Export analytics data
async function exportAnalytics(filters, format) {
    const analytics = {};

    // Student overview analytics
    const studentOverview = await query(`
        SELECT 
            COUNT(*) as total_students,
            COUNT(CASE WHEN u.last_login >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as active_weekly,
            COUNT(CASE WHEN u.last_login >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as active_monthly,
            ROUND(AVG(sp.profile_completion_percentage), 2) as avg_profile_completion,
            COUNT(CASE WHEN sp.profile_completion_percentage >= 80 THEN 1 END) as high_completion_profiles,
            COUNT(CASE WHEN sp.profile_completion_percentage < 50 THEN 1 END) as low_completion_profiles
        FROM users u
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE u.role = 'student' AND u.is_active = true
    `);

    analytics.studentOverview = studentOverview.rows[0];

    // Skills analytics
    const skillsAnalytics = await query(`
        SELECT 
            s.skill_name,
            s.category,
            COUNT(ss.user_id) as student_count,
            ROUND(AVG(CASE 
                WHEN ss.proficiency_level = 'beginner' THEN 1
                WHEN ss.proficiency_level = 'intermediate' THEN 2
                WHEN ss.proficiency_level = 'advanced' THEN 3
                WHEN ss.proficiency_level = 'expert' THEN 4
                ELSE 0
            END), 2) as avg_proficiency_numeric,
            MODE() WITHIN GROUP (ORDER BY ss.proficiency_level) as most_common_level
        FROM skills s
        LEFT JOIN student_skills ss ON s.id = ss.skill_id
        LEFT JOIN users u ON ss.user_id = u.id
        WHERE u.role = 'student' AND u.is_active = true
        GROUP BY s.id, s.skill_name, s.category
        HAVING COUNT(ss.user_id) > 0
        ORDER BY student_count DESC
        LIMIT 20
    `);

    analytics.topSkills = skillsAnalytics.rows;

    // Goals analytics
    const goalsAnalytics = await query(`
        SELECT 
            category,
            status,
            COUNT(*) as count,
            ROUND(AVG(CASE 
                WHEN priority = 'low' THEN 1
                WHEN priority = 'medium' THEN 2
                WHEN priority = 'high' THEN 3
                ELSE 0
            END), 2) as avg_priority_numeric
        FROM goals g
        JOIN users u ON g.user_id = u.id
        WHERE u.role = 'student' AND u.is_active = true
        GROUP BY category, status
        ORDER BY category, status
    `);

    analytics.goalsBreakdown = goalsAnalytics.rows;

    // Groups analytics
    const groupsAnalytics = await query(`
        SELECT 
            g.status,
            COUNT(*) as group_count,
            ROUND(AVG(
                (SELECT COUNT(*) FROM group_members WHERE group_id = g.id AND left_at IS NULL)
            ), 2) as avg_group_size,
            ROUND(AVG(
                COALESCE((SELECT calculate_group_compatibility(g.id)), 0)
            ), 2) as avg_compatibility_score
        FROM groups g
        GROUP BY g.status
        ORDER BY group_count DESC
    `);

    analytics.groupsOverview = groupsAnalytics.rows;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `analytics_export_${timestamp}.${format}`;

    if (format === 'json') {
        return {
            data: JSON.stringify({
                exportType: 'analytics',
                exportDate: new Date().toISOString(),
                filters: filters,
                data: analytics
            }, null, 2),
            filename,
            headers: ['Content-Type: application/json']
        };
    } else if (format === 'csv') {
        // For CSV, flatten the analytics data
        const flattenedData = [
            ...analytics.topSkills.map(skill => ({
                type: 'skill',
                name: skill.skill_name,
                category: skill.category,
                count: skill.student_count,
                avg_level: skill.avg_proficiency_numeric,
                most_common_level: skill.most_common_level
            })),
            ...analytics.goalsBreakdown.map(goal => ({
                type: 'goal',
                category: goal.category,
                status: goal.status,
                count: goal.count,
                avg_priority: goal.avg_priority_numeric
            })),
            ...analytics.groupsOverview.map(group => ({
                type: 'group',
                status: group.status,
                count: group.group_count,
                avg_size: group.avg_group_size,
                avg_compatibility: group.avg_compatibility_score
            }))
        ];

        const csvData = convertToCSV(flattenedData, ['type', 'name', 'category', 'status', 'count', 'avg_level', 'avg_priority', 'avg_size', 'avg_compatibility']);
        return { data: csvData, filename, headers: ['Content-Type: text/csv'] };
    }
}

// Export comprehensive data (all data types combined)
async function exportComprehensive(filters, format) {
    const comprehensive = {};

    // Get students data
    const studentsResult = await exportStudents(filters.students || {}, 'json');
    comprehensive.students = JSON.parse(studentsResult.data);

    // Get groups data
    const groupsResult = await exportGroups(filters.groups || {}, 'json');
    comprehensive.groups = JSON.parse(groupsResult.data);

    // Get analytics data
    const analyticsResult = await exportAnalytics(filters.analytics || {}, 'json');
    comprehensive.analytics = JSON.parse(analyticsResult.data);

    // Add system metadata
    comprehensive.metadata = {
        exportType: 'comprehensive',
        exportDate: new Date().toISOString(),
        exportedBy: 'System Administrator',
        totalStudents: comprehensive.students.totalRecords,
        totalGroups: comprehensive.groups.totalRecords,
        systemVersion: '1.0.0'
    };

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `comprehensive_export_${timestamp}.${format}`;

    if (format === 'json') {
        return {
            data: JSON.stringify(comprehensive, null, 2),
            filename,
            headers: ['Content-Type: application/json']
        };
    } else {
        // For CSV comprehensive export, create a summary
        const summaryData = [
            { section: 'Students', total_records: comprehensive.students.totalRecords },
            { section: 'Groups', total_records: comprehensive.groups.totalRecords },
            { section: 'Skills', total_records: comprehensive.analytics.data.topSkills?.length || 0 },
            { section: 'Goals', total_records: comprehensive.analytics.data.goalsBreakdown?.length || 0 }
        ];

        const csvData = convertToCSV(summaryData, ['section', 'total_records']);
        return { data: csvData, filename, headers: ['Content-Type: text/csv'] };
    }
}

// Export skills data
async function exportSkills(filters, format) {
    const skillsQuery = `
        SELECT 
            s.id,
            s.skill_name,
            s.category,
            s.created_at,
            COUNT(ss.user_id) as total_students,
            COUNT(CASE WHEN ss.proficiency_level = 'beginner' THEN 1 END) as beginner_count,
            COUNT(CASE WHEN ss.proficiency_level = 'intermediate' THEN 1 END) as intermediate_count,
            COUNT(CASE WHEN ss.proficiency_level = 'advanced' THEN 1 END) as advanced_count,
            COUNT(CASE WHEN ss.proficiency_level = 'expert' THEN 1 END) as expert_count,
            STRING_AGG(
                u.first_name || ' ' || u.last_name || ' (' || ss.proficiency_level || ')',
                '; '
            ) as students_list
        FROM skills s
        LEFT JOIN student_skills ss ON s.id = ss.skill_id
        LEFT JOIN users u ON ss.user_id = u.id AND u.role = 'student' AND u.is_active = true
        GROUP BY s.id, s.skill_name, s.category, s.created_at
        ORDER BY total_students DESC, s.skill_name
    `;

    const result = await query(skillsQuery);
    const skills = result.rows;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `skills_export_${timestamp}.${format}`;

    if (format === 'json') {
        return {
            data: JSON.stringify({
                exportType: 'skills',
                exportDate: new Date().toISOString(),
                totalRecords: skills.length,
                data: skills
            }, null, 2),
            filename,
            headers: ['Content-Type: application/json']
        };
    } else if (format === 'csv') {
        const csvData = convertToCSV(skills, [
            'id', 'skill_name', 'category', 'total_students',
            'beginner_count', 'intermediate_count', 'advanced_count', 'expert_count',
            'created_at', 'students_list'
        ]);
        return { data: csvData, filename, headers: ['Content-Type: text/csv'] };
    }
}

// Export goals data
async function exportGoals(filters, format) {
    const goalsQuery = `
        SELECT 
            g.id,
            g.title,
            g.description,
            g.category,
            g.status,
            g.priority,
            g.target_date,
            g.created_at,
            g.updated_at,
            u.first_name || ' ' || u.last_name as student_name,
            u.email as student_email,
            sp.year_level,
            sp.major
        FROM goals g
        JOIN users u ON g.user_id = u.id
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE u.role = 'student' AND u.is_active = true
        ORDER BY g.created_at DESC
    `;

    const result = await query(goalsQuery);
    const goals = result.rows;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `goals_export_${timestamp}.${format}`;

    if (format === 'json') {
        return {
            data: JSON.stringify({
                exportType: 'goals',
                exportDate: new Date().toISOString(),
                totalRecords: goals.length,
                data: goals
            }, null, 2),
            filename,
            headers: ['Content-Type: application/json']
        };
    } else if (format === 'csv') {
        const csvData = convertToCSV(goals, [
            'id', 'title', 'description', 'category', 'status', 'priority',
            'target_date', 'created_at', 'updated_at', 'student_name',
            'student_email', 'year_level', 'major'
        ]);
        return { data: csvData, filename, headers: ['Content-Type: text/csv'] };
    }
}

// Export surveys data
async function exportSurveys(filters, format) {
    const surveysQuery = `
        SELECT 
            s.id,
            s.title,
            s.description,
            s.status,
            s.created_at,
            s.updated_at,
            COUNT(sr.id) as total_responses,
            COUNT(CASE WHEN sr.completed_at IS NOT NULL THEN 1 END) as completed_responses,
            ROUND(
                COUNT(CASE WHEN sr.completed_at IS NOT NULL THEN 1 END)::DECIMAL / 
                NULLIF(COUNT(sr.id), 0) * 100, 2
            ) as completion_rate
        FROM surveys s
        LEFT JOIN survey_responses sr ON s.id = sr.survey_id
        GROUP BY s.id, s.title, s.description, s.status, s.created_at, s.updated_at
        ORDER BY s.created_at DESC
    `;

    const result = await query(surveysQuery);
    const surveys = result.rows;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `surveys_export_${timestamp}.${format}`;

    if (format === 'json') {
        return {
            data: JSON.stringify({
                exportType: 'surveys',
                exportDate: new Date().toISOString(),
                totalRecords: surveys.length,
                data: surveys
            }, null, 2),
            filename,
            headers: ['Content-Type: application/json']
        };
    } else if (format === 'csv') {
        const csvData = convertToCSV(surveys, [
            'id', 'title', 'description', 'status', 'total_responses',
            'completed_responses', 'completion_rate', 'created_at', 'updated_at'
        ]);
        return { data: csvData, filename, headers: ['Content-Type: text/csv'] };
    }
}

// Utility functions
function convertToCSV(data, columns) {
    if (!data || data.length === 0) {
        return 'No data available';
    }

    // Create header row
    const headers = columns.map(col => `"${col.replace(/"/g, '""')}"`).join(',');
    
    // Create data rows
    const rows = data.map(row => {
        return columns.map(col => {
            let value = row[col];
            if (value === null || value === undefined) {
                value = '';
            } else if (typeof value === 'object') {
                value = JSON.stringify(value);
            } else {
                value = String(value);
            }
            // Escape quotes and wrap in quotes
            return `"${value.replace(/"/g, '""')}"`;
        }).join(',');
    });

    return [headers, ...rows].join('\\n');
}

function getContentType(format) {
    switch (format) {
        case 'csv':
            return 'text/csv; charset=utf-8';
        case 'json':
            return 'application/json; charset=utf-8';
        default:
            return 'text/plain; charset=utf-8';
    }
}