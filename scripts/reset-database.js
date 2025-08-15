// Safe database reset script - cleans and reinitializes with fresh data
// Run: node scripts/reset-database.js
const { MongoClient } = require('mongodb');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGODB_DB || 'cafeteria';
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
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
    
    console.log('\n🎉 Database reset completed successfully!');
    console.log('\nYou can now:');
    console.log('1. Visit /auth/register to create new accounts');
    console.log('2. Select from available companies in the dropdown');
    console.log('3. Each company will have isolated data');
    
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
