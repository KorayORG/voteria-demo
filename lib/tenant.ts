// Multi-tenant helper (Phase 1: single DB, default tenant only)
// Future: extract from subdomain or path.
import type { TenantContext } from '@/types/tenant'

const DEFAULT_TENANT_SLUG = 'default'

export function sanitizeTenantSlug(raw?: string): string {
  if (!raw) return DEFAULT_TENANT_SLUG
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40)
  return cleaned || DEFAULT_TENANT_SLUG
}

export function resolveTenant(selectedSlug?: string): TenantContext {
  const slug = selectedSlug || DEFAULT_TENANT_SLUG
  return { slug, tenantId: slug }
}

export function attachTenant<T extends Record<string, any>>(doc: T, tenant: TenantContext): T {
  if (!doc.tenantId) (doc as any).tenantId = tenant.tenantId
  return doc
}

export function tenantFilter(base: Record<string, any> | undefined, tenant: TenantContext) {
  return { ...(base || {}), tenantId: tenant.tenantId }
}
