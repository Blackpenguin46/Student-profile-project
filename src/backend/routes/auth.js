const express = require('express');
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const router = express.Router();

const db = require('../config/database');
const logger = require('../config/logger');
const { 
    authLimiter, 
    passwordResetLimiter,
    validateEmail, 
    validatePassword, 
    validateName,
    handleValidationErrors,
    logActivity
} = require('../middleware/security');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Registration endpoint
router.post('/register', 
    authLimiter,
    [
        validateEmail,
        validatePassword,
        validateName('first_name'),
        validateName('last_name'),
        body('role')
            .isIn(['teacher', 'student'])
            .withMessage('Role must be either teacher or student'),
        body('class_code')
            .optional()
            .isLength({ min: 1, max: 20 })
            .withMessage('Class code must be provided for student registration')
    ],
    handleValidationErrors,
    logActivity('user_register', 'user'),
    async (req, res) => {
        try {
            const { email, password, first_name, last_name, role, class_code } = req.body;

            // Check if user already exists
            const existingUsers = await db.query(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'An account with this email already exists'
                });
            }

            // Validate class code for students
            if (role === 'student') {
                if (!class_code) {
                    return res.status(400).json({
                        success: false,
                        message: 'Class code is required for student registration'
                    });
                }

                const classes = await db.query(
                    'SELECT id, teacher_id FROM classes WHERE class_code = ? AND is_active = TRUE',
                    [class_code]
                );

                if (classes.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid class code'
                    });
                }
            }

            // Hash password
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            const password_hash = await bcrypt.hash(password, saltRounds);

            // Create user
            const result = await db.query(
                'INSERT INTO users (email, password_hash, role, first_name, last_name, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
                [email, password_hash, role, first_name, last_name, process.env.NODE_ENV === 'development']
            );

            const userId = result.insertId;

            // Create student profile if role is student
            if (role === 'student') {
                const profileResult = await db.query(
                    'INSERT INTO student_profiles (user_id) VALUES (?)',
                    [userId]
                );

                // Enroll student in class
                const classInfo = await db.query(
                    'SELECT id FROM classes WHERE class_code = ?',
                    [class_code]
                );

                if (classInfo.length > 0) {
                    await db.query(
                        'INSERT INTO class_enrollments (class_id, student_profile_id) VALUES (?, ?)',
                        [classInfo[0].id, profileResult.insertId]
                    );
                }
            }

            logger.info(`New ${role} registered:`, { userId, email, role });

            res.status(201).json({
                success: true,
                message: 'Account created successfully',
                user: {
                    id: userId,
                    email,
                    role,
                    first_name,
                    last_name
                }
            });

        } catch (error) {
            logger.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create account'
            });
        }
    }
);

// Login endpoint
router.post('/login',
    authLimiter,
    [
        validateEmail,
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ],
    handleValidationErrors,
    logActivity('user_login', 'user'),
    async (req, res) => {
        try {
            const { email, password } = req.body;

            // Find user
            const users = await db.query(
                'SELECT id, email, password_hash, role, first_name, last_name, is_active FROM users WHERE email = ?',
                [email]
            );

            if (users.length === 0) {
                logger.warn('Failed login attempt - user not found:', { email, ip: req.ip });
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            const user = users[0];

            if (!user.is_active) {
                logger.warn('Failed login attempt - account deactivated:', { email, ip: req.ip });
                return res.status(401).json({
                    success: false,
                    message: 'Account has been deactivated'
                });
            }

            // Verify password
            const passwordValid = await bcrypt.compare(password, user.password_hash);
            if (!passwordValid) {
                logger.warn('Failed login attempt - invalid password:', { email, ip: req.ip });
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Update last login
            await db.query(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [user.id]
            );

            // Create session
            req.session.userId = user.id;
            req.session.userEmail = user.email;
            req.session.userRole = user.role;

            logger.info('Successful login:', { userId: user.id, email: user.email, role: user.role, ip: req.ip });

            res.json({
                success: true,
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    first_name: user.first_name,
                    last_name: user.last_name
                }
            });

        } catch (error) {
            logger.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Login failed'
            });
        }
    }
);

// Logout endpoint
router.post('/logout', 
    requireAuth,
    logActivity('user_logout', 'user'),
    (req, res) => {
        const userId = req.session.userId;
        
        req.session.destroy((err) => {
            if (err) {
                logger.error('Logout error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to logout'
                });
            }

            logger.info('User logged out:', { userId });
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        });
    }
);

// Check authentication status
router.get('/me', optionalAuth, async (req, res) => {
    if (!req.user) {
        return res.json({
            success: false,
            authenticated: false,
            message: 'Not authenticated'
        });
    }

    try {
        // Get fresh user data
        const users = await db.query(
            'SELECT id, email, role, first_name, last_name, last_login FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                authenticated: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        // Get student profile if user is a student
        let profile = null;
        if (user.role === 'student') {
            const profiles = await db.query(
                'SELECT id, student_id_num, year_grade, major_focus, profile_completion_percentage FROM student_profiles WHERE user_id = ?',
                [user.id]
            );
            if (profiles.length > 0) {
                profile = profiles[0];
            }
        }

        res.json({
            success: true,
            authenticated: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                last_login: user.last_login,
                profile
            }
        });

    } catch (error) {
        logger.error('Failed to get user info:', error);
        res.status(500).json({
            success: false,
            authenticated: false,
            message: 'Failed to get user information'
        });
    }
});

// Password reset request
router.post('/forgot-password',
    passwordResetLimiter,
    [validateEmail],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { email } = req.body;

            // Check if user exists
            const users = await db.query(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            // Always return success to prevent email enumeration
            if (users.length === 0) {
                logger.warn('Password reset requested for non-existent email:', { email, ip: req.ip });
                return res.json({
                    success: true,
                    message: 'If an account exists with this email, you will receive password reset instructions'
                });
            }

            // Generate reset token (in real implementation, this would be sent via email)
            const resetToken = Math.random().toString(36).substr(2, 32);
            const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            await db.query(
                'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
                [resetToken, resetExpires, email]
            );

            logger.info('Password reset token generated:', { email, token: resetToken });

            // In a real implementation, send email here
            if (process.env.NODE_ENV === 'development') {
                logger.info(`Password reset link: http://localhost:3000/reset-password?token=${resetToken}`);
            }

            res.json({
                success: true,
                message: 'If an account exists with this email, you will receive password reset instructions',
                ...(process.env.NODE_ENV === 'development' && { 
                    debug_reset_token: resetToken 
                })
            });

        } catch (error) {
            logger.error('Password reset request error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process password reset request'
            });
        }
    }
);

// Password reset confirmation
router.post('/reset-password',
    passwordResetLimiter,
    [
        body('token')
            .notEmpty()
            .withMessage('Reset token is required'),
        validatePassword
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { token, password } = req.body;

            // Find user by reset token
            const users = await db.query(
                'SELECT id, email FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
                [token]
            );

            if (users.length === 0) {
                logger.warn('Invalid or expired reset token used:', { token, ip: req.ip });
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token'
                });
            }

            const user = users[0];

            // Hash new password
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            const password_hash = await bcrypt.hash(password, saltRounds);

            // Update password and clear reset token
            await db.query(
                'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
                [password_hash, user.id]
            );

            logger.info('Password reset completed:', { userId: user.id, email: user.email });

            res.json({
                success: true,
                message: 'Password reset successfully'
            });

        } catch (error) {
            logger.error('Password reset error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reset password'
            });
        }
    }
);

module.exports = router;