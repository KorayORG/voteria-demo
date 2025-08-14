import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { identityNumber, password } = await req.json();
    if (!identityNumber || !password) {
      return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('cafeteria');
    const users = db.collection('users');
    // Bakım modu kontrolü
    const settings = await db.collection('system_settings').findOne({ id: 'core' });
    const user = await users.findOne({ identityNumber });
    if (settings?.maintenanceMode) {
      // Sadece admin kullanıcı giriş yapabilir (hem roleId rolü admin code'a maplenmiş hem de legacy role alanı)
      const isAdmin = user && (user.role === 'admin')
      if (!isAdmin) {
        return NextResponse.json({ error: 'Sistem bakım modunda. Giriş geçici olarak devre dışı.' }, { status: 503 });
      }
    }
    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }
    if (user.isActive === false) {
      return NextResponse.json({ error: 'Hesap pasif' }, { status: 403 });
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash || '');
    if (!isMatch) {
      return NextResponse.json({ error: 'Şifre yanlış' }, { status: 401 });
    }
    // Geçici token (gerçekte JWT vb.)
    const token = `tok_${user._id.toString()}`;
    const res = NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        identityNumber: user.identityNumber,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role || 'member',
        isActive: user.isActive !== false,
      },
    })
    // Basit cookie (httpOnly=false) sadece bakım modunda middleware kontrolü için kullanılıyor.
    res.cookies.set('uid', user._id.toString(), { path: '/' })
    res.cookies.set('urole', user.role || 'member', { path: '/' })
    return res;
  } catch (e) {
    console.error('LOGIN error', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
