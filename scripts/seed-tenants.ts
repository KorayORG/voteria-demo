// Seed initial tenants for testing
// Run: npx ts-node scripts/seed-tenants.ts
import clientPromise from '@/lib/mongodb'

async function run() {
  const client = await clientPromise
  const db = client.db()
  const tenantsCol = db.collection('tenants')
  
  const count = await tenantsCol.countDocuments()
  if (count > 0) {
    console.log('Tenants already exist, skipping seed')
    process.exit(0)
  }

  const tenants = [
    { slug: 'default', name: 'Varsayılan Firma', status: 'active', createdAt: new Date() },
    { slug: 'acme-corp', name: 'ACME Şirketi', status: 'active', createdAt: new Date() },
    { slug: 'tech-solutions', name: 'Tech Solutions Ltd.', status: 'active', createdAt: new Date() },
    { slug: 'global-inc', name: 'Global Inc.', status: 'active', createdAt: new Date() },
    { slug: 'startup-hub', name: 'Startup Hub', status: 'active', createdAt: new Date() },
  ]

  await tenantsCol.insertMany(tenants)
  console.log(`Inserted ${tenants.length} tenants`)
  process.exit(0)
}

run().catch(e=>{ console.error(e); process.exit(1) })
