import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth-middleware"

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req)

    if (!authContext.isAuthenticated || !authContext.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: authContext.user,
      tenant: authContext.tenant,
      isMasterAdmin: authContext.isMasterAdmin,
    })
  } catch (error) {
    console.error("Auth me error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
