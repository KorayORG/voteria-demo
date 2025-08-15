export interface SystemSettings {
  id: string
  /** Multi-tenant */
  tenantId?: string
  siteTitle: string
  maintenanceMode: boolean
  voteCutoffTime?: string
  activeTheme: string
  paletteSize?: number
  paletteColors?: string[]
  texts?: Record<string, string>
  createdAt: Date
  updatedAt: Date
}

export interface ExternalAdjustment {
  id: string
  tenantId?: string
  date: Date
  shiftId: string
  addAbsolute?: number
  addPercent?: number
  note?: string
  createdBy: string
  createdAt: Date
}

export interface AuditLog {
  id: string
  tenantId?: string
  actorId: string
  actorName: string
  actorIdentityNumber?: string
  action: string
  entity: string
  entityId?: string
  targetId?: string
  targetName?: string
  targetIdentityNumber?: string
  meta?: Record<string, any>
  createdAt: Date
}

export interface Theme {
  id: string
  code: string
  name: string
  isActive: boolean
  assets?: Record<string, string>
}

export interface RolePermissionSet {
  canVote: boolean
  kitchenView: boolean
  kitchenManage: boolean
  isAdmin: boolean
}

export interface RoleDef {
  id: string
  tenantId?: string
  name: string
  code?: string
  color?: string
  order: number
  permissions: RolePermissionSet
  createdAt: Date
  updatedAt: Date
}
