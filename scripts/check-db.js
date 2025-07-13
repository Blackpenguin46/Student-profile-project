const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkDatabase() {
    try {
        console.log('🔌 Connecting to Neon database...');
        
        // Check tables
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        
        console.log('📋 Existing tables:');
        tablesResult.rows.forEach(row => {
            console.log('  -', row.table_name);
        });
        
        // Check users table structure
        if (tablesResult.rows.some(row => row.table_name === 'users')) {
            const usersStructure = await pool.query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                ORDER BY ordinal_position;
            `);
            
            console.log('\n👤 Users table structure:');
            usersStructure.rows.forEach(row => {
                console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
            });
        }
        
        // Check if student_profiles table exists
        if (tablesResult.rows.some(row => row.table_name === 'student_profiles')) {
            console.log('\n✅ student_profiles table exists');
        } else {
            console.log('\n❌ student_profiles table missing');
        }
        
        await pool.end();
        
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
        process.exit(1);
    }
}

checkDatabase();