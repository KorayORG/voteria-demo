// Complete database reset with tenant setup
// Run: node scripts/reset-database-safe.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function run() {
  let uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.log('❌ MONGODB_URI not found in environment variables.');
    process.exit(1);
  }
  
  const dbName = process.env.MONGODB_DB || 'cafeteria';
  
  console.log('🔄 DATABASE RESET SCRIPT');
  console.log(`Database: ${dbName}`);
  console.log('This will clean and setup fresh data...');
  console.log('');
  
  const client = new MongoClient(uri);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // 1. Clean all collections
    console.log('\n🗑️  Cleaning existing data...');
    const collections = ['users', 'system_settings', 'menus', 'external_adjustments', 'suggestions', 'votes', 'roles', 'audit_logs', 'tenants'];
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const result = await collection.deleteMany({});
      console.log(`✅ ${collectionName}: ${result.deletedCount} documents deleted`);
    }
    
    // 2. Insert fresh tenants
    console.log('\n🏢 Creating initial tenants...');
    const tenants = [
      { slug: 'default', name: 'Varsayılan Firma', status: 'active', createdAt: new Date() },
      { slug: 'acme-corp', name: 'ACME Şirketi', status: 'active', createdAt: new Date() },
      { slug: 'tech-solutions', name: 'Tech Solutions Ltd.', status: 'active', createdAt: new Date() },
      { slug: 'global-inc', name: 'Global Inc.', status: 'active', createdAt: new Date() },
      { slug: 'startup-hub', name: 'Startup Hub', status: 'active', createdAt: new Date() },
      { slug: 'innovative-labs', name: 'Innovative Labs', status: 'active', createdAt: new Date() },
      { slug: 'future-tech', name: 'Future Tech Corp', status: 'active', createdAt: new Date() }
    ];
    
    await db.collection('tenants').insertMany(tenants);
    console.log(`✅ Inserted ${tenants.length} tenants`);
    
    // 3. Create essential indexes
    console.log('\n🔧 Creating indexes...');
    try {
      await Promise.all([
        db.collection('menus').createIndex({ tenantId:1, weekOfISO:1 }),
        db.collection('votes').createIndex({ tenantId:1, userId:1, date:1 }),
        db.collection('suggestions').createIndex({ tenantId:1, status:1, submittedAt:-1 }),
        db.collection('users').createIndex({ tenantId:1, identityNumber:1 }),
        db.collection('audit_logs').createIndex({ tenantId:1, createdAt:-1 }),
        db.collection('external_adjustments').createIndex({ tenantId:1, date:-1 }),
        db.collection('roles').createIndex({ tenantId:1, code:1 }),
        db.collection('tenants').createIndex({ slug:1 }, { unique:true })
      ]);
      console.log('✅ Indexes created');
    } catch (indexError) {
      console.log('⚠️  Some indexes already exist, continuing...');
    }
    
    console.log('\n🎉 Database reset completed successfully!');
    console.log('\nSetup Summary:');
    console.log(`- Database: ${dbName}`);
    console.log(`- Tenants: ${tenants.length} companies available`);
    console.log('- Indexes: Multi-tenant optimized');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start your application: pnpm dev');
    console.log('2. Visit: http://localhost:3000/auth/register');
    console.log('3. Select a company from dropdown');
    console.log('4. Create your first account');
    
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    
    // Common error diagnostics
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n🔍 DNS/Network Issue:');
      console.log('- Check internet connection');
      console.log('- Verify MongoDB cluster URL is correct');
    } else if (error.message.includes('authentication')) {
      console.log('\n🔍 Authentication Issue:');
      console.log('- Check username/password in .env');
      console.log('- Verify MongoDB user has read/write permissions');
    } else if (error.message.includes('timeout')) {
      console.log('\n🔍 Connection Timeout:');
      console.log('- MongoDB cluster might be paused/sleeping');
      console.log('- Check MongoDB Atlas dashboard');
    }
    
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
