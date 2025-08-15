import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { parseUserFromHeaders, requireRole } from '@/lib/auth-headers'
import { addAuditLog } from '@/lib/audit'
import { ObjectId } from 'mongodb'
import { resolveTenant } from '@/lib/tenant'

const COLLECTION = 'menus'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const week = searchParams.get('week')
  const shiftId = searchParams.get('shift')
  try {
    const tenant = resolveTenant()
    const client = await clientPromise
    const db = client.db()
    const base: any = {}
    if (week) base.weekOfISO = week
    // Backward compatibility: include legacy docs without tenantId
    const query: any = { ...base, $or:[ { tenantId: tenant.tenantId }, { tenantId: { $exists:false } } ] }
    const docs = await db.collection(COLLECTION).find(query).sort({ weekOfISO: 1 }).toArray()
    // Eğer shift parametresi varsa, days içindeki base değerleri shift override ile birleştir
    const menus = docs.map((doc: any) => {
      if (!shiftId) return doc
      const days = (doc.days || []).map((d: any) => {
        if (!d.shifts || !d.shifts[shiftId]) return d
        const over = d.shifts[shiftId]
        return {
          ...d,
          traditional: over.traditional !== undefined ? over.traditional : d.traditional,
          alternative: over.alternative !== undefined ? over.alternative : d.alternative,
        }
      })
      return { ...doc, days }
    })
    return NextResponse.json({ menus })
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const ctx = parseUserFromHeaders(req.headers as any)
  const authz = requireRole(ctx, ['admin','kitchen'])
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 })
  try {
    const tenant = resolveTenant()
    const body = await req.json()
  const { weekOfISO, days, isPublished=false, source } = body || {}
    if (!weekOfISO || !Array.isArray(days) || days.length === 0) {
      return NextResponse.json({ error: 'Eksik veri' }, { status: 400 })
    }
    const normDays = days.map((d:any) => ({
      date: d.date,
      traditional: d.traditional || null,
      alternative: d.alternative || null,
      shifts: d.shifts ? Object.fromEntries(Object.entries(d.shifts).map(([sid,val]:any) => [sid, {
        traditional: val.traditional || null,
        alternative: val.alternative || null
      }])) : undefined
    }))
    const doc = {
      weekOfISO,
      days: normDays,
      isPublished: !!isPublished,
      source: source || { type: 'manual' },
      createdAt: new Date().toISOString(),
      createdBy: ctx.userId || 'system',
      updatedAt: new Date().toISOString(),
      updatedBy: ctx.userId || 'system',
      tenantId: tenant.tenantId
    }
    const client = await clientPromise
    const db = client.db()
    await db.collection(COLLECTION).updateOne({ weekOfISO, $or:[ { tenantId: tenant.tenantId }, { tenantId: { $exists:false } } ] }, { $set: doc }, { upsert: true })
    let actorIdentityNumber: string | undefined
    if (ctx.userId) {
      try { const au = await db.collection('users').findOne({ _id: new ObjectId(ctx.userId) }); if (au) actorIdentityNumber = (au as any).identityNumber } catch {}
    }
    await addAuditLog({
      actorId: ctx.userId,
      actorName: 'Sistem',
      actorIdentityNumber,
      action: 'MENU_UPSERTED',
      entity: 'Menu',
      entityId: weekOfISO,
      targetId: weekOfISO,
      targetName: weekOfISO,
      meta: { dayCount: normDays.length, isPublished: !!isPublished, source: doc.source?.type },
      tenantId: tenant.tenantId
    })
    return NextResponse.json({ ok: true, menu: doc })
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
