"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TenantSelector } from "@/components/ui/tenant-selector"
import { Utensils, Eye, EyeOff, Crown, AlertTriangle } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function LoginPage() {
  const [identityNumber, setIdentityNumber] = useState("")
  const [password, setPassword] = useState("")
  const [selectedTenant, setSelectedTenant] = useState("secye")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [maintenanceInfo, setMaintenanceInfo] = useState<any>(null)

  const { login, user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const isMasterAdminInput =
    identityNumber === process.env.NEXT_PUBLIC_MASTER_ADMIN_TCKN ||
    (identityNumber.length === 11 && selectedTenant === "secye")

  useEffect(() => {
    // Check for maintenance mode
    const checkMaintenance = async () => {
      try {
        const res = await fetch("/api/system/status")
        if (res.ok) {
          const data = await res.json()
          setMaintenanceInfo(data.maintenance)
        }
      } catch (error) {
        console.error("Failed to check maintenance status:", error)
      }
    }
    checkMaintenance()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!identityNumber || !password) {
      setError("Lütfen kimlik numarası ve şifre girin")
      setIsLoading(false)
      return
    }

    if (!isMasterAdminInput && !selectedTenant) {
      setError("Lütfen firmanızı seçin")
      setIsLoading(false)
      return
    }

    if (!isMasterAdminInput && identityNumber.length !== 11) {
      setError("Kimlik numarası 11 haneli olmalıdır")
      setIsLoading(false)
      return
    }

    const success = await login(identityNumber, password, selectedTenant)

    if (success) {
      toast({
        title: "Giriş Başarılı",
        description: "Hoş geldiniz!",
      })

      // Router will handle redirection based on role in auth provider
    } else {
      setError("Kimlik numarası, şifre veya firma seçimi hatalı")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/abstract-geometric-pattern.png')] opacity-5"></div>

      <Card className="w-full max-w-md card-3d shadow-3d glass-effect border-gray-700">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex items-center gap-2 p-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
              <Utensils className="h-8 w-8 text-white" />
              <Utensils className="h-8 w-8 text-white rotate-45" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              Seç Ye
              {isMasterAdminInput && <Crown className="h-5 w-5 text-amber-400" />}
            </CardTitle>
            <CardDescription className="text-gray-300 mt-2">
              {isMasterAdminInput ? "Master Admin Paneli" : "Kurumsal yemek oylama sistemine giriş yapın"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {maintenanceInfo?.active && (
            <div className="mb-4 p-3 bg-amber-900/40 border border-amber-700 rounded text-amber-200 text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold">Sistem Bakımda</div>
                <div className="text-xs mt-1">
                  {maintenanceInfo.message ||
                    "Sistem geçici olarak bakım modunda. Sadece yetkili kullanıcılar giriş yapabilir."}
                </div>
                {maintenanceInfo.until && (
                  <div className="text-xs mt-1 opacity-75">
                    Bitiş: {new Date(maintenanceInfo.until).toLocaleString("tr-TR")}
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenant" className="text-gray-200">
                Firma
              </Label>
              <TenantSelector
                value={selectedTenant}
                onValueChange={setSelectedTenant}
                placeholder="Firmanızı seçin..."
                className="w-full"
                disabled={isMasterAdminInput}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="identityNumber" className="text-gray-200">
                {isMasterAdminInput ? "Master Admin TCKN" : "Kimlik/Pasaport Numarası"}
              </Label>
              <Input
                id="identityNumber"
                type="text"
                placeholder={isMasterAdminInput ? "Master Admin TCKN" : "11 haneli kimlik numarası"}
                value={identityNumber}
                onChange={(e) =>
                  setIdentityNumber(
                    isMasterAdminInput ? e.target.value : e.target.value.replace(/\D/g, "").slice(0, 11),
                  )
                }
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500"
                maxLength={11}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">
                Şifre
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifrenizi girin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert className="bg-red-900/50 border-red-700">
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className={cn(
                "w-full font-semibold py-2 shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-60",
                isMasterAdminInput
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
                "text-white",
              )}
              disabled={isLoading}
            >
              {isLoading
                ? isMasterAdminInput
                  ? "Master Giriş..."
                  : "Giriş yapılıyor..."
                : isMasterAdminInput
                  ? "Master Admin Giriş"
                  : "Giriş Yap"}
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-center text-sm">
            <p className="text-gray-400">
              Hesabınız yok mu?{" "}
              <Link href="/auth/register" className="text-orange-500 hover:text-orange-400 font-medium">
                Kayıt olun
              </Link>
            </p>
            <p>
              <Link href="/auth/forgot" className="text-gray-400 hover:text-orange-400">
                Şifremi unuttum
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ")
}
