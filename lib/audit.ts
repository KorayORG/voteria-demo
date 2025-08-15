import clientPromise from "@/lib/mongodb";

// Extended to support multi-tenancy (Phase 1). tenantId optional for backward compatibility.
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
  tenantId?: string;
}) {
  const client = await clientPromise;
  const db = client.db();
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
    tenantId: log.tenantId,
    createdAt: new Date(),
  });
}
