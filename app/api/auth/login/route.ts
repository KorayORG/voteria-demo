import { NextRequest, NextResponse } from 'next/server';
import clientPromise, { getDb } from '@/lib/mongodb';
import { resolveTenant } from '@/lib/tenant';
import bcrypt from 'bcryptjs';
import { addAuditLog } from '@/lib/audit';

const FAILED_WINDOW_MINUTES = 10;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

async function isLocked(db: any, identityNumber: string, tenantSlug?: string) {
  return await db.collection('login_locks').findOne({ identityNumber, tenantSlug, until: { $gt: new Date() } });
}

async function countRecentFailures(db: any, identityNumber: string, tenantSlug: string | undefined) {
  const since = new Date(Date.now() - FAILED_WINDOW_MINUTES * 60 * 1000);
  return db.collection('login_attempts').countDocuments({ identityNumber, tenantSlug, success: false, createdAt: { $gte: since } });
}

async function recordAttempt(data: { identityNumber: string; tenantSlug?: string; success: boolean; reason?: string; ip?: string; isMaster?: boolean }) {
  try {
    const db = await getDb();
    await db.collection('login_attempts').insertOne({
      identityNumber: data.identityNumber,
      tenantSlug: data.tenantSlug,
      success: data.success,
      reason: data.reason,
      ip: data.ip,
      isMaster: !!data.isMaster,
      createdAt: new Date()
    });
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const { identityNumber, password, tenantSlug } = await req.json();
    if (!identityNumber || !password) {
      return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
    }
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';

    // Check for Master Admin first
    const masterAdminId = process.env.MASTER_ADMIN_ID;
    const masterAdminPassword = process.env.MASTER_ADMIN_PASSWORD;
    if (
      identityNumber === masterAdminId &&
      password === masterAdminPassword &&
      (!tenantSlug || tenantSlug === 'sec-ye')
    ) {
      const masterUser = {
        id: 'master-admin',
        identityNumber: masterAdminId,
        fullName: 'Master Administrator',
        phone: '00000000000',
        role: 'master-admin',
        isActive: true,
        tenantId: 'master',
        tenantSlug: 'sec-ye',
        tenantName: 'Seç Ye'
      };
      const token = `tok_master_admin`;
      const res = NextResponse.json({
        success: true,
        token,
        user: masterUser,
        isMasterAdmin: true
      });
      res.cookies.set('uid', 'master-admin', { path: '/' });
      res.cookies.set('urole', 'master-admin', { path: '/' });
      recordAttempt({ identityNumber, tenantSlug, success: true, ip, isMaster: true });
      return res;
    }

    // Normal user login
    const tenant = resolveTenant(tenantSlug);
    let dbUnavailable = false;
    let user: any = null;
    let settings: any = null;
    try {
      const db = await getDb();
      const users = db.collection('users');
      settings = await db.collection('system_settings').findOne({ id: 'core', tenantId: tenant.tenantId });
      if (!settings) {
        const globalSettings = await db.collection('system_settings').findOne({ id: 'core', tenantId: 'global' });
        if (globalSettings) settings = globalSettings;
      }
      user = await users.findOne({ identityNumber, tenantId: tenant.tenantId });
    } catch (err) {
      dbUnavailable = true;
      console.error('DB erişim hatası (login):', (err as any)?.message);
    }
    if (settings?.maintenanceMode) {
      const isAdmin = user && (user.role === 'admin')
      if (!isAdmin) {
        recordAttempt({ identityNumber, tenantSlug, success: false, reason: 'maintenance', ip });
        return NextResponse.json({ error: 'Sistem bakım modunda. Giriş geçici olarak devre dışı.' }, { status: 503 });
      }
    }
    // Rate limit & lock logic (requires DB available)
    if (!dbUnavailable) {
      const db = await getDb();
      const existingLock = await isLocked(db, identityNumber, tenantSlug);
      if (existingLock) {
        recordAttempt({ identityNumber, tenantSlug, success: false, reason: 'locked', ip });
        return NextResponse.json({ error: 'Hesap geçici olarak kilitlendi. Birkaç dakika sonra tekrar deneyin.' }, { status: 423 });
      }
    }
    if (!user && !dbUnavailable) {
      recordAttempt({ identityNumber, tenantSlug, success: false, reason: 'not_found', ip });
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }
    if (user && user.isActive === false) {
      recordAttempt({ identityNumber, tenantSlug, success: false, reason: 'inactive', ip });
      return NextResponse.json({ error: 'Hesap pasif' }, { status: 403 });
    }
    if (user && !(await bcrypt.compare(password, user.passwordHash || ''))) {
      recordAttempt({ identityNumber, tenantSlug, success: false, reason: 'wrong_password', ip });
      try {
        const db = await getDb();
        const failures = await countRecentFailures(db, identityNumber, tenantSlug);
        if (failures + 1 >= MAX_FAILED_ATTEMPTS) {
          const until = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
            await db.collection('login_locks').updateOne(
              { identityNumber, tenantSlug },
              { $set: { identityNumber, tenantSlug, until, createdAt: new Date() } },
              { upsert: true }
            );
            await addAuditLog({ action: 'ACCOUNT_LOCKED', entity: 'USER', targetName: identityNumber, meta: { tenantSlug, until }, actorName: 'system' });
        }
      } catch {}
      return NextResponse.json({ error: 'Şifre yanlış' }, { status: 401 });
    }
    const token = user ? `tok_${user._id.toString()}` : 'tok_no_db';
    const res = NextResponse.json({
      success: true,
      token,
      user: {
        id: user ? user._id.toString() : 'unknown',
        identityNumber: user ? user.identityNumber : identityNumber,
        fullName: user ? user.fullName : 'Bilinmeyen Kullanıcı',
        phone: user ? user.phone : '',
        role: user ? (user.role || 'member') : 'member',
        isActive: user ? user.isActive !== false : true,
        tenantId: tenant.tenantId,
      },
    })
    if (user) {
      res.cookies.set('uid', user._id.toString(), { path: '/' })
      res.cookies.set('urole', user.role || 'member', { path: '/' })
    }
    recordAttempt({ identityNumber, tenantSlug, success: true, ip });
    return res;
  } catch (e) {
    console.error('LOGIN error', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
