import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

// POST /api/auth/forgot -> generate (demo) code
export async function POST(req: Request){
  try {
    const { identityNumber, phone } = await req.json()
    if(!identityNumber || !phone) return NextResponse.json({ error:'Eksik bilgi' }, { status:400 })
    const client = await clientPromise
    const db = client.db()
    const user = await db.collection('users').findOne({ identityNumber, phone })
    if(!user) return NextResponse.json({ error:'Kullanıcı bulunamadı' }, { status:404 })
    // demo: static code 000000 stored with short expiry
    const code = '000000'
    const expiresAt = new Date(Date.now()+5*60*1000)
    await db.collection('password_resets').updateOne({ userId: user._id }, { $set: { code, expiresAt, used:false } }, { upsert:true })
    return NextResponse.json({ ok:true })
  } catch (e:any){
    console.error('forgot error', e)
    return NextResponse.json({ error:'Sunucu hatası' }, { status:500 })
  }
}
