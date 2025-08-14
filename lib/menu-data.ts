import type { WeekMenu, Shift, Dish } from "@/types/menu"

export const defaultShifts: Shift[] = [
  {
    id: "morning",
    code: "08-16",
    label: "Sabah Vardiyası",
    startTime: "08:00",
    endTime: "16:00",
    order: 1,
    isActive: true,
  },
  {
    id: "evening",
    code: "16-00",
    label: "Akşam Vardiyası",
    startTime: "16:00",
    endTime: "00:00",
    order: 2,
    isActive: true,
  },
  {
    id: "night",
    code: "00-08",
    label: "Gece Vardiyası",
    startTime: "00:00",
    endTime: "08:00",
    order: 3,
    isActive: true,
  },
]

// Örnek yemekler kaldırıldı – gerçek menüler eklenecek.
const sampleDishes: Record<string, Dish> = {}

export function getCurrentWeekMenu(): WeekMenu {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1)

  const weekOfISO = `${monday.getFullYear()}-W${String(Math.ceil(monday.getDate() / 7)).padStart(2, "0")}`

  const days = []
  // Boş günler (gerçek menü eklenene kadar geleneksel/alternatif null tutulabilir)
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    // Placeholder null dishes; çağıranlar null kontrolü yapmalı
    const emptyDish = { id: '', name: 'Menü Yok', tags: [], pairTags: {} as Record<string,'left'|'right'> }
    days.push({ id: `day-${i}`, date, traditional: emptyDish, alternative: emptyDish, categoriesSchemaVersion: 1 })
  }

  return {
    id: "current-week",
    weekOfISO,
    days,
    isPublished: true,
    createdBy: "system",
    createdAt: new Date(),
  }
}

export function getWeekDays(): string[] {
  return ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
}

export function getShortWeekDays(): string[] {
  return ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
}
