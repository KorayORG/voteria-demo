import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { resolveTenant } from "@/lib/tenant"
import bcrypt from "bcryptjs"
import { addAuditLog } from "@/lib/audit"
import jwt from "jsonwebtoken"

const FAILED_WINDOW_MINUTES = 10
const MAX_FAILED_ATTEMPTS = 5
const LOCK_MINUTES = 15

async function isMasterAdmin(identityNumber: string, password: string, tenantSlug?: string): Promise<boolean> {
  const masterTckn = process.env.MASTER_ADMIN_TCKN
  const masterPassword = process.env.MASTER_ADMIN_PASSWORD

  return identityNumber === masterTckn && password === masterPassword && (!tenantSlug || tenantSlug === "secye")
}

async function isLocked(db: any, identityNumber: string, tenantSlug?: string) {
  return await db.collection("login_locks").findOne({ identityNumber, tenantSlug, until: { $gt: new Date() } })
}

async function countRecentFailures(db: any, identityNumber: string, tenantSlug: string | undefined) {
  const since = new Date(Date.now() - FAILED_WINDOW_MINUTES * 60 * 1000)
  return db
    .collection("login_attempts")
    .countDocuments({ identityNumber, tenantSlug, success: false, createdAt: { $gte: since } })
}

async function recordAttempt(data: {
  identityNumber: string
  tenantSlug?: string
  success: boolean
  reason?: string
  ip?: string
  isMaster?: boolean
}) {
  try {
    const db = await getDb()
    await db.collection("login_attempts").insertOne({
      identityNumber: data.identityNumber,
      tenantSlug: data.tenantSlug,
      success: data.success,
      reason: data.reason,
      ip: data.ip,
      isMaster: !!data.isMaster,
      createdAt: new Date(),
    })
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const { identityNumber, password, tenantSlug } = await req.json()
    if (!identityNumber || !password) {
      return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 })
    }
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"

    if (await isMasterAdmin(identityNumber, password, tenantSlug)) {
      const masterUser = {
        userId: "master-admin",
        username: "master-admin",
        fullName: "Master Administrator",
        email: "master@secye.com",
        currentTenant: "secye",
        currentRole: "master",
        rolesByTenant: { secye: "master" },
        permissions: {
          canVote: false,
          canViewKitchen: false,
          canManageKitchen: false,
          canViewAdmin: false,
          canManageAdmin: false,
          canViewMaster: true,
          canManageMaster: true,
        },
      }

      const token = jwt.sign(masterUser, process.env.JWT_SECRET!, { expiresIn: "24h" })

      const res = NextResponse.json({
        success: true,
        user: masterUser,
        isMasterAdmin: true,
        maintenance: { active: false },
        degraded: false,
      })

      res.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: "/",
      })
      res.cookies.set("tenant-slug", "secye", { path: "/" })

      recordAttempt({ identityNumber, tenantSlug: "secye", success: true, ip, isMaster: true })

      await addAuditLog({
        action: "MASTER_LOGIN",
        entity: "MASTER",
        targetName: "Master Dashboard",
        actorName: "Master Administrator",
        actorIdentityNumber: identityNumber,
        meta: { ip, tenantSlug: "secye" },
      })

      return res
    }

    // Normal user login
    const tenant = await resolveTenant(tenantSlug)
    let dbUnavailable = false
    let user: any = null
    let settings: any = null

    try {
      const db = await getDb()
      const users = db.collection("users")

      // Check maintenance settings
      settings = await db.collection("system_settings").findOne({
        id: "core",
        $or: [{ tenantId: tenant.tenantId }, { tenantId: "global" }],
      })

      // Find user with tenant filtering
      const userQuery = {
        $or: [
          { identityNumber, tenantId: tenant.tenantId },
          { identityNumber, phone: identityNumber, tenantId: tenant.tenantId },
        ],
      }
      user = await users.findOne(userQuery)
    } catch (err) {
      dbUnavailable = true
      console.error("DB erişim hatası (login):", (err as any)?.message)
    }

    if (settings?.maintenanceMode && !dbUnavailable) {
      const isAdmin = user && (user.role === "admin" || user.role === "kitchen")
      if (!isAdmin) {
        recordAttempt({ identityNumber, tenantSlug, success: false, reason: "maintenance", ip })
        return NextResponse.json(
          {
            error: "Sistem bakım modunda. Giriş geçici olarak devre dışı.",
            maintenance: {
              active: true,
              message: settings.maintenanceMessage || "Sistem bakımda",
              until: settings.maintenanceUntil,
            },
          },
          { status: 503 },
        )
      }
    }

    // Rate limit & lock logic (requires DB available)
    if (!dbUnavailable) {
      const db = await getDb()
      const existingLock = await isLocked(db, identityNumber, tenantSlug)
      if (existingLock) {
        recordAttempt({ identityNumber, tenantSlug, success: false, reason: "locked", ip })
        return NextResponse.json(
          { error: "Hesap geçici olarak kilitlendi. Birkaç dakika sonra tekrar deneyin." },
          { status: 423 },
        )
      }
    }

    if (!user && !dbUnavailable) {
      recordAttempt({ identityNumber, tenantSlug, success: false, reason: "not_found", ip })
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    if (user && user.isActive === false) {
      recordAttempt({ identityNumber, tenantSlug, success: false, reason: "inactive", ip })
      return NextResponse.json({ error: "Hesap pasif" }, { status: 403 })
    }

    if (user && !(await bcrypt.compare(password, user.passwordHash || ""))) {
      recordAttempt({ identityNumber, tenantSlug, success: false, reason: "wrong_password", ip })

      try {
        const db = await getDb()
        const failures = await countRecentFailures(db, identityNumber, tenantSlug)
        if (failures + 1 >= MAX_FAILED_ATTEMPTS) {
          const until = new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
          await db
            .collection("login_locks")
            .updateOne(
              { identityNumber, tenantSlug },
              { $set: { identityNumber, tenantSlug, until, createdAt: new Date() } },
              { upsert: true },
            )
          await addAuditLog({
            action: "ACCOUNT_LOCKED",
            entity: "USER",
            targetName: identityNumber,
            meta: { tenantSlug, until },
            actorName: "system",
          })
        }
      } catch {}

      return NextResponse.json({ error: "Şifre yanlış" }, { status: 401 })
    }

    const userSession = {
      userId: user ? user._id.toString() : "unknown",
      username: user ? user.username : identityNumber,
      fullName: user ? user.fullName : "Bilinmeyen Kullanıcı",
      email: user ? user.email : "",
      currentTenant: tenant.slug,
      currentRole: user ? user.role || "member" : "member",
      rolesByTenant: user
        ? user.rolesByTenant || { [tenant.slug]: user.role || "member" }
        : { [tenant.slug]: "member" },
      permissions: {
        canVote: true,
        canViewKitchen: user?.role === "kitchen" || user?.role === "admin",
        canManageKitchen: user?.role === "kitchen" || user?.role === "admin",
        canViewAdmin: user?.role === "admin",
        canManageAdmin: user?.role === "admin",
        canViewMaster: false,
        canManageMaster: false,
      },
    }

    const token = jwt.sign(userSession, process.env.JWT_SECRET!, { expiresIn: "7d" })

    const res = NextResponse.json({
      success: true,
      user: userSession,
      isMasterAdmin: false,
      maintenance: { active: false },
      degraded: dbUnavailable,
    })

    res.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    })
    res.cookies.set("tenant-slug", tenant.slug, { path: "/" })

    recordAttempt({ identityNumber, tenantSlug, success: true, ip })

    if (user) {
      await addAuditLog({
        action: "USER_LOGIN",
        entity: "USER",
        targetName: user.fullName || user.username,
        actorName: user.fullName || user.username,
        actorIdentityNumber: identityNumber,
        meta: { ip, tenantSlug, role: user.role },
      })
    }

    return res
  } catch (e) {
    console.error("LOGIN error", e)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
