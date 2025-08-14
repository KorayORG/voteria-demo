import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function POST(req: Request){
  try {
    const { identityNumber, code } = await req.json()
    if(!identityNumber || !code) return NextResponse.json({ error:'Eksik bilgi' }, { status:400 })
    const client = await clientPromise
    const db = client.db()
    const user = await db.collection('users').findOne({ identityNumber }, { projection:{ _id:1 } })
    if(!user) return NextResponse.json({ error:'Kullanıcı yok' }, { status:404 })
    const pr = await db.collection('password_resets').findOne({ userId: user._id, used:false })
    if(!pr || pr.code !== code) return NextResponse.json({ error:'Kod hatalı' }, { status:400 })
    if(new Date(pr.expiresAt) < new Date()) return NextResponse.json({ error:'Kod süresi doldu' }, { status:400 })
    return NextResponse.json({ ok:true })
  } catch(e:any){
    console.error('verify error', e)
    return NextResponse.json({ error:'Sunucu hatası' }, { status:500 })
  }
}
