const { query } = require('../lib/db');
const { 
    comparePassword, 
    generateToken, 
    sendError, 
    sendSuccess,
    setCorsHeaders,
    validateEmail
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
        const { email, password } = req.body;

        // Validation
        if (!validateEmail(email)) {
            return sendError(res, 400, 'Invalid email format');
        }

        if (!password) {
            return sendError(res, 400, 'Password is required');
        }

        // Find user
        const userResult = await query(
            `SELECT id, email, password_hash, role, first_name, last_name, is_active 
             FROM users WHERE email = $1`,
            [email]
        );

        if (userResult.rows.length === 0) {
            return sendError(res, 401, 'Invalid email or password');
        }

        const user = userResult.rows[0];

        if (!user.is_active) {
            return sendError(res, 401, 'Account is deactivated');
        }

        // Verify password
        const passwordValid = await comparePassword(password, user.password_hash);
        if (!passwordValid) {
            return sendError(res, 401, 'Invalid email or password');
        }

        // Update last login
        await query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Generate token
        const token = generateToken(user);

        // Log activity
        await query(
            `INSERT INTO activity_logs (user_id, action, details) 
             VALUES ($1, $2, $3)`,
            [user.id, 'user_login', { email }]
        );

        // Get additional profile data for students
        let profileData = null;
        if (user.role === 'student') {
            const profileResult = await query(
                `SELECT year_level, major, profile_completion_percentage 
                 FROM student_profiles WHERE user_id = $1`,
                [user.id]
            );
            if (profileResult.rows.length > 0) {
                profileData = profileResult.rows[0];
            }
        }

        sendSuccess(res, {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                profile: profileData
            },
            token
        }, 'Login successful');

    } catch (error) {
        console.error('Login error:', error);
        sendError(res, 500, 'Login failed');
    }
}