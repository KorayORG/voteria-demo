"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { KitchenDashboard } from "@/components/dashboard/kitchen-dashboard"

export default function KitchenPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || (user.role !== "kitchen" && user.role !== "admin"))) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Yükleniyor...</div>
      </div>
    )
  }

  if (!user || (user.role !== "kitchen" && user.role !== "admin")) {
    return null
  }

  return (
    <DashboardLayout>
      <KitchenDashboard />
    </DashboardLayout>
  )
}
