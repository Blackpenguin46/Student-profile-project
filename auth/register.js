const { query, getClient } = require('../lib/db');
const { 
    hashPassword, 
    generateToken, 
    sendError, 
    sendSuccess,
    setCorsHeaders,
    validateEmail,
    validatePassword,
    validateName
} = require('../lib/auth');

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return sendError(res, 405, 'Method not allowed');
    }

    try {
        const { email, password, first_name, last_name, role } = req.body;

        // Validation
        if (!validateEmail(email)) {
            return sendError(res, 400, 'Invalid email format');
        }

        if (!validatePassword(password)) {
            return sendError(res, 400, 'Password must be at least 8 characters with uppercase, lowercase, and number');
        }

        if (!validateName(first_name)) {
            return sendError(res, 400, 'First name must be 2-50 characters');
        }

        if (!validateName(last_name)) {
            return sendError(res, 400, 'Last name must be 2-50 characters');
        }

        if (!['teacher', 'student'].includes(role)) {
            return sendError(res, 400, 'Role must be either teacher or student');
        }

        // Check if user already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return sendError(res, 400, 'An account with this email already exists');
        }

        // Hash password
        const password_hash = await hashPassword(password);

        // Use transaction for user creation
        const client = await getClient();
        
        try {
            await client.query('BEGIN');

            // Create user
            const userResult = await client.query(
                `INSERT INTO users (email, password_hash, role, first_name, last_name, email_verified) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 RETURNING id, email, role, first_name, last_name`,
                [email, password_hash, role, first_name, last_name, true]
            );

            const user = userResult.rows[0];

            // Create student profile if role is student
            if (role === 'student') {
                await client.query(
                    'INSERT INTO student_profiles (user_id) VALUES ($1)',
                    [user.id]
                );
            }

            await client.query('COMMIT');

            // Generate token
            const token = generateToken(user);

            // Log activity
            await query(
                `INSERT INTO activity_logs (user_id, action, details) 
                 VALUES ($1, $2, $3)`,
                [user.id, 'user_register', { role, email }]
            );

            sendSuccess(res, {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    first_name: user.first_name,
                    last_name: user.last_name
                },
                token
            }, 'Account created successfully');

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Registration error:', error);
        sendError(res, 500, 'Failed to create account');
    }
}