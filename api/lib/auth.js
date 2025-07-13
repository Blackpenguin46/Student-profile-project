const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { query } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// Verify JWT token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// Hash password
async function hashPassword(password) {
    return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Compare password
async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

// Middleware to extract user from token
function extractUser(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    return decoded;
}

// CORS helper
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Response helper
function sendResponse(res, statusCode, data) {
    setCorsHeaders(res);
    res.status(statusCode).json(data);
}

// Error response helper
function sendError(res, statusCode, message, details = null) {
    setCorsHeaders(res);
    res.status(statusCode).json({
        success: false,
        message,
        details
    });
}

// Success response helper
function sendSuccess(res, data, message = 'Success') {
    setCorsHeaders(res);
    res.status(200).json({
        success: true,
        message,
        data
    });
}

// Validation helpers
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

function validateName(name) {
    return name && name.trim().length >= 2 && name.trim().length <= 50;
}

// Authenticate token and get user data
async function authenticateToken(req) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { success: false, message: 'No token provided' };
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return { success: false, message: 'Invalid token' };
        }

        // Get fresh user data from database
        const userResult = await query(
            'SELECT id, email, role, first_name, last_name, is_active FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
            return { success: false, message: 'User not found or inactive' };
        }

        return { success: true, user: userResult.rows[0] };
    } catch (error) {
        console.error('Authentication error:', error);
        return { success: false, message: 'Authentication failed' };
    }
}

module.exports = {
    generateToken,
    verifyToken,
    hashPassword,
    comparePassword,
    extractUser,
    authenticateToken,
    setCorsHeaders,
    sendResponse,
    sendError,
    sendSuccess,
    validateEmail,
    validatePassword,
    validateName
};