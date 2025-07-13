const { setCorsHeaders } = require('./lib/auth');
const { getRedisClient, set, get } = require('./lib/redis');

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        return res.status(200).end();
    }

    setCorsHeaders(res);

    try {
        const client = getRedisClient();
        
        if (!client) {
            return res.status(200).json({
                success: false,
                message: 'Redis not configured',
                envVars: {
                    KV_REST_API_URL: process.env.KV_REST_API_URL ? 'SET' : 'NOT_SET',
                    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'SET' : 'NOT_SET'
                }
            });
        }

        // Test Redis connection
        const testKey = `test:${Date.now()}`;
        const testValue = 'Redis is working!';
        
        // Set a test value
        await set(testKey, testValue, 60); // Expire in 60 seconds
        
        // Get the test value back
        const retrievedValue = await get(testKey);
        
        // Clean up
        await client.del(testKey);

        res.status(200).json({
            success: true,
            message: 'Redis connection test successful',
            test: {
                set: testValue,
                retrieved: retrievedValue,
                match: testValue === retrievedValue
            },
            redisInfo: {
                url: process.env.KV_REST_API_URL?.substring(0, 20) + '...',
                tokenSet: !!process.env.KV_REST_API_TOKEN
            }
        });

    } catch (error) {
        console.error('Redis test error:', error);
        res.status(500).json({
            success: false,
            message: 'Redis test failed',
            error: error.message
        });
    }
}