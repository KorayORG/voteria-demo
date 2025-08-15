import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { parseUserFromHeaders, resolvePermissions, requirePermission } from '@/lib/auth-headers'
import { resolveTenant } from '@/lib/tenant'
import { addAuditLog } from '@/lib/audit'

// GET list external adjustments (optionally filtered by date range)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
  const tenant = resolveTenant()
  const client = await clientPromise
  const db = client.db()
    const col = db.collection('external_adjustments')
    const query: any = {}
    if (from || to) {
      query.date = {}
      if (from) query.date.$gte = new Date(from + 'T00:00:00.000Z')
      if (to) query.date.$lte = new Date(to + 'T23:59:59.999Z')
    }
  query.$or = [ { tenantId: tenant.tenantId }, { tenantId: { $exists:false } } ]
    const items = await col.find(query).sort({ date: -1, createdAt: -1 }).limit(500).toArray()
    return NextResponse.json({ adjustments: items })
  } catch (e) {
    console.error('GET /api/admin/external-adjustments error', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// POST create external adjustment
export async function POST(req: NextRequest) {
  try {
  const ctx = await resolvePermissions(parseUserFromHeaders(req.headers as any))
  const authz = requirePermission(ctx, 'kitchenManage')
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 })
    const body = await req.json()
    const { date, shiftId, addAbsolute, addPercent, note, actorId = 'system', actorName = 'Sistem' } = body
    if (!date || !shiftId) {
      return NextResponse.json({ error: 'Tarih ve vardiya zorunlu' }, { status: 400 })
    }
    if (addAbsolute == null && addPercent == null) {
      return NextResponse.json({ error: 'Bir adet ya da yüzde artışı gerekli' }, { status: 400 })
    }
    const doc: any = {
      date: new Date(date + 'T00:00:00.000Z'),
      shiftId,
      addAbsolute: addAbsolute != null ? Number(addAbsolute) : undefined,
      addPercent: addPercent != null ? Number(addPercent) : undefined,
      note: note?.toString().slice(0, 300) || undefined,
      createdBy: actorId,
      createdAt: new Date(),
    }
    const tenant = resolveTenant()
    const client = await clientPromise
    const db = client.db()
    const col = db.collection('external_adjustments')
    doc.tenantId = tenant.tenantId
    const result = await col.insertOne(doc)

    await addAuditLog({
      actorId, actorName,
      action: 'EXTERNAL_ADJUSTMENT_CREATED',
      entity: 'ExternalAdjustment',
      entityId: result.insertedId,
      meta: { shiftId, addAbsolute: doc.addAbsolute, addPercent: doc.addPercent },
      tenantId: tenant.tenantId
    })

    return NextResponse.json({ id: result.insertedId })
  } catch (e) {
    console.error('POST /api/admin/external-adjustments error', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
