const { Redis } = require('@upstash/redis');

let redis = null;

function getRedisClient() {
    if (redis) return redis;
    
    // Upstash Redis connection from Vercel integration
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!redisUrl || !redisToken) {
        console.warn('Redis not configured - caching disabled');
        return null;
    }
    
    redis = new Redis({
        url: redisUrl,
        token: redisToken,
    });
    
    return redis;
}

// Cache helpers
async function get(key) {
    const client = getRedisClient();
    if (!client) return null;
    
    try {
        return await client.get(key);
    } catch (error) {
        console.error('Redis get error:', error);
        return null;
    }
}

async function set(key, value, expirationSeconds = 3600) {
    const client = getRedisClient();
    if (!client) return false;
    
    try {
        await client.set(key, value, { ex: expirationSeconds });
        return true;
    } catch (error) {
        console.error('Redis set error:', error);
        return false;
    }
}

async function del(key) {
    const client = getRedisClient();
    if (!client) return false;
    
    try {
        await client.del(key);
        return true;
    } catch (error) {
        console.error('Redis del error:', error);
        return false;
    }
}

// Session management
async function setSession(sessionId, userData, expirationSeconds = 86400) {
    return await set(`session:${sessionId}`, JSON.stringify(userData), expirationSeconds);
}

async function getSession(sessionId) {
    const data = await get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
}

async function deleteSession(sessionId) {
    return await del(`session:${sessionId}`);
}

// Cache frequently accessed data
async function cacheUserProfile(userId, profileData, expirationSeconds = 1800) {
    return await set(`profile:${userId}`, JSON.stringify(profileData), expirationSeconds);
}

async function getCachedUserProfile(userId) {
    const data = await get(`profile:${userId}`);
    return data ? JSON.parse(data) : null;
}

async function invalidateUserProfile(userId) {
    return await del(`profile:${userId}`);
}

module.exports = {
    getRedisClient,
    get,
    set,
    del,
    setSession,
    getSession,
    deleteSession,
    cacheUserProfile,
    getCachedUserProfile,
    invalidateUserProfile
};