const { query } = require('./lib/db');
const { 
    sendError, 
    sendSuccess, 
    setCorsHeaders, 
    authenticateToken 
} = require('./lib/auth');
const { parseResumeFile } = require('./lib/resume-parser');

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
        const { file_id, action } = req.query;

        if (req.method === 'POST' && action === 'parse') {
            // Parse uploaded resume file
            if (!file_id) {
                return sendError(res, 400, 'File ID is required');
            }

            // Get the uploaded file
            const fileResult = await query(`
                SELECT id, user_id, filename, original_filename, file_type, 
                       file_data, category, created_at
                FROM uploaded_files 
                WHERE id = $1 AND category = 'resume'
            `, [file_id]);

            if (fileResult.rows.length === 0) {
                return sendError(res, 404, 'Resume file not found');
            }

            const file = fileResult.rows[0];

            // Check permissions
            const canAccess = user.role === 'teacher' || user.role === 'admin' || user.id === file.user_id;
            if (!canAccess) {
                return sendError(res, 403, 'Access denied');
            }

            // Parse the resume
            const parseResult = await parseResumeFile(
                file.file_data, 
                file.original_filename, 
                file.file_type
            );

            if (!parseResult.success) {
                return sendError(res, 500, `Resume parsing failed: ${parseResult.error}`);
            }

            // Store parsed data
            const parsedResumeResult = await query(`
                INSERT INTO parsed_resume_data (
                    file_id, student_id, extracted_skills, extracted_experience, 
                    extracted_education, extracted_contact, confidence_scores
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (file_id, student_id) 
                DO UPDATE SET 
                    extracted_skills = $3,
                    extracted_experience = $4,
                    extracted_education = $5,
                    extracted_contact = $6,
                    confidence_scores = $7,
                    created_at = CURRENT_TIMESTAMP
                RETURNING *
            `, [
                file.id,
                file.user_id,
                JSON.stringify(parseResult.parsedData.skills),
                JSON.stringify(parseResult.parsedData.experience),
                JSON.stringify(parseResult.parsedData.education),
                JSON.stringify(parseResult.parsedData.contact),
                JSON.stringify(parseResult.parsedData.confidence)
            ]);

            return sendSuccess(res, {
                message: 'Resume parsed successfully',
                parsedData: parseResult.parsedData,
                metadata: parseResult.metadata,
                extractedText: parseResult.extractedText.substring(0, 500) + '...', // Truncate for response
                confidence: parseResult.parsedData.confidence,
                suggestions: generateAutoFillSuggestions(parseResult.parsedData)
            });

        } else if (req.method === 'POST' && action === 'auto-fill') {
            // Auto-fill profile with parsed data
            const { file_id, selected_data } = req.body;

            if (!file_id || !selected_data) {
                return sendError(res, 400, 'File ID and selected data are required');
            }

            // Get parsed resume data
            const parsedResult = await query(`
                SELECT prd.*, uf.user_id
                FROM parsed_resume_data prd
                JOIN uploaded_files uf ON prd.file_id = uf.id
                WHERE prd.file_id = $1
            `, [file_id]);

            if (parsedResult.rows.length === 0) {
                return sendError(res, 404, 'Parsed resume data not found');
            }

            const parsedData = parsedResult.rows[0];

            // Check permissions
            const canEdit = user.role === 'teacher' || user.role === 'admin' || user.id === parsedData.user_id;
            if (!canEdit) {
                return sendError(res, 403, 'Access denied');
            }

            const results = {
                profile_updated: false,
                skills_added: 0,
                goals_created: 0,
                errors: []
            };

            // Update basic profile information
            if (selected_data.contact && selected_data.contact.length > 0) {
                try {
                    const contact = JSON.parse(parsedData.extracted_contact);
                    const updateFields = [];
                    const updateValues = [];
                    let valueIndex = 1;

                    if (selected_data.contact.includes('phone') && contact.phone) {
                        updateFields.push(`phone = $${valueIndex++}`);
                        updateValues.push(contact.phone);
                    }

                    if (selected_data.contact.includes('linkedin') && contact.linkedin) {
                        updateFields.push(`linkedin_url = $${valueIndex++}`);
                        updateValues.push(contact.linkedin);
                    }

                    if (selected_data.contact.includes('github') && contact.github) {
                        updateFields.push(`github_url = $${valueIndex++}`);
                        updateValues.push(contact.github);
                    }

                    if (selected_data.contact.includes('portfolio') && contact.portfolio) {
                        updateFields.push(`portfolio_url = $${valueIndex++}`);
                        updateValues.push(contact.portfolio);
                    }

                    if (updateFields.length > 0) {
                        updateValues.push(parsedData.user_id);
                        await query(`
                            UPDATE student_profiles 
                            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                            WHERE user_id = $${valueIndex}
                        `, updateValues);
                        results.profile_updated = true;
                    }
                } catch (error) {
                    results.errors.push(`Profile update error: ${error.message}`);
                }
            }

            // Add selected skills
            if (selected_data.skills && selected_data.skills.length > 0) {
                try {
                    const skills = JSON.parse(parsedData.extracted_skills);
                    
                    for (const skillName of selected_data.skills) {
                        const skill = skills.find(s => s.name === skillName);
                        if (skill) {
                            // Find or create skill in database
                            let skillResult = await query(`
                                SELECT id FROM skills WHERE LOWER(skill_name) = LOWER($1)
                            `, [skill.name]);

                            let skillId;
                            if (skillResult.rows.length === 0) {
                                // Create new skill
                                const newSkillResult = await query(`
                                    INSERT INTO skills (skill_name, category, description)
                                    VALUES ($1, $2, $3) RETURNING id
                                `, [skill.name, skill.category, `Auto-added from resume: ${skill.context || ''}`]);
                                skillId = newSkillResult.rows[0].id;
                            } else {
                                skillId = skillResult.rows[0].id;
                            }

                            // Add skill to user
                            await query(`
                                INSERT INTO student_skills (user_id, skill_id, proficiency_level, years_experience)
                                VALUES ($1, $2, $3, $4)
                                ON CONFLICT (user_id, skill_id) 
                                DO UPDATE SET proficiency_level = $3, years_experience = $4
                            `, [parsedData.user_id, skillId, skill.proficiency, 0]);

                            results.skills_added++;
                        }
                    }
                } catch (error) {
                    results.errors.push(`Skills update error: ${error.message}`);
                }
            }

            // Create goals from experience
            if (selected_data.goals && selected_data.goals.length > 0) {
                try {
                    const experience = JSON.parse(parsedData.extracted_experience);
                    
                    for (const goalType of selected_data.goals) {
                        let goalTitle = '';
                        let goalDescription = '';

                        if (goalType === 'career_growth' && experience.length > 0) {
                            const latestJob = experience[0];
                            goalTitle = `Advance in ${latestJob.position || 'current role'}`;
                            goalDescription = `Continue developing skills and experience in ${latestJob.position || 'my field'} to advance to the next level.`;
                        } else if (goalType === 'skill_development') {
                            goalTitle = 'Develop technical skills';
                            goalDescription = 'Continue building and enhancing technical skills based on industry trends and career goals.';
                        }

                        if (goalTitle) {
                            await query(`
                                INSERT INTO goals (user_id, title, description, category, priority, status)
                                VALUES ($1, $2, $3, $4, $5, $6)
                            `, [parsedData.user_id, goalTitle, goalDescription, 'career', 'medium', 'active']);
                            results.goals_created++;
                        }
                    }
                } catch (error) {
                    results.errors.push(`Goals creation error: ${error.message}`);
                }
            }

            return sendSuccess(res, {
                message: 'Profile auto-fill completed',
                results: results
            });

        } else if (req.method === 'GET' && file_id) {
            // Get parsed resume data
            const parsedResult = await query(`
                SELECT prd.*, uf.user_id, uf.original_filename
                FROM parsed_resume_data prd
                JOIN uploaded_files uf ON prd.file_id = uf.id
                WHERE prd.file_id = $1
            `, [file_id]);

            if (parsedResult.rows.length === 0) {
                return sendError(res, 404, 'Parsed resume data not found');
            }

            const parsedData = parsedResult.rows[0];

            // Check permissions
            const canAccess = user.role === 'teacher' || user.role === 'admin' || user.id === parsedData.user_id;
            if (!canAccess) {
                return sendError(res, 403, 'Access denied');
            }

            return sendSuccess(res, {
                fileName: parsedData.original_filename,
                skills: JSON.parse(parsedData.extracted_skills || '[]'),
                experience: JSON.parse(parsedData.extracted_experience || '[]'),
                education: JSON.parse(parsedData.extracted_education || '[]'),
                contact: JSON.parse(parsedData.extracted_contact || '{}'),
                confidence: JSON.parse(parsedData.confidence_scores || '{}'),
                parsedAt: parsedData.created_at
            });

        } else {
            return sendError(res, 405, 'Method not allowed');
        }

    } catch (error) {
        console.error('Resume parser API error:', error);
        sendError(res, 500, 'Internal server error');
    }
}

/**
 * Generate suggestions for auto-filling profile
 */
function generateAutoFillSuggestions(parsedData) {
    const suggestions = {
        contact: [],
        skills: [],
        goals: []
    };

    // Contact suggestions
    if (parsedData.contact.phone) suggestions.contact.push('phone');
    if (parsedData.contact.linkedin) suggestions.contact.push('linkedin');
    if (parsedData.contact.github) suggestions.contact.push('github');
    if (parsedData.contact.portfolio) suggestions.contact.push('portfolio');

    // Skills suggestions (top 10 most confident)
    suggestions.skills = parsedData.skills
        .filter(skill => skill.proficiency !== 'beginner')
        .slice(0, 10)
        .map(skill => skill.name);

    // Goals suggestions
    if (parsedData.experience.length > 0) {
        suggestions.goals.push('career_growth');
    }
    if (parsedData.skills.length > 5) {
        suggestions.goals.push('skill_development');
    }

    return suggestions;
}