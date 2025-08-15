import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth-middleware"
import { getDb } from "@/lib/mongodb"
import { addAuditLog } from "@/lib/audit"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req)
    if (!authContext.isAuthenticated || !authContext.user?.permissions.canManageKitchen) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const week = searchParams.get("week")

    if (!week) {
      return NextResponse.json({ error: "Week parameter required" }, { status: 400 })
    }

    const db = await getDb()
    const substitutes = await db
      .collection("menu_substitutes")
      .find({
        weekOfISO: Number.parseInt(week),
        tenantId: authContext.tenant.tenantId,
      })
      .toArray()

    const formattedSubstitutes = substitutes.map((sub) => ({
      id: sub._id.toString(),
      dayIndex: sub.dayIndex,
      originalType: sub.originalType,
      originalName: sub.originalName,
      substituteName: sub.substituteName,
      reason: sub.reason,
      timestamp: sub.createdAt,
    }))

    return NextResponse.json({ substitutes: formattedSubstitutes })
  } catch (error) {
    console.error("Failed to fetch substitutes:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req)
    if (!authContext.isAuthenticated || !authContext.user?.permissions.canManageKitchen) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { weekOfISO, dayIndex, originalType, substituteName, reason } = await req.json()

    if (!weekOfISO || dayIndex === undefined || !originalType || !substituteName || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDb()

    const substitute = {
      _id: new ObjectId(),
      weekOfISO,
      dayIndex,
      originalType,
      originalName: `${originalType === "traditional" ? "Geleneksel" : "Alternatif"} Menü`,
      substituteName,
      reason,
      tenantId: authContext.tenant.tenantId,
      createdBy: authContext.user.userId,
      createdAt: new Date(),
    }

    await db.collection("menu_substitutes").insertOne(substitute)

    await addAuditLog({
      action: "MENU_SUBSTITUTE",
      entity: "KITCHEN",
      targetName: `Week ${weekOfISO} Day ${dayIndex} ${originalType} -> ${substituteName}`,
      actorName: authContext.user.fullName || authContext.user.username,
      actorIdentityNumber: authContext.user.userId,
      meta: { weekOfISO, dayIndex, originalType, substituteName, reason, tenantId: authContext.tenant.tenantId },
    })

    return NextResponse.json({ success: true, substituteId: substitute._id })
  } catch (error) {
    console.error("Failed to save substitute:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
