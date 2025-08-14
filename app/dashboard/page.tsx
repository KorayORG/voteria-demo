"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { MemberDashboard } from "@/components/dashboard/member-dashboard"
import { KitchenDashboard } from "@/components/dashboard/kitchen-dashboard"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Yükleniyor...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const renderDashboard = () => {
    switch (user.role) {
      case "admin":
        return <AdminDashboard />
      case "kitchen":
        return <KitchenDashboard />
      case "member":
      default:
        return <MemberDashboard />
    }
  }

  return <DashboardLayout>{renderDashboard()}</DashboardLayout>
}
