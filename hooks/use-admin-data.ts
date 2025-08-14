"use client"

import { useState, useEffect } from "react"
import type { User } from "@/components/auth/auth-provider"
import type { SystemSettings, ExternalAdjustment, AuditLog, CategorySchema, Theme } from "@/types/admin"
import type { Shift } from "@/types/menu"
import {
  generateMockUsers,
  getSystemSettings,
  generateMockAuditLogs,
  generateMockExternalAdjustments,
  getCategorySchema,
  getAvailableThemes,
} from "@/lib/admin-data"
import { defaultShifts } from "@/lib/menu-data"

export function useAdminData() {
  const [users, setUsers] = useState<User[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [externalAdjustments, setExternalAdjustments] = useState<ExternalAdjustment[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [categorySchema, setCategorySchema] = useState<CategorySchema | null>(null)
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [userCreationCooldown, setUserCreationCooldown] = useState(0)

  useEffect(() => {
    loadAdminData()
  }, [])

  useEffect(() => {
    if (userCreationCooldown > 0) {
      const timer = setTimeout(() => {
        setUserCreationCooldown(userCreationCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [userCreationCooldown])

  const loadAdminData = async () => {
    try {
      setLoading(true)

      // Load all admin data
      setUsers(generateMockUsers())
      setShifts(defaultShifts)
      setSystemSettings(getSystemSettings())
      setExternalAdjustments(generateMockExternalAdjustments())
      setAuditLogs(generateMockAuditLogs())
      setCategorySchema(getCategorySchema())
      setThemes(getAvailableThemes())
    } catch (error) {
      console.error("Failed to load admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (userData: Omit<User, "id">): Promise<boolean> => {
    if (userCreationCooldown > 0) {
      return false
    }

    try {
      const newUser: User = {
        ...userData,
        id: Date.now().toString(),
      }

      setUsers((prev) => [...prev, newUser])
      setUserCreationCooldown(3) // 3 second cooldown

      // Add audit log
      addAuditLog("USER_CREATED", "User", newUser.id, {
        role: newUser.role,
        identityNumber: newUser.identityNumber,
      })

      return true
    } catch (error) {
      console.error("Failed to create user:", error)
      return false
    }
  }

  const updateUser = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    try {
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, ...updates } : user)))

      // Add audit log
      addAuditLog("USER_UPDATED", "User", userId, updates)

      return true
    } catch (error) {
      console.error("Failed to update user:", error)
      return false
    }
  }

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      const user = users.find((u) => u.id === userId)
      if (!user) return false

      setUsers((prev) => prev.filter((user) => user.id !== userId))

      // Add audit log
      addAuditLog("USER_DELETED", "User", userId, {
        identityNumber: user.identityNumber,
        fullName: user.fullName,
      })

      return true
    } catch (error) {
      console.error("Failed to delete user:", error)
      return false
    }
  }

  const updateSystemSettings = async (updates: Partial<SystemSettings>): Promise<boolean> => {
    try {
      setSystemSettings((prev) => (prev ? { ...prev, ...updates, updatedAt: new Date() } : null))

      // Add audit log
      addAuditLog("SYSTEM_SETTINGS_UPDATED", "SystemSettings", "system-1", updates)

      return true
    } catch (error) {
      console.error("Failed to update system settings:", error)
      return false
    }
  }

  const createExternalAdjustment = async (
    adjustment: Omit<ExternalAdjustment, "id" | "createdBy" | "createdAt">,
  ): Promise<boolean> => {
    try {
      const newAdjustment: ExternalAdjustment = {
        ...adjustment,
        id: Date.now().toString(),
        createdBy: "1", // Current admin user
        createdAt: new Date(),
      }

      setExternalAdjustments((prev) => [...prev, newAdjustment])

      // Add audit log
      addAuditLog("EXTERNAL_ADJUSTMENT_CREATED", "ExternalAdjustment", newAdjustment.id, {
        date: adjustment.date,
        shiftId: adjustment.shiftId,
        addAbsolute: adjustment.addAbsolute,
        addPercent: adjustment.addPercent,
      })

      return true
    } catch (error) {
      console.error("Failed to create external adjustment:", error)
      return false
    }
  }

  const activateTheme = async (themeCode: string): Promise<boolean> => {
    try {
      setThemes((prev) =>
        prev.map((theme) => ({
          ...theme,
          isActive: theme.code === themeCode,
        })),
      )

      // Add audit log
      addAuditLog("THEME_ACTIVATED", "Theme", themeCode, { themeCode })

      return true
    } catch (error) {
      console.error("Failed to activate theme:", error)
      return false
    }
  }

  const addAuditLog = (action: string, entity: string, entityId?: string, meta?: Record<string, any>) => {
    const newLog: AuditLog = {
      id: Date.now().toString(),
      actorId: "1", // Current admin user
      actorName: "Sistem Yöneticisi",
      action,
      entity,
      entityId,
      meta,
      createdAt: new Date(),
    }

    setAuditLogs((prev) => [newLog, ...prev])
  }

  return {
    users,
    shifts,
    systemSettings,
    externalAdjustments,
    auditLogs,
    categorySchema,
    themes,
    loading,
    userCreationCooldown,
    createUser,
    updateUser,
    deleteUser,
    updateSystemSettings,
    createExternalAdjustment,
    activateTheme,
    refreshData: loadAdminData,
  }
}
