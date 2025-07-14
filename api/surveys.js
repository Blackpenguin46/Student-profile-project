const { query } = require('./lib/db');
const { 
    sendError, 
    sendSuccess, 
    setCorsHeaders, 
    authenticateToken,
    validateInput
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
        const { id, template_id, response_id } = req.query;

        // Route based on endpoint
        if (req.url.includes('/templates')) {
            return await handleSurveyTemplates(req, res, user, { id, template_id });
        } else if (req.url.includes('/responses')) {
            return await handleSurveyResponses(req, res, user, { id, response_id });
        } else {
            return await handleSurveys(req, res, user, { id });
        }

    } catch (error) {
        console.error('Survey API error:', error);
        sendError(res, 500, 'Internal server error');
    }
}

// Survey Templates Management
async function handleSurveyTemplates(req, res, user, { id, template_id }) {
    if (req.method === 'GET') {
        if (template_id) {
            // Get specific template
            const canAccess = user.role === 'teacher' || user.role === 'admin';
            if (!canAccess) {
                return sendError(res, 403, 'Only teachers and admins can access survey templates');
            }

            const templateResult = await query(`
                SELECT st.*, u.first_name, u.last_name
                FROM survey_templates st
                JOIN users u ON st.created_by = u.id
                WHERE st.id = $1
            `, [template_id]);

            if (templateResult.rows.length === 0) {
                return sendError(res, 404, 'Survey template not found');
            }

            return sendSuccess(res, { template: templateResult.rows[0] });
        } else {
            // Get all templates (teachers see only their own, admins see all)
            const canAccess = user.role === 'teacher' || user.role === 'admin';
            if (!canAccess) {
                return sendError(res, 403, 'Only teachers and admins can access survey templates');
            }

            let templatesQuery;
            let params;

            if (user.role === 'admin') {
                templatesQuery = `
                    SELECT st.*, u.first_name, u.last_name
                    FROM survey_templates st
                    JOIN users u ON st.created_by = u.id
                    WHERE st.is_active = true
                    ORDER BY st.created_at DESC
                `;
                params = [];
            } else {
                templatesQuery = `
                    SELECT st.*, u.first_name, u.last_name
                    FROM survey_templates st
                    JOIN users u ON st.created_by = u.id
                    WHERE st.created_by = $1 AND st.is_active = true
                    ORDER BY st.created_at DESC
                `;
                params = [user.id];
            }

            const templatesResult = await query(templatesQuery, params);
            return sendSuccess(res, { templates: templatesResult.rows });
        }
    } else if (req.method === 'POST') {
        // Create new template
        if (user.role !== 'teacher' && user.role !== 'admin') {
            return sendError(res, 403, 'Only teachers and admins can create survey templates');
        }

        const { title, description, questions, template_type = 'general', estimated_duration } = req.body;

        if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
            return sendError(res, 400, 'Title and questions are required');
        }

        // Validate questions structure
        for (const question of questions) {
            if (!question.question_text || !question.question_type) {
                return sendError(res, 400, 'Each question must have question_text and question_type');
            }
        }

        const templateResult = await query(`
            INSERT INTO survey_templates (created_by, title, description, questions, template_type, estimated_duration)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [user.id, title, description, JSON.stringify(questions), template_type, estimated_duration]);

        return sendSuccess(res, { 
            message: 'Survey template created successfully', 
            template: templateResult.rows[0] 
        });
    } else if (req.method === 'PUT' && template_id) {
        // Update template
        const templateResult = await query('SELECT * FROM survey_templates WHERE id = $1', [template_id]);
        if (templateResult.rows.length === 0) {
            return sendError(res, 404, 'Survey template not found');
        }

        const template = templateResult.rows[0];
        const canEdit = user.role === 'admin' || user.id === template.created_by;
        if (!canEdit) {
            return sendError(res, 403, 'Cannot edit this survey template');
        }

        const { title, description, questions, template_type, estimated_duration, is_active } = req.body;

        const updateResult = await query(`
            UPDATE survey_templates 
            SET title = COALESCE($1, title),
                description = COALESCE($2, description),
                questions = COALESCE($3, questions),
                template_type = COALESCE($4, template_type),
                estimated_duration = COALESCE($5, estimated_duration),
                is_active = COALESCE($6, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *
        `, [title, description, questions ? JSON.stringify(questions) : null, template_type, estimated_duration, is_active, template_id]);

        return sendSuccess(res, { 
            message: 'Survey template updated successfully', 
            template: updateResult.rows[0] 
        });
    } else if (req.method === 'DELETE' && template_id) {
        // Delete template (soft delete)
        const templateResult = await query('SELECT * FROM survey_templates WHERE id = $1', [template_id]);
        if (templateResult.rows.length === 0) {
            return sendError(res, 404, 'Survey template not found');
        }

        const template = templateResult.rows[0];
        const canDelete = user.role === 'admin' || user.id === template.created_by;
        if (!canDelete) {
            return sendError(res, 403, 'Cannot delete this survey template');
        }

        await query('UPDATE survey_templates SET is_active = false WHERE id = $1', [template_id]);
        return sendSuccess(res, { message: 'Survey template deleted successfully' });
    }
}

// Survey Responses Management
async function handleSurveyResponses(req, res, user, { id, response_id }) {
    if (req.method === 'GET') {
        if (response_id) {
            // Get specific response
            const responseResult = await query(`
                SELECT sr.*, st.title as survey_title, u.first_name, u.last_name
                FROM survey_responses sr
                JOIN survey_templates st ON sr.survey_template_id = st.id
                JOIN users u ON sr.student_id = u.id
                WHERE sr.id = $1
            `, [response_id]);

            if (responseResult.rows.length === 0) {
                return sendError(res, 404, 'Survey response not found');
            }

            const response = responseResult.rows[0];
            const canAccess = user.role === 'teacher' || user.role === 'admin' || user.id === response.student_id;
            if (!canAccess) {
                return sendError(res, 403, 'Access denied');
            }

            return sendSuccess(res, { response: responseResult.rows[0] });
        } else if (id) {
            // Get responses for a specific survey template
            const canAccess = user.role === 'teacher' || user.role === 'admin';
            if (!canAccess) {
                return sendError(res, 403, 'Only teachers and admins can view survey responses');
            }

            const responsesResult = await query(`
                SELECT sr.*, u.first_name, u.last_name, u.email
                FROM survey_responses sr
                JOIN users u ON sr.student_id = u.id
                WHERE sr.survey_template_id = $1
                ORDER BY sr.started_at DESC
            `, [id]);

            return sendSuccess(res, { responses: responsesResult.rows });
        } else {
            // Get user's own responses
            const responsesResult = await query(`
                SELECT sr.*, st.title as survey_title, st.description
                FROM survey_responses sr
                JOIN survey_templates st ON sr.survey_template_id = st.id
                WHERE sr.student_id = $1
                ORDER BY sr.started_at DESC
            `, [user.id]);

            return sendSuccess(res, { responses: responsesResult.rows });
        }
    } else if (req.method === 'POST') {
        // Submit survey response
        const { survey_template_id, responses, completion_status = 'completed' } = req.body;

        if (!survey_template_id || !responses) {
            return sendError(res, 400, 'Survey template ID and responses are required');
        }

        // Check if survey template exists
        const templateResult = await query('SELECT * FROM survey_templates WHERE id = $1 AND is_active = true', [survey_template_id]);
        if (templateResult.rows.length === 0) {
            return sendError(res, 404, 'Survey template not found or inactive');
        }

        // Check if user already responded
        const existingResponse = await query(
            'SELECT id FROM survey_responses WHERE survey_template_id = $1 AND student_id = $2',
            [survey_template_id, user.id]
        );

        if (existingResponse.rows.length > 0) {
            // Update existing response
            const updateResult = await query(`
                UPDATE survey_responses 
                SET responses = $1, 
                    completion_status = $2,
                    completed_at = CASE WHEN $2 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
                    completion_percentage = $3
                WHERE survey_template_id = $4 AND student_id = $5
                RETURNING *
            `, [JSON.stringify(responses), completion_status, 100, survey_template_id, user.id]);

            return sendSuccess(res, { 
                message: 'Survey response updated successfully', 
                response: updateResult.rows[0] 
            });
        } else {
            // Create new response
            const responseResult = await query(`
                INSERT INTO survey_responses (survey_template_id, student_id, responses, completion_status, completion_percentage, completed_at)
                VALUES ($1, $2, $3, $4, $5, CASE WHEN $4 = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END)
                RETURNING *
            `, [survey_template_id, user.id, JSON.stringify(responses), completion_status, 100]);

            return sendSuccess(res, { 
                message: 'Survey response submitted successfully', 
                response: responseResult.rows[0] 
            });
        }
    }
}

// General surveys endpoint (list assigned surveys for students)
async function handleSurveys(req, res, user, { id }) {
    if (req.method === 'GET') {
        if (user.role === 'student') {
            // Get assigned surveys for student
            const surveysResult = await query(`
                SELECT st.*, 
                       sr.id as response_id,
                       sr.completion_status,
                       sr.completion_percentage,
                       sr.started_at as response_started_at,
                       sr.completed_at as response_completed_at
                FROM survey_templates st
                LEFT JOIN survey_responses sr ON st.id = sr.survey_template_id AND sr.student_id = $1
                WHERE st.is_active = true
                ORDER BY st.created_at DESC
            `, [user.id]);

            return sendSuccess(res, { surveys: surveysResult.rows });
        } else {
            // Teachers and admins get their created templates
            return await handleSurveyTemplates(req, res, user, { id });
        }
    }
}