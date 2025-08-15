import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { parseUserFromHeaders, requireRole } from '@/lib/auth-headers'
import { addAuditLog } from '@/lib/audit'
import { ObjectId } from 'mongodb'
import { resolveTenant } from '@/lib/tenant'

// NOTE: This is a scaffold. Actual PDF parsing will be implemented later.
// Endpoint supports two modes:
// 1) POST multipart/form-data with a PDF file (field name 'file') and optional { commit: 'true' } query param.
// 2) Returns a preview (commit=false) or saves (commit=true) extracted menu.

export const runtime = 'nodejs'

const COLLECTION = 'menus'

async function parsePdfToMenu(fileBuffer: Buffer) {
  // Basit heuristik PDF -> menü parse (taslak). Gerçek format netleşince iyileştirilecek.
  try {
  // @ts-ignore - pdf-parse has no types
  const pdfMod = await import('pdf-parse') as any
    const pdf = pdfMod.default || pdfMod
    const data = await pdf(fileBuffer)
    const text: string = data.text || ''
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    const dayNames = ['PAZARTESI','PAZARTESİ','SALI','ÇARŞAMBA','CARSAMBA','PERŞEMBE','PERSEMBE','CUMA','CUMARTESI','CUMARTESİ','PAZAR']
    interface ParsedDay { name: string; raw: string[] }
    const days: ParsedDay[] = []
    let current: ParsedDay | null = null
    for (const line of lines) {
      const upper = line.toUpperCase()
      const isDay = dayNames.some(d => upper.startsWith(d))
      if (isDay) {
        if (current) days.push(current)
        current = { name: upper.split(/\s+/)[0], raw: [] }
      } else if (current) {
        current.raw.push(line)
      }
    }
    if (current) days.push(current)

    // Map to stored day structure - naive: ilk iki satır geleneksel & alternatif
    const mappedDays = days.map((d, idx) => {
      const tradLine = d.raw[0] || null
      const altLine = d.raw[1] || null
      const norm = (s: string | null) => s ? s.replace(/\s+/g,' ').trim() : null
      return {
        date: null, // tarih PDF yapısından çıkarılamadıysa UI'da kullanıcı doldurabilir
        traditional: tradLine ? { name: norm(tradLine) } : null,
        alternative: altLine ? { name: norm(altLine) } : null,
        _sourceDayName: d.name
      }
    })

    return { days: mappedDays, meta: { extractedLineCount: lines.length } }
  } catch (e:any) {
    return { days: [], meta: { error: e.message } }
  }
}

export async function POST(req: Request) {
  const url = new URL(req.url)
  const tenant = resolveTenant()
  const commit = url.searchParams.get('commit') === 'true'
  const ctx = parseUserFromHeaders(req.headers as any)
  const authz = requireRole(ctx, ['admin','kitchen'])
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 })

  const contentType = req.headers.get('content-type') || ''
  if (!contentType.startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'multipart/form-data gerekli' }, { status: 400 })
  }

  const formData = await (req as any).formData?.() // Next.js edge/runtime nuance
  if (!formData) {
    return NextResponse.json({ error: 'Form veri okunamadı' }, { status: 400 })
  }
  const file = formData.get('file') as File | null
  const weekOfISO = formData.get('weekOfISO') as string | null
  if (!file || !weekOfISO) {
    return NextResponse.json({ error: 'file ve weekOfISO zorunlu' }, { status: 400 })
  }
  const arrayBuf = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuf)
  const parsed = await parsePdfToMenu(buffer)

  const preview = {
    weekOfISO,
    extracted: parsed,
  }

  if (!commit) {
    return NextResponse.json({ preview, commit: false })
  }

  // When committing, we expect parsed.days to contain structured dishes
  const client = await clientPromise
  const db = client.db()
  const doc = {
    weekOfISO,
    days: (parsed.days || []).map((d: any) => ({
      date: d.date || '',
      traditional: d.traditional || null,
      alternative: d.alternative || null
    })),
    isPublished: false,
    source: { type: 'pdf-import', meta: parsed.meta || {} },
    createdAt: new Date().toISOString(),
    createdBy: ctx.userId || 'system',
    updatedAt: new Date().toISOString(),
    updatedBy: ctx.userId || 'system',
    tenantId: tenant.tenantId
  }
  await db.collection(COLLECTION).updateOne({ weekOfISO }, { $set: doc }, { upsert: true })
  let actorIdentityNumber: string | undefined
  if (ctx.userId) {
    try { const au = await db.collection('users').findOne({ _id: new ObjectId(ctx.userId) }); if (au) actorIdentityNumber = (au as any).identityNumber } catch {}
  }
  await addAuditLog({
    actorId: ctx.userId,
    actorName: 'Sistem',
    actorIdentityNumber,
    action: 'MENU_IMPORTED_PDF',
    entity: 'Menu',
    entityId: weekOfISO,
    targetId: weekOfISO,
    targetName: weekOfISO,
    meta: { dayCount: (parsed.days||[]).length, commit, source: 'pdf-import' },
    tenantId: tenant.tenantId
  })
  return NextResponse.json({ ok: true, menu: doc, committed: true })
}
