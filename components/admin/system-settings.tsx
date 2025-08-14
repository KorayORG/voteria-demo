"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Settings, AlertTriangle, Save, Clock, Palette, Plus, Trash2, Eye, Upload } from "lucide-react"
import { useAdminData } from "@/hooks/use-admin-data"
import { useToast } from "@/hooks/use-toast"

export function SystemSettings() {
  const { systemSettings, updateSystemSettings } = useAdminData()
  // Canlı ön izleme için local CSS değişkenlerini body'ye uygula (yayınlamadan sadece bu kullanıcı görür)
  const applyLivePreview = () => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    settings.paletteColors.slice(0, settings.paletteSize).forEach((c, idx) => {
      root.style.setProperty(`--palette-${idx+1}`, c)
    })
  }

  const handlePublishPalette = async () => {
    // Yalnızca renklerle ilgili kısmı kaydet
    const success = await updateSystemSettings({ paletteSize: settings.paletteSize, paletteColors: settings.paletteColors })
    if (success) {
      applyLivePreview()
    }
  }
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    siteTitle: systemSettings?.siteTitle || "",
    maintenanceMode: systemSettings?.maintenanceMode || false,
    voteCutoffTime: systemSettings?.voteCutoffTime || "09:00",
    paletteSize: Math.min(5, systemSettings?.paletteSize || 5),
    paletteColors: (systemSettings?.paletteColors || ["#2563eb","#16a34a","#dc2626","#f59e0b","#9333ea"]).slice(0,5),
    texts: systemSettings?.texts || { heroTitle:"Hoş geldiniz", heroSubtitle:"Kurumsal yemek oylama sistemi" }
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
      <Card className="bg-gray-800/50 border-gray-700">
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

          {/* Color Palette */}
          <div className="space-y-3">
            <Label className="text-gray-200 flex items-center gap-2"><Palette className="h-4 w-4"/>Renk Paleti</Label>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 mb-1">Renk Sayısı</span>
                <Input type="number" min={1} max={5} value={settings.paletteSize} onChange={e=> {
                  const size = Math.min(5, Math.max(1, e.target.valueAsNumber || 1))
                  setSettings(prev => ({ ...prev, paletteSize: size, paletteColors: prev.paletteColors.slice(0,size).concat(Array(Math.max(0,size - prev.paletteColors.length)).fill('#555555')) }))
                }} className="w-24 bg-gray-700 border-gray-600 text-white" />
              </div>
              <div className="flex gap-3 flex-wrap items-center">
                {settings.paletteColors.slice(0, settings.paletteSize).map((c,idx)=>(
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <input type="color" value={c} onChange={e=> setSettings(p=> { const arr=[...p.paletteColors]; arr[idx]=e.target.value; return {...p, paletteColors:arr } })} className="w-12 h-12 rounded border border-gray-600 bg-gray-800 cursor-pointer" />
                    <button type="button" onClick={()=> setSettings(p=> { const arr=[...p.paletteColors]; arr.splice(idx,1); return { ...p, paletteColors: arr, paletteSize: Math.min(p.paletteSize, arr.length) } })} className="text-[10px] text-gray-400 hover:text-red-400"><Trash2 className="h-3 w-3"/></button>
                  </div>
                ))}
                {settings.paletteColors.length < settings.paletteSize && (
                  <button type="button" onClick={()=> setSettings(p=> ({ ...p, paletteColors: [...p.paletteColors, '#444444'] }))} className="w-12 h-12 flex items-center justify-center border border-dashed border-gray-600 rounded text-gray-400 hover:text-white"><Plus className="h-4 w-4"/></button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400">Maksimum 5 renk. Palet dinamik olarak tema değişkenlerine yansır.</p>
          </div>

          {/* Editable Texts */}
          <div className="space-y-3">
            <Label className="text-gray-200 flex items-center gap-2"><Settings className="h-4 w-4"/>Metin İçerikleri</Label>
            <div className="space-y-4">
              {Object.entries(settings.texts).map(([key,val]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs text-gray-400">{key}</Label>
                  <Input value={val} onChange={e=> setSettings(p=> ({ ...p, texts:{ ...p.texts, [key]: e.target.value } }))} className="bg-gray-700 border-gray-600 text-white" />
                </div>
              ))}
              <AddTextField settings={settings} setSettings={setSettings} />
            </div>
            <p className="text-xs text-gray-500">Buradaki anahtarlar frontend’de istenilen yerlerde kullanılabilir.</p>
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
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <span className="text-gray-300">Renkler</span>
                <div className="flex gap-1">{(systemSettings?.paletteColors||[]).slice(0, systemSettings?.paletteSize||0).map((c,i)=>(<span key={i} className="w-4 h-4 rounded border border-gray-600" style={{background:c}}/>))}</div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
            <div className="flex gap-2 flex-wrap">
              <Button type="button" variant="outline" onClick={applyLivePreview} className="border-gray-600 text-gray-200">
                <Eye className="h-4 w-4 mr-1"/> Ön İzle (Sadece Bana)
              </Button>
              <Button type="button" variant="outline" onClick={handlePublishPalette} className="border-purple-500 text-purple-200">
                <Upload className="h-4 w-4 mr-1"/> Paleti Yayınla
              </Button>
            </div>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Tüm Ayarları Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Küçük yardımcı bileşen: yeni metin anahtarı ekleme
function AddTextField({ settings, setSettings }: any) {
  const [adding, setAdding] = useState(false)
  const [keyName, setKeyName] = useState("")
  const [value, setValue] = useState("")
  if (!adding) return (
    <Button type="button" variant="outline" size="sm" onClick={()=> setAdding(true)} className="border-gray-600 text-gray-300">Yeni Metin Alanı</Button>
  )
  return (
    <div className="p-3 bg-gray-700/40 rounded-lg space-y-2">
      <div className="flex gap-2">
        <Input placeholder="anahtar (ör: footerNote)" value={keyName} onChange={e=> setKeyName(e.target.value.replace(/[^a-zA-Z0-9_-]/g,''))} className="bg-gray-800 border-gray-600 text-white" />
        <Input placeholder="değer" value={value} onChange={e=> setValue(e.target.value)} className="bg-gray-800 border-gray-600 text-white" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={()=> { setAdding(false); setKeyName(""); setValue("") }} className="border-gray-600 text-gray-300">İptal</Button>
        <Button type="button" size="sm" disabled={!keyName} onClick={()=> { setSettings((p:any)=> ({ ...p, texts:{ ...p.texts, [keyName]: value } })); setAdding(false); setKeyName(""); setValue("") }} className="bg-blue-600">Ekle</Button>
      </div>
    </div>
  )
}
