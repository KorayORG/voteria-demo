import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { resolveTenant } from "./tenant"
import type { UserSession } from "@/types/user"

export interface AuthContext {
  user: UserSession | null
  tenant: any
  isAuthenticated: boolean
  isMasterAdmin: boolean
}

export async function getAuthContext(request: NextRequest): Promise<AuthContext> {
  const token = request.cookies.get("auth-token")?.value
  const tenantSlug = request.cookies.get("tenant-slug")?.value || "secye"

  const tenant = await resolveTenant(tenantSlug)

  if (!token) {
    return {
      user: null,
      tenant,
      isAuthenticated: false,
      isMasterAdmin: false,
    }
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user: UserSession = {
      userId: decoded.userId,
      username: decoded.username,
      fullName: decoded.fullName,
      email: decoded.email,
      currentTenant: tenant.slug,
      currentRole: decoded.rolesByTenant?.[tenant.slug] || "member",
      rolesByTenant: decoded.rolesByTenant || {},
      permissions: decoded.permissions || {
        canVote: true,
        canViewKitchen: false,
        canManageKitchen: false,
        canViewAdmin: false,
        canManageAdmin: false,
        canViewMaster: false,
        canManageMaster: false,
      },
    }

    const isMasterAdmin = user.currentRole === "master" && tenant.slug === "secye"

    return {
      user,
      tenant,
      isAuthenticated: true,
      isMasterAdmin,
    }
  } catch (error) {
    console.warn("[auth-middleware] Invalid token:", error)
    return {
      user: null,
      tenant,
      isAuthenticated: false,
      isMasterAdmin: false,
    }
  }
}
