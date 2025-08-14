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
  role: UserRole
  isActive: boolean
  activeFrom?: Date
  activeTo?: Date
}

interface AuthContextType {
  user: User | null
  login: (identityNumber: string, password: string) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => void
  loading: boolean
}

interface RegisterData {
  identityNumber: string
  fullName: string
  phone: string
  password: string
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
        if (token) {
          // In a real app, validate token with backend
          const userData = localStorage.getItem("user_data")
          if (userData) {
            setUser(JSON.parse(userData))
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

  const login = async (identityNumber: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identityNumber, password }),
      })
      if (!res.ok) return false
      const data = await res.json()
      if (!data.success) return false
      localStorage.setItem("auth_token", data.token)
      localStorage.setItem("user_data", JSON.stringify(data.user))
      setUser(data.user)
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
