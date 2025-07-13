const { query, getClient } = require('./lib/db');
const { setCorsHeaders } = require('./lib/auth');
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

        // Read the enhanced schema file
        const schemaPath = path.join(process.cwd(), 'database', 'file-storage-schema.sql');
        let schemaSQL;
        
        try {
            schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        } catch (error) {
            // Fallback to inline schema if file not found
            schemaSQL = `
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

                -- Create indexes for uploaded_files
                CREATE INDEX IF NOT EXISTS idx_uploaded_files_user ON uploaded_files(user_id);
                CREATE INDEX IF NOT EXISTS idx_uploaded_files_category ON uploaded_files(category);
                CREATE INDEX IF NOT EXISTS idx_uploaded_files_created ON uploaded_files(created_at);

                -- Add profile_photo_id to student_profiles if not exists
                ALTER TABLE student_profiles 
                ADD COLUMN IF NOT EXISTS profile_photo_id INTEGER REFERENCES uploaded_files(id) ON DELETE SET NULL;

                -- Activities table for extracurricular activities
                CREATE TABLE IF NOT EXISTS activities (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    category VARCHAR(50) DEFAULT 'other' CHECK (category IN ('academic', 'sports', 'volunteer', 'work', 'creative', 'leadership', 'other')),
                    start_date DATE,
                    end_date DATE,
                    hours INTEGER DEFAULT 0,
                    organization VARCHAR(255),
                    position VARCHAR(255),
                    achievements TEXT,
                    is_current BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Create indexes for activities
                CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
                CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
                CREATE INDEX IF NOT EXISTS idx_activities_start_date ON activities(start_date);
            `;
        }

        // Execute the schema updates
        const statements = schemaSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        const results = [];
        const errors = [];

        for (const statement of statements) {
            try {
                await query(statement);
                results.push({
                    statement: statement.substring(0, 100) + '...',
                    status: 'success'
                });
            } catch (error) {
                console.error('Schema statement error:', error);
                errors.push({
                    statement: statement.substring(0, 100) + '...',
                    error: error.message
                });
            }
        }

        // Get list of existing tables
        const tablesResult = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        res.status(200).json({
            success: true,
            message: 'Enhanced database setup completed',
            results: {
                statementsExecuted: results.length,
                errors: errors.length,
                existingTables: tablesResult.rows.map(row => row.table_name)
            },
            details: {
                successful: results,
                failed: errors
            }
        });

    } catch (error) {
        console.error('Enhanced database setup error:', error);
        setCorsHeaders(res);
        res.status(500).json({
            success: false,
            message: 'Enhanced database setup failed',
            error: error.message
        });
    }
}