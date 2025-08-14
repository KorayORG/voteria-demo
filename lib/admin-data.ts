import type { User } from "@/components/auth/auth-provider"
import type { SystemSettings, ExternalAdjustment, AuditLog, Theme } from "@/types/admin"
import { defaultShifts } from "./menu-data"

// Mock admin data
export function generateMockUsers(): User[] {
  return [
    {
      id: "1",
      identityNumber: "99999999999",
      fullName: "Sistem Yöneticisi",
      phone: "05551234567",
      role: "admin",
      isActive: true,
    },
    {
      id: "2",
      identityNumber: "11111111111",
      fullName: "Mutfak Sorumlusu",
      phone: "05551234568",
      role: "kitchen",
      isActive: true,
    },
    {
      id: "3",
      identityNumber: "22222222222",
      fullName: "Test Üyesi",
      phone: "05551234569",
      role: "member",
      isActive: true,
    },
    {
      id: "4",
      identityNumber: "33333333333",
      fullName: "Ahmet Kaya",
      phone: "05551234570",
      role: "member",
      isActive: true,
      activeFrom: new Date("2024-01-01"),
      activeTo: new Date("2024-12-31"),
    },
    {
      id: "5",
      identityNumber: "44444444444",
      fullName: "Fatma Demir",
      phone: "05551234571",
      role: "member",
      isActive: false,
      activeFrom: new Date("2024-01-01"),
      activeTo: new Date("2024-06-30"),
    },
  ]
}

export function getSystemSettings(): SystemSettings {
  return {
    id: "system-1",
    siteTitle: "Seç Ye - Kurumsal Yemek Oylama Sistemi",
    maintenanceMode: false,
    voteCutoffTime: "09:00",
    activeTheme: "default",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date(),
  }
}

export function generateMockAuditLogs(): AuditLog[] {
  return [
    {
      id: "audit-1",
      actorId: "1",
      actorName: "Sistem Yöneticisi",
      action: "USER_CREATED",
      entity: "User",
      entityId: "5",
      meta: { role: "member", identityNumber: "44444444444" },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: "audit-2",
      actorId: "1",
      actorName: "Sistem Yöneticisi",
      action: "SYSTEM_SETTINGS_UPDATED",
      entity: "SystemSettings",
      meta: { field: "siteTitle", oldValue: "Old Title", newValue: "New Title" },
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
    {
      id: "audit-3",
      actorId: "1",
      actorName: "Sistem Yöneticisi",
      action: "MAINTENANCE_MODE_ENABLED",
      entity: "SystemSettings",
      meta: { enabled: true },
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ]
}

export function generateMockExternalAdjustments(): ExternalAdjustment[] {
  const today = new Date()
  const adjustments: ExternalAdjustment[] = []

  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)

    defaultShifts.forEach((shift) => {
      adjustments.push({
        id: `adj-${i}-${shift.id}`,
        date,
        shiftId: shift.id,
        addAbsolute: Math.floor(Math.random() * 10) + 2,
        note: `Stajyer ve taşeron personel için ek adet`,
        createdBy: "1",
        createdAt: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000),
      })
    })
  }

  return adjustments
}

export function getAvailableThemes(): Theme[] {
  return [
    {
      id: "theme-1",
      code: "default",
      name: "Varsayılan Tema",
      isActive: true,
    },
    {
      id: "theme-ramadan",
      code: "ramadan-bayram",
      name: "Ramazan Bayramı",
      isActive: false,
      assets: { primaryColor: "#8B5CF6", accentColor: "#F59E0B" }, // Mor ve altın
    },
    {
      id: "theme-kurban",
      code: "kurban-bayram",
      name: "Kurban Bayramı",
      isActive: false,
      assets: { primaryColor: "#059669", accentColor: "#D97706" }, // Yeşil ve turuncu
    },
    {
      id: "theme-republic",
      code: "republic-day",
      name: "29 Ekim Cumhuriyet Bayramı",
      isActive: false,
      assets: { primaryColor: "#DC2626", accentColor: "#FFFFFF" }, // Kırmızı ve beyaz
    },
    {
      id: "theme-victory",
      code: "victory-day",
      name: "30 Ağustos Zafer Bayramı",
      isActive: false,
      assets: { primaryColor: "#B91C1C", accentColor: "#FCD34D" }, // Koyu kırmızı ve altın
    },
    {
      id: "theme-children",
      code: "children-day",
      name: "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı",
      isActive: false,
      assets: { primaryColor: "#3B82F6", accentColor: "#F59E0B" }, // Mavi ve turuncu
    },
    {
      id: "theme-labor",
      code: "labor-day",
      name: "1 Mayıs İşçi ve Emekçi Bayramı",
      isActive: false,
      assets: { primaryColor: "#DC2626", accentColor: "#374151" }, // Kırmızı ve gri
    },
    {
      id: "theme-youth",
      code: "youth-day",
      name: "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı",
      isActive: false,
      assets: { primaryColor: "#059669", accentColor: "#FFFFFF" }, // Yeşil ve beyaz
    },
    {
      id: "theme-newyear",
      code: "new-year",
      name: "Yılbaşı",
      isActive: false,
      assets: { primaryColor: "#DC2626", accentColor: "#059669" }, // Kırmızı ve yeşil
    },
    {
      id: "theme-teachers",
      code: "teachers-day",
      name: "24 Kasım Öğretmenler Günü",
      isActive: false,
      assets: { primaryColor: "#7C3AED", accentColor: "#F59E0B" }, // Mor ve altın
    },
    {
      id: "theme-mothers",
      code: "mothers-day",
      name: "Anneler Günü",
      isActive: false,
      assets: { primaryColor: "#EC4899", accentColor: "#FBBF24" }, // Pembe ve altın
    },
    {
      id: "theme-fathers",
      code: "fathers-day",
      name: "Babalar Günü",
      isActive: false,
      assets: { primaryColor: "#1F2937", accentColor: "#3B82F6" }, // Koyu gri ve mavi
    },
    {
      id: "theme-spring",
      code: "spring",
      name: "Bahar Teması",
      isActive: false,
      assets: { primaryColor: "#059669", accentColor: "#F59E0B" }, // Yeşil ve turuncu
    },
    {
      id: "theme-summer",
      code: "summer",
      name: "Yaz Teması",
      isActive: false,
      assets: { primaryColor: "#F59E0B", accentColor: "#3B82F6" }, // Turuncu ve mavi
    },
    {
      id: "theme-autumn",
      code: "autumn",
      name: "Sonbahar Teması",
      isActive: false,
      assets: { primaryColor: "#D97706", accentColor: "#B91C1C" }, // Turuncu ve kırmızı
    },
    {
      id: "theme-winter",
      code: "winter",
      name: "Kış Teması",
      isActive: false,
      assets: { primaryColor: "#1E40AF", accentColor: "#E5E7EB" }, // Mavi ve açık gri
    },
  ]
}
