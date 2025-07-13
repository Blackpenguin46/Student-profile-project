const { setCorsHeaders } = require('./lib/auth');

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        return res.status(200).end();
    }

    try {
        setCorsHeaders(res);

        // Get all environment variables related to database
        const dbVars = {};
        const allVars = [];
        
        Object.keys(process.env).forEach(key => {
            if (key.includes('DATABASE') || key.includes('POSTGRES') || key.includes('NEON')) {
                dbVars[key] = process.env[key] ? 'SET' : 'NOT_SET';
            }
            allVars.push(key);
        });

        res.status(200).json({
            success: true,
            message: 'Environment check',
            databaseVars: dbVars,
            totalEnvVars: allVars.length,
            nodeEnv: process.env.NODE_ENV,
            vercelEnv: process.env.VERCEL_ENV
        });

    } catch (error) {
        console.error('Environment check error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}