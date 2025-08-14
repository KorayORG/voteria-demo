import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { parseUserFromHeaders, requirePermission, resolvePermissions } from '@/lib/auth-headers'

const COLLECTION = 'shifts'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const ctx = await resolvePermissions(parseUserFromHeaders(req.headers as any))
  const authz = requirePermission(ctx, 'kitchenManage')
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 })
  try {
    const body = await req.json()
    const allowed = (({ code, label, startTime, endTime, order, isActive }) => ({ code, label, startTime, endTime, order, isActive }))(body)
    Object.keys(allowed).forEach(k => (allowed as any)[k] === undefined && delete (allowed as any)[k])
    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })
    }
    const client = await clientPromise
    const db = client.db()
    if (allowed.code) {
      const exists = await db.collection(COLLECTION).findOne({ code: allowed.code, _id: { $ne: new ObjectId(params.id) } })
      if (exists) return NextResponse.json({ error: 'Kod zaten kullanılıyor' }, { status: 409 })
    }
    await db.collection(COLLECTION).updateOne({ _id: new ObjectId(params.id) }, { $set: { ...allowed, updatedAt: new Date(), updatedBy: ctx.userId || 'system' } })
    return NextResponse.json({ ok: true })
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const ctx = await resolvePermissions(parseUserFromHeaders(req.headers as any))
  const authz = requirePermission(ctx, 'kitchenManage')
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 })
  try {
    const client = await clientPromise
    const db = client.db()
    await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(params.id) })
    return NextResponse.json({ ok: true })
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
