const { setCorsHeaders } = require('./lib/auth');

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        return res.status(200).end();
    }

    try {
        setCorsHeaders(res);

        res.status(200).json({
            success: true,
            message: 'Debug endpoint - showing what frontend sent',
            method: req.method,
            headers: req.headers,
            body: req.body,
            url: req.url,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}