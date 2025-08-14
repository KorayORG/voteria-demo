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
      id: "theme-5",
      code: "republic-day",
      name: "Cumhuriyet Bayramı",
      isActive: false,
      assets: { primaryColor: "#E30A17", accentColor: "#FFFFFF" }, // Türk bayrağı kırmızı & beyaz
    },
    {
      id: "theme-2",
      code: "ramadan",
      name: "Ramazan Teması",
      isActive: false,
      assets: { primaryColor: "#8B5CF6", accentColor: "#F59E0B" },
    },
    {
      id: "theme-3",
      code: "newyear",
      name: "Yılbaşı Teması",
      isActive: false,
      assets: { primaryColor: "#EF4444", accentColor: "#10B981" },
    },
    {
      id: "theme-4",
      code: "spring",
      name: "Bahar Teması",
      isActive: false,
      assets: { primaryColor: "#10B981", accentColor: "#F59E0B" },
    },
  ]
}
