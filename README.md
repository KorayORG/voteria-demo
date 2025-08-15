## Multi-tenant Transition (Phase 1)

This project is being prepared for future multi-tenant (SaaS) use.

Current state (Phase 1):
* Single MongoDB database.
* Domain models updated with optional `tenantId` field (will become required later).
* Default tenant slug: `default`.
* Helper utilities in `lib/tenant.ts`.

Planned next phases:
1. Enforce tenantId in all queries & writes.
2. Introduce `tenants` collection and runtime slug resolution (subdomain/path).
3. Tenant-aware caches & authorization hardening.

Types: see `types/*.ts` (user, menu, admin, tenant).


