const { Pool } = require('pg');

// Create a connection pool for PostgreSQL
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Database query helper
async function query(text, params) {
    const start = Date.now();
    try {
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