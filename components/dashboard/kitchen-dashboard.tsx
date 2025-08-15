"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChefHat, BarChart3, MessageSquare, Calendar, Users, Plus, Utensils } from "lucide-react"
import { useKitchenData } from "@/hooks/use-kitchen-data"
import { StatisticsCharts } from "@/components/kitchen/statistics-charts"
import { SuggestionsInbox } from "@/components/kitchen/suggestions-inbox"
import { MenuManagement } from "@/components/kitchen/menu-management"
import { WeeklyOverview } from "@/components/kitchen/weekly-overview"

export function KitchenDashboard() {
  const { weekStatistics, suggestions, loading, getUnreadSuggestionsCount, markSuggestionAsRead, refreshData } =
    useKitchenData()
  const [activeTab, setActiveTab] = useState("overview")

  const unreadCount = getUnreadSuggestionsCount()

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-white text-lg">Yükleniyor...</div>
      </div>
    )
  }

  const totalProductionTraditional =
    weekStatistics?.days.reduce(
      (sum, day) => sum + day.traditional.votes + (day.externalAdjustment?.traditional || 0),
      0,
    ) || 0
  const totalProductionAlternative =
    weekStatistics?.days.reduce(
      (sum, day) => sum + day.alternative.votes + (day.externalAdjustment?.alternative || 0),
      0,
    ) || 0
  const totalProduction = totalProductionTraditional + totalProductionAlternative

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Mutfak Paneli</h1>
          <p className="text-gray-300">Haftalık istatistikler, üretim planlama ve menü yönetimi</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-300">
            <ChefHat className="h-5 w-5 text-orange-500" />
            <span className="text-sm">Mutfak Sorumlusu</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{weekStatistics?.totalVotes || 0}</p>
                <p className="text-sm text-gray-400">Sistem Oyları</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Utensils className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalProduction}</p>
                <p className="text-sm text-gray-400">Toplam Üretim</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{weekStatistics?.averageParticipation || 0}</p>
                <p className="text-sm text-gray-400">Günlük Ortalama</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center relative">
                <MessageSquare className="h-6 w-6 text-white" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 min-w-[20px] h-5 flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{suggestions.length}</p>
                <p className="text-sm text-gray-400">Öneri/İstek</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-800/50 border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-orange-500">
            <Calendar className="h-4 w-4 mr-2" />
            Genel Bakış
          </TabsTrigger>
          <TabsTrigger value="statistics" className="data-[state=active]:bg-orange-500">
            <BarChart3 className="h-4 w-4 mr-2" />
            İstatistikler
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="data-[state=active]:bg-orange-500">
            <MessageSquare className="h-4 w-4 mr-2" />
            Öneriler
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs px-1 min-w-[16px] h-4 flex items-center justify-center">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="menu" className="data-[state=active]:bg-orange-500">
            <Plus className="h-4 w-4 mr-2" />
            Menü Yönetimi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <WeeklyOverview weekStatistics={weekStatistics} onRefresh={refreshData} />
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <StatisticsCharts weekStatistics={weekStatistics} />
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          <SuggestionsInbox
            suggestions={suggestions}
            onMarkRead={async (id: string) => {
              await markSuggestionAsRead(id)
            }}
          />
        </TabsContent>

        <TabsContent value="menu" className="space-y-6">
          <MenuManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
