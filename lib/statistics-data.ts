import type { DayStatistics, WeekStatistics, Suggestion } from "@/types/statistics"
import { getWeekDays } from "./menu-data"

// Mock statistics data
export function generateMockStatistics(): WeekStatistics {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1)

  const weekOfISO = `${monday.getFullYear()}-W${String(Math.ceil(monday.getDate() / 7)).padStart(2, "0")}`
  const weekDays = getWeekDays()

  const days: DayStatistics[] = []
  let totalWeekVotes = 0

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)

    // Generate random vote counts
    const traditionalVotes = Math.floor(Math.random() * 50) + 20
    const alternativeVotes = Math.floor(Math.random() * 40) + 15
    const totalVotes = traditionalVotes + alternativeVotes

    // External adjustments (for non-system users like interns/contractors)
    const traditionalAdjustment = Math.floor(Math.random() * 10) + 2
    const alternativeAdjustment = Math.floor(Math.random() * 8) + 1

    const dayStats: DayStatistics = {
      date,
      dayName: weekDays[i],
      traditional: {
        votes: traditionalVotes,
        percentage: Math.round((traditionalVotes / totalVotes) * 100),
      },
      alternative: {
        votes: alternativeVotes,
        percentage: Math.round((alternativeVotes / totalVotes) * 100),
      },
      totalVotes,
      externalAdjustment: {
        traditional: traditionalAdjustment,
        alternative: alternativeAdjustment,
      },
      finalCount: {
        traditional: traditionalVotes + traditionalAdjustment,
        alternative: alternativeVotes + alternativeAdjustment,
      },
    }

    days.push(dayStats)
    totalWeekVotes += totalVotes
  }

  return {
    weekOfISO,
    days,
    totalVotes: totalWeekVotes,
    averageParticipation: Math.round(totalWeekVotes / 7),
  }
}

export function generateMockSuggestions(): Suggestion[] {
  const suggestions: Suggestion[] = [
    {
      id: "1",
      userId: "user1",
      text: "Salatalarda kullanılmak üzere daha çeşitli şeyler alabilirız. Özellikle mevsim sebzeleri çok güzel olur.",
      maskedIdentity: "Ahmet K*** 5*** ** **",
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: "2",
      userId: "user2",
      text: "Çorbaların tuzu biraz fazla geliyor. Daha az tuzlu olabilir.",
      maskedIdentity: "Fatma S*** 1*** ** **",
      isRead: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
    {
      id: "3",
      userId: "user3",
      text: "Vegan seçenekleri artırılabilir. Özellikle protein açısından zengin olanlar.",
      maskedIdentity: "Mehmet A*** 3*** ** **",
      isRead: true,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      readAt: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20 hours ago
    },
    {
      id: "4",
      userId: "user4",
      text: "Balık günlerinde yanında pilav yerine bulgur pilavı olabilir.",
      maskedIdentity: "Ayşe D*** 7*** ** **",
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      readAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      id: "5",
      userId: "user5",
      text: "Tatlı seçenekleri de eklenebilir haftada 1-2 gün.",
      maskedIdentity: "Can Y*** 9*** ** **",
      isRead: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },
  ]

  return suggestions
}
