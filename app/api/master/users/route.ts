import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { assertMaster } from '@/lib/master-auth'
import { ObjectId } from 'mongodb'

// GET /api/master/users
// query: search, role, tenant, isActive, limit (max 100), cursor (user _id for pagination)
export async function GET(req: NextRequest) {
  const auth = assertMaster(req)
  if (auth) return auth
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const tenant = searchParams.get('tenant') || ''
    const isActive = searchParams.get('isActive')
    const cursor = searchParams.get('cursor')
    const limitParam = parseInt(searchParams.get('limit') || '50', 10)
    const limit = Math.min(Math.max(limitParam, 1), 100)

    const db = await getDb()
    const col = db.collection('users')
    const q: any = {}
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'i')
      q.$or = [
        { fullName: regex },
        { identityNumber: regex },
        { phone: regex }
      ]
    }
    if (role) q.role = role
    if (tenant) q.tenantId = tenant
    if (isActive === 'true') q.isActive = { $ne: false }
    if (isActive === 'false') q.isActive = false
    if (cursor && ObjectId.isValid(cursor)) {
      q._id = { $lt: new ObjectId(cursor) }
    }

    const docs = await col.find(q).sort({ _id: -1 }).limit(limit + 1).toArray()
    const hasMore = docs.length > limit
    if (hasMore) docs.pop()

    return NextResponse.json({
      users: docs.map(d => ({
        id: d._id,
        identityNumber: d.identityNumber,
        fullName: d.fullName,
        phone: d.phone,
        role: d.role || 'member',
        isActive: d.isActive !== false,
        tenantId: d.tenantId,
        createdAt: d.createdAt,
        lastLogin: d.lastLogin
      })),
      nextCursor: hasMore ? String(docs[docs.length - 1]._id) : null,
      hasMore
    })
  } catch (e) {
    console.error('GET /api/master/users error', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// PATCH /api/master/users -> toggle activation
export async function PATCH(req: NextRequest) {
  const auth = assertMaster(req)
  if (auth) return auth
  try {
    const body = await req.json()
    const { userId, isActive } = body
    if (!userId || !ObjectId.isValid(userId)) return NextResponse.json({ error:'Geçersiz userId' }, { status:400 })
    const db = await getDb()
    await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { isActive: !!isActive, updatedAt:new Date() } })
    return NextResponse.json({ success:true })
  } catch (e) {
    console.error('PATCH /api/master/users error', e)
    return NextResponse.json({ error:'Sunucu hatası' }, { status:500 })
  }
}
