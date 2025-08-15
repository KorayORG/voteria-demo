import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { assertMaster } from '@/lib/master-auth'
import { addAuditLog } from '@/lib/audit'

function normalize(doc: any) {
  if (!doc) return { maintenanceMode: false }
  return {
    maintenanceMode: !!doc.maintenanceMode,
    message: doc.maintenanceMessage || '',
    until: doc.maintenanceUntil || null,
    updatedAt: doc.updatedAt || null
  }
}

export async function GET(req: NextRequest) {
  const auth = assertMaster(req)
  if (auth) return auth
  try {
    const db = await getDb()
    const settings = await db.collection('system_settings')
      .find({ id: 'core' })
      .toArray()
    const globalDoc = settings.find(s => s.tenantId === 'global')
    const perTenant = settings.filter(s => s.tenantId !== 'global').map(s => ({
      tenantId: s.tenantId,
      ...normalize(s)
    }))
    return NextResponse.json({
      global: normalize(globalDoc),
      tenants: perTenant
    })
  } catch (e) {
    console.error('GET /api/master/maintenance error', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const auth = assertMaster(req)
  if (auth) return auth
  try {
    const body = await req.json()
    const { scope, tenantId, maintenanceMode, message, until } = body || {}
    if (scope !== 'global' && scope !== 'tenant') {
      return NextResponse.json({ error: 'scope geçersiz' }, { status: 400 })
    }
    if (scope === 'tenant' && !tenantId) {
      return NextResponse.json({ error: 'tenantId gerekli' }, { status: 400 })
    }
    const db = await getDb()
    const filter: any = { id: 'core', tenantId: scope === 'global' ? 'global' : tenantId }
    const update: any = {
      $set: {
        id: 'core',
        tenantId: filter.tenantId,
        maintenanceMode: !!maintenanceMode,
        maintenanceMessage: message || '',
        maintenanceUntil: until ? new Date(until) : null,
        updatedAt: new Date()
      },
      $setOnInsert: { createdAt: new Date() }
    }
    await db.collection('system_settings').updateOne(filter, update, { upsert: true })
    try {
      await addAuditLog({
        action: 'MAINTENANCE_UPDATED',
        entity: 'SYSTEM_SETTINGS',
        targetName: scope === 'global' ? 'global' : tenantId,
        meta: { scope, maintenanceMode, message, until },
        actorName: 'Master Admin',
        actorId: 'master-admin'
      })
    } catch {}
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('PATCH /api/master/maintenance error', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
