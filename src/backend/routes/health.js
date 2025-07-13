const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../config/logger');

// Health check endpoint
router.get('/', async (req, res) => {
    try {
        const healthCheck = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: require('../../package.json').version || '1.0.0',
            services: {}
        };

        // Check database connection
        const dbHealth = await db.healthCheck();
        healthCheck.services.database = dbHealth;

        // Check memory usage
        const memUsage = process.memoryUsage();
        healthCheck.services.memory = {
            status: 'healthy',
            usage: {
                rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
                external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
            }
        };

        // Check if any service is unhealthy
        const allHealthy = Object.values(healthCheck.services)
            .every(service => service.status === 'healthy');

        if (!allHealthy) {
            healthCheck.status = 'degraded';
            return res.status(503).json(healthCheck);
        }

        res.json(healthCheck);
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Detailed health check for monitoring systems
router.get('/detailed', async (req, res) => {
    try {
        const detailedHealth = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: require('../../package.json').version || '1.0.0',
            services: {},
            metrics: {}
        };

        // Database health with connection pool info
        const dbHealth = await db.healthCheck();
        detailedHealth.services.database = dbHealth;

        // System metrics
        const memUsage = process.memoryUsage();
        detailedHealth.metrics = {
            memory: {
                rss: memUsage.rss,
                heapTotal: memUsage.heapTotal,
                heapUsed: memUsage.heapUsed,
                external: memUsage.external,
                heapUsedPercentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
            },
            cpu: {
                uptime: process.uptime(),
                platform: process.platform,
                arch: process.arch
            }
        };

        // Check response times (basic check)
        const start = Date.now();
        await db.query('SELECT 1 as test');
        const dbResponseTime = Date.now() - start;
        detailedHealth.metrics.responseTime = {
            database: `${dbResponseTime}ms`
        };

        // Add warning thresholds
        if (detailedHealth.metrics.memory.heapUsedPercentage > 90) {
            detailedHealth.warnings = detailedHealth.warnings || [];
            detailedHealth.warnings.push('High memory usage detected');
        }

        if (dbResponseTime > 1000) {
            detailedHealth.warnings = detailedHealth.warnings || [];
            detailedHealth.warnings.push('Slow database response time');
        }

        res.json(detailedHealth);
    } catch (error) {
        logger.error('Detailed health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Readiness probe (for Kubernetes/Docker)
router.get('/ready', async (req, res) => {
    try {
        // Check if database is ready
        await db.query('SELECT 1');
        
        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Readiness check failed:', error);
        res.status(503).json({
            status: 'not ready',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Liveness probe (for Kubernetes/Docker)
router.get('/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

module.exports = router;