"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import type { WeekStatistics } from "@/types/statistics"
import { getShortWeekDays } from "@/lib/menu-data"

interface StatisticsChartsProps {
  weekStatistics: WeekStatistics | null
}

const COLORS = {
  traditional: "#f97316", // orange-500
  alternative: "#10b981", // emerald-500
  adjustment: "#6366f1", // indigo-500
}

export function StatisticsCharts({ weekStatistics }: StatisticsChartsProps) {
  if (!weekStatistics) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6 text-center">
          <p className="text-gray-300">Grafik verisi yükleniyor...</p>
        </CardContent>
      </Card>
    )
  }

  const shortWeekDays = getShortWeekDays()

  // Prepare data for charts
  const barChartData = weekStatistics.days.map((day, index) => ({
    day: shortWeekDays[index],
    geleneksel: day.traditional.votes,
    alternatif: day.alternative.votes,
    gelenekelAyar: day.externalAdjustment.traditional,
    alternatifAyar: day.externalAdjustment.alternative,
    toplamGeleneksel: day.finalCount.traditional,
    toplamAlternatif: day.finalCount.alternative,
  }))

  // Pie chart data for total week
  const totalTraditional = weekStatistics.days.reduce((sum, day) => sum + day.traditional.votes, 0)
  const totalAlternative = weekStatistics.days.reduce((sum, day) => sum + day.alternative.votes, 0)

  const pieChartData = [
    { name: "Geleneksel", value: totalTraditional, color: COLORS.traditional },
    { name: "Alternatif", value: totalAlternative, color: COLORS.alternative },
  ]

  return (
    <div className="space-y-6">
      {/* Bar Chart - Daily Votes */}
      <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
        <CardHeader>
          <CardTitle className="text-white">Günlük Oy Dağılımı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F3F4F6",
                  }}
                />
                <Bar dataKey="geleneksel" fill={COLORS.traditional} name="Geleneksel" radius={[2, 2, 0, 0]} />
                <Bar dataKey="alternatif" fill={COLORS.alternative} name="Alternatif" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Week Total */}
        <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
          <CardHeader>
            <CardTitle className="text-white">Haftalık Toplam Dağılım</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#F3F4F6",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-300">Geleneksel ({totalTraditional})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-sm text-gray-300">Alternatif ({totalAlternative})</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final Production Chart */}
        <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
          <CardHeader>
            <CardTitle className="text-white">Nihai Üretim Adedi (Harici Ayar Dahil)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#F3F4F6",
                    }}
                  />
                  <Bar
                    dataKey="toplamGeleneksel"
                    fill={COLORS.traditional}
                    name="Toplam Geleneksel"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="toplamAlternatif"
                    fill={COLORS.alternative}
                    name="Toplam Alternatif"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
