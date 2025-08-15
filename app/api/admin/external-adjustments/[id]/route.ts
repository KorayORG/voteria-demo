import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { parseUserFromHeaders, resolvePermissions, requirePermission } from '@/lib/auth-headers'
import { resolveTenant } from '@/lib/tenant'
import { addAuditLog } from '@/lib/audit'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
  const ctx = await resolvePermissions(parseUserFromHeaders(req.headers as any))
  const authz = requirePermission(ctx, 'kitchenManage')
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 })
    const body = await req.json()
    const { id } = params
    const updates: any = {}
    if (body.addAbsolute != null) updates.addAbsolute = Number(body.addAbsolute)
    if (body.addPercent != null) updates.addPercent = Number(body.addPercent)
    if (body.note !== undefined) updates.note = body.note?.toString().slice(0,300) || undefined
    if (body.date) updates.date = new Date(body.date + 'T00:00:00.000Z')
    if (body.shiftId) updates.shiftId = body.shiftId
    updates.updatedAt = new Date()
    const tenant = resolveTenant()
    const client = await clientPromise
    const db = client.db()
    const col = db.collection('external_adjustments')
    const res = await col.findOneAndUpdate({ _id: new ObjectId(id), $or:[ { tenantId: tenant.tenantId }, { tenantId: { $exists:false } } ] }, { $set: { ...updates, tenantId: tenant.tenantId } })
    if (!res || !res.value) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    await addAuditLog({
      actorId: body.actorId || 'system',
      actorName: body.actorName || 'Sistem',
      action: 'EXTERNAL_ADJUSTMENT_UPDATED',
      entity: 'ExternalAdjustment',
      entityId: new ObjectId(id),
      meta: updates,
      tenantId: tenant.tenantId
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('PATCH /api/admin/external-adjustments/[id] error', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
  const ctx = await resolvePermissions(parseUserFromHeaders((_req as any).headers))
  const authz = requirePermission(ctx, 'kitchenManage')
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 })
    const { id } = params
    const tenant = resolveTenant()
    const client = await clientPromise
    const db = client.db()
    const col = db.collection('external_adjustments')
    const existing = await col.findOne({ _id: new ObjectId(id), $or:[ { tenantId: tenant.tenantId }, { tenantId: { $exists:false } } ] })
    if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    await col.deleteOne({ _id: new ObjectId(id) })
    await addAuditLog({
      actorId: 'system',
      actorName: 'Sistem',
      action: 'EXTERNAL_ADJUSTMENT_DELETED',
      entity: 'ExternalAdjustment',
      entityId: new ObjectId(id),
      meta: { shiftId: (existing as any).shiftId, date: (existing as any).date },
      tenantId: tenant.tenantId
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/admin/external-adjustments/[id] error', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
