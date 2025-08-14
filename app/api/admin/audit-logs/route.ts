import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const client = await clientPromise;
    const db = client.db("cafeteria");
    const logs = await db
      .collection("audit_logs")
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return NextResponse.json({ logs });
  } catch (e) {
    console.error("GET /api/admin/audit-logs error", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
