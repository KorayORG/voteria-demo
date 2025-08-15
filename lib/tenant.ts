import type { TenantContext, Tenant } from "@/types/tenant"
import { tryGetDb } from "./mongodb"

const DEFAULT_TENANT_SLUG = "secye" // Changed to match master admin requirements

export function sanitizeTenantSlug(raw?: string): string {
  if (!raw) return DEFAULT_TENANT_SLUG
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 40)
  return cleaned || DEFAULT_TENANT_SLUG
}

export async function resolveTenant(selectedSlug?: string): Promise<TenantContext> {
  const slug = sanitizeTenantSlug(selectedSlug)

  // Try to get tenant from database
  const db = await tryGetDb()
  if (db) {
    try {
      const tenant = await db.collection("tenants").findOne({ slug })
      if (tenant) {
        return {
          slug: tenant.slug,
          tenantId: tenant._id?.toString() || tenant.slug,
          name: tenant.name || tenant.displayName || slug,
          status: tenant.status || "active",
          maintenance: tenant.maintenance,
        }
      }
    } catch (error) {
      console.warn("[tenant] Database lookup failed, using default:", error)
    }
  }

  // Fallback to default tenant context
  return {
    slug,
    tenantId: slug,
    name: slug === "secye" ? "Seç Ye Platform" : slug,
    status: "active",
  }
}

export function resolveTenantSync(selectedSlug?: string): TenantContext {
  const slug = sanitizeTenantSlug(selectedSlug)
  return {
    slug,
    tenantId: slug,
    name: slug === "secye" ? "Seç Ye Platform" : slug,
    status: "active",
  }
}

export function attachTenant<T extends Record<string, any>>(doc: T, tenant: TenantContext): T {
  if (!doc.tenantId) (doc as any).tenantId = tenant.tenantId
  return doc
}

export function tenantFilter(base: Record<string, any> | undefined, tenant: TenantContext) {
  const filter = { ...(base || {}) }

  // For backward compatibility during migration, use $or to match both tenanted and non-tenanted docs
  if (tenant.slug === DEFAULT_TENANT_SLUG) {
    filter.$or = [{ tenantId: tenant.tenantId }, { tenantId: { $exists: false } }, { tenantId: null }]
  } else {
    filter.tenantId = tenant.tenantId
  }

  return filter
}

export function isTenantInMaintenance(tenant: TenantContext): boolean {
  if (!tenant.maintenance?.active) return false

  if (tenant.maintenance.until) {
    return new Date() < new Date(tenant.maintenance.until)
  }

  return true
}

export async function getAllTenants(): Promise<Tenant[]> {
  const db = await tryGetDb()
  if (!db) return []

  try {
    const tenants = await db.collection("tenants").find({}).sort({ createdAt: -1 }).toArray()

    return tenants.map((t) => ({
      ...t,
      _id: t._id?.toString(),
    })) as Tenant[]
  } catch (error) {
    console.error("[tenant] Failed to get all tenants:", error)
    return []
  }
}
