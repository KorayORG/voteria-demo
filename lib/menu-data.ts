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

const sampleDishes: Record<string, Dish> = {
  mercimekCorbasi: {
    id: "mercimek-corbasi",
    name: "Mercimek Çorbası",
    description: "Geleneksel Türk mutfağından besleyici mercimek çorbası",
    imageUrl: "/mercimek-corbasi.png",
    tags: ["Çorba", "Sebzeli"],
    pairTags: { Sıcaklık: "left", Besin: "left" },
  },
  kuruFasulye: {
    id: "kuru-fasulye",
    name: "Kuru Fasulye",
    description: "Pilav ile servis edilen geleneksel kuru fasulye",
    imageUrl: "/kuru-fasulye-pilav.png",
    tags: ["Ana Yemek", "Geleneksel"],
    pairTags: { Protein: "left", Besin: "left" },
  },
  tavukSote: {
    id: "tavuk-sote",
    name: "Tavuk Sote",
    description: "Sebzeli tavuk sote, pilav ile",
    imageUrl: "/tavuk-sote-sebzeli.png",
    tags: ["Ana Yemek", "Protein"],
    pairTags: { Protein: "right", Besin: "right" },
  },
  sebzeYemegi: {
    id: "sebze-yemegi",
    name: "Karışık Sebze Yemeği",
    description: "Mevsim sebzeleri ile hazırlanmış sağlıklı yemek",
    imageUrl: "/mixed-vegetable-dish.png",
    tags: ["Ana Yemek", "Sebzeli", "Vegan"],
    pairTags: { Protein: "right", Besin: "right" },
  },
  balik: {
    id: "balik",
    name: "Izgara Balık",
    description: "Taze deniz balığı, salata ile",
    imageUrl: "/grilled-fish-salad.png",
    tags: ["Ana Yemek", "Balık", "Omega-3"],
    pairTags: { Protein: "right", Besin: "left" },
  },
  kofte: {
    id: "kofte",
    name: "Ev Yapımı Köfte",
    description: "Bulgur pilavı ile servis edilen köfte",
    imageUrl: "/homemade-kofte-bulgur.png",
    tags: ["Ana Yemek", "Et"],
    pairTags: { Protein: "left", Besin: "left" },
  },
  pilav: {
    id: "pilav",
    name: "Tereyağlı Pilav",
    description: "Geleneksel tereyağlı pilav",
    imageUrl: "/buttery-rice-pilaf.png",
    tags: ["Yan Yemek", "Temel"],
    pairTags: { Protein: "right", Besin: "left" },
  },
  salata: {
    id: "salata",
    name: "Mevsim Salatası",
    description: "Taze yeşillikler ve mevsim sebzeleri",
    imageUrl: "/fresh-seasonal-salad.png",
    tags: ["Salata", "Sebzeli", "Sağlıklı"],
    pairTags: { Protein: "right", Besin: "right" },
  },
}

export function getCurrentWeekMenu(): WeekMenu {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1)

  const weekOfISO = `${monday.getFullYear()}-W${String(Math.ceil(monday.getDate() / 7)).padStart(2, "0")}`

  const days = []
  const dishKeys = Object.keys(sampleDishes)

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)

    const traditionalIndex = i % dishKeys.length
    const alternativeIndex = (i + 1) % dishKeys.length

    days.push({
      id: `day-${i}`,
      date,
      traditional: sampleDishes[dishKeys[traditionalIndex]],
      alternative: sampleDishes[dishKeys[alternativeIndex]],
      categoriesSchemaVersion: 1,
    })
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
