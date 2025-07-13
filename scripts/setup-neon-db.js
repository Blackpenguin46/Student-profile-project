const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Neon database connection
const client = new Client({
    connectionString: 'postgres://neondb_owner:npg_Ul9c4SHzyjQi@ep-tiny-math-adovemav-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function setupDatabase() {
    try {
        console.log('🔌 Connecting to Neon database...');
        await client.connect();
        console.log('✅ Connected successfully!');

        // Read and execute the schema file
        console.log('📋 Reading schema file...');
        const schemaPath = path.join(__dirname, '../database/neon-schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('🚀 Creating database schema...');
        await client.query(schema);
        console.log('✅ Database schema created successfully!');

        // Verify tables were created
        console.log('🔍 Verifying tables...');
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);

        console.log('📊 Created tables:');
        result.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        // Check demo data
        console.log('👥 Checking demo users...');
        const users = await client.query('SELECT email, role FROM users ORDER BY role, email');
        console.log('Demo users created:');
        users.rows.forEach(user => {
            console.log(`  - ${user.email} (${user.role})`);
        });

        console.log('🎉 Database setup completed successfully!');

    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Run the setup
setupDatabase();