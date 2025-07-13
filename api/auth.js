const { query, getClient } = require('./lib/db');
const { 
    hashPassword, 
    generateToken, 
    sendError, 
    sendSuccess,
    setCorsHeaders,
    validateEmail,
    validatePassword,
    validateName,
    authenticateToken
} = require('./lib/auth');

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        return res.status(200).end();
    }

    setCorsHeaders(res);

    const { action } = req.query;

    try {
        if (action === 'register' && req.method === 'POST') {
            // Registration
            const { email, password, first_name, last_name, role } = req.body;

            // Validation
            if (!validateEmail(email)) {
                return sendError(res, 400, 'Invalid email format');
            }
            if (!validatePassword(password)) {
                return sendError(res, 400, 'Password must be at least 8 characters with uppercase, lowercase, and number');
            }
            if (!validateName(first_name) || !validateName(last_name)) {
                return sendError(res, 400, 'Names must be 2-50 characters');
            }
            if (!['teacher', 'student'].includes(role)) {
                return sendError(res, 400, 'Role must be either teacher or student');
            }

            // Check if user exists
            const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
            if (existingUser.rows.length > 0) {
                return sendError(res, 400, 'An account with this email already exists');
            }

            // Hash password and create user
            const password_hash = await hashPassword(password);
            const client = await getClient();
            
            try {
                await client.query('BEGIN');

                const userResult = await client.query(`
                    INSERT INTO users (email, password_hash, role, first_name, last_name, email_verified) 
                    VALUES ($1, $2, $3, $4, $5, $6) 
                    RETURNING id, email, role, first_name, last_name
                `, [email, password_hash, role, first_name, last_name, true]);

                const user = userResult.rows[0];

                if (role === 'student') {
                    await client.query('INSERT INTO student_profiles (user_id) VALUES ($1)', [user.id]);
                }

                await client.query('COMMIT');

                const token = generateToken(user);
                
                await query(`
                    INSERT INTO activity_logs (user_id, action, details) 
                    VALUES ($1, $2, $3)
                `, [user.id, 'user_register', { role, email }]);

                sendSuccess(res, { user, token }, 'Account created successfully');

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } else if (action === 'login' && req.method === 'POST') {
            // Login
            const { email, password } = req.body;

            if (!email || !password) {
                return sendError(res, 400, 'Email and password are required');
            }

            const userResult = await query(`
                SELECT u.id, u.email, u.password_hash, u.role, u.first_name, u.last_name, u.is_active,
                       sp.year_level, sp.major, sp.profile_completion_percentage
                FROM users u
                LEFT JOIN student_profiles sp ON u.id = sp.user_id
                WHERE u.email = $1
            `, [email]);

            if (userResult.rows.length === 0) {
                return sendError(res, 401, 'Invalid email or password');
            }

            const user = userResult.rows[0];

            if (!user.is_active) {
                return sendError(res, 401, 'Account is deactivated');
            }

            const bcrypt = require('bcrypt');
            const validPassword = await bcrypt.compare(password, user.password_hash);

            if (!validPassword) {
                return sendError(res, 401, 'Invalid email or password');
            }

            // Update last login
            await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

            const token = generateToken(user);
            
            const userData = {
                id: user.id,
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name
            };

            if (user.role === 'student') {
                userData.profile = {
                    year_level: user.year_level,
                    major: user.major,
                    profile_completion_percentage: user.profile_completion_percentage || 0
                };
            }

            sendSuccess(res, { user: userData, token }, 'Login successful');

        } else if (action === 'me' && req.method === 'GET') {
            // Get current user
            const authResult = await authenticateToken(req);
            if (!authResult.success) {
                return sendError(res, 401, authResult.message);
            }

            const userResult = await query(`
                SELECT u.id, u.email, u.role, u.first_name, u.last_name,
                       sp.year_level, sp.major, sp.profile_completion_percentage
                FROM users u
                LEFT JOIN student_profiles sp ON u.id = sp.user_id
                WHERE u.id = $1 AND u.is_active = true
            `, [authResult.user.id]);

            if (userResult.rows.length === 0) {
                return sendError(res, 401, 'User not found');
            }

            const user = userResult.rows[0];
            const userData = {
                id: user.id,
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name
            };

            if (user.role === 'student') {
                userData.profile = {
                    year_level: user.year_level,
                    major: user.major,
                    profile_completion_percentage: user.profile_completion_percentage || 0
                };
            }

            res.status(200).json({
                success: true,
                authenticated: true,
                data: { user: userData }
            });

        } else {
            return sendError(res, 405, 'Method not allowed');
        }

    } catch (error) {
        console.error('Auth API error:', error);
        sendError(res, 500, 'Internal server error');
    }
}