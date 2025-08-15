import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { assertMaster } from '@/lib/master-auth'

// Thresholds for brute-force style detection (initial heuristic)
const SHORT_WINDOW_MINUTES = 10
const SHORT_WINDOW_FAIL_THRESHOLD = 5

// NOTE: Further sophistication (per-IP + per-identity correlation, exponential backoff) can be added later

export async function GET(req: NextRequest) {
  const auth = assertMaster(req)
  if (auth) return auth
  const degradedDefaults = {
    range: '24h',
    windowStart: new Date(),
    failedWindow: 0,
    successWindow: 0,
    last24Failed: 0,
    last24Success: 0,
    topFailedIdentities: [],
    topFailedIPs: [],
    recentFailures: [],
    activeLocks: [],
    bruteForce: {
      shortWindowMinutes: SHORT_WINDOW_MINUTES,
      threshold: SHORT_WINDOW_FAIL_THRESHOLD,
      identities: [],
      ips: []
    },
    __dbUnavailable: true
  }
  try {
    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range') || '24h' // 24h | 7d | 30d
    const now = new Date()
    const minutesMap: Record<string, number> = { '24h': 1440, '7d': 10080, '30d': 43200 }
    const windowMinutes = minutesMap[range] || 1440
    const windowStart = new Date(now.getTime() - windowMinutes*60*1000)
    const weekAgo = new Date(now.getTime() - 7*24*60*60*1000)
    const last24Start = new Date(now.getTime() - 24*60*60*1000)
    const shortWindowStart = new Date(now.getTime() - SHORT_WINDOW_MINUTES*60*1000)
    const db = await getDb()
    const col = db.collection('login_attempts')
    const locksCol = db.collection('login_locks')

    const [ failedWindow, successWindow, topFailedIdentities, topFailedIPs, recentFailures, activeLocks, last24Failed, last24Success, shortFailedAggIdentities, shortFailedAggIPs ] = await Promise.all([
      col.countDocuments({ success: false, createdAt: { $gte: windowStart } }),
      col.countDocuments({ success: true, createdAt: { $gte: windowStart } }),
      col.aggregate([
        { $match: { success: false, createdAt: { $gte: weekAgo } } },
        { $group: { _id: '$identityNumber', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]).toArray(),
      col.aggregate([
        { $match: { success: false, createdAt: { $gte: weekAgo } } },
        { $group: { _id: '$ip', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]).toArray(),
      col.find({ success: false }).sort({ createdAt: -1 }).limit(15).toArray(),
      locksCol.find({ until: { $gt: new Date() } }).sort({ until: 1 }).limit(50).toArray(),
      col.countDocuments({ success: false, createdAt: { $gte: last24Start } }),
      col.countDocuments({ success: true, createdAt: { $gte: last24Start } }),
      // Short window aggregations for brute-force alerting (identities)
      col.aggregate([
        { $match: { success: false, createdAt: { $gte: shortWindowStart } } },
        { $group: { _id: '$identityNumber', count: { $sum: 1 }, ips: { $addToSet: '$ip' } } },
        { $match: { count: { $gte: SHORT_WINDOW_FAIL_THRESHOLD } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]).toArray(),
      // Short window aggregations for brute-force alerting (IPs)
      col.aggregate([
        { $match: { success: false, createdAt: { $gte: shortWindowStart } } },
        { $group: { _id: '$ip', count: { $sum: 1 }, identities: { $addToSet: '$identityNumber' } } },
        { $match: { count: { $gte: SHORT_WINDOW_FAIL_THRESHOLD } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]).toArray()
    ])

    return NextResponse.json({
      range,
      windowStart,
      failedWindow,
      successWindow,
      last24Failed,
      last24Success,
      topFailedIdentities: topFailedIdentities.map(i => ({ identityNumber: i._id, count: i.count })),
      topFailedIPs: topFailedIPs.map(i => ({ ip: i._id, count: i.count })),
      recentFailures: recentFailures.map(r => ({ identityNumber: r.identityNumber, tenantSlug: r.tenantSlug, ip: r.ip, reason: r.reason, createdAt: r.createdAt })),
      activeLocks: activeLocks.map(l => ({ identityNumber: l.identityNumber, tenantSlug: l.tenantSlug, until: l.until })),
      bruteForce: {
        shortWindowMinutes: SHORT_WINDOW_MINUTES,
        threshold: SHORT_WINDOW_FAIL_THRESHOLD,
        identities: shortFailedAggIdentities.map(i => ({ identityNumber: i._id, count: i.count, ips: i.ips })),
        ips: shortFailedAggIPs.map(i => ({ ip: i._id, count: i.count, identities: i.identities }))
      }
    })
  } catch (e:any) {
    console.error('[security] DB unavailable, serving degraded defaults:', e?.message)
    return NextResponse.json(degradedDefaults, { status: 200 })
  }
}

// Manual unlock endpoint
export async function POST(req: NextRequest) {
  const auth = assertMaster(req)
  if (auth) return auth
  try {
    const body = await req.json().catch(()=> ({}))
    const { identityNumber, tenantSlug } = body || {}
    if (!identityNumber) {
      return NextResponse.json({ error: 'identityNumber gerekli' }, { status: 400 })
    }
    const db = await getDb()
    await db.collection('login_locks').deleteOne({ identityNumber, tenantSlug: tenantSlug || undefined })
    // Optionally insert an audit log (reuse addAuditLog dynamically imported to avoid circular if any)
    try {
      const { addAuditLog } = await import('@/lib/audit')
      await addAuditLog({ action: 'ACCOUNT_UNLOCKED', entity: 'USER', targetName: identityNumber, meta: { tenantSlug: tenantSlug || null }, actorName: 'master-admin' })
    } catch {}
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('POST /api/master/security unlock error', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
