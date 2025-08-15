import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth-middleware"
import { getDb } from "@/lib/mongodb"
import { addAuditLog } from "@/lib/audit"

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
    const adjustments = await db
      .collection("production_adjustments")
      .find({
        weekOfISO: Number.parseInt(week),
        tenantId: authContext.tenant.tenantId,
      })
      .toArray()

    return NextResponse.json({ adjustments })
  } catch (error) {
    console.error("Failed to fetch adjustments:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext(req)
    if (!authContext.isAuthenticated || !authContext.user?.permissions.canManageKitchen) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { weekOfISO, dayIndex, type, change, reason } = await req.json()

    if (!weekOfISO || dayIndex === undefined || !type || change === undefined || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDb()

    // Upsert adjustment
    const result = await db.collection("production_adjustments").updateOne(
      {
        weekOfISO,
        dayIndex,
        type,
        tenantId: authContext.tenant.tenantId,
      },
      {
        $set: {
          weekOfISO,
          dayIndex,
          type,
          change,
          reason,
          tenantId: authContext.tenant.tenantId,
          createdBy: authContext.user.userId,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    await addAuditLog({
      action: "PRODUCTION_ADJUSTMENT",
      entity: "KITCHEN",
      targetName: `Week ${weekOfISO} Day ${dayIndex} ${type}`,
      actorName: authContext.user.fullName || authContext.user.username,
      actorIdentityNumber: authContext.user.userId,
      meta: { weekOfISO, dayIndex, type, change, reason, tenantId: authContext.tenant.tenantId },
    })

    return NextResponse.json({ success: true, adjustmentId: result.upsertedId })
  } catch (error) {
    console.error("Failed to save adjustment:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
