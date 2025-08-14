import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { parseUserFromHeaders, resolvePermissions, requirePermission } from '@/lib/auth-headers'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('cafeteria')
    const col = db.collection('roles')
    const count = await col.countDocuments()
    if (count === 0) {
      const seed = [
        { name: 'Admin', code:'admin', color:'#dc2626', order:1, permissions:{ canVote:true, kitchenView:true, kitchenManage:true, isAdmin:true }, createdAt:new Date(), updatedAt:new Date() },
        { name: 'Mutfak', code:'kitchen', color:'#f59e0b', order:2, permissions:{ canVote:true, kitchenView:true, kitchenManage:true, isAdmin:false }, createdAt:new Date(), updatedAt:new Date() },
        { name: 'Üye', code:'member', color:'#2563eb', order:3, permissions:{ canVote:true, kitchenView:false, kitchenManage:false, isAdmin:false }, createdAt:new Date(), updatedAt:new Date() },
      ]
      await col.insertMany(seed)
    }
    const roles = await col.find({}).sort({ order:1 }).toArray()
    return NextResponse.json({ roles })
  } catch (e) {
    console.error('GET /api/admin/roles error', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
  const ctx = await resolvePermissions(parseUserFromHeaders(req.headers as any))
  const authz = requirePermission(ctx, 'kitchenManage') // treat kitchenManage (admin subset) as manage roles
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 })
    const body = await req.json()
  const { name, code, color = '#888888', order = 99, permissions } = body
    if (!name || !permissions) return NextResponse.json({ error: 'Eksik alan' }, { status: 400 })
    const client = await clientPromise
    const db = client.db('cafeteria')
  const doc = { name: name.toString().slice(0,40), code: code?.toString().toLowerCase().slice(0,40) || undefined, color, order: Number(order), permissions, createdAt: new Date(), updatedAt: new Date() }
    const result = await db.collection('roles').insertOne(doc)
    let actorIdentityNumber: string | undefined
    if (ctx.userId) {
      try { const au = await db.collection('users').findOne({ _id: new ObjectId(ctx.userId) }); if (au) actorIdentityNumber = (au as any).identityNumber } catch {}
    }
    await db.collection('audit_logs').insertOne({ action:'ROLE_CREATED', actorId: ctx.userId || 'system', actorName:'Sistem', actorIdentityNumber, entity:'Role', entityId: result.insertedId, targetId: result.insertedId, targetName: name, meta:{ name, code }, createdAt:new Date() })
    return NextResponse.json({ id: result.insertedId })
  } catch (e) {
    console.error('POST /api/admin/roles error', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
