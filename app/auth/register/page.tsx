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
import { useAdminData } from "@/hooks/use-admin-data"
import Link from "next/link"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    identityNumber: "",
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { register } = useAuth()
  const { systemSettings } = useAdminData()
  const { toast } = useToast()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "identityNumber") {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/\D/g, "").slice(0, 11) }))
    } else if (name === "phone") {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/\D/g, "").slice(0, 11) }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const validateForm = () => {
    if (!formData.identityNumber || !formData.fullName || !formData.phone || !formData.password) {
      return "Lütfen tüm alanları doldurun"
    }

    if (formData.identityNumber.length !== 11) {
      return "Kimlik numarası 11 haneli olmalıdır"
    }

    if (formData.phone.length !== 11) {
      return "Telefon numarası 11 haneli olmalıdır"
    }

    if (formData.password.length < 6) {
      return "Şifre en az 6 karakter olmalıdır"
    }

    if (formData.password !== formData.confirmPassword) {
      return "Şifreler eşleşmiyor"
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)

    if (systemSettings?.maintenanceMode) {
      setError("Sistem bakım modunda. Kayıt geçici olarak devre dışı.")
      setIsLoading(false)
      return
    }
    const success = await register({
      identityNumber: formData.identityNumber,
      fullName: formData.fullName,
      phone: formData.phone,
      password: formData.password,
    })

    if (success) {
      toast({
        title: "Kayıt Başarılı",
        description: "Hesabınız oluşturuldu, hoş geldiniz!",
      })
      router.push("/dashboard")
    } else {
      setError("Kayıt işlemi başarısız oldu")
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
            <CardTitle className="text-2xl font-bold text-white">Kayıt Ol</CardTitle>
            <CardDescription className="text-gray-300 mt-2">Yeni hesap oluşturun</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {systemSettings?.maintenanceMode && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded text-red-200 text-sm">
              Sistem bakım modunda. Kayıt işlemleri kapalı.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identityNumber" className="text-gray-200">
                Kimlik/Pasaport Numarası
              </Label>
              <Input
                id="identityNumber"
                name="identityNumber"
                type="text"
                placeholder="11 haneli kimlik numarası"
                value={formData.identityNumber}
                onChange={handleChange}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500"
                maxLength={11}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-200">
                Ad Soyad
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Adınız ve soyadınız"
                value={formData.fullName}
                onChange={handleChange}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-200">
                Telefon
              </Label>
              <Input
                id="phone"
                name="phone"
                type="text"
                placeholder="05xxxxxxxxx"
                value={formData.phone}
                onChange={handleChange}
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
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="En az 6 karakter"
                  value={formData.password}
                  onChange={handleChange}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-200">
                Şifre Tekrar
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Şifrenizi tekrar girin"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500"
              />
            </div>

            {error && (
              <Alert className="bg-red-900/50 border-red-700">
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-2 shadow-lg transform transition-all duration-200 hover:scale-105"
              disabled={isLoading || !!systemSettings?.maintenanceMode}
            >
              {isLoading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Zaten hesabınız var mı?{" "}
              <Link href="/auth/login" className="text-orange-500 hover:text-orange-400 font-medium">
                Giriş yapın
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
