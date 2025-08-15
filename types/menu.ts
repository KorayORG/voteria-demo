export interface Dish {
  id: string
  name: string
  description?: string
  imageUrl?: string
  tags: string[]
  pairTags: Record<string, "left" | "right">
}

export interface DayMenu {
  id: string
  date: Date
  traditional: Dish
  alternative: Dish
  categoriesSchemaVersion: number
}

export interface WeekMenu {
  id: string
  weekOfISO: string
  days: DayMenu[]
  isPublished: boolean
  createdBy: string
  createdAt: Date
}

// Persistent stored menu schema (DB)
export interface StoredMenuDayDish {
  name: string
  description?: string
  imageUrl?: string
  tags?: string[]
}

export interface StoredMenuDay {
  date: string // ISO date (yyyy-mm-dd)
  traditional: StoredMenuDayDish | null
  alternative: StoredMenuDayDish | null
  // Shift bazlı farklılaşan menüler (opsiyonel). Key: shiftId
  shifts?: Record<string, { traditional?: StoredMenuDayDish | null; alternative?: StoredMenuDayDish | null }>
}

export interface StoredMenuDocument {
  _id?: string
  /** Multi-tenant (optional during transition) */
  tenantId?: string
  weekOfISO: string
  days: StoredMenuDay[]
  isPublished: boolean
  source?: { type: 'manual' | 'pdf-import'; originalFileName?: string; importNotes?: string; meta?: any }
  createdAt: string
  createdBy: string
  updatedAt?: string
  updatedBy?: string
}

export interface Shift {
  id: string
  code: string
  label: string
  startTime: string
  endTime: string
  order: number
  isActive: boolean
}

export interface Vote {
  id: string
  /** Multi-tenant */
  tenantId?: string
  userId: string
  date: Date
  weekOfISO: string
  shiftId: string
  choice: "traditional" | "alternative"
  createdAt: Date
  updatedAt: Date
}

export interface VotingProgress {
  userId: string
  weekOfISO: string
  shiftId: string
  completedDays: string[]
  currentStep: number
  totalSteps: number
  lastUpdated: Date
}
