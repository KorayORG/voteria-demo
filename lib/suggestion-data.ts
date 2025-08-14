import type { Suggestion } from "@/types/suggestion"

export const mockSuggestions: Suggestion[] = [
  {
    id: "1",
    title: "Vegan Seçenekleri Artırılsın",
    description:
      "Haftalık menüde vegan seçeneklerin sayısı artırılabilir. Özellikle protein açısından zengin vegan yemekler eklenebilir.",
    category: "menu",
    priority: "medium",
    status: "under-review",
    submittedBy: "Ayşe Yılmaz",
    submittedAt: new Date("2024-01-15"),
    votes: 23,
    tags: ["vegan", "sağlık", "çeşitlilik"],
  },
  {
    id: "2",
    title: "Yemek Servisi Saatleri",
    description:
      "Akşam vardiyası için yemek servisi saatleri uzatılabilir. 19:00'dan sonra da sıcak yemek bulunabilir.",
    category: "service",
    priority: "high",
    status: "in-progress",
    submittedBy: "Mehmet Kaya",
    submittedAt: new Date("2024-01-14"),
    assignedTo: "Mutfak Ekibi",
    votes: 45,
    tags: ["vardiya", "servis-saati"],
  },
  {
    id: "3",
    title: "Oturma Alanı Genişletilmesi",
    description: "Yemekhanedeki oturma alanları yetersiz. Özellikle öğle saatlerinde yer bulamıyoruz.",
    category: "facility",
    priority: "high",
    status: "pending",
    submittedBy: "Fatma Demir",
    submittedAt: new Date("2024-01-13"),
    votes: 67,
    tags: ["alan", "kapasite", "konfor"],
  },
  {
    id: "4",
    title: "Dezenfektan Standları",
    description: "Yemekhanede daha fazla dezenfektan standı bulunmalı. Giriş ve çıkışlarda yetersiz.",
    category: "hygiene",
    priority: "urgent",
    status: "completed",
    submittedBy: "Ali Özkan",
    submittedAt: new Date("2024-01-10"),
    response: "Dezenfektan standları tüm giriş ve çıkışlara yerleştirildi. Düzenli kontrol ve dolum yapılmaktadır.",
    respondedAt: new Date("2024-01-12"),
    respondedBy: "Admin",
    votes: 89,
    tags: ["hijyen", "sağlık", "güvenlik"],
  },
  {
    id: "5",
    title: "Kahve Makinesi Bakımı",
    description: "Kahve makinesi sık sık arızalanıyor. Düzenli bakım yapılması gerekiyor.",
    category: "equipment",
    priority: "medium",
    status: "under-review",
    submittedBy: "Zeynep Arslan",
    submittedAt: new Date("2024-01-12"),
    votes: 34,
    tags: ["bakım", "kahve", "ekipman"],
  },
]

export const categoryLabels = {
  menu: "Menü",
  service: "Servis",
  facility: "Tesis",
  hygiene: "Hijyen",
  equipment: "Ekipman",
  other: "Diğer",
}

export const priorityLabels = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  urgent: "Acil",
}

export const statusLabels = {
  pending: "Beklemede",
  "under-review": "İnceleniyor",
  "in-progress": "Devam Ediyor",
  completed: "Tamamlandı",
  rejected: "Reddedildi",
}

export const priorityColors = {
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
}

export const statusColors = {
  pending: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  "under-review": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "in-progress": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
}
