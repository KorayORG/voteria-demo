"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Users, Utensils, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react"
import type { WeekStatistics } from "@/types/statistics"
import { ProductionPlanner } from "./production-planner"

interface WeeklyOverviewProps {
  weekStatistics: WeekStatistics | null
  onRefresh?: () => void
}

export function WeeklyOverview({ weekStatistics, onRefresh }: WeeklyOverviewProps) {
  const [activeTab, setActiveTab] = useState("overview")

  if (!weekStatistics) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6 text-center">
          <p className="text-gray-300">İstatistik verisi yükleniyor...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-800/50 border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-orange-500">
            <BarChart3 className="h-4 w-4 mr-2" />
            Genel Bakış
          </TabsTrigger>
          <TabsTrigger value="production" className="data-[state=active]:bg-orange-500">
            <Utensils className="h-4 w-4 mr-2" />
            Üretim Planlama
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Week Summary */}
          <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  Haftalık Özet - Hafta {weekStatistics.weekOfISO}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{weekStatistics.totalVotes}</p>
                  <p className="text-sm text-gray-400">Toplam Oy</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{weekStatistics.averageParticipation}</p>
                  <p className="text-sm text-gray-400">Günlük Ortalama</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">
                    {Math.round((weekStatistics.totalVotes / (weekStatistics.days.length * 100)) * 100)}%
                  </p>
                  <p className="text-sm text-gray-400">Katılım Oranı</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {weekStatistics.days.map((day, index) => {
              const traditionalTotal = day.traditional.votes + (day.externalAdjustment?.traditional || 0)
              const alternativeTotal = day.alternative.votes + (day.externalAdjustment?.alternative || 0)
              const totalVotes = traditionalTotal + alternativeTotal

              const traditionalPercentage = totalVotes > 0 ? Math.round((traditionalTotal / totalVotes) * 100) : 0
              const alternativePercentage = 100 - traditionalPercentage

              return (
                <Card key={index} className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">{day.dayName}</CardTitle>
                      <Badge className="bg-gray-700 text-gray-300">
                        {day.date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Vote Counts */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className="text-sm text-gray-300">Geleneksel</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-semibold">{day.traditional.votes}</span>
                          {day.externalAdjustment?.traditional !== 0 && (
                            <span className="text-xs text-gray-400 ml-1">
                              ({day.externalAdjustment?.traditional > 0 ? "+" : ""}
                              {day.externalAdjustment?.traditional})
                            </span>
                          )}
                        </div>
                      </div>
                      <Progress value={traditionalPercentage} className="h-2" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-300">Alternatif</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-semibold">{day.alternative.votes}</span>
                          {day.externalAdjustment?.alternative !== 0 && (
                            <span className="text-xs text-gray-400 ml-1">
                              ({day.externalAdjustment?.alternative > 0 ? "+" : ""}
                              {day.externalAdjustment?.alternative})
                            </span>
                          )}
                        </div>
                      </div>
                      <Progress value={alternativePercentage} className="h-2" />
                    </div>

                    {/* Final Production Count */}
                    <div className="pt-3 border-t border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Utensils className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium text-white">Üretim Adedi</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-center p-2 bg-orange-500/10 rounded">
                          <p className="text-orange-300 font-semibold">{traditionalTotal}</p>
                          <p className="text-xs text-gray-400">Geleneksel</p>
                        </div>
                        <div className="text-center p-2 bg-green-500/10 rounded">
                          <p className="text-green-300 font-semibold">{alternativeTotal}</p>
                          <p className="text-xs text-gray-400">Alternatif</p>
                        </div>
                      </div>
                    </div>

                    {/* Trend Indicator */}
                    <div className="flex items-center justify-center gap-2 pt-2">
                      {traditionalPercentage > alternativePercentage ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-orange-500" />
                          <span className="text-xs text-orange-300">Geleneksel Önde</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="text-xs text-green-300">Alternatif Önde</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="production" className="space-y-6">
          <ProductionPlanner weekStatistics={weekStatistics} onRefresh={onRefresh || (() => {})} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
