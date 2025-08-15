import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { parseUserFromHeaders } from "@/lib/auth-headers";
import { ObjectId } from "mongodb";
import { resolveTenant } from '@/lib/tenant'
import { addAuditLog } from '@/lib/audit'

// GET: list all users
export async function GET() {
  try {
  const tenant = resolveTenant()
  const client = await clientPromise;
  const db = client.db();
  const users = await db.collection("users").find({ $or:[ { tenantId: tenant.tenantId }, { tenantId: { $exists:false } } ] }).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ users });
  } catch (e) {
    console.error("GET /api/admin/users error", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST: create user (admin panel)
export async function POST(req: NextRequest) {
  try {
  const body = await req.json();
  const headerCtx = parseUserFromHeaders(req.headers as any);
  const { identityNumber, fullName, phone, role = "member", roleId, isActive = true, password } = body;

    if (!identityNumber || !fullName || !phone) {
      return NextResponse.json({ error: "Zorunlu alanlar eksik" }, { status: 400 });
    }

  const tenant = resolveTenant()
  const client = await clientPromise;
  const db = client.db();
    const usersCol = db.collection("users");

  const existing = await usersCol.findOne({ tenantId: tenant.tenantId, $or: [{ identityNumber }, { phone }] });
    if (existing) {
      return NextResponse.json({ error: "Kimlik numarası veya telefon kayıtlı" }, { status: 409 });
    }

    const toInsert: any = {
      identityNumber,
      fullName,
      phone,
  role,
  roleId: roleId || undefined,
      isActive,
      activeFrom: body.activeFrom ? new Date(body.activeFrom) : undefined,
      activeTo: body.activeTo ? new Date(body.activeTo) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      tenantId: tenant.tenantId,
    };

    if (password) {
      toInsert.passwordHash = await bcrypt.hash(password, 10);
    }

    const result = await usersCol.insertOne(toInsert);

    let actorIdentityNumber: string | undefined
    if (headerCtx.userId) {
      const actorUser = await usersCol.findOne({ _id: new ObjectId(headerCtx.userId) }).catch(()=>null)
      if (actorUser) actorIdentityNumber = (actorUser as any).identityNumber
    }
    await addAuditLog({
      actorId: headerCtx.userId || body.actorId || "system",
      actorName: body.actorName || "Sistem",
      actorIdentityNumber,
      action: "USER_CREATED",
      entity: "User",
      entityId: result.insertedId,
      targetId: result.insertedId,
      targetName: fullName,
      targetIdentityNumber: identityNumber,
      meta: { identityNumber, role, roleId },
      tenantId: tenant.tenantId
    });

    return NextResponse.json({ userId: result.insertedId });
  } catch (e) {
    console.error("POST /api/admin/users error", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
