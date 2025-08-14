"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import type { User } from "@/components/auth/auth-provider"
import type { SystemSettings, ExternalAdjustment, AuditLog, Theme } from "@/types/admin"
import type { Shift } from "@/types/menu"
import { getAvailableThemes } from "@/lib/admin-data"
import { defaultShifts } from "@/lib/menu-data"

export function useAdminData() {
  const { user: authUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [externalAdjustments, setExternalAdjustments] = useState<ExternalAdjustment[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [themes, setThemes] = useState<Theme[]>([])
  const [roles, setRoles] = useState<any[]>([])
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

      // Backend'den kullanıcılar
  const usersRes = await fetch("/api/admin/users", { headers: { 'x-user-id': authUser?.id || '', 'x-user-role': authUser?.role || '' } })
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(
          (data.users || []).map((u: any) => ({
            id: u._id,
            identityNumber: u.identityNumber,
            fullName: u.fullName,
            phone: u.phone,
            role: u.role,
            roleId: u.roleId,
            isActive: u.isActive,
            activeFrom: u.activeFrom ? new Date(u.activeFrom) : undefined,
            activeTo: u.activeTo ? new Date(u.activeTo) : undefined,
          }))
        )
      } else {
        setUsers([])
      }

      // Backend'den audit loglar
  const logsRes = await fetch("/api/admin/audit-logs?limit=200", { headers: { 'x-user-id': authUser?.id || '', 'x-user-role': authUser?.role || '' } })
      if (logsRes.ok) {
        const data = await logsRes.json()
        setAuditLogs(
          (data.logs || []).map((l: any) => ({
            id: l._id?.toString() || l.id,
            actorId: l.actorId,
            actorName: l.actorName,
            action: l.action,
            entity: l.entity,
            entityId: l.entityId?.toString?.() || l.entityId,
            targetId: l.targetId?.toString?.() || l.targetId,
            targetName: l.targetName,
            actorIdentityNumber: l.actorIdentityNumber,
            targetIdentityNumber: l.targetIdentityNumber,
            meta: l.meta,
            createdAt: new Date(l.createdAt),
          }))
        )
      } else {
        setAuditLogs([])
      }

      // Shifts (backend) düşmezse default'a fallback
      try {
  const shiftsRes = await fetch('/api/shifts', { headers: { 'x-user-id': authUser?.id || '', 'x-user-role': authUser?.role || '' } })
        if (shiftsRes.ok) {
          const data = await shiftsRes.json()
          setShifts((data.shifts || []).map((s:any) => ({
            id: s._id?.toString() || s.id,
            code: s.code,
            label: s.label,
            startTime: s.startTime,
            endTime: s.endTime,
            order: s.order ?? 99,
            isActive: s.isActive !== false,
          })))
        } else {
          setShifts(defaultShifts)
        }
      } catch {
        setShifts(defaultShifts)
      }

  // External adjustments UI kaldırıldı (isteğe bağlı geri eklenebilir)
  setExternalAdjustments([])

      // Roles
      try {
  const rolesRes = await fetch('/api/admin/roles', { headers: { 'x-user-id': authUser?.id || '', 'x-user-role': authUser?.role || '' } })
        if (rolesRes.ok) {
          const data = await rolesRes.json()
          setRoles((data.roles||[]).map((r:any)=> ({ id: r._id?.toString()||r.id, name:r.name, code:r.code, color:r.color, order:r.order, permissions:r.permissions, createdAt: new Date(r.createdAt), updatedAt: new Date(r.updatedAt) })))
        } else setRoles([])
      } catch { setRoles([]) }

      // System settings real
      try {
  const ss = await fetch('/api/admin/system-settings', { headers: { 'x-user-id': authUser?.id || '', 'x-user-role': authUser?.role || '' } })
        if (ss.ok) {
          const data = await ss.json()
          const s = data.settings
          setSystemSettings({ id: s.id, siteTitle: s.siteTitle, maintenanceMode: !!s.maintenanceMode, voteCutoffTime: s.voteCutoffTime, activeTheme: s.activeTheme, paletteSize: s.paletteSize, paletteColors: s.paletteColors, texts: s.texts, createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt) })
        }
      } catch {}

      // Mock kalan kısımlar
      setThemes(getAvailableThemes())
    } catch (error) {
      console.error("Failed to load admin data:", error)
    } finally { setLoading(false) }
  }

  const createUser = async (userData: Omit<User, "id"> & { password?: string }): Promise<boolean> => {
    if (userCreationCooldown > 0) return false
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", 'x-user-id': authUser?.id || '', 'x-user-role': authUser?.role || '' },
        body: JSON.stringify(userData),
      })
      if (!res.ok) return false
      setUserCreationCooldown(3)
      await loadAdminData()
      return true
    } catch (error) {
      console.error("Failed to create user:", error)
      return false
    }
  }

  const updateUser = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", 'x-user-id': authUser?.id || '', 'x-user-role': authUser?.role || '' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) return false
      await loadAdminData()
      return true
    } catch (error) {
      console.error("Failed to update user:", error)
      return false
    }
  }

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
  const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE", headers: { 'x-user-id': authUser?.id || '', 'x-user-role': authUser?.role || '' } })
      if (!res.ok) return false
      await loadAdminData()
      return true
    } catch (error) {
      console.error("Failed to delete user:", error)
      return false
    }
  }

  const updateSystemSettings = async (updates: Partial<SystemSettings>): Promise<boolean> => {
    try {
  const res = await fetch('/api/admin/system-settings', { method:'PATCH', headers:{'Content-Type':'application/json','x-user-id': authUser?.id || '', 'x-user-role': authUser?.role || ''}, body: JSON.stringify(updates) })
      if (!res.ok) return false
  const data = await res.json(); const s = data.settings
  setSystemSettings({ id: s.id, siteTitle: s.siteTitle, maintenanceMode: !!s.maintenanceMode, voteCutoffTime: s.voteCutoffTime, activeTheme: s.activeTheme, paletteSize: s.paletteSize, paletteColors: s.paletteColors, texts: s.texts, createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt) })
      return true
    } catch (e) { console.error('Failed to update system settings', e); return false }
  }

  const createExternalAdjustment = async (
    adjustment: Omit<ExternalAdjustment, "id" | "createdBy" | "createdAt">,
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/external-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: adjustment.date.toISOString().split('T')[0],
          shiftId: adjustment.shiftId,
            addAbsolute: adjustment.addAbsolute,
            addPercent: adjustment.addPercent,
            note: adjustment.note,
            actorId: 'admin',
            actorName: 'Admin' }),
      })
      if (!res.ok) return false
      await loadAdminData()
      return true
    } catch (error) {
      console.error("Failed to create external adjustment:", error)
      return false
    }
  }

  const updateExternalAdjustment = async (id: string, updates: Partial<ExternalAdjustment>): Promise<boolean> => {
    try {
      const payload: any = { ...updates }
      if (payload.date instanceof Date) payload.date = payload.date.toISOString().split('T')[0]
      const res = await fetch(`/api/admin/external-adjustments/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (!res.ok) return false
      await loadAdminData()
      return true
    } catch (e) { console.error('Failed to update external adjustment', e); return false }
  }

  const deleteExternalAdjustment = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/external-adjustments/${id}`, { method: 'DELETE' })
      if (!res.ok) return false
      await loadAdminData()
      return true
    } catch (e) { console.error('Failed to delete external adjustment', e); return false }
  }

  const activateTheme = async (themeCode: string): Promise<boolean> => {
    try {
      // Optimistic local update
      setThemes(prev => prev.map(t => ({ ...t, isActive: t.code === themeCode })))
      // Backend'e yaz (system settings activeTheme)
      const res = await fetch('/api/admin/system-settings', { method:'PATCH', headers:{ 'Content-Type':'application/json','x-user-id': authUser?.id || '', 'x-user-role': authUser?.role || '' }, body: JSON.stringify({ activeTheme: themeCode }) })
      if (!res.ok) {
        // revert on failure
        setThemes(prev => prev.map(t => ({ ...t, isActive: t.code === (systemSettings?.activeTheme || 'default') })))
        return false
      }
      const data = await res.json(); const s = data.settings
      setSystemSettings(prev => prev ? { ...prev, activeTheme: s.activeTheme } : prev)
      return true
    } catch (error) {
      console.error('Failed to activate theme:', error)
      return false
    }
  }

  // Shift CRUD
  const createShift = async (shift: Omit<Shift, 'id'>): Promise<boolean> => {
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin', // backend role kontrolü için
        },
        body: JSON.stringify(shift),
      })
      if (!res.ok) return false
      await loadAdminData()
      return true
    } catch (e) {
      console.error('Failed to create shift', e)
      return false
    }
  }

  const updateShift = async (id: string, updates: Partial<Shift>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/shifts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
        },
        body: JSON.stringify(updates),
      })
      if (!res.ok) return false
      await loadAdminData()
      return true
    } catch (e) {
      console.error('Failed to update shift', e)
      return false
    }
  }

  const deleteShift = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/shifts/${id}`, { method: 'DELETE', headers: { 'x-user-role': 'admin' } })
      if (!res.ok) return false
      await loadAdminData()
      return true
    } catch (e) {
      console.error('Failed to delete shift', e)
      return false
    }
  }

  const createRole = async (role: { name:string; color?:string; order?:number; permissions:any }): Promise<boolean> => {
    try {
  const res = await fetch('/api/admin/roles', { method:'POST', headers:{'Content-Type':'application/json','x-user-id': authUser?.id || '', 'x-user-role': authUser?.role || ''}, body: JSON.stringify(role) })
      if (!res.ok) return false
      await loadAdminData(); return true
    } catch { return false }
  }
  const updateRole = async (id:string, updates:any): Promise<boolean> => {
  try { const res = await fetch(`/api/admin/roles/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json','x-user-id': authUser?.id || '', 'x-user-role': authUser?.role || ''}, body: JSON.stringify(updates) }); if(!res.ok) return false; await loadAdminData(); return true } catch { return false }
  }
  const deleteRole = async (id:string): Promise<boolean> => {
  try { const res = await fetch(`/api/admin/roles/${id}`, { method:'DELETE', headers:{'x-user-id': authUser?.id || '', 'x-user-role': authUser?.role || ''} }); if(!res.ok) return false; await loadAdminData(); return true } catch { return false }
  }

  // Audit log ekleme backend'e taşındı

  return {
    users,
    shifts,
    systemSettings,
    externalAdjustments,
    auditLogs,
    themes,
    roles,
    loading,
    userCreationCooldown,
    createUser,
    updateUser,
    deleteUser,
    updateSystemSettings,
    createExternalAdjustment,
    updateExternalAdjustment,
    deleteExternalAdjustment,
    activateTheme,
  createShift,
  updateShift,
  deleteShift,
    createRole,
  updateRole,
  deleteRole,
    refreshData: loadAdminData,
  }
}
