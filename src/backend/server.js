require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import configuration and middleware
const db = require('./config/database');
const logger = require('./config/logger');
const { helmetConfig, apiLimiter, sanitizeRequest } = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const studentRoutes = require('./routes/students');
const surveyRoutes = require('./routes/surveys');
const fileRoutes = require('./routes/files');
const analyticsRoutes = require('./routes/analytics');
const exportRoutes = require('./routes/export');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 5000;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Trust proxy for accurate IP addresses in production
app.set('trust proxy', 1);

// Security middleware
app.use(helmetConfig);

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            process.env.FRONTEND_URL
        ].filter(Boolean);

        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    exposedHeaders: ['X-Total-Count']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        // Store raw body for file upload verification
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'studentProfileSession',
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    }
};

// Use Redis for session store in production (would be implemented)
if (process.env.NODE_ENV === 'production' && process.env.REDIS_HOST) {
    // const RedisStore = require('connect-redis')(session);
    // const redis = require('redis');
    // const redisClient = redis.createClient({
    //     host: process.env.REDIS_HOST,
    //     port: process.env.REDIS_PORT
    // });
    // sessionConfig.store = new RedisStore({ client: redisClient });
}

app.use(session(sessionConfig));

// Request sanitization
app.use(sanitizeRequest);

// API rate limiting
app.use('/api', apiLimiter);

// Request logging
app.use((req, res, next) => {
    logger.http(`${req.method} ${req.url} - ${req.ip} - ${req.get('User-Agent')}`);
    next();
});

// Add request ID for tracking
app.use((req, res, next) => {
    req.id = Math.random().toString(36).substr(2, 9);
    res.set('X-Request-ID', req.id);
    next();
});

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../frontend/build')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
    });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    logger.warn(`404 - API endpoint not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        requestId: req.id
    });

    // Don't leak error details in production
    const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message;

    res.status(err.status || 500).json({
        success: false,
        message,
        requestId: req.id
    });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`);
    
    try {
        // Close database connection
        await db.close();
        logger.info('Database connection closed');
        
        // Close server
        server.close(() => {
            logger.info('Server closed successfully');
            process.exit(0);
        });
        
        // Force shutdown after 10 seconds
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
        
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});

// Start server
async function startServer() {
    try {
        // Initialize database connection
        await db.initialize();
        
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Student Profile System Server running on port ${PORT}`);
            logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🗄️  Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
            
            if (process.env.COMPETITION_MODE === 'true') {
                logger.info('🏆 Competition mode enabled - Demo features active');
            }
        });

        // Store server reference for graceful shutdown
        global.server = server;
        
        return server;
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server if this file is run directly
if (require.main === module) {
    startServer();
}

module.exports = app;