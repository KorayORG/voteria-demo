// Database cleanup script - removes all data from collections
// WARNING: This will permanently delete ALL data!
// Run: node scripts/cleanup-database.js
const { MongoClient } = require('mongodb');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGODB_DB || 'cafeteria';
  
  console.log('⚠️  WARNING: This will DELETE ALL DATA from the database!');
  console.log(`Database: ${dbName}`);
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  
  // 5 second delay to allow cancellation
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
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
    
    // Drop indexes (optional)
    console.log('\n🔧 Dropping indexes...');
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        await collection.dropIndexes();
        console.log(`✅ ${collectionName}: Indexes dropped`);
      } catch (error) {
        // Ignore errors (collection might not exist)
        console.log(`⚪ ${collectionName}: No indexes to drop`);
      }
    }
    
    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: node scripts/seed-tenants.js');
    console.log('2. Run: node scripts/create-indexes.js (if available)');
    console.log('3. Start using the application with fresh data');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed.');
  }
}

// Confirmation prompt
console.log('🚨 DATABASE CLEANUP SCRIPT');
console.log('This will permanently delete ALL data from your database.');
console.log('Make sure you have backups if needed.');
console.log('');

run().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
