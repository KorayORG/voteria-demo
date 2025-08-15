import { NextRequest, NextResponse } from 'next/server'
import { getDb, tryGetDb } from '@/lib/mongodb'
import { assertMaster } from '@/lib/master-auth'

// GET /api/master/audit-logs
// Query params:
//  tenant (optional) -> filter by tenantId
//  action (optional) -> exact action match
//  search (optional) -> fuzzy match on actorIdentityNumber, actorName, targetName, action, entity
//  start, end (ISO date) -> date range on createdAt
//  cursor (ISO date) + cursorId (ObjectId) for pagination OR skip (deprecated)
//  limit (default 50, max 200)
export async function GET(req: NextRequest) {
  const authError = assertMaster(req)
  if (authError) return authError

  try {
    const { searchParams } = new URL(req.url)
    const tenant = searchParams.get('tenant') || undefined
    const action = searchParams.get('action') || undefined
    const search = searchParams.get('search') || undefined
    const start = searchParams.get('start') || undefined
    const end = searchParams.get('end') || undefined
    const limitParam = parseInt(searchParams.get('limit') || '50', 10)
    const limit = Math.min(Math.max(limitParam, 1), 200)
    const cursor = searchParams.get('cursor') || undefined
    const skip = parseInt(searchParams.get('skip') || '0', 10)

    const db = await tryGetDb()
    if (!db) {
      return NextResponse.json({ logs: [], hasMore: false, nextCursor: null, degraded: true }, { status: 200 })
    }
    const collection = db.collection('audit_logs')

    const query: any = {}
    if (tenant) query.tenantId = tenant
    if (action) query.action = action
    if (start || end) {
      query.createdAt = {}
      if (start) query.createdAt.$gte = new Date(start)
      if (end) query.createdAt.$lte = new Date(end)
    }
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      query.$or = [
        { actorIdentityNumber: regex },
        { actorName: regex },
        { targetName: regex },
        { action: regex },
        { entity: regex }
      ]
    }
    if (cursor) {
      // simple cursor by date: fetch records older than cursor date
      const cursorDate = new Date(cursor)
      query.createdAt = { ...(query.createdAt || {}), $lt: cursorDate }
    }

    const docs = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(cursor ? 0 : skip) // if cursor pagination used, skip ignored
      .limit(limit + 1) // read one extra to know if there's more
      .toArray()

    const hasMore = docs.length > limit
    if (hasMore) docs.pop()

    return NextResponse.json({
      logs: docs.map(d => ({
        id: d._id,
        action: d.action,
        actorName: d.actorName,
        actorIdentityNumber: d.actorIdentityNumber,
        entity: d.entity,
        targetName: d.targetName,
        tenantId: d.tenantId,
        createdAt: d.createdAt,
        meta: d.meta
      })),
      nextCursor: hasMore ? docs[docs.length - 1]?.createdAt : null,
      hasMore
    })
  } catch (e) {
    console.error('GET /api/master/audit-logs error', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
