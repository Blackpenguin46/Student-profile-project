const { healthCheck } = require('./lib/db');
const { setCorsHeaders } = require('./lib/auth');

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        return res.status(200).end();
    }

    try {
        const dbHealth = await healthCheck();
        
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            database: dbHealth,
            uptime: process.uptime(),
            version: '1.0.0'
        };

        setCorsHeaders(res);
        res.status(200).json(health);

    } catch (error) {
        console.error('Health check error:', error);
        setCorsHeaders(res);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
}