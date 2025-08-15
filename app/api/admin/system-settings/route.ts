import { NextRequest, NextResponse } from 'next/server'
import clientPromise, { getDb } from '@/lib/mongodb'
import { parseUserFromHeaders, resolvePermissions, requirePermission } from '@/lib/auth-headers'
import { ObjectId } from 'mongodb'
import { resolveTenant } from '@/lib/tenant'
import { addAuditLog } from '@/lib/audit'

const COLLECTION = 'system_settings'

export async function GET() {
  const tenant = resolveTenant()
  try {
    const db = await getDb()
    let doc = await db.collection(COLLECTION).findOne({ id: 'core', tenantId: tenant.tenantId })
    // Backfill legacy single-tenant doc if exists without tenantId
    if (!doc) {
      const legacy = await db.collection(COLLECTION).findOne({ id: 'core', tenantId: { $exists: false } })
      if (legacy) {
        await db.collection(COLLECTION).updateOne({ _id: (legacy as any)._id }, { $set: { tenantId: tenant.tenantId } })
        doc = { ...legacy, tenantId: tenant.tenantId }
      }
    }
    if (!doc) {
      const def = { id:'core', siteTitle:'Seç Ye', maintenanceMode:false, voteCutoffTime:'09:00', activeTheme:'default', paletteSize:5, paletteColors:['#2563eb','#16a34a','#dc2626','#f59e0b','#9333ea'], texts:{ heroTitle:'Hoş geldiniz', heroSubtitle:'Kurumsal yemek oylama sistemi' }, createdAt:new Date(), updatedAt:new Date(), tenantId: tenant.tenantId }
      try { await db.collection(COLLECTION).insertOne(def) } catch {}
      return NextResponse.json({ settings: def })
    }
    return NextResponse.json({ settings: doc })
  } catch (e:any) {
    // Graceful degraded response if connection fails (e.g., TLS issues)
    const msg = (e && e.message) || ''
    const degraded = {
      id: 'core',
      siteTitle: 'Seç Ye',
      maintenanceMode: false,
      voteCutoffTime: '09:00',
      activeTheme: 'default',
      paletteSize: 5,
      paletteColors: ['#2563eb','#16a34a','#dc2626','#f59e0b','#9333ea'],
      texts: { heroTitle: 'Hoş geldiniz', heroSubtitle: 'Kurumsal yemek oylama sistemi' },
      tenantId: tenant.tenantId,
      updatedAt: new Date(),
      __dbUnavailable: true,
      __error: msg.slice(0,200)
    }
    console.error('[system-settings] DB unavailable, serving degraded defaults:', msg)
    return NextResponse.json({ settings: degraded, degraded: true }, { status: 200 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
  const ctx = await resolvePermissions(parseUserFromHeaders(req.headers as any))
  const authz = requirePermission(ctx, 'kitchenManage')
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 })
    const body = await req.json()
  const allowedFields = ['siteTitle','maintenanceMode','voteCutoffTime','activeTheme','paletteSize','paletteColors','texts']
    const updates: any = {}
    for (const k of allowedFields) if (k in body) updates[k] = body[k]
    if (updates.paletteSize && updates.paletteColors) {
      updates.paletteColors = (updates.paletteColors as string[]).slice(0, updates.paletteSize)
    }
    updates.updatedAt = new Date()
    const tenant = resolveTenant()
  const db = await getDb()
    await db.collection(COLLECTION).updateOne({ id:'core', $or:[{ tenantId: tenant.tenantId }, { tenantId: { $exists:false } }] }, { $set: { ...updates, tenantId: tenant.tenantId } }, { upsert: true })
    const saved = await db.collection(COLLECTION).findOne({ id:'core', tenantId: tenant.tenantId })
    let actorIdentityNumber: string | undefined
    if (ctx.userId) {
      try { const au = await db.collection('users').findOne({ _id: new ObjectId(ctx.userId) }); if (au) actorIdentityNumber = (au as any).identityNumber } catch {}
    }
    await addAuditLog({
      action:'SYSTEM_SETTINGS_UPDATED',
      actorId: ctx.userId || 'system',
      actorName:'Sistem',
      actorIdentityNumber,
      entity:'SystemSettings',
      entityId:'core',
      targetId:'core',
      targetName:'System Settings',
      meta:updates,
      tenantId: tenant.tenantId
    })
    return NextResponse.json({ settings: saved })
  } catch (e) {
    console.error('PATCH /api/admin/system-settings error', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
