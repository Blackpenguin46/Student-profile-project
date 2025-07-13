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
            message: 'Test registration endpoint working',
            method: req.method,
            body: req.body,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Test registration error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}