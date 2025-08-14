"use client"

import { useEffect, useState } from "react"
import { Sparkles, Flag, Heart, Users, BookOpen, Briefcase, Sun, Leaf, Snowflake, Calendar } from "lucide-react"

interface ThemeOverlayProps {
  themeCode: string
}

export function ThemeOverlay({ themeCode }: ThemeOverlayProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => setIsVisible(false), 5000)
    return () => clearTimeout(timer)
  }, [themeCode])

  if (themeCode === "default" || !isVisible) return null

  const getThemeConfig = (code: string) => {
    switch (code) {
      case "ramadan-bayram":
        return {
          title: "Ramazan Bayramınız Mübarek Olsun! 🌙",
          subtitle: "Bayramınızı kutlar, sağlık ve mutluluk dileriz",
          icon: <Sparkles className="h-6 w-6" />,
          gradient: "from-purple-600 via-purple-500 to-amber-500",
          textColor: "text-white",
        }
      case "kurban-bayram":
        return {
          title: "Kurban Bayramınız Mübarek Olsun! 🕌",
          subtitle: "Bayramınızı kutlar, bereket ve huzur dileriz",
          icon: <Heart className="h-6 w-6" />,
          gradient: "from-emerald-600 via-emerald-500 to-amber-600",
          textColor: "text-white",
        }
      case "republic-day":
        return {
          title: "29 Ekim Cumhuriyet Bayramımız Kutlu Olsun! 🇹🇷",
          subtitle: "Cumhuriyetimizin kuruluşunu gururla kutluyoruz",
          icon: <Flag className="h-6 w-6" />,
          gradient: "from-red-600 via-red-500 to-white",
          textColor: "text-red-900",
        }
      case "victory-day":
        return {
          title: "30 Ağustos Zafer Bayramımız Kutlu Olsun! ⭐",
          subtitle: "Büyük zaferin yıldönümünü gururla anıyoruz",
          icon: <Flag className="h-6 w-6" />,
          gradient: "from-red-700 via-red-600 to-yellow-400",
          textColor: "text-white",
        }
      case "children-day":
        return {
          title: "23 Nisan Ulusal Egemenlik ve Çocuk Bayramımız Kutlu Olsun! 🎈",
          subtitle: "Çocuklarımız geleceğimizdir",
          icon: <Users className="h-6 w-6" />,
          gradient: "from-blue-500 via-blue-400 to-amber-500",
          textColor: "text-white",
        }
      case "labor-day":
        return {
          title: "1 Mayıs İşçi ve Emekçi Bayramınız Kutlu Olsun! ✊",
          subtitle: "Tüm emekçilerin bayramını kutluyoruz",
          icon: <Briefcase className="h-6 w-6" />,
          gradient: "from-red-600 via-red-500 to-gray-700",
          textColor: "text-white",
        }
      case "youth-day":
        return {
          title: "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramımız Kutlu Olsun! 🏃‍♂️",
          subtitle: "Gençliğimizle gururluyuz",
          icon: <Users className="h-6 w-6" />,
          gradient: "from-emerald-600 via-emerald-500 to-white",
          textColor: "text-emerald-900",
        }
      case "new-year":
        return {
          title: "Yeni Yılınız Kutlu Olsun! 🎊",
          subtitle: "Sağlık, mutluluk ve başarı dolu bir yıl dileriz",
          icon: <Sparkles className="h-6 w-6" />,
          gradient: "from-red-600 via-red-500 to-emerald-600",
          textColor: "text-white",
        }
      case "teachers-day":
        return {
          title: "24 Kasım Öğretmenler Gününüz Kutlu Olsun! 📚",
          subtitle: "Değerli öğretmenlerimizi saygıyla anıyoruz",
          icon: <BookOpen className="h-6 w-6" />,
          gradient: "from-purple-600 via-purple-500 to-amber-500",
          textColor: "text-white",
        }
      case "mothers-day":
        return {
          title: "Anneler Gününüz Kutlu Olsun! 💐",
          subtitle: "Tüm annelerimizi sevgiyle kutluyoruz",
          icon: <Heart className="h-6 w-6" />,
          gradient: "from-pink-500 via-pink-400 to-yellow-400",
          textColor: "text-white",
        }
      case "fathers-day":
        return {
          title: "Babalar Gününüz Kutlu Olsun! 👨‍👧‍👦",
          subtitle: "Tüm babalarımızı saygıyla kutluyoruz",
          icon: <Heart className="h-6 w-6" />,
          gradient: "from-gray-800 via-gray-700 to-blue-500",
          textColor: "text-white",
        }
      case "spring":
        return {
          title: "Bahar Geldi! 🌸",
          subtitle: "Doğanın uyanışını kutluyoruz",
          icon: <Leaf className="h-6 w-6" />,
          gradient: "from-emerald-500 via-emerald-400 to-amber-500",
          textColor: "text-white",
        }
      case "summer":
        return {
          title: "Yaz Keyfi! ☀️",
          subtitle: "Güneşli günlerin tadını çıkarın",
          icon: <Sun className="h-6 w-6" />,
          gradient: "from-amber-500 via-amber-400 to-blue-500",
          textColor: "text-white",
        }
      case "autumn":
        return {
          title: "Sonbahar Güzelliği! 🍂",
          subtitle: "Doğanın renk cümbüşü",
          icon: <Leaf className="h-6 w-6" />,
          gradient: "from-amber-600 via-amber-500 to-red-700",
          textColor: "text-white",
        }
      case "winter":
        return {
          title: "Kış Mevsimi! ❄️",
          subtitle: "Sıcak yemeklerle ısının",
          icon: <Snowflake className="h-6 w-6" />,
          gradient: "from-blue-800 via-blue-700 to-gray-300",
          textColor: "text-white",
        }
      default:
        return {
          title: "Özel Gün! 🎉",
          subtitle: "Bu özel günü birlikte kutluyoruz",
          icon: <Calendar className="h-6 w-6" />,
          gradient: "from-purple-600 via-purple-500 to-pink-500",
          textColor: "text-white",
        }
    }
  }

  const config = getThemeConfig(themeCode)

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r ${config.gradient} shadow-lg transform transition-transform duration-500 ${isVisible ? "translate-y-0" : "-translate-y-full"}`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          <div className={`${config.textColor} opacity-90`}>{config.icon}</div>
          <div className="text-center">
            <h2 className={`text-lg font-bold ${config.textColor} mb-1`}>{config.title}</h2>
            <p className={`text-sm ${config.textColor} opacity-90`}>{config.subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
