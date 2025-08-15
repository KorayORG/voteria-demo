import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db()
    const tenants = await db.collection('tenants').find({ active: { $ne: false } }).project({ slug:1, name:1, _id:0 }).sort({ name:1 }).toArray()
    return NextResponse.json({ tenants })
  } catch (e) {
    console.error('GET /api/public/tenants error', e)
    return NextResponse.json({ tenants: [{ slug:'default', name:'Default' }] })
  }
}
