import { NextRequest, NextResponse } from 'next/server'
import clientPromise, { getDb } from '@/lib/mongodb'

// GET: List all active tenants for company selection
export async function GET() {
  try {
    const db = await getDb()
    const filter = { $or: [ { status: 'active' }, { status: { $exists: false }, isActive: { $ne: false } }, { status: { $exists: false }, isActive: { $exists: false } } ] }
    const tenants = await db.collection('tenants').find(filter).sort({ name: 1 }).toArray()
    return NextResponse.json({ tenants })
  } catch (e) {
    console.error('GET /api/tenants error', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// POST: Create new tenant (admin only - future)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, slug } = body
    
    if (!name || !slug) {
      return NextResponse.json({ error: 'Firma adı ve slug gerekli' }, { status: 400 })
    }

    const db = await getDb()
    const tenantsCol = db.collection('tenants')
    
    // Check if slug already exists
    const existing = await tenantsCol.findOne({ slug })
    if (existing) {
      return NextResponse.json({ error: 'Bu slug zaten kullanımda' }, { status: 409 })
    }

    const tenant = {
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40),
      name: name.slice(0, 100),
      status: 'active' as const,
      isActive: true,
      createdAt: new Date()
    }

    const result = await tenantsCol.insertOne(tenant)
    return NextResponse.json({ success: true, tenantId: result.insertedId })
  } catch (e) {
    console.error('POST /api/tenants error', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
