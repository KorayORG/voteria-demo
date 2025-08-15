"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChefHat, Plus, Minus, Save, AlertTriangle, RefreshCw, Calendar, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { WeekStatistics, DayStatistics } from "@/types/statistics"
import { getWeekDays } from "@/lib/menu-data"

interface ProductionPlannerProps {
  weekStatistics: WeekStatistics | null
  onRefresh: () => void
}

interface ProductionAdjustment {
  dayIndex: number
  traditional: number
  alternative: number
  reason: string
}

interface SubstituteItem {
  id: string
  dayIndex: number
  originalType: "traditional" | "alternative"
  originalName: string
  substituteName: string
  reason: string
  timestamp: Date
}

export function ProductionPlanner({ weekStatistics, onRefresh }: ProductionPlannerProps) {
  const [adjustments, setAdjustments] = useState<ProductionAdjustment[]>([])
  const [substitutes, setSubstitutes] = useState<SubstituteItem[]>([])
  const [loading, setLoading] = useState(false)
  const [activeDay, setActiveDay] = useState(0)
  const { toast } = useToast()

  const weekDays = getWeekDays()

  useEffect(() => {
    loadProductionData()
  }, [weekStatistics])

  const loadProductionData = async () => {
    if (!weekStatistics) return

    try {
      // Load existing adjustments and substitutes
      const [adjustRes, subsRes] = await Promise.all([
        fetch(`/api/kitchen/adjustments?week=${weekStatistics.weekOfISO}`),
        fetch(`/api/kitchen/substitutes?week=${weekStatistics.weekOfISO}`),
      ])

      if (adjustRes.ok) {
        const data = await adjustRes.json()
        setAdjustments(data.adjustments || [])
      }

      if (subsRes.ok) {
        const data = await subsRes.json()
        setSubstitutes(data.substitutes || [])
      }
    } catch (error) {
      console.error("Failed to load production data:", error)
    }
  }

  const handleAdjustment = async (
    dayIndex: number,
    type: "traditional" | "alternative",
    change: number,
    reason: string,
  ) => {
    if (!weekStatistics) return

    setLoading(true)
    try {
      const response = await fetch("/api/kitchen/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          weekOfISO: weekStatistics.weekOfISO,
          dayIndex,
          type,
          change,
          reason,
        }),
      })

      if (response.ok) {
        toast({
          title: "Ayarlama Kaydedildi",
          description: `${type === "traditional" ? "Geleneksel" : "Alternatif"} menü için ${change > 0 ? "+" : ""}${change} ayarlaması yapıldı.`,
        })
        onRefresh()
        loadProductionData()
      } else {
        throw new Error("Failed to save adjustment")
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ayarlama kaydedilemedi.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubstitute = async (
    dayIndex: number,
    originalType: "traditional" | "alternative",
    substituteName: string,
    reason: string,
  ) => {
    if (!weekStatistics) return

    setLoading(true)
    try {
      const response = await fetch("/api/kitchen/substitutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          weekOfISO: weekStatistics.weekOfISO,
          dayIndex,
          originalType,
          substituteName,
          reason,
        }),
      })

      if (response.ok) {
        toast({
          title: "İkame Kaydedildi",
          description: `${originalType === "traditional" ? "Geleneksel" : "Alternatif"} menü için ikame eklendi.`,
        })
        loadProductionData()
      } else {
        throw new Error("Failed to save substitute")
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "İkame kaydedilemedi.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!weekStatistics) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6 text-center">
          <p className="text-gray-300">Üretim planlama verisi yükleniyor...</p>
        </CardContent>
      </Card>
    )
  }

  const currentDay = weekStatistics.days[activeDay]
  const currentAdjustment = adjustments.find((a) => a.dayIndex === activeDay)
  const daySubstitutes = substitutes.filter((s) => s.dayIndex === activeDay)

  return (
    <div className="space-y-6">
      {/* Header with Week Navigation */}
      <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChefHat className="h-6 w-6 text-orange-500" />
              <div>
                <CardTitle className="text-white">Üretim Planlama</CardTitle>
                <p className="text-sm text-gray-400">Hafta {weekStatistics.weekOfISO} - Günlük üretim ayarlamaları</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeDay.toString()} onValueChange={(value) => setActiveDay(Number.parseInt(value))}>
        <TabsList className="bg-gray-800/50 border-gray-700 grid grid-cols-7 w-full">
          {weekDays.map((day, index) => {
            const dayData = weekStatistics.days[index]
            const hasAdjustment = adjustments.some((a) => a.dayIndex === index)
            const hasSubstitute = substitutes.some((s) => s.dayIndex === index)

            return (
              <TabsTrigger
                key={index}
                value={index.toString()}
                className="data-[state=active]:bg-orange-500 relative text-xs"
              >
                {day.slice(0, 3)}
                {(hasAdjustment || hasSubstitute) && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"></div>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {weekStatistics.days.map((dayData, dayIndex) => (
          <TabsContent key={dayIndex} value={dayIndex.toString()} className="space-y-6">
            <DayProductionPanel
              dayData={dayData}
              dayIndex={dayIndex}
              dayName={weekDays[dayIndex]}
              adjustment={adjustments.find((a) => a.dayIndex === dayIndex)}
              substitutes={substitutes.filter((s) => s.dayIndex === dayIndex)}
              onAdjustment={handleAdjustment}
              onSubstitute={handleSubstitute}
              loading={loading}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

interface DayProductionPanelProps {
  dayData: DayStatistics
  dayIndex: number
  dayName: string
  adjustment?: ProductionAdjustment
  substitutes: SubstituteItem[]
  onAdjustment: (dayIndex: number, type: "traditional" | "alternative", change: number, reason: string) => void
  onSubstitute: (
    dayIndex: number,
    originalType: "traditional" | "alternative",
    substituteName: string,
    reason: string,
  ) => void
  loading: boolean
}

function DayProductionPanel({
  dayData,
  dayIndex,
  dayName,
  adjustment,
  substitutes,
  onAdjustment,
  onSubstitute,
  loading,
}: DayProductionPanelProps) {
  const [traditionalAdjust, setTraditionalAdjust] = useState(0)
  const [alternativeAdjust, setAlternativeAdjust] = useState(0)
  const [adjustReason, setAdjustReason] = useState("")
  const [substituteForm, setSubstituteForm] = useState({
    type: "traditional" as "traditional" | "alternative",
    name: "",
    reason: "",
  })

  const traditionalTotal = dayData.traditional.votes + (adjustment?.traditional || 0)
  const alternativeTotal = dayData.alternative.votes + (adjustment?.alternative || 0)

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            {dayName} - {dayData.date.toLocaleDateString("tr-TR")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Traditional */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <h4 className="font-semibold text-white">Geleneksel</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Sistem Oyları:</span>
                  <span className="text-white font-medium">{dayData.traditional.votes}</span>
                </div>
                {adjustment && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Harici Ayar:</span>
                    <span className={`font-medium ${adjustment.traditional >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {adjustment.traditional >= 0 ? "+" : ""}
                      {adjustment.traditional}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg border-t border-gray-700 pt-2">
                  <span className="text-white font-semibold">Toplam Üretim:</span>
                  <span className="text-orange-400 font-bold">{traditionalTotal}</span>
                </div>
              </div>
            </div>

            {/* Alternative */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <h4 className="font-semibold text-white">Alternatif</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Sistem Oyları:</span>
                  <span className="text-white font-medium">{dayData.alternative.votes}</span>
                </div>
                {adjustment && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Harici Ayar:</span>
                    <span className={`font-medium ${adjustment.alternative >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {adjustment.alternative >= 0 ? "+" : ""}
                      {adjustment.alternative}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg border-t border-gray-700 pt-2">
                  <span className="text-white font-semibold">Toplam Üretim:</span>
                  <span className="text-green-400 font-bold">{alternativeTotal}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Production Adjustments */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Üretim Ayarlamaları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Traditional Adjustment */}
            <div className="space-y-3">
              <Label className="text-white">Geleneksel Ayar</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTraditionalAdjust(Math.max(traditionalAdjust - 1, -dayData.traditional.votes))}
                  disabled={loading}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={traditionalAdjust}
                  onChange={(e) => setTraditionalAdjust(Number.parseInt(e.target.value) || 0)}
                  className="text-center bg-gray-700 border-gray-600 text-white"
                  disabled={loading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTraditionalAdjust(traditionalAdjust + 1)}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Alternative Adjustment */}
            <div className="space-y-3">
              <Label className="text-white">Alternatif Ayar</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAlternativeAdjust(Math.max(alternativeAdjust - 1, -dayData.alternative.votes))}
                  disabled={loading}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={alternativeAdjust}
                  onChange={(e) => setAlternativeAdjust(Number.parseInt(e.target.value) || 0)}
                  className="text-center bg-gray-700 border-gray-600 text-white"
                  disabled={loading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAlternativeAdjust(alternativeAdjust + 1)}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-white">Ayarlama Nedeni</Label>
            <Input
              placeholder="Örn: Harici sipariş, personel yemeği, vb."
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              disabled={loading}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (traditionalAdjust !== 0) {
                  onAdjustment(dayIndex, "traditional", traditionalAdjust, adjustReason)
                  setTraditionalAdjust(0)
                }
                if (alternativeAdjust !== 0) {
                  onAdjustment(dayIndex, "alternative", alternativeAdjust, adjustReason)
                  setAlternativeAdjust(0)
                }
                setAdjustReason("")
              }}
              disabled={loading || (traditionalAdjust === 0 && alternativeAdjust === 0) || !adjustReason.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Ayarlamayı Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Substitutes Management */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            İkame Yönetimi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Substitutes */}
          {substitutes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white">Aktif İkameler:</h4>
              {substitutes.map((sub) => (
                <Alert key={sub.id} className="bg-amber-900/20 border-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-amber-200">
                    <strong>{sub.originalType === "traditional" ? "Geleneksel" : "Alternatif"}</strong> yerine{" "}
                    <strong>{sub.substituteName}</strong> - {sub.reason}
                    <div className="text-xs text-amber-300 mt-1">{sub.timestamp.toLocaleString("tr-TR")}</div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Add New Substitute */}
          <div className="space-y-3 border-t border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-white">Yeni İkame Ekle:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-white">Menü Tipi</Label>
                <select
                  value={substituteForm.type}
                  onChange={(e) => setSubstituteForm((prev) => ({ ...prev, type: e.target.value as any }))}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  disabled={loading}
                >
                  <option value="traditional">Geleneksel</option>
                  <option value="alternative">Alternatif</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-white">İkame Menü</Label>
                <Input
                  placeholder="İkame menü adı"
                  value={substituteForm.name}
                  onChange={(e) => setSubstituteForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Neden</Label>
                <Input
                  placeholder="İkame nedeni"
                  value={substituteForm.reason}
                  onChange={(e) => setSubstituteForm((prev) => ({ ...prev, reason: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  disabled={loading}
                />
              </div>
            </div>
            <Button
              onClick={() => {
                onSubstitute(dayIndex, substituteForm.type, substituteForm.name, substituteForm.reason)
                setSubstituteForm({ type: "traditional", name: "", reason: "" })
              }}
              disabled={loading || !substituteForm.name.trim() || !substituteForm.reason.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              İkame Ekle
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
