import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { identityNumber, fullName, phone, password } = await req.json();
    if (!identityNumber || !fullName || !phone || !password) {
      return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
    }
    if (identityNumber.length !== 11) {
      return NextResponse.json({ error: 'Kimlik numarası 11 haneli olmalı' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('cafeteria');
    const settings = await db.collection('system_settings').findOne({ id: 'core' });
    if (settings?.maintenanceMode) {
      return NextResponse.json({ error: 'Sistem bakım modunda. Kayıt geçici olarak devre dışı.' }, { status: 503 });
    }
    const users = db.collection('users');
    const existing = await users.findOne({ $or: [ { identityNumber }, { phone } ] });
    if (existing) {
      return NextResponse.json({ error: 'Kimlik numarası veya telefon kayıtlı' }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const userDoc = {
      identityNumber,
      fullName,
      phone,
      role: 'member',
      isActive: true,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await users.insertOne(userDoc);
    return NextResponse.json({ success: true, userId: result.insertedId, fullName, role: 'member' });
  } catch (e) {
    console.error('REGISTER error', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
