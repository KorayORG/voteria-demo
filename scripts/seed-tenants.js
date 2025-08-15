// Seed initial tenants for testing
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGODB_DB || 'cafeteria';
  
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const tenantsCol = db.collection('tenants');
  
  const count = await tenantsCol.countDocuments();
  if (count > 0) {
    console.log('Tenants already exist, skipping seed');
    await client.close();
    process.exit(0);
  }

  const tenants = [
    { slug: 'sec-ye', name: 'Seç Ye', status: 'active', isActive: true, isMasterTenant: true, createdAt: new Date(), updatedAt: new Date() },
    { slug: 'default', name: 'Varsayılan Firma', status: 'active', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { slug: 'acme-corp', name: 'ACME Şirketi', status: 'active', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { slug: 'tech-solutions', name: 'Tech Solutions Ltd.', status: 'active', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { slug: 'global-inc', name: 'Global Inc.', status: 'active', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { slug: 'startup-hub', name: 'Startup Hub', status: 'active', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ];

  await tenantsCol.insertMany(tenants);
  console.log(`Inserted ${tenants.length} tenants`);
  await client.close();
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
