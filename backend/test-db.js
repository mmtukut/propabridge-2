const { query } = require('./config/db');

async function testConnection() {
  try {
    const result = await query('SELECT NOW()');
    console.log('✅ Database connection successful! Current time:', result.rows[0].now);
    
    // Test properties table
    const properties = await query('SELECT * FROM properties LIMIT 1');
    console.log('✅ Properties table exists. Sample property:', properties.rows[0] || 'No properties found');
    
    // Test conversations table
    const conversations = await query('SELECT * FROM conversations LIMIT 1');
    console.log('✅ Conversations table exists. Sample conversation:', conversations.rows[0] || 'No conversations found');
  } catch (error) {
    console.error('❌ Database connection error:', error);
  }
}

testConnection();