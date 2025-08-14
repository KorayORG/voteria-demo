import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { parseUserFromHeaders } from "@/lib/auth-headers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { id } = params;
    const client = await clientPromise;
    const db = client.db("cafeteria");
    const usersCol = db.collection("users");

  const updates: any = { ...body };
    delete updates._id;
    updates.updatedAt = new Date();
    if (updates.activeFrom) updates.activeFrom = new Date(updates.activeFrom);
    if (updates.activeTo) updates.activeTo = new Date(updates.activeTo);

    const result = await usersCol.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    const headerCtx = parseUserFromHeaders(req.headers as any);
    let actorIdentityNumber: string | undefined
    if (headerCtx.userId) {
      const actorUser = await usersCol.findOne({ _id: new ObjectId(headerCtx.userId) }).catch(()=>null)
      if (actorUser) actorIdentityNumber = (actorUser as any).identityNumber
    }
    const targetIdentityNumber = (result as any)?.identityNumber || updates.identityNumber
    await db.collection("audit_logs").insertOne({
      actorId: headerCtx.userId || body.actorId || "system",
      actorName: body.actorName || "Sistem",
      actorIdentityNumber,
      action: "USER_UPDATED",
      entity: "User",
      entityId: result._id,
      targetId: result._id,
      targetName: (result as any)?.fullName || updates.fullName,
      targetIdentityNumber,
      meta: updates,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PATCH /api/admin/users/:id error", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const client = await clientPromise;
    const db = client.db("cafeteria");
    const usersCol = db.collection("users");
    const user = await usersCol.findOne({ _id: new ObjectId(id) });
    if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  await usersCol.deleteOne({ _id: new ObjectId(id) });

    const headerCtx = parseUserFromHeaders((_req as any).headers);
    let actorIdentityNumber: string | undefined
    if (headerCtx.userId) {
      const actorUser = await usersCol.findOne({ _id: new ObjectId(headerCtx.userId) }).catch(()=>null)
      if (actorUser) actorIdentityNumber = (actorUser as any).identityNumber
    }
    await db.collection("audit_logs").insertOne({
      actorId: headerCtx.userId || "system",
      actorName: "Sistem",
      actorIdentityNumber,
      action: "USER_DELETED",
      entity: "User",
      entityId: user._id,
      targetId: user._id,
      targetName: user.fullName,
      targetIdentityNumber: user.identityNumber,
      meta: { identityNumber: user.identityNumber, fullName: user.fullName },
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/admin/users/:id error", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
