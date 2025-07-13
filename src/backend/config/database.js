const mysql = require('mysql2/promise');
const winston = require('winston');

class Database {
    constructor() {
        this.pool = null;
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    async initialize() {
        try {
            this.pool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT) || 3306,
                user: process.env.DB_USER || 'app_user',
                password: process.env.DB_PASSWORD || 'app_password123',
                database: process.env.DB_NAME || 'student_profile_db',
                waitForConnections: true,
                connectionLimit: 10,
                maxIdle: 10,
                idleTimeout: 60000,
                queueLimit: 0,
                acquireTimeout: 60000,
                charset: 'utf8mb4',
                timezone: '+00:00',
                supportBigNumbers: true,
                bigNumberStrings: true,
                dateStrings: false,
                multipleStatements: false
            });

            // Test the connection
            const connection = await this.pool.getConnection();
            await connection.ping();
            connection.release();
            
            this.logger.info('Database connected successfully');
            return this.pool;
        } catch (error) {
            this.logger.error('Database connection failed:', error);
            throw error;
        }
    }

    async query(sql, params = []) {
        try {
            const [rows] = await this.pool.execute(sql, params);
            return rows;
        } catch (error) {
            this.logger.error('Database query error:', { sql, params, error: error.message });
            throw error;
        }
    }

    async transaction(callback) {
        const connection = await this.pool.getConnection();
        await connection.beginTransaction();
        
        try {
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            this.logger.info('Database connection closed');
        }
    }

    // Health check method
    async healthCheck() {
        try {
            const connection = await this.pool.getConnection();
            await connection.ping();
            connection.release();
            return { status: 'healthy', timestamp: new Date().toISOString() };
        } catch (error) {
            return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
        }
    }
}

module.exports = new Database();