import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { parseUserFromHeaders, resolvePermissions, requirePermission } from '@/lib/auth-headers'
import { ObjectId } from 'mongodb'

const COLLECTION = 'system_settings'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('cafeteria')
    const doc = await db.collection(COLLECTION).findOne({ id: 'core' })
    if (!doc) {
  const def = { id:'core', siteTitle:'Seç Ye', maintenanceMode:false, voteCutoffTime:'09:00', activeTheme:'default', paletteSize:5, paletteColors:['#2563eb','#16a34a','#dc2626','#f59e0b','#9333ea'], texts:{ heroTitle:'Hoş geldiniz', heroSubtitle:'Kurumsal yemek oylama sistemi' }, createdAt:new Date(), updatedAt:new Date() }
      await db.collection(COLLECTION).insertOne(def)
      return NextResponse.json({ settings: def })
    }
    return NextResponse.json({ settings: doc })
  } catch (e) {
    console.error('GET /api/admin/system-settings error', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
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
    const client = await clientPromise
    const db = client.db('cafeteria')
    await db.collection(COLLECTION).updateOne({ id:'core' }, { $set: updates }, { upsert: true })
    const saved = await db.collection(COLLECTION).findOne({ id:'core' })
    let actorIdentityNumber: string | undefined
    if (ctx.userId) {
      try { const au = await db.collection('users').findOne({ _id: new ObjectId(ctx.userId) }); if (au) actorIdentityNumber = (au as any).identityNumber } catch {}
    }
    await db.collection('audit_logs').insertOne({ action:'SYSTEM_SETTINGS_UPDATED', actorId: ctx.userId || 'system', actorName:'Sistem', actorIdentityNumber, entity:'SystemSettings', entityId:'core', targetId:'core', targetName:'System Settings', meta:updates, createdAt:new Date() })
    return NextResponse.json({ settings: saved })
  } catch (e) {
    console.error('PATCH /api/admin/system-settings error', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
