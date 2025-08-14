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
