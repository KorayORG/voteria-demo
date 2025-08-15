// Database cleanup with environment detection
// Run: node scripts/cleanup-database-safe.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function run() {
  // Try to detect MongoDB URI from environment or use default
  let uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.log('❌ MONGODB_URI not found in environment variables.');
    console.log('');
    console.log('Please create a .env file with your MongoDB connection:');
    console.log('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority');
    console.log('MONGODB_DB=cafeteria');
    console.log('');
    console.log('Or set environment variables manually before running the script.');
    process.exit(1);
  }
  
  const dbName = process.env.MONGODB_DB || 'cafeteria';
  
  console.log('🚨 DATABASE CLEANUP SCRIPT');
  console.log(`Database: ${dbName}`);
  console.log(`URI: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`); // Hide credentials
  console.log('');
  console.log('⚠️  WARNING: This will DELETE ALL DATA from the database!');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  
  // 5 second delay to allow cancellation
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const client = new MongoClient(uri);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // List of all collections to clean
    const collections = [
      'users',
      'system_settings',
      'menus',
      'external_adjustments', 
      'suggestions',
      'votes',
      'roles',
      'audit_logs',
      'tenants'
    ];
    
    console.log('\n🗑️  Starting cleanup...\n');
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          const result = await collection.deleteMany({});
          console.log(`✅ ${collectionName}: Deleted ${result.deletedCount} documents`);
        } else {
          console.log(`⚪ ${collectionName}: Already empty`);
        }
      } catch (error) {
        console.log(`❌ ${collectionName}: Error - ${error.message}`);
      }
    }
    
    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('\nTo set up fresh data, run:');
    console.log('node scripts/reset-database-safe.js');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    console.log('\nPossible solutions:');
    console.log('1. Check your .env file has correct MONGODB_URI');
    console.log('2. Verify MongoDB cluster is running and accessible');
    console.log('3. Check network connectivity');
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed.');
  }
}

run().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
