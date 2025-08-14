"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Palette, Check, RotateCcw } from "lucide-react"
import { useAdminData } from "@/hooks/use-admin-data"
import { useToast } from "@/hooks/use-toast"

export function ThemeManagement() {
  const { themes, activateTheme } = useAdminData()
  const { toast } = useToast()

  const handleActivateTheme = async (themeCode: string) => {
    const success = await activateTheme(themeCode)

    if (success) {
      toast({
        title: "Başarılı",
        description: "Tema başarıyla değiştirildi",
      })
    } else {
      toast({
        title: "Hata",
        description: "Tema değiştirilemedi",
        variant: "destructive",
      })
    }
  }

  const handleResetToDefault = async () => {
    await handleActivateTheme("default")
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" />
              Tema Yönetimi
            </CardTitle>
            <Button
              onClick={handleResetToDefault}
              variant="outline"
              className="border-gray-600 text-gray-300 bg-transparent"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Varsayılana Dön
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {themes.map((theme) => (
              <Card
                key={theme.id}
                className={`border-2 transition-all duration-200 cursor-pointer card-3d shadow-3d ${
                  theme.isActive
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-gray-600 bg-gray-700/50 hover:border-purple-400"
                }`}
                onClick={() => !theme.isActive && handleActivateTheme(theme.code)}
              >
                <CardContent className="p-6 text-center">
                  <div className="relative">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        theme.assets?.primaryColor ? "" : "bg-gradient-to-r from-purple-500 to-pink-500"
                      }`}
                      style={{
                        background: theme.assets?.primaryColor
                          ? `linear-gradient(135deg, ${theme.assets.primaryColor}, ${theme.assets.accentColor || theme.assets.primaryColor})`
                          : undefined,
                      }}
                    >
                      <Palette className="h-8 w-8 text-white" />
                    </div>
                    {theme.isActive && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2">{theme.name}</h3>
                  <Badge
                    className={
                      theme.isActive
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                        : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                    }
                  >
                    {theme.isActive ? "Aktif" : "Pasif"}
                  </Badge>

                  {!theme.isActive && (
                    <Button
                      className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleActivateTheme(theme.code)
                      }}
                    >
                      Temayı Uygula
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
            <h4 className="text-white font-medium mb-2">Tema Bilgileri</h4>
            <p className="text-sm text-gray-300">
              Özel gün temaları (Ramazan, Yılbaşı, Bahar) geçici olarak uygulanabilir. Varsayılan temaya geri dönmek
              için "Varsayılana Dön" butonunu kullanın.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
