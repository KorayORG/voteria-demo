"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Utensils, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { useAdminData } from "@/hooks/use-admin-data"
import Link from "next/link"

export default function LoginPage() {
  const [identityNumber, setIdentityNumber] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { login, user } = useAuth()
  const { systemSettings } = useAdminData()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!identityNumber || !password) {
      setError("Lütfen tüm alanları doldurun")
      setIsLoading(false)
      return
    }

    if (identityNumber.length !== 11) {
      setError("Kimlik numarası 11 haneli olmalıdır")
      setIsLoading(false)
      return
    }

  // Bakım modunda butonu kapatma, backend admin kontrolü yapacak
  const success = await login(identityNumber, password)

    if (success) {
      toast({
        title: "Giriş Başarılı",
        description: "Hoş geldiniz!",
      })
      router.push("/dashboard")
    } else {
      setError("Kimlik numarası veya şifre hatalı")
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
            <CardTitle className="text-2xl font-bold text-white">Seç Ye</CardTitle>
            <CardDescription className="text-gray-300 mt-2">
              Kurumsal yemek oylama sistemine giriş yapın
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {systemSettings?.maintenanceMode && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded text-red-200 text-sm">
              Sistem bakım modunda. <span className="font-semibold">Sadece admin</span> kullanıcılar giriş yapabilir. Diğer kullanıcılar denediklerinde uyarı alacaktır.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identityNumber" className="text-gray-200">
                Kimlik/Pasaport Numarası
              </Label>
              <Input
                id="identityNumber"
                type="text"
                placeholder="11 haneli kimlik numarası"
                value={identityNumber}
                onChange={(e) => setIdentityNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
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
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-2 shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? (systemSettings?.maintenanceMode ? "Kontrol ediliyor..." : "Giriş yapılıyor...") : (systemSettings?.maintenanceMode ? "Giriş Yap (Bakım)" : "Giriş Yap")}
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
