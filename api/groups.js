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
            if (id === 'algorithms') {
                // Get group formation algorithms and recommendations
                return await getGroupFormationAlgorithms(req, res, user);
            } else if (id === 'suggest') {
                // Get intelligent group suggestions
                return await getGroupSuggestions(req, res, user);
            } else if (id) {
                // Get specific group
                return await getGroup(req, res, user, parseInt(id));
            } else {
                // List all groups
                return await getGroups(req, res, user);
            }

        } else if (req.method === 'POST') {
            if (id === 'create-intelligent') {
                // Create groups using intelligent algorithms
                return await createIntelligentGroups(req, res, user);
            } else {
                // Create manual group
                return await createGroup(req, res, user);
            }

        } else if (req.method === 'PUT' && id) {
            // Update group
            return await updateGroup(req, res, user, parseInt(id));

        } else if (req.method === 'DELETE' && id) {
            // Delete group
            return await deleteGroup(req, res, user, parseInt(id));

        } else {
            return sendError(res, 405, 'Method not allowed');
        }

    } catch (error) {
        console.error('Groups API error:', error);
        sendError(res, 500, 'Internal server error');
    }
}

// Get all groups for the user
async function getGroups(req, res, user) {
    try {
        // Only teachers and admins can manage groups
        if (!['teacher', 'admin'].includes(user.role)) {
            return sendError(res, 403, 'Access denied');
        }

        const { page = 1, limit = 20, projectId, status } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const queryParams = [];
        let paramIndex = 1;

        // Filter by project if specified
        if (projectId) {
            whereClause += ` AND g.project_id = $${paramIndex}`;
            queryParams.push(parseInt(projectId));
            paramIndex++;
        }

        // Filter by status if specified
        if (status) {
            whereClause += ` AND g.status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }

        const groupsQuery = `
            SELECT 
                g.id, g.name, g.description, g.project_id, g.max_size, g.status,
                g.formation_criteria, g.created_at, g.updated_at,
                p.title as project_title,
                COUNT(gm.user_id) as current_size,
                ARRAY_AGG(
                    CASE WHEN gm.user_id IS NOT NULL THEN
                        JSON_BUILD_OBJECT(
                            'id', u.id,
                            'name', u.first_name || ' ' || u.last_name,
                            'email', u.email,
                            'role_in_group', gm.role
                        )
                    END
                ) FILTER (WHERE gm.user_id IS NOT NULL) as members
            FROM groups g
            LEFT JOIN projects p ON g.project_id = p.id
            LEFT JOIN group_members gm ON g.id = gm.group_id
            LEFT JOIN users u ON gm.user_id = u.id
            ${whereClause}
            GROUP BY g.id, p.title
            ORDER BY g.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        const countQuery = `
            SELECT COUNT(*) as total
            FROM groups g
            ${whereClause}
        `;

        queryParams.push(limit, offset);

        const [groupsResult, countResult] = await Promise.all([
            query(groupsQuery, queryParams),
            query(countQuery, queryParams.slice(0, -2))
        ]);

        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);

        return sendSuccess(res, {
            groups: groupsResult.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get groups error:', error);
        return sendError(res, 500, 'Failed to fetch groups');
    }
}

// Get specific group with detailed information
async function getGroup(req, res, user, groupId) {
    try {
        if (!['teacher', 'admin'].includes(user.role)) {
            return sendError(res, 403, 'Access denied');
        }

        const groupResult = await query(`
            SELECT 
                g.*,
                p.title as project_title, p.description as project_description,
                COUNT(gm.user_id) as current_size
            FROM groups g
            LEFT JOIN projects p ON g.project_id = p.id
            LEFT JOIN group_members gm ON g.id = gm.group_id
            WHERE g.id = $1
            GROUP BY g.id, p.title, p.description
        `, [groupId]);

        if (groupResult.rows.length === 0) {
            return sendError(res, 404, 'Group not found');
        }

        const group = groupResult.rows[0];

        // Get group members with their profiles
        const membersResult = await query(`
            SELECT 
                u.id, u.first_name, u.last_name, u.email,
                gm.role as role_in_group, gm.joined_at,
                sp.year_level, sp.major, sp.profile_completion_percentage,
                COALESCE(
                    (SELECT JSON_AGG(JSON_BUILD_OBJECT('id', s.id, 'name', s.skill_name, 'proficiency', ss.proficiency_level))
                     FROM student_skills ss 
                     JOIN skills s ON ss.skill_id = s.id 
                     WHERE ss.user_id = u.id), '[]'::json
                ) as skills,
                COALESCE(
                    (SELECT JSON_AGG(JSON_BUILD_OBJECT('id', i.id, 'name', i.interest_name))
                     FROM student_interests si 
                     JOIN interests i ON si.interest_id = i.id 
                     WHERE si.user_id = u.id), '[]'::json
                ) as interests
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            LEFT JOIN student_profiles sp ON u.id = sp.user_id
            WHERE gm.group_id = $1
            ORDER BY gm.joined_at
        `, [groupId]);

        group.members = membersResult.rows;

        return sendSuccess(res, { group });

    } catch (error) {
        console.error('Get group error:', error);
        return sendError(res, 500, 'Failed to fetch group');
    }
}

// Create a new group manually
async function createGroup(req, res, user) {
    try {
        if (!['teacher', 'admin'].includes(user.role)) {
            return sendError(res, 403, 'Access denied');
        }

        const {
            name,
            description,
            projectId,
            maxSize = 4,
            formationCriteria = {},
            memberIds = []
        } = req.body;

        if (!name) {
            return sendError(res, 400, 'Group name is required');
        }

        // Create the group
        const groupResult = await query(`
            INSERT INTO groups (name, description, project_id, max_size, formation_criteria, created_by, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'active')
            RETURNING *
        `, [name, description, projectId || null, maxSize, JSON.stringify(formationCriteria), user.id]);

        const group = groupResult.rows[0];

        // Add members if provided
        if (memberIds.length > 0) {
            for (const memberId of memberIds) {
                await query(`
                    INSERT INTO group_members (group_id, user_id, role, joined_at)
                    VALUES ($1, $2, 'member', CURRENT_TIMESTAMP)
                `, [group.id, memberId]);
            }
        }

        return sendSuccess(res, { 
            group,
            message: 'Group created successfully'
        });

    } catch (error) {
        console.error('Create group error:', error);
        return sendError(res, 500, 'Failed to create group');
    }
}

// Get group formation algorithms and criteria
async function getGroupFormationAlgorithms(req, res, user) {
    try {
        if (!['teacher', 'admin'].includes(user.role)) {
            return sendError(res, 403, 'Access denied');
        }

        const algorithms = {
            balanced_skills: {
                name: 'Balanced Skills',
                description: 'Create groups with complementary skill sets, ensuring each group has diverse abilities',
                criteria: ['skills_diversity', 'skill_levels', 'technical_balance'],
                optimal_size: 4,
                considerations: [
                    'Each group gets members with different technical skills',
                    'Balances skill proficiency levels across groups',
                    'Ensures no group is all beginners or all experts'
                ]
            },
            similar_interests: {
                name: 'Similar Interests',
                description: 'Group students with similar interests and career goals for better collaboration',
                criteria: ['interests_overlap', 'career_alignment', 'project_preferences'],
                optimal_size: 3,
                considerations: [
                    'Students with similar interests work well together',
                    'Aligned career goals improve motivation',
                    'Shared interests lead to better communication'
                ]
            },
            mixed_experience: {
                name: 'Mixed Experience Levels',
                description: 'Combine students of different experience levels for peer mentoring',
                criteria: ['year_level_mix', 'experience_diversity', 'mentoring_opportunities'],
                optimal_size: 4,
                considerations: [
                    'Senior students can mentor juniors',
                    'Different perspectives from various experience levels',
                    'Knowledge transfer between group members'
                ]
            },
            project_optimized: {
                name: 'Project-Optimized',
                description: 'Form groups specifically optimized for the selected project requirements',
                criteria: ['project_skills_match', 'required_expertise', 'workload_distribution'],
                optimal_size: 'variable',
                considerations: [
                    'Groups have skills required for specific project',
                    'Workload is distributed based on member capabilities',
                    'Project timeline considerations'
                ]
            },
            random_balanced: {
                name: 'Random with Balance',
                description: 'Random assignment with basic balancing to ensure fair distribution',
                criteria: ['random_assignment', 'basic_balance', 'equal_group_sizes'],
                optimal_size: 4,
                considerations: [
                    'Promotes interaction between unlikely collaborators',
                    'Reduces bias in group formation',
                    'Ensures equal group sizes'
                ]
            }
        };

        const formationCriteria = {
            skills_factors: {
                diversity_weight: 0.4,
                complementarity_weight: 0.3,
                proficiency_balance_weight: 0.3
            },
            interests_factors: {
                overlap_threshold: 0.6,
                career_alignment_weight: 0.5,
                project_preference_weight: 0.5
            },
            experience_factors: {
                year_level_spread: 0.4,
                skill_level_distribution: 0.6
            },
            group_constraints: {
                min_size: 2,
                max_size: 6,
                preferred_size: 4
            }
        };

        return sendSuccess(res, {
            algorithms,
            formationCriteria,
            availableProjects: await getAvailableProjects()
        });

    } catch (error) {
        console.error('Get algorithms error:', error);
        return sendError(res, 500, 'Failed to fetch algorithms');
    }
}

// Get intelligent group suggestions
async function getGroupSuggestions(req, res, user) {
    try {
        if (!['teacher', 'admin'].includes(user.role)) {
            return sendError(res, 403, 'Access denied');
        }

        const { 
            algorithm = 'balanced_skills',
            groupSize = 4,
            projectId,
            includeStudents = [],
            excludeStudents = [] 
        } = req.query;

        // Get available students with their profiles
        const studentsResult = await query(`
            SELECT 
                u.id, u.first_name, u.last_name, u.email,
                sp.year_level, sp.major, sp.profile_completion_percentage,
                COALESCE(
                    (SELECT JSON_AGG(JSON_BUILD_OBJECT(
                        'id', s.id, 
                        'name', s.skill_name, 
                        'category', s.category,
                        'proficiency', ss.proficiency_level
                    ))
                     FROM student_skills ss 
                     JOIN skills s ON ss.skill_id = s.id 
                     WHERE ss.user_id = u.id), '[]'::json
                ) as skills,
                COALESCE(
                    (SELECT JSON_AGG(JSON_BUILD_OBJECT(
                        'id', i.id, 
                        'name', i.interest_name,
                        'category', i.category
                    ))
                     FROM student_interests si 
                     JOIN interests i ON si.interest_id = i.id 
                     WHERE si.user_id = u.id), '[]'::json
                ) as interests
            FROM users u
            LEFT JOIN student_profiles sp ON u.id = sp.user_id
            WHERE u.role = 'student' AND u.is_active = true
            ${excludeStudents.length > 0 ? `AND u.id NOT IN (${excludeStudents.map((_, i) => `$${i + 1}`).join(',')})` : ''}
            ORDER BY u.first_name, u.last_name
        `, excludeStudents.length > 0 ? excludeStudents : []);

        const students = studentsResult.rows;

        // Apply the selected algorithm
        let groupSuggestions;
        switch (algorithm) {
            case 'balanced_skills':
                groupSuggestions = generateBalancedSkillsGroups(students, parseInt(groupSize));
                break;
            case 'similar_interests':
                groupSuggestions = generateSimilarInterestsGroups(students, parseInt(groupSize));
                break;
            case 'mixed_experience':
                groupSuggestions = generateMixedExperienceGroups(students, parseInt(groupSize));
                break;
            case 'random_balanced':
                groupSuggestions = generateRandomBalancedGroups(students, parseInt(groupSize));
                break;
            default:
                groupSuggestions = generateBalancedSkillsGroups(students, parseInt(groupSize));
        }

        return sendSuccess(res, {
            algorithm,
            groupSize: parseInt(groupSize),
            totalStudents: students.length,
            suggestedGroups: groupSuggestions,
            groupAnalysis: analyzeGroupQuality(groupSuggestions)
        });

    } catch (error) {
        console.error('Get suggestions error:', error);
        return sendError(res, 500, 'Failed to generate group suggestions');
    }
}

// Create groups using intelligent algorithms
async function createIntelligentGroups(req, res, user) {
    try {
        if (!['teacher', 'admin'].includes(user.role)) {
            return sendError(res, 403, 'Access denied');
        }

        const {
            projectId,
            algorithm = 'balanced_skills',
            groupSize = 4,
            groupNames = [],
            groups
        } = req.body;

        if (!groups || !Array.isArray(groups)) {
            return sendError(res, 400, 'Groups data is required');
        }

        const createdGroups = [];

        // Create each group
        for (let i = 0; i < groups.length; i++) {
            const groupData = groups[i];
            const groupName = groupNames[i] || `Group ${i + 1}`;

            // Create the group
            const groupResult = await query(`
                INSERT INTO groups (
                    name, description, project_id, max_size, 
                    formation_criteria, created_by, status
                )
                VALUES ($1, $2, $3, $4, $5, $6, 'active')
                RETURNING *
            `, [
                groupName,
                `Automatically formed using ${algorithm} algorithm`,
                projectId || null,
                groupSize,
                JSON.stringify({
                    algorithm,
                    formation_date: new Date().toISOString(),
                    quality_score: groupData.qualityScore || 0
                }),
                user.id
            ]);

            const group = groupResult.rows[0];

            // Add members to the group
            for (const member of groupData.members) {
                await query(`
                    INSERT INTO group_members (group_id, user_id, role, joined_at)
                    VALUES ($1, $2, 'member', CURRENT_TIMESTAMP)
                `, [group.id, member.id]);
            }

            createdGroups.push({
                ...group,
                members: groupData.members,
                qualityScore: groupData.qualityScore
            });
        }

        return sendSuccess(res, {
            message: `Successfully created ${createdGroups.length} groups using ${algorithm} algorithm`,
            groups: createdGroups,
            algorithm,
            totalMembers: groups.reduce((sum, group) => sum + group.members.length, 0)
        });

    } catch (error) {
        console.error('Create intelligent groups error:', error);
        return sendError(res, 500, 'Failed to create intelligent groups');
    }
}

// Algorithm implementations
function generateBalancedSkillsGroups(students, groupSize) {
    const groups = [];
    const availableStudents = [...students];
    
    while (availableStudents.length >= groupSize) {
        const group = {
            members: [],
            qualityScore: 0,
            skillDistribution: {},
            analysis: {}
        };

        // Start with a student who has diverse skills
        const starter = availableStudents.reduce((best, student) => {
            const skillCount = Array.isArray(student.skills) ? student.skills.length : 0;
            const bestSkillCount = Array.isArray(best.skills) ? best.skills.length : 0;
            return skillCount > bestSkillCount ? student : best;
        });

        group.members.push(starter);
        availableStudents.splice(availableStudents.indexOf(starter), 1);

        // Add complementary members
        while (group.members.length < groupSize && availableStudents.length > 0) {
            const existingSkills = new Set();
            group.members.forEach(member => {
                if (Array.isArray(member.skills)) {
                    member.skills.forEach(skill => existingSkills.add(skill.name));
                }
            });

            // Find student with most complementary skills
            const nextMember = availableStudents.reduce((best, student) => {
                const studentSkills = Array.isArray(student.skills) ? student.skills : [];
                const newSkills = studentSkills.filter(skill => !existingSkills.has(skill.name)).length;
                const bestStudentSkills = Array.isArray(best.skills) ? best.skills : [];
                const bestNewSkills = bestStudentSkills.filter(skill => !existingSkills.has(skill.name)).length;
                
                return newSkills > bestNewSkills ? student : best;
            });

            group.members.push(nextMember);
            availableStudents.splice(availableStudents.indexOf(nextMember), 1);
        }

        // Calculate quality score
        group.qualityScore = calculateGroupQualityScore(group.members);
        group.analysis = analyzeGroupComposition(group.members);
        
        groups.push(group);
    }

    return groups;
}

function generateSimilarInterestsGroups(students, groupSize) {
    const groups = [];
    const availableStudents = [...students];

    while (availableStudents.length >= groupSize) {
        const group = {
            members: [],
            qualityScore: 0,
            interestOverlap: {},
            analysis: {}
        };

        // Start with a random student
        const starter = availableStudents[Math.floor(Math.random() * availableStudents.length)];
        group.members.push(starter);
        availableStudents.splice(availableStudents.indexOf(starter), 1);

        const starterInterests = Array.isArray(starter.interests) ? starter.interests.map(i => i.name) : [];

        // Add students with similar interests
        while (group.members.length < groupSize && availableStudents.length > 0) {
            const nextMember = availableStudents.reduce((best, student) => {
                const studentInterests = Array.isArray(student.interests) ? student.interests.map(i => i.name) : [];
                const overlap = starterInterests.filter(interest => studentInterests.includes(interest)).length;
                
                const bestInterests = Array.isArray(best.interests) ? best.interests.map(i => i.name) : [];
                const bestOverlap = starterInterests.filter(interest => bestInterests.includes(interest)).length;
                
                return overlap > bestOverlap ? student : best;
            });

            group.members.push(nextMember);
            availableStudents.splice(availableStudents.indexOf(nextMember), 1);
        }

        group.qualityScore = calculateInterestOverlapScore(group.members);
        group.analysis = analyzeGroupComposition(group.members);
        
        groups.push(group);
    }

    return groups;
}

function generateMixedExperienceGroups(students, groupSize) {
    const groups = [];
    const availableStudents = [...students];
    
    // Sort students by experience level (year level)
    const yearLevelOrder = { 'Freshman': 1, 'Sophomore': 2, 'Junior': 3, 'Senior': 4, 'Graduate': 5, 'PhD': 6 };
    availableStudents.sort((a, b) => {
        const aLevel = yearLevelOrder[a.year_level] || 0;
        const bLevel = yearLevelOrder[b.year_level] || 0;
        return bLevel - aLevel; // Sort descending (most experienced first)
    });

    while (availableStudents.length >= groupSize) {
        const group = {
            members: [],
            qualityScore: 0,
            experienceDistribution: {},
            analysis: {}
        };

        // Take students from different experience levels
        const experienceLevels = [...new Set(availableStudents.map(s => s.year_level).filter(Boolean))];
        
        for (let i = 0; i < groupSize && availableStudents.length > 0; i++) {
            // Try to get from different experience levels
            const targetLevel = experienceLevels[i % experienceLevels.length];
            let memberIndex = availableStudents.findIndex(s => s.year_level === targetLevel);
            
            if (memberIndex === -1) {
                memberIndex = 0; // Take any available student
            }

            group.members.push(availableStudents[memberIndex]);
            availableStudents.splice(memberIndex, 1);
        }

        group.qualityScore = calculateExperienceMixScore(group.members);
        group.analysis = analyzeGroupComposition(group.members);
        
        groups.push(group);
    }

    return groups;
}

function generateRandomBalancedGroups(students, groupSize) {
    const groups = [];
    const availableStudents = [...students];
    
    // Shuffle students randomly
    for (let i = availableStudents.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableStudents[i], availableStudents[j]] = [availableStudents[j], availableStudents[i]];
    }

    while (availableStudents.length >= groupSize) {
        const group = {
            members: availableStudents.splice(0, groupSize),
            qualityScore: 0,
            analysis: {}
        };

        group.qualityScore = calculateGroupQualityScore(group.members);
        group.analysis = analyzeGroupComposition(group.members);
        
        groups.push(group);
    }

    return groups;
}

// Quality analysis functions
function calculateGroupQualityScore(members) {
    if (!members || members.length === 0) return 0;

    let score = 0;
    const factors = {
        skillDiversity: 0.3,
        experienceBalance: 0.3,
        profileCompleteness: 0.2,
        groupSize: 0.2
    };

    // Skill diversity score
    const allSkills = new Set();
    members.forEach(member => {
        if (Array.isArray(member.skills)) {
            member.skills.forEach(skill => allSkills.add(skill.name));
        }
    });
    const skillDiversityScore = Math.min(allSkills.size / 10, 1) * 100; // Max 10 unique skills = 100%

    // Experience balance score
    const yearLevels = members.map(m => m.year_level).filter(Boolean);
    const uniqueYearLevels = new Set(yearLevels).size;
    const experienceBalanceScore = (uniqueYearLevels / Math.min(members.length, 4)) * 100;

    // Profile completeness score
    const completionScores = members.map(m => m.profile_completion_percentage || 0);
    const avgCompletion = completionScores.reduce((sum, score) => sum + score, 0) / completionScores.length;

    // Group size score (optimal size is 4)
    const groupSizeScore = Math.max(0, 100 - Math.abs(members.length - 4) * 20);

    score = (skillDiversityScore * factors.skillDiversity) +
            (experienceBalanceScore * factors.experienceBalance) +
            (avgCompletion * factors.profileCompleteness) +
            (groupSizeScore * factors.groupSize);

    return Math.round(score);
}

function calculateInterestOverlapScore(members) {
    if (!members || members.length === 0) return 0;

    const allInterests = [];
    members.forEach(member => {
        if (Array.isArray(member.interests)) {
            member.interests.forEach(interest => allInterests.push(interest.name));
        }
    });

    const interestCounts = {};
    allInterests.forEach(interest => {
        interestCounts[interest] = (interestCounts[interest] || 0) + 1;
    });

    const sharedInterests = Object.values(interestCounts).filter(count => count > 1).length;
    const totalUniqueInterests = Object.keys(interestCounts).length;

    return totalUniqueInterests > 0 ? Math.round((sharedInterests / totalUniqueInterests) * 100) : 0;
}

function calculateExperienceMixScore(members) {
    if (!members || members.length === 0) return 0;

    const yearLevels = members.map(m => m.year_level).filter(Boolean);
    const uniqueYearLevels = new Set(yearLevels).size;
    
    // Higher score for more diverse experience levels
    const diversityScore = (uniqueYearLevels / Math.min(members.length, 4)) * 100;
    
    return Math.round(diversityScore);
}

function analyzeGroupComposition(members) {
    const analysis = {
        skillCategories: {},
        yearLevelDistribution: {},
        majors: {},
        averageProfileCompletion: 0,
        totalSkills: 0,
        totalInterests: 0
    };

    // Analyze skills
    members.forEach(member => {
        if (Array.isArray(member.skills)) {
            member.skills.forEach(skill => {
                const category = skill.category || 'Other';
                analysis.skillCategories[category] = (analysis.skillCategories[category] || 0) + 1;
                analysis.totalSkills++;
            });
        }

        if (Array.isArray(member.interests)) {
            analysis.totalInterests += member.interests.length;
        }

        // Year level distribution
        if (member.year_level) {
            analysis.yearLevelDistribution[member.year_level] = (analysis.yearLevelDistribution[member.year_level] || 0) + 1;
        }

        // Majors
        if (member.major) {
            analysis.majors[member.major] = (analysis.majors[member.major] || 0) + 1;
        }
    });

    // Average profile completion
    const completionScores = members.map(m => m.profile_completion_percentage || 0);
    analysis.averageProfileCompletion = Math.round(
        completionScores.reduce((sum, score) => sum + score, 0) / completionScores.length
    );

    return analysis;
}

function analyzeGroupQuality(groups) {
    if (!groups || groups.length === 0) return {};

    const overallAnalysis = {
        totalGroups: groups.length,
        averageQualityScore: 0,
        averageGroupSize: 0,
        skillDistribution: {},
        qualityDistribution: { high: 0, medium: 0, low: 0 }
    };

    let totalQuality = 0;
    let totalMembers = 0;

    groups.forEach(group => {
        totalQuality += group.qualityScore || 0;
        totalMembers += group.members.length;

        // Categorize quality
        const score = group.qualityScore || 0;
        if (score >= 80) overallAnalysis.qualityDistribution.high++;
        else if (score >= 60) overallAnalysis.qualityDistribution.medium++;
        else overallAnalysis.qualityDistribution.low++;

        // Aggregate skill categories
        if (group.analysis && group.analysis.skillCategories) {
            Object.entries(group.analysis.skillCategories).forEach(([category, count]) => {
                overallAnalysis.skillDistribution[category] = (overallAnalysis.skillDistribution[category] || 0) + count;
            });
        }
    });

    overallAnalysis.averageQualityScore = Math.round(totalQuality / groups.length);
    overallAnalysis.averageGroupSize = Math.round(totalMembers / groups.length);

    return overallAnalysis;
}

// Helper function to get available projects
async function getAvailableProjects() {
    try {
        const result = await query(`
            SELECT id, title, description, required_skills, max_groups
            FROM projects
            WHERE status = 'active'
            ORDER BY created_at DESC
        `);
        return result.rows;
    } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
}

// Update group
async function updateGroup(req, res, user, groupId) {
    try {
        if (!['teacher', 'admin'].includes(user.role)) {
            return sendError(res, 403, 'Access denied');
        }

        const { name, description, maxSize, status, memberIds = [] } = req.body;

        // Update group details
        const updateResult = await query(`
            UPDATE groups 
            SET name = COALESCE($1, name),
                description = COALESCE($2, description),
                max_size = COALESCE($3, max_size),
                status = COALESCE($4, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING *
        `, [name, description, maxSize, status, groupId]);

        if (updateResult.rows.length === 0) {
            return sendError(res, 404, 'Group not found');
        }

        // Update members if provided
        if (memberIds.length > 0) {
            // Remove existing members
            await query('DELETE FROM group_members WHERE group_id = $1', [groupId]);
            
            // Add new members
            for (const memberId of memberIds) {
                await query(`
                    INSERT INTO group_members (group_id, user_id, role, joined_at)
                    VALUES ($1, $2, 'member', CURRENT_TIMESTAMP)
                `, [groupId, memberId]);
            }
        }

        return sendSuccess(res, {
            group: updateResult.rows[0],
            message: 'Group updated successfully'
        });

    } catch (error) {
        console.error('Update group error:', error);
        return sendError(res, 500, 'Failed to update group');
    }
}

// Delete group
async function deleteGroup(req, res, user, groupId) {
    try {
        if (!['teacher', 'admin'].includes(user.role)) {
            return sendError(res, 403, 'Access denied');
        }

        // Delete group members first
        await query('DELETE FROM group_members WHERE group_id = $1', [groupId]);
        
        // Delete the group
        const deleteResult = await query('DELETE FROM groups WHERE id = $1 RETURNING *', [groupId]);

        if (deleteResult.rows.length === 0) {
            return sendError(res, 404, 'Group not found');
        }

        return sendSuccess(res, {
            message: 'Group deleted successfully'
        });

    } catch (error) {
        console.error('Delete group error:', error);
        return sendError(res, 500, 'Failed to delete group');
    }
}