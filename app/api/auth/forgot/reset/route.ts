import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import bcrypt from 'bcryptjs'

export async function POST(req: Request){
  try {
    const { identityNumber, code, password } = await req.json()
    if(!identityNumber || !code || !password) return NextResponse.json({ error:'Eksik bilgi' }, { status:400 })
    if(password.length < 6) return NextResponse.json({ error:'Şifre çok kısa' }, { status:400 })
    const client = await clientPromise
    const db = client.db()
    const user = await db.collection('users').findOne({ identityNumber })
    if(!user) return NextResponse.json({ error:'Kullanıcı yok' }, { status:404 })
    const pr = await db.collection('password_resets').findOne({ userId: user._id, used:false })
    if(!pr || pr.code !== code) return NextResponse.json({ error:'Kod hatalı' }, { status:400 })
    if(new Date(pr.expiresAt) < new Date()) return NextResponse.json({ error:'Kod süresi doldu' }, { status:400 })
    const hashed = await bcrypt.hash(password, 10)
    await db.collection('users').updateOne({ _id: user._id }, { $set: { password: hashed } })
    await db.collection('password_resets').updateOne({ _id: pr._id }, { $set: { used:true, usedAt:new Date() } })
    return NextResponse.json({ ok:true })
  } catch(e:any){
    console.error('reset error', e)
    return NextResponse.json({ error:'Sunucu hatası' }, { status:500 })
  }
}
