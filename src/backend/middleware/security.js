const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const logger = require('../config/logger');

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message: message || 'Too many requests, please try again later.'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn(`Rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
            res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later.'
            });
        }
    });
};

// General API rate limiter
const apiLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // limit each IP to 100 requests per windowMs
    'Too many API requests, please try again later.'
);

// Strict rate limiter for authentication endpoints
const authLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // limit each IP to 5 requests per windowMs
    'Too many authentication attempts, please try again later.'
);

// File upload rate limiter
const uploadLimiter = createRateLimiter(
    60 * 60 * 1000, // 1 hour
    10, // limit each IP to 10 uploads per hour
    'Too many file uploads, please try again later.'
);

// Password reset rate limiter
const passwordResetLimiter = createRateLimiter(
    60 * 60 * 1000, // 1 hour
    3, // limit each IP to 3 password reset requests per hour
    'Too many password reset attempts, please try again later.'
);

// Helmet configuration for security headers
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://stackpath.bootstrapcdn.com"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://stackpath.bootstrapcdn.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
            connectSrc: ["'self'"],
            mediaSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false, // Disable for compatibility
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

// Input validation helpers
const sanitizeString = (value) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/[<>]/g, ''); // Basic XSS prevention
};

const validateEmail = body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address');

const validatePassword = body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number');

const validateName = (fieldName) => body(fieldName)
    .isLength({ min: 1, max: 100 })
    .withMessage(`${fieldName} is required and must be less than 100 characters`)
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);

const validateOptionalText = (fieldName, maxLength = 1000) => body(fieldName)
    .optional()
    .isLength({ max: maxLength })
    .withMessage(`${fieldName} must be less than ${maxLength} characters`);

// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn('Validation errors:', { errors: errors.array(), ip: req.ip });
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
};

// CSRF token validation (if implementing CSRF protection)
const validateCSRF = (req, res, next) => {
    // Skip CSRF for GET requests and API endpoints in development
    if (req.method === 'GET' || process.env.NODE_ENV === 'development') {
        return next();
    }

    const token = req.headers['x-csrf-token'] || req.body._csrf;
    if (!token) {
        logger.warn('Missing CSRF token:', { ip: req.ip, method: req.method, url: req.url });
        return res.status(403).json({
            success: false,
            message: 'CSRF token required'
        });
    }

    // In a real implementation, you would validate the token here
    // For now, we'll just check if it exists
    next();
};

// Request sanitization middleware
const sanitizeRequest = (req, res, next) => {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeString(req.body[key]);
            }
        }
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
        for (const key in req.query) {
            if (typeof req.query[key] === 'string') {
                req.query[key] = sanitizeString(req.query[key]);
            }
        }
    }

    next();
};

// Activity logging middleware
const logActivity = (action, resourceType) => {
    return (req, res, next) => {
        const originalSend = res.send;
        res.send = function(data) {
            // Log successful actions (2xx status codes)
            if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
                // This would be implemented to log to the activity_logs table
                logger.info('User activity:', {
                    userId: req.user.id,
                    action,
                    resourceType,
                    resourceId: req.params.id || null,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    timestamp: new Date().toISOString()
                });
            }
            originalSend.call(this, data);
        };
        next();
    };
};

// File upload security
const validateFileUpload = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(req.file.mimetype)) {
        logger.warn('Invalid file type uploaded:', { 
            mimetype: req.file.mimetype, 
            originalname: req.file.originalname,
            ip: req.ip 
        });
        return res.status(400).json({
            success: false,
            message: 'Invalid file type. Only PDF and Word documents are allowed.'
        });
    }

    if (req.file.size > maxSize) {
        logger.warn('File too large uploaded:', { 
            size: req.file.size, 
            originalname: req.file.originalname,
            ip: req.ip 
        });
        return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 10MB.'
        });
    }

    next();
};

module.exports = {
    apiLimiter,
    authLimiter,
    uploadLimiter,
    passwordResetLimiter,
    helmetConfig,
    validateEmail,
    validatePassword,
    validateName,
    validateOptionalText,
    handleValidationErrors,
    validateCSRF,
    sanitizeRequest,
    logActivity,
    validateFileUpload
};