import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { parseUserFromHeaders, requirePermission, resolvePermissions } from '@/lib/auth-headers'

const COLLECTION = 'shifts'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db()
    const shifts = await db.collection(COLLECTION).find({}).sort({ order: 1 }).toArray()
    return NextResponse.json({ shifts })
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const ctx = await resolvePermissions(parseUserFromHeaders(req.headers as any))
  const authz = requirePermission(ctx, 'kitchenManage')
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 })
  try {
    const body = await req.json()
    const { code, label, startTime, endTime, order, isActive = true } = body || {}
    if (!code || !label || !startTime || !endTime) {
      return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 })
    }
    const client = await clientPromise
    const db = client.db()
    const existing = await db.collection(COLLECTION).findOne({ code })
    if (existing) return NextResponse.json({ error: 'Kod zaten var' }, { status: 409 })
    const shiftDoc = {
      code,
      label,
      startTime,
      endTime,
      order: order ?? 99,
      isActive: !!isActive,
      createdAt: new Date(),
      createdBy: ctx.userId || 'system'
    }
    const res = await db.collection(COLLECTION).insertOne(shiftDoc)
    return NextResponse.json({ shift: { ...shiftDoc, _id: res.insertedId } }, { status: 201 })
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
