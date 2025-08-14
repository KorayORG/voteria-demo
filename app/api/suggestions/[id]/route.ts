import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { parseUserFromHeaders, requireRole } from "@/lib/auth-headers";
import { ObjectId } from "mongodb";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
  const ctx = parseUserFromHeaders(req.headers);
  const authz = requireRole(ctx, ['admin','kitchen']);
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 });
    const body = await req.json();
    const { id } = params;
    const client = await clientPromise;
    const db = client.db("cafeteria");
    const col = db.collection("suggestions");
    const updates: any = {};
    if (body.status) updates.status = body.status;
    if (body.response !== undefined) {
      updates.response = body.response;
      updates.respondedAt = body.response ? new Date() : null;
      updates.respondedBy = body.response ? body.respondedBy || "Admin" : null;
    }
    if (body.assignedTo !== undefined) updates.assignedTo = body.assignedTo;
    if (body.markRead === true) {
      updates.isRead = true;
      updates.readAt = new Date();
    }
    if (body.markRead === false) {
      updates.isRead = false;
      updates.readAt = null;
    }
    const r = await col.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updates }, { returnDocument: "after" });
    if (!r) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PATCH /api/suggestions/:id", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
