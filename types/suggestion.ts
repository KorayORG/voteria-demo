export interface Suggestion {
  id: string
  title: string
  description: string
  category: SuggestionCategory
  priority: SuggestionPriority
  status: SuggestionStatus
  submittedBy: string
  submittedAt: Date
  assignedTo?: string
  response?: string
  respondedAt?: Date
  respondedBy?: string
  attachments?: string[]
  votes: number
  tags: string[]
  // Backend'ten gelen kullanıcıya özel alan: mevcut kullanıcı oy vermiş mi
  userHasVoted?: boolean
}

export type SuggestionCategory = "menu" | "service" | "facility" | "hygiene" | "equipment" | "other"

export type SuggestionPriority = "low" | "medium" | "high" | "urgent"

export type SuggestionStatus = "pending" | "under-review" | "in-progress" | "completed" | "rejected"

export interface SuggestionFilter {
  category?: SuggestionCategory
  priority?: SuggestionPriority
  status?: SuggestionStatus
  search?: string
  dateRange?: {
    from: Date
    to: Date
  }
}
