const express = require('express');
const router = express.Router();
const { requireAuth, requireTeacherOrAdmin } = require('../middleware/auth');
const db = require('../config/database');
const logger = require('../config/logger');

// Get all users (admin/teacher only)
router.get('/', requireAuth, requireTeacherOrAdmin, async (req, res) => {
    try {
        const query = `
            SELECT 
                u.user_id, u.first_name, u.last_name, u.email, u.role, u.created_at,
                sp.year_level, sp.major, sp.profile_completion_percentage
            FROM users u
            LEFT JOIN student_profiles sp ON u.user_id = sp.student_id
            ORDER BY u.created_at DESC
        `;
        
        const [users] = await db.execute(query);
        
        res.json({
            success: true,
            users: users
        });
    } catch (error) {
        logger.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve users'
        });
    }
});

// Get current user profile
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        // Get user basic info
        const [users] = await db.execute(
            'SELECT user_id, first_name, last_name, email, role, created_at FROM users WHERE user_id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const user = users[0];
        
        // Get detailed profile if student
        if (user.role === 'student') {
            const [profiles] = await db.execute(
                `SELECT * FROM student_profiles WHERE student_id = ?`,
                [userId]
            );
            
            if (profiles.length > 0) {
                const profile = profiles[0];
                
                // Get skills
                const [skills] = await db.execute(
                    `SELECT s.skill_name, ss.proficiency_level, s.category 
                     FROM student_skills ss 
                     JOIN skills s ON ss.skill_id = s.skill_id 
                     WHERE ss.student_id = ?`,
                    [userId]
                );
                
                // Get interests
                const [interests] = await db.execute(
                    `SELECT i.interest_name 
                     FROM student_interests si 
                     JOIN interests i ON si.interest_id = i.interest_id 
                     WHERE si.student_id = ?`,
                    [userId]
                );
                
                // Parse JSON fields safely
                const parseJSON = (field) => {
                    try {
                        return field ? JSON.parse(field) : [];
                    } catch {
                        return [];
                    }
                };
                
                user.profile = {
                    ...profile,
                    technical_skills: skills.filter(s => s.category === 'technical'),
                    soft_skills: skills.filter(s => s.category === 'soft'),
                    interests: interests.map(i => i.interest_name),
                    extracurricular_activities: parseJSON(profile.extracurricular_activities),
                    hobbies: parseJSON(profile.hobbies),
                    languages: parseJSON(profile.languages)
                };
            }
        }
        
        res.json({
            success: true,
            user: user
        });
    } catch (error) {
        logger.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile'
        });
    }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const userId = req.user.user_id;
        const {
            first_name, last_name, email, phone, date_of_birth,
            year_level, major, short_term_goals, long_term_goals,
            career_aspirations, bio, linkedin_url, portfolio_url, 
            github_url, technical_skills, soft_skills, interests,
            extracurricular_activities, hobbies, languages
        } = req.body;
        
        // Update basic user info
        await connection.execute(
            `UPDATE users SET 
             first_name = ?, last_name = ?, email = ?, 
             phone = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE user_id = ?`,
            [first_name, last_name, email, phone, userId]
        );
        
        // Update or create student profile
        if (req.user.role === 'student') {
            // Check if profile exists
            const [existingProfile] = await connection.execute(
                'SELECT student_id FROM student_profiles WHERE student_id = ?',
                [userId]
            );
            
            const profileData = [
                year_level, major, short_term_goals, long_term_goals,
                career_aspirations, bio, linkedin_url, portfolio_url,
                github_url, date_of_birth,
                JSON.stringify(extracurricular_activities || []),
                JSON.stringify(hobbies || []),
                JSON.stringify(languages || [])
            ];
            
            if (existingProfile.length > 0) {
                // Update existing profile
                await connection.execute(
                    `UPDATE student_profiles SET 
                     year_level = ?, major = ?, short_term_goals = ?, long_term_goals = ?,
                     career_aspirations = ?, bio = ?, linkedin_url = ?, portfolio_url = ?,
                     github_url = ?, date_of_birth = ?, extracurricular_activities = ?,
                     hobbies = ?, languages = ?, updated_at = CURRENT_TIMESTAMP
                     WHERE student_id = ?`,
                    [...profileData, userId]
                );
            } else {
                // Create new profile
                await connection.execute(
                    `INSERT INTO student_profiles 
                     (student_id, year_level, major, short_term_goals, long_term_goals,
                      career_aspirations, bio, linkedin_url, portfolio_url, github_url,
                      date_of_birth, extracurricular_activities, hobbies, languages) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [userId, ...profileData]
                );
            }
            
            // Update skills
            if (technical_skills || soft_skills) {
                // Remove existing skills
                await connection.execute(
                    'DELETE FROM student_skills WHERE student_id = ?',
                    [userId]
                );
                
                // Add technical skills
                if (technical_skills && technical_skills.length > 0) {
                    for (const skill of technical_skills) {
                        // Insert or get skill
                        const [skillResult] = await connection.execute(
                            'INSERT IGNORE INTO skills (skill_name, category) VALUES (?, ?)',
                            [skill.name, 'technical']
                        );
                        
                        const [skillRows] = await connection.execute(
                            'SELECT skill_id FROM skills WHERE skill_name = ? AND category = ?',
                            [skill.name, 'technical']
                        );
                        
                        if (skillRows.length > 0) {
                            await connection.execute(
                                'INSERT INTO student_skills (student_id, skill_id, proficiency_level) VALUES (?, ?, ?)',
                                [userId, skillRows[0].skill_id, skill.proficiency]
                            );
                        }
                    }
                }
                
                // Add soft skills
                if (soft_skills && soft_skills.length > 0) {
                    for (const skill of soft_skills) {
                        // Insert or get skill
                        const [skillResult] = await connection.execute(
                            'INSERT IGNORE INTO skills (skill_name, category) VALUES (?, ?)',
                            [skill.name, 'soft']
                        );
                        
                        const [skillRows] = await connection.execute(
                            'SELECT skill_id FROM skills WHERE skill_name = ? AND category = ?',
                            [skill.name, 'soft']
                        );
                        
                        if (skillRows.length > 0) {
                            await connection.execute(
                                'INSERT INTO student_skills (student_id, skill_id, proficiency_level) VALUES (?, ?, ?)',
                                [userId, skillRows[0].skill_id, skill.proficiency]
                            );
                        }
                    }
                }
            }
            
            // Update interests
            if (interests) {
                // Remove existing interests
                await connection.execute(
                    'DELETE FROM student_interests WHERE student_id = ?',
                    [userId]
                );
                
                // Add new interests
                for (const interest of interests) {
                    // Insert or get interest
                    await connection.execute(
                        'INSERT IGNORE INTO interests (interest_name) VALUES (?)',
                        [interest]
                    );
                    
                    const [interestRows] = await connection.execute(
                        'SELECT interest_id FROM interests WHERE interest_name = ?',
                        [interest]
                    );
                    
                    if (interestRows.length > 0) {
                        await connection.execute(
                            'INSERT INTO student_interests (student_id, interest_id) VALUES (?, ?)',
                            [userId, interestRows[0].interest_id]
                        );
                    }
                }
            }
            
            // Calculate and update profile completion
            const completionPercentage = calculateProfileCompletion({
                first_name, last_name, email, year_level, major,
                short_term_goals, long_term_goals, bio,
                technical_skills, soft_skills, interests
            });
            
            await connection.execute(
                'UPDATE student_profiles SET profile_completion_percentage = ? WHERE student_id = ?',
                [completionPercentage, userId]
            );
        }
        
        await connection.commit();
        
        // Get updated user data
        const [updatedUser] = await connection.execute(
            'SELECT user_id, first_name, last_name, email, role FROM users WHERE user_id = ?',
            [userId]
        );
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser[0]
        });
        
    } catch (error) {
        await connection.rollback();
        logger.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    } finally {
        connection.release();
    }
});

// Helper function to calculate profile completion
function calculateProfileCompletion(data) {
    const requiredFields = [
        data.first_name, data.last_name, data.email, 
        data.year_level, data.major, data.short_term_goals, 
        data.long_term_goals, data.bio
    ];
    
    const completedFields = requiredFields.filter(field => field && field.trim()).length;
    const basePercentage = (completedFields / requiredFields.length) * 80;
    
    const skillsBonus = (data.technical_skills?.length > 0 || data.soft_skills?.length > 0) ? 10 : 0;
    const interestsBonus = (data.interests?.length > 0) ? 10 : 0;
    
    return Math.min(Math.round(basePercentage + skillsBonus + interestsBonus), 100);
}

module.exports = router;