// Create multi-tenant helpful indexes.
// Run: npx ts-node scripts/create-indexes.ts
import clientPromise from '@/lib/mongodb'

async function run() {
  const client = await clientPromise
  const db = client.db()
  await Promise.all([
    db.collection('menus').createIndex({ tenantId:1, weekOfISO:1 }, { name:'idx_tenant_week' }),
    db.collection('votes').createIndex({ tenantId:1, userId:1, date:1 }, { name:'idx_tenant_user_date' }),
    db.collection('suggestions').createIndex({ tenantId:1, status:1, submittedAt:-1 }, { name:'idx_tenant_status_submittedAt' }),
    db.collection('users').createIndex({ tenantId:1, identityNumber:1 }, { name:'idx_tenant_identity' }),
    db.collection('audit_logs').createIndex({ tenantId:1, createdAt:-1 }, { name:'idx_tenant_createdAt' }),
    db.collection('external_adjustments').createIndex({ tenantId:1, date:-1 }, { name:'idx_tenant_date' }),
    db.collection('roles').createIndex({ tenantId:1, code:1 }, { name:'idx_tenant_code' }),
  ])
  console.log('Indexes created')
  process.exit(0)
}

run().catch(e=>{ console.error(e); process.exit(1) })
