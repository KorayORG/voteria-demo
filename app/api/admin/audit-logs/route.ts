import { NextRequest, NextResponse } from "next/server";
import clientPromise, { tryGetDb } from "@/lib/mongodb";
import { resolveTenant } from '@/lib/tenant'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const tenant = resolveTenant()
    const db = await tryGetDb()
    if (!db) {
      return NextResponse.json({ logs: [], degraded: true })
    }
    const logs = await db
      .collection("audit_logs")
      .find({ $or:[ { tenantId: tenant.tenantId }, { tenantId: { $exists:false } } ] })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return NextResponse.json({ logs });
  } catch (e) {
    console.error("GET /api/admin/audit-logs error", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
