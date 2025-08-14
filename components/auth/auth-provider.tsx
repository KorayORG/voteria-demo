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

      // Mock authentication - in real app, call backend API
      if (identityNumber === "99999999999" && password === "Admin!234") {
        const adminUser: User = {
          id: "1",
          identityNumber: "99999999999",
          fullName: "Sistem Yöneticisi",
          phone: "05551234567",
          role: "admin",
          isActive: true,
        }

        localStorage.setItem("auth_token", "mock_admin_token")
        localStorage.setItem("user_data", JSON.stringify(adminUser))
        setUser(adminUser)
        return true
      } else if (identityNumber === "11111111111" && password === "Kitchen!123") {
        const kitchenUser: User = {
          id: "2",
          identityNumber: "11111111111",
          fullName: "Mutfak Sorumlusu",
          phone: "05551234568",
          role: "kitchen",
          isActive: true,
        }

        localStorage.setItem("auth_token", "mock_kitchen_token")
        localStorage.setItem("user_data", JSON.stringify(kitchenUser))
        setUser(kitchenUser)
        return true
      } else if (identityNumber === "22222222222" && password === "Member!123") {
        const memberUser: User = {
          id: "3",
          identityNumber: "22222222222",
          fullName: "Test Üyesi",
          phone: "05551234569",
          role: "member",
          isActive: true,
        }

        localStorage.setItem("auth_token", "mock_member_token")
        localStorage.setItem("user_data", JSON.stringify(memberUser))
        setUser(memberUser)
        return true
      }

      return false
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

      // Mock registration - in real app, call backend API
      const newUser: User = {
        id: Date.now().toString(),
        identityNumber: data.identityNumber,
        fullName: data.fullName,
        phone: data.phone,
        role: "member",
        isActive: true,
      }

      localStorage.setItem("auth_token", `mock_token_${newUser.id}`)
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
