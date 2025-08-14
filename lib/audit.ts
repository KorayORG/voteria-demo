import clientPromise from "@/lib/mongodb";

export async function addAuditLog(log: {
  actorId?: string;
  actorName?: string;
  actorIdentityNumber?: string;
  action: string;
  entity: string;
  entityId?: any;
  targetId?: any;
  targetName?: string;
  targetIdentityNumber?: string;
  meta?: Record<string, any>;
}) {
  const client = await clientPromise;
  const db = client.db("cafeteria");
  await db.collection("audit_logs").insertOne({
    actorId: log.actorId || "system",
    actorName: log.actorName || "Sistem",
  actorIdentityNumber: log.actorIdentityNumber,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
  targetId: log.targetId,
  targetName: log.targetName,
  targetIdentityNumber: log.targetIdentityNumber,
    meta: log.meta,
    createdAt: new Date(),
  });
}
