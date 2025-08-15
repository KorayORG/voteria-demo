import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth-middleware"
import { resolveTenant } from "@/lib/tenant"
import jwt from "jsonwebtoken"
import { addAuditLog } from "@/lib/audit"

export async function POST(req: NextRequest) {
  try {
    const { tenantSlug } = await req.json()

    if (!tenantSlug) {
      return NextResponse.json({ error: "Tenant slug required" }, { status: 400 })
    }

    const authContext = await getAuthContext(req)

    if (!authContext.isAuthenticated || !authContext.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if user has access to this tenant
    const userRole = authContext.user.rolesByTenant[tenantSlug]
    if (!userRole) {
      return NextResponse.json({ error: "No access to this tenant" }, { status: 403 })
    }

    // Resolve the new tenant
    const tenant = await resolveTenant(tenantSlug)

    // Create new session with updated tenant context
    const updatedUser = {
      ...authContext.user,
      currentTenant: tenant.slug,
      currentRole: userRole,
      permissions: {
        canVote: true,
        canViewKitchen: userRole === "kitchen" || userRole === "admin",
        canManageKitchen: userRole === "kitchen" || userRole === "admin",
        canViewAdmin: userRole === "admin",
        canManageAdmin: userRole === "admin",
        canViewMaster: userRole === "master",
        canManageMaster: userRole === "master",
      },
    }

    const token = jwt.sign(updatedUser, process.env.JWT_SECRET!, { expiresIn: "7d" })

    const res = NextResponse.json({
      success: true,
      user: updatedUser,
    })

    res.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    })
    res.cookies.set("tenant-slug", tenant.slug, { path: "/" })

    await addAuditLog({
      action: "TENANT_SWITCH",
      entity: "USER",
      targetName: tenant.name,
      actorName: authContext.user.fullName || authContext.user.username,
      actorIdentityNumber: authContext.user.userId,
      meta: {
        fromTenant: authContext.user.currentTenant,
        toTenant: tenant.slug,
        newRole: userRole,
      },
    })

    return res
  } catch (error) {
    console.error("Tenant switch error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
