const { Pool } = require('pg');

// Create a connection pool for PostgreSQL - delayed initialization
let pool = null;

function getPool() {
    if (pool) return pool;
    
    const connectionString = process.env.POSTGRES_URL || 
                             process.env.DATABASE_URL || 
                             process.env.NEON_DATABASE_URL ||
                             process.env.DATABASE_URL_POOLER;

    if (!connectionString) {
        const availableVars = Object.keys(process.env).filter(key => 
            key.includes('DATABASE') || key.includes('POSTGRES') || key.includes('NEON')
        );
        console.error('❌ No database connection string found. Available env vars:', availableVars);
        throw new Error(`Database connection string not configured. Available vars: ${availableVars.join(', ')}`);
    }

    console.log('🔌 Creating database pool...');
    
    pool = new Pool({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });
    
    return pool;
}

// Database query helper
async function query(text, params) {
    const start = Date.now();
    try {
        const pool = getPool();
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// Get a client from the pool for transactions
async function getClient() {
    const pool = getPool();
    return await pool.connect();
}

// Health check function
async function healthCheck() {
    try {
        const result = await query('SELECT NOW() as time');
        return {
            status: 'healthy',
            timestamp: result.rows[0].time
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = {
    query,
    getClient,
    healthCheck,
    pool
};