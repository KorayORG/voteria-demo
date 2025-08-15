import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { parseUserFromHeaders, requirePermission, resolvePermissions } from "@/lib/auth-headers";
import { resolveTenant } from '@/lib/tenant'

export async function GET(req: NextRequest) {
  try {
    // Permission: only users who canVote (their own votes) or admin can query.
    const ctx = await resolvePermissions(parseUserFromHeaders(req.headers as any));
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const weekOfISO = searchParams.get("week");
    if (!userId || !weekOfISO) return NextResponse.json({ votes: [] });
    if (!ctx.permissions?.isAdmin && ctx.userId !== userId) {
      const perm = requirePermission(ctx, 'canVote')
      if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: 403 })
    }
  const tenant = resolveTenant()
  const client = await clientPromise;
  const db = client.db();
    const col = db.collection("votes");
  const docs = await col.find({ userId, weekOfISO, $or:[ { tenantId: tenant.tenantId }, { tenantId: { $exists:false } } ] }).toArray();
    return NextResponse.json({ votes: docs });
  } catch (e) {
    console.error("GET /api/votes", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
  const ctx = await resolvePermissions(parseUserFromHeaders(req.headers as any));
    const perm = requirePermission(ctx, "canVote");
    if (!perm.ok) return NextResponse.json({ error: perm.error }, { status: 403 });
    const { userId, date, weekOfISO, shiftId, choice } = await req.json();
    if (!userId || !date || !weekOfISO || !shiftId || !choice) {
      return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 });
    }
    const tenant = resolveTenant()
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("votes");
    const usersCol = db.collection("users");
    const existing = await col.findOne({ userId, date, $or:[ { tenantId: tenant.tenantId }, { tenantId: { $exists:false } } ] });
    if (existing) {
      await col.updateOne({ _id: existing._id }, { $set: { choice, shiftId, updatedAt: new Date(), tenantId: tenant.tenantId } });
    } else {
      await col.insertOne({ userId, date, weekOfISO, shiftId, choice, createdAt: new Date(), updatedAt: new Date(), tenantId: tenant.tenantId });
    }
    try {
      const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
      if (userObjectId) {
        await (usersCol as any).updateOne(
          { _id: userObjectId },
          { $push: { preferenceHistory: { $each: [{ date, weekOfISO, shiftId, choice }] } } }
        );
      }
    } catch {}
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/votes", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
