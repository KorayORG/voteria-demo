"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  Users,
  Settings,
  Clock,
  BarChart3,
  Palette,
  FileText,
  AlertTriangle,
  Database,
  Tags,
} from "lucide-react"
import { useAdminData } from "@/hooks/use-admin-data"
import { UserManagement } from "@/components/admin/user-management"
import { SystemSettings } from "@/components/admin/system-settings"
import { ShiftManagement } from "@/components/admin/shift-management"
import { ExternalAdjustments } from "@/components/admin/external-adjustments"
import { ThemeManagement } from "@/components/admin/theme-management"
import { AuditLogs } from "@/components/admin/audit-logs"
import { CategoryManagement } from "@/components/admin/category-management"

export function AdminDashboard() {
  const { users, systemSettings, auditLogs, themes, loading } = useAdminData()
  const [activeTab, setActiveTab] = useState("overview")

  const activeUsers = users.filter((u) => u.isActive).length
  const inactiveUsers = users.filter((u) => !u.isActive).length
  const recentLogs = auditLogs.slice(0, 5)
  const activeTheme = themes.find((t) => t.isActive)

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-white text-lg">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Paneli</h1>
          <p className="text-gray-300">Sistem yönetimi ve konfigürasyonu</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-300">
            <Shield className="h-5 w-5 text-red-500" />
            <span className="text-sm">Sistem Yöneticisi</span>
          </div>
          {systemSettings?.maintenanceMode && (
            <Badge className="bg-red-500 text-white animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Bakım Modu
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activeUsers}</p>
                <p className="text-sm text-gray-400">Aktif Kullanıcı</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{users.length}</p>
                <p className="text-sm text-gray-400">Toplam Kullanıcı</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{auditLogs.length}</p>
                <p className="text-sm text-gray-400">Audit Kayıtları</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Palette className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activeTheme?.name || "Varsayılan"}</p>
                <p className="text-sm text-gray-400">Aktif Tema</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-800/50 border-gray-700 grid grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="overview" className="data-[state=active]:bg-red-500">
            <BarChart3 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Genel</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-red-500">
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Kullanıcılar</span>
          </TabsTrigger>
          <TabsTrigger value="shifts" className="data-[state=active]:bg-red-500">
            <Clock className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Vardiyalar</span>
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="data-[state=active]:bg-red-500">
            <Database className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Ayarlar</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-red-500">
            <Tags className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Kategoriler</span>
          </TabsTrigger>
          <TabsTrigger value="themes" className="data-[state=active]:bg-red-500">
            <Palette className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Temalar</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-red-500">
            <Settings className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Sistem</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Status */}
            <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Sistem Durumu</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Bakım Modu</span>
                    <Badge className={systemSettings?.maintenanceMode ? "bg-red-500" : "bg-green-500"}>
                      {systemSettings?.maintenanceMode ? "Aktif" : "Pasif"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Aktif Kullanıcılar</span>
                    <span className="text-white font-semibold">{activeUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Pasif Kullanıcılar</span>
                    <span className="text-white font-semibold">{inactiveUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Aktif Tema</span>
                    <span className="text-white font-semibold">{activeTheme?.name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Son Aktiviteler</h3>
                <div className="space-y-3">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">{log.action.replace(/_/g, " ")}</p>
                        <p className="text-xs text-gray-400">{log.actorName}</p>
                        <p className="text-xs text-gray-500">
                          {log.createdAt.toLocaleString("tr-TR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="shifts" className="space-y-6">
          <ShiftManagement />
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-6">
          <ExternalAdjustments />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <CategoryManagement />
        </TabsContent>

        <TabsContent value="themes" className="space-y-6">
          <ThemeManagement />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <SystemSettings />
          <AuditLogs />
        </TabsContent>
      </Tabs>
    </div>
  )
}
