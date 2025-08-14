"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Utensils, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function LoginPage() {
  const [identityNumber, setIdentityNumber] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
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
            <CardTitle className="text-2xl font-bold text-white">Cafeteria Vote</CardTitle>
            <CardDescription className="text-gray-300 mt-2">
              Kurumsal yemek oylama sistemine giriş yapın
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
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
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-2 shadow-lg transform transition-all duration-200 hover:scale-105"
              disabled={isLoading}
            >
              {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Hesabınız yok mu?{" "}
              <Link href="/auth/register" className="text-orange-500 hover:text-orange-400 font-medium">
                Kayıt olun
              </Link>
            </p>
          </div>

          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Demo hesapları:</p>
            <div className="space-y-1 text-xs text-gray-300">
              <div>Admin: 99999999999 / Admin!234</div>
              <div>Mutfak: 11111111111 / Kitchen!123</div>
              <div>Üye: 22222222222 / Member!123</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
