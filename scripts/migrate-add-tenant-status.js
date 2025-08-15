// Migration: add status field to existing tenant documents
// Usage: node scripts/migrate-add-tenant-status.js
// Sets status based on isActive when available, otherwise defaults to 'active'.

const clientPromise = require('../lib/mongodb').default

async function run() {
  console.log('🔄 Tenant status migration başlıyor...')
  const client = await clientPromise
  const db = client.db()
  const col = db.collection('tenants')

  // 1. isActive:true & status yok -> active
  const resActive = await col.updateMany({ status: { $exists: false }, isActive: true }, { $set: { status: 'active' } })
  // 2. isActive:false & status yok -> suspended
  const resSuspended = await col.updateMany({ status: { $exists: false }, isActive: false }, { $set: { status: 'suspended' } })
  // 3. isActive alanı yok & status yok -> active
  const resDefault = await col.updateMany({ status: { $exists: false }, isActive: { $exists: false } }, { $set: { status: 'active' } })

  // Optional: ensure index on slug
  try {
    await col.createIndex({ slug: 1 }, { unique: true })
  } catch (e) {
    console.warn('⚠️ slug index oluşturulamadı (muhtemelen zaten var):', e.message)
  }

  const totalUpdated = resActive.modifiedCount + resSuspended.modifiedCount + resDefault.modifiedCount
  console.log(`✅ Migration tamamlandı. Güncellenen kayıt sayısı: ${totalUpdated}`)
  console.log(`   - Active set: ${resActive.modifiedCount}`)
  console.log(`   - Suspended set: ${resSuspended.modifiedCount}`)
  console.log(`   - Default active set: ${resDefault.modifiedCount}`)
  console.log('🎯 Artık /api/tenants endpoint yeni oluşturulan firmaları gösterebilecek.')
}

run()
  .catch(err => { console.error('❌ Migration hata:', err); process.exitCode = 1 })
  .finally(() => { setTimeout(()=> process.exit(), 50) })
