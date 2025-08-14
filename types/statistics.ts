export interface DayStatistics {
  date: Date
  dayName: string
  traditional: {
    votes: number
    percentage: number
  }
  alternative: {
    votes: number
    percentage: number
  }
  totalVotes: number
  externalAdjustment: {
    traditional: number
    alternative: number
  }
  finalCount: {
    traditional: number
    alternative: number
  }
}

export interface WeekStatistics {
  weekOfISO: string
  days: DayStatistics[]
  totalVotes: number
  averageParticipation: number
}

export interface Suggestion {
  id: string
  userId: string
  text: string
  maskedIdentity: string
  isRead: boolean
  createdAt: Date
  readAt?: Date
}
