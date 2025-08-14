"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Settings, AlertTriangle, Save, Clock } from "lucide-react"
import { useAdminData } from "@/hooks/use-admin-data"
import { useToast } from "@/hooks/use-toast"

export function SystemSettings() {
  const { systemSettings, updateSystemSettings } = useAdminData()
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    siteTitle: systemSettings?.siteTitle || "",
    maintenanceMode: systemSettings?.maintenanceMode || false,
    voteCutoffTime: systemSettings?.voteCutoffTime || "09:00",
  })

  const handleSave = async () => {
    const success = await updateSystemSettings(settings)

    if (success) {
      toast({
        title: "Başarılı",
        description: "Sistem ayarları güncellendi",
      })
    } else {
      toast({
        title: "Hata",
        description: "Sistem ayarları güncellenemedi",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-500" />
            Sistem Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Site Title */}
          <div className="space-y-2">
            <Label htmlFor="siteTitle" className="text-gray-200">
              Site Başlığı
            </Label>
            <Input
              id="siteTitle"
              value={settings.siteTitle}
              onChange={(e) => setSettings((prev) => ({ ...prev, siteTitle: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          {/* Vote Cutoff Time */}
          <div className="space-y-2">
            <Label htmlFor="voteCutoffTime" className="text-gray-200 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Oylama Kapanış Saati
            </Label>
            <Input
              id="voteCutoffTime"
              type="time"
              value={settings.voteCutoffTime}
              onChange={(e) => setSettings((prev) => ({ ...prev, voteCutoffTime: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <p className="text-xs text-gray-400">Bu saatten sonra oylar değiştirilemez</p>
          </div>

          {/* Maintenance Mode */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenanceMode" className="text-gray-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Bakım Modu
                </Label>
                <p className="text-sm text-gray-400 mt-1">Bakım modunda sadece yöneticiler sisteme giriş yapabilir</p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, maintenanceMode: checked }))}
              />
            </div>

            {settings.maintenanceMode && (
              <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-red-300 font-medium">Bakım Modu Aktif</span>
                </div>
                <p className="text-sm text-red-200">
                  Sistem bakım modunda. Sadece yönetici hesapları giriş yapabilir. Normal kullanıcılar "Sistem bakımda"
                  mesajı görecek.
                </p>
              </div>
            )}
          </div>

          {/* Current Status */}
          <div className="pt-4 border-t border-gray-700">
            <h4 className="text-white font-medium mb-3">Mevcut Durum</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <span className="text-gray-300">Bakım Modu</span>
                <Badge className={systemSettings?.maintenanceMode ? "bg-red-500" : "bg-green-500"}>
                  {systemSettings?.maintenanceMode ? "Aktif" : "Pasif"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <span className="text-gray-300">Oylama Kapanış</span>
                <Badge className="bg-blue-500/20 text-blue-300">{systemSettings?.voteCutoffTime}</Badge>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Ayarları Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
