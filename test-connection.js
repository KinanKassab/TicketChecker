// Quick test script to verify Supabase connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_URL not set in .env');
      return;
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not set in .env');
      return;
    }
    
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'NOT SET');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'NOT SET');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Try a simple query
    const { data, error } = await supabase.from('agents').select('count').limit(1);
    
    if (error) {
      // If table doesn't exist, that's okay - schema might not be set up yet
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('✅ Successfully connected to Supabase!');
        console.log('⚠️  Database tables not found. Please run the SQL schema from database_SQL/schema.sql');
        return;
      }
      throw error;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    console.log('✅ Database tables are accessible');
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check if your Supabase project is paused (unpause it in dashboard)');
    console.log('2. Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env file');
    console.log('3. Get these values from Supabase Dashboard > Settings > API');
    console.log('4. Run the SQL schema from database_SQL/schema.sql in Supabase SQL Editor');
  }
}

testConnection();
