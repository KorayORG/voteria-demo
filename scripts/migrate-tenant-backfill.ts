// One-off migration script: backfill tenantId on legacy documents.
// Run: npx ts-node scripts/migrate-tenant-backfill.ts
import clientPromise from '@/lib/mongodb'
import { resolveTenant } from '@/lib/tenant'

async function run() {
  const tenant = resolveTenant()
  const client = await clientPromise
  const db = client.db()
  const collections = ['users','system_settings','menus','external_adjustments','suggestions','votes','roles','audit_logs']
  for (const name of collections) {
    const col = db.collection(name)
    const res = await col.updateMany({ tenantId: { $exists:false } }, { $set: { tenantId: tenant.tenantId } })
    console.log(`[${name}] matched ${res.matchedCount} modified ${res.modifiedCount}`)
  }
  console.log('Backfill complete for tenant', tenant.tenantId)
  process.exit(0)
}

run().catch(e=>{ console.error(e); process.exit(1) })
