export interface SystemSettings {
  id: string
  siteTitle: string
  maintenanceMode: boolean
  voteCutoffTime?: string
  activeTheme: string
  createdAt: Date
  updatedAt: Date
}

export interface ExternalAdjustment {
  id: string
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
  actorId: string
  actorName: string
  action: string
  entity: string
  entityId?: string
  meta?: Record<string, any>
  createdAt: Date
}

export interface CategorySchema {
  id: string
  mutualPairs: Array<{
    key: string
    left: string
    right: string
  }>
  singleTags: string[]
  version: number
  createdAt: Date
}

export interface Theme {
  id: string
  code: string
  name: string
  isActive: boolean
  assets?: Record<string, string>
}
