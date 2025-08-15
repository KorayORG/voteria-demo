// Tenant entity definition (multi-tenant groundwork)
export interface Tenant {
  _id?: string
  slug: string // unique, lowercase
  name: string
  status: 'active' | 'suspended'
  createdAt: Date
}

// Lightweight tenant resolution context
export interface TenantContext {
  slug: string
  tenantId: string // For now slug == tenantId in single-DB model
}
