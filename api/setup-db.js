const { query } = require('./lib/db');
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
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        setCorsHeaders(res);

        // Read the schema file
        const schemaPath = path.join(process.cwd(), 'database', 'neon-schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Split into individual statements (basic split on semicolons)
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        let created = 0;
        let errors = [];

        // Execute each statement
        for (const statement of statements) {
            try {
                await query(statement);
                created++;
            } catch (error) {
                // Ignore "already exists" errors
                if (error.code === '42P07' || error.code === '42710') {
                    console.log(`Skipping existing: ${error.message}`);
                } else {
                    errors.push({
                        statement: statement.substring(0, 100) + '...',
                        error: error.message
                    });
                }
            }
        }

        // Check what tables exist now
        const tablesResult = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        res.status(200).json({
            success: true,
            message: 'Database setup completed',
            tablesCreated: created,
            errors: errors,
            existingTables: tablesResult.rows.map(r => r.table_name)
        });

    } catch (error) {
        console.error('Database setup error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}