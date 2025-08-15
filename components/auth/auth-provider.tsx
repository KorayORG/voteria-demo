"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export type UserRole = "member" | "kitchen" | "admin"

export interface User {
  id: string
  identityNumber: string
  fullName: string
  phone: string
  role: UserRole | 'master-admin'
  isActive: boolean
  tenantId?: string
  activeFrom?: Date
  activeTo?: Date
}

interface AuthContextType {
  user: User | null
  login: (identityNumber: string, password: string, tenantSlug?: string) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => void
  loading: boolean
}

interface RegisterData {
  identityNumber: string
  fullName: string
  phone: string
  password: string
  tenantSlug?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        const userData = localStorage.getItem("user_data")
        const isMasterAdmin = localStorage.getItem("is_master_admin") === "true"
        
        if (token && userData) {
          try {
            const parsedUser = JSON.parse(userData)
            if (isMasterAdmin) {
              parsedUser.role = 'master-admin'
            }
            setUser(parsedUser)
            
            // Redirect master admin to master dashboard
            if (isMasterAdmin && window.location.pathname === '/dashboard') {
              router.push('/master-dashboard')
            }
          } catch (error) {
            console.error('Error parsing user data:', error)
            localStorage.removeItem("auth_token")
            localStorage.removeItem("user_data")
            localStorage.removeItem("is_master_admin")
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (identityNumber: string, password: string, tenantSlug?: string): Promise<boolean> => {
    try {
      setLoading(true)
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identityNumber, password, tenantSlug }),
      })
      if (!res.ok) return false
      const data = await res.json()
      if (!data.success) return false
      localStorage.setItem("auth_token", data.token)
      localStorage.setItem("user_data", JSON.stringify(data.user))
      setUser(data.user)
      
      // Redirect master admin to special dashboard
      if (data.isMasterAdmin) {
        localStorage.setItem("is_master_admin", "true")
        // Update user role for master admin
        const masterUser = { ...data.user, role: 'master-admin' }
        setUser(masterUser)
        localStorage.setItem("user_data", JSON.stringify(masterUser))
      }
      
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
        body: JSON.stringify(data),
      })
      if (!res.ok) return false
      const resp = await res.json()
      if (!resp.success) return false
      const newUser: User = {
        id: resp.userId,
        identityNumber: data.identityNumber,
        fullName: data.fullName,
        phone: data.phone,
        role: "member",
        isActive: true,
      }
      localStorage.setItem("auth_token", `tok_${resp.userId}`)
      localStorage.setItem("user_data", JSON.stringify(newUser))
      setUser(newUser)
      return true
    } catch (error) {
      console.error("Registration failed:", error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    localStorage.removeItem("is_master_admin")
    setUser(null)
  fetch('/api/auth/logout', { method:'POST' })
    router.push("/auth/login")
  }

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
