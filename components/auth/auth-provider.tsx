"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { UserSession } from "@/types/user"

interface AuthContextType {
  user: UserSession | null
  login: (identityNumber: string, password: string, tenantSlug?: string) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => void
  switchTenant: (tenantSlug: string) => Promise<boolean>
  loading: boolean
  currentTenant: string
  availableTenants: string[]
}

interface RegisterData {
  identityNumber: string
  fullName: string
  phone: string
  email?: string
  password: string
  tenantSlug?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTenant, setCurrentTenant] = useState("secye")
  const [availableTenants, setAvailableTenants] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setCurrentTenant(data.user.currentTenant)
        setAvailableTenants(Object.keys(data.user.rolesByTenant || {}))

        // Redirect based on role and tenant
        if (data.user.currentRole === "master" && data.user.currentTenant === "secye") {
          if (window.location.pathname === "/dashboard") {
            router.push("/master-dashboard")
          }
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (identityNumber: string, password: string, tenantSlug?: string): Promise<boolean> => {
    try {
      setLoading(true)
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identityNumber, password, tenantSlug }),
      })

      if (!res.ok) return false

      const data = await res.json()
      if (!data.success) return false

      setUser(data.user)
      setCurrentTenant(data.user.currentTenant)
      setAvailableTenants(Object.keys(data.user.rolesByTenant || {}))

      return true
    } catch (error) {
      console.error("Login failed:", error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      setLoading(true)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      })

      if (!res.ok) return false

      const resp = await res.json()
      if (!resp.success) return false

      // Auto-login after successful registration
      return await login(data.identityNumber, data.password, data.tenantSlug)
    } catch (error) {
      console.error("Registration failed:", error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const switchTenant = async (tenantSlug: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/switch-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tenantSlug }),
      })

      if (!res.ok) return false

      const data = await res.json()
      if (!data.success) return false

      setUser(data.user)
      setCurrentTenant(data.user.currentTenant)

      // Redirect based on new role
      if (data.user.currentRole === "master" && tenantSlug === "secye") {
        router.push("/master-dashboard")
      } else {
        router.push("/dashboard")
      }

      return true
    } catch (error) {
      console.error("Tenant switch failed:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout failed:", error)
    }

    setUser(null)
    setCurrentTenant("secye")
    setAvailableTenants([])
    router.push("/auth/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        switchTenant,
        loading,
        currentTenant,
        availableTenants,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
