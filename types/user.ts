export interface User {
  _id?: string
  /** Multi-tenant: will become required later; optional now for migration phase */
  tenantId?: string
  username: string
  phone: string
  password: string
  /** Full display name for UI */
  fullName?: string
  /** Email for notifications and recovery */
  email?: string
  /** T.C. Kimlik No for Turkish identity verification */
  tckn?: string
  /** User roles by tenant - allows same user to have different roles across tenants */
  rolesByTenant?: { [tenantSlug: string]: string }
  /** Account status */
  status?: "active" | "suspended" | "pending"
  /** Last login timestamp */
  lastLoginAt?: Date
  /** Failed login attempts counter */
  failedLoginAttempts?: number
  /** Account locked until timestamp */
  lockedUntil?: Date
  createdAt?: Date
  updatedAt?: Date
}

/** User session context with tenant and role information */
export interface UserSession {
  userId: string
  username: string
  fullName?: string
  email?: string
  currentTenant: string
  currentRole: string
  rolesByTenant: { [tenantSlug: string]: string }
  permissions: RolePermissionSet
}

/** Role permission definitions */
export interface RolePermissionSet {
  canVote: boolean
  canViewKitchen: boolean
  canManageKitchen: boolean
  canViewAdmin: boolean
  canManageAdmin: boolean
  canViewMaster: boolean
  canManageMaster: boolean
}
