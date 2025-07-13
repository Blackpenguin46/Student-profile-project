const { query, getClient } = require('./lib/db');
const { setCorsHeaders, getRedisClient } = require('./lib/auth');
const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        setCorsHeaders(res);
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        setCorsHeaders(res);

        const { type = 'basic' } = req.body;

        if (type === 'enhanced') {
            // Enhanced setup with file storage
            const enhancedSchema = `
                -- Uploaded files table for storing files in database
                CREATE TABLE IF NOT EXISTS uploaded_files (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    filename VARCHAR(255) NOT NULL,
                    original_filename VARCHAR(255) NOT NULL,
                    file_type VARCHAR(100) NOT NULL,
                    file_size BIGINT NOT NULL,
                    file_data BYTEA NOT NULL,
                    category VARCHAR(50) DEFAULT 'document' CHECK (category IN ('document', 'resume', 'profile_photo', 'transcript', 'certificate')),
                    upload_ip INET,
                    is_public BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_uploaded_files_user ON uploaded_files(user_id);
                CREATE INDEX IF NOT EXISTS idx_uploaded_files_category ON uploaded_files(category);

                ALTER TABLE student_profiles 
                ADD COLUMN IF NOT EXISTS profile_photo_id INTEGER REFERENCES uploaded_files(id) ON DELETE SET NULL;

                ALTER TABLE goals 
                DROP COLUMN IF EXISTS student_id,
                ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                DROP COLUMN IF EXISTS goal_type,
                ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'personal',
                ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                ADD COLUMN IF NOT EXISTS progress_notes TEXT,
                ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

                ALTER TABLE goals 
                DROP CONSTRAINT IF EXISTS goals_status_check,
                ADD CONSTRAINT goals_status_check CHECK (status IN ('active', 'completed', 'paused', 'cancelled'));

                CREATE TABLE IF NOT EXISTS activities (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    category VARCHAR(50) DEFAULT 'other',
                    start_date DATE,
                    end_date DATE,
                    hours INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            const statements = enhancedSchema
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

            const results = [];
            const errors = [];

            for (const statement of statements) {
                try {
                    await query(statement);
                    results.push({ status: 'success' });
                } catch (error) {
                    errors.push({ error: error.message });
                }
            }

            res.status(200).json({
                success: true,
                message: 'Enhanced database setup completed',
                results: { successful: results.length, failed: errors.length }
            });

        } else {
            // Basic setup - original database schema
            const schemaPath = path.join(process.cwd(), 'database', 'neon-schema.sql');
            let schemaSQL;
            
            try {
                schemaSQL = fs.readFileSync(schemaPath, 'utf8');
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Schema file not found'
                });
            }

            const statements = schemaSQL
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

            const results = [];
            const errors = [];

            for (const statement of statements) {
                try {
                    await query(statement);
                    results.push({ status: 'success' });
                } catch (error) {
                    if (!error.message.includes('already exists')) {
                        errors.push({ error: error.message });
                    }
                }
            }

            const tablesResult = await query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            `);

            res.status(200).json({
                success: true,
                message: 'Database setup completed',
                tablesCreated: results.length,
                errors: errors,
                existingTables: tablesResult.rows.map(row => row.table_name)
            });
        }

    } catch (error) {
        console.error('Database setup error:', error);
        setCorsHeaders(res);
        res.status(500).json({
            success: false,
            message: 'Database setup failed',
            error: error.message
        });
    }
}