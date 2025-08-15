import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { parseUserFromHeaders, resolvePermissions, requirePermission } from '@/lib/auth-headers'
import { ObjectId } from 'mongodb'
import { resolveTenant } from '@/lib/tenant'
import { addAuditLog } from '@/lib/audit'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
  const ctx = await resolvePermissions(parseUserFromHeaders(req.headers as any))
  const authz = requirePermission(ctx, 'kitchenManage')
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 })
    const { id } = params
    const body = await req.json()
    const updates:any = {}
  if (body.name) updates.name = body.name.toString().slice(0,40)
  if (body.code !== undefined) updates.code = body.code?.toString().toLowerCase().slice(0,40) || undefined
    if (body.color) updates.color = body.color
    if (body.order != null) updates.order = Number(body.order)
    if (body.permissions) updates.permissions = body.permissions
    updates.updatedAt = new Date()
  const tenant = resolveTenant()
  const client = await clientPromise
  const db = client.db()
    const col = db.collection('roles')
  const res = await col.findOneAndUpdate({ _id: new ObjectId(id), $or:[ { tenantId: tenant.tenantId }, { tenantId: { $exists:false } } ] }, { $set: { ...updates, tenantId: tenant.tenantId } })
    if (!res || !res.value) return NextResponse.json({ error: 'Rol bulunamadı' }, { status: 404 })
    let actorIdentityNumber: string | undefined
    if (ctx.userId) {
      try { const au = await db.collection('users').findOne({ _id: new ObjectId(ctx.userId) }); if (au) actorIdentityNumber = (au as any).identityNumber } catch {}
    }
  await addAuditLog({ action:'ROLE_UPDATED', actorId: ctx.userId || 'system', actorName:'Sistem', actorIdentityNumber, entity:'Role', entityId: new ObjectId(id), targetId: new ObjectId(id), targetName: updates.name || (res.value as any).name, meta: updates, tenantId: tenant.tenantId })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('PATCH /api/admin/roles/[id] error', e)
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
    const col = db.collection('roles')
  const role = await col.findOne({ _id: new ObjectId(id), $or:[ { tenantId: tenant.tenantId }, { tenantId: { $exists:false } } ] })
    if (!role) return NextResponse.json({ error: 'Rol bulunamadı' }, { status: 404 })
  await col.deleteOne({ _id: new ObjectId(id) })
    let actorIdentityNumber: string | undefined
    if (ctx.userId) {
      try { const au = await db.collection('users').findOne({ _id: new ObjectId(ctx.userId) }); if (au) actorIdentityNumber = (au as any).identityNumber } catch {}
    }
  await addAuditLog({ action:'ROLE_DELETED', actorId: ctx.userId || 'system', actorName:'Sistem', actorIdentityNumber, entity:'Role', entityId: new ObjectId(id), targetId: new ObjectId(id), targetName: (role as any).name, meta:{ name: (role as any).name }, tenantId: tenant.tenantId })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/admin/roles/[id] error', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
