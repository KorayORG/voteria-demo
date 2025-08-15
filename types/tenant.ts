export interface Tenant {
  _id?: string
  slug: string // unique, lowercase identifier
  name: string
  displayName?: string
  /** Tenant status */
  status: "active" | "suspended" | "trial" | "expired"
  /** Subscription details */
  subscription?: {
    plan: "free" | "basic" | "premium" | "enterprise"
    startDate: Date
    endDate?: Date
    maxUsers?: number
    features?: string[]
  }
  /** Tenant-specific configuration */
  config?: {
    theme?: "light" | "dark" | "auto"
    primaryColor?: string
    logo?: string
    customDomain?: string
    timezone?: string
    locale?: string
  }
  /** Maintenance mode settings */
  maintenance?: {
    active: boolean
    message?: string
    until?: Date
    allowedRoles?: string[]
  }
  /** Database strategy for this tenant */
  dbStrategy?: "shared" | "dedicated"
  /** Dedicated DB connection string if using dedicated strategy */
  dedicatedDbUri?: string
  createdAt: Date
  updatedAt?: Date
}

/** Lightweight tenant resolution context */
export interface TenantContext {
  slug: string
  tenantId: string
  name: string
  status: string
  maintenance?: {
    active: boolean
    message?: string
    until?: Date
  }
}

/** Master admin configuration */
export interface MasterConfig {
  tckn: string
  password: string
  tenantSlug: string // Must be "secye" for master access
}
