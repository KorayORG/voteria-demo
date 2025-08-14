"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, TrendingUp } from "lucide-react"
import { useAdminData } from "@/hooks/use-admin-data"
import { getShortWeekDays } from "@/lib/menu-data"

export function ExternalAdjustments() {
  const { externalAdjustments, shifts } = useAdminData()

  const shortWeekDays = getShortWeekDays()

  const getShiftLabel = (shiftId: string) => {
    const shift = shifts.find((s) => s.id === shiftId)
    return shift ? shift.label : shiftId
  }

  const groupedAdjustments = externalAdjustments.reduce(
    (acc, adj) => {
      const dateKey = adj.date.toISOString().split("T")[0]
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(adj)
      return acc
    },
    {} as Record<string, typeof externalAdjustments>,
  )

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-green-500" />
            Harici Adet Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(groupedAdjustments)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .slice(0, 7)
              .map(([dateKey, adjustments]) => {
                const date = new Date(dateKey)
                const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1 // Convert to Monday = 0

                return (
                  <Card key={dateKey} className="bg-gray-700/50 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-white font-medium">
                            {shortWeekDays[dayIndex]} - {date.toLocaleDateString("tr-TR")}
                          </h4>
                        </div>
                        <Badge className="bg-green-500/20 text-green-300">{adjustments.length} ayar</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {adjustments.map((adj) => (
                          <div key={adj.id} className="p-3 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-300">{getShiftLabel(adj.shiftId)}</span>
                              <div className="flex items-center gap-1 text-green-400">
                                <TrendingUp className="h-3 w-3" />
                                <span className="text-sm font-semibold">+{adj.addAbsolute || 0}</span>
                              </div>
                            </div>
                            {adj.note && <p className="text-xs text-gray-400">{adj.note}</p>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

            {Object.keys(groupedAdjustments).length === 0 && (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Henüz harici adet ayarı bulunmuyor</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
