import type React from "react"
import type { Metadata } from "next"
import { Inter, Poppins } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth/auth-provider"
import clientPromise from "@/lib/mongodb"
import { Toaster } from "@/components/ui/toaster"
import { RamadanOverlay } from "@/components/theme/ramadan-overlay"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "Seç Ye - Kurumsal Yemek Oylama Sistemi",
  description: "Haftalık menü oylama ve yemek planlama sistemi",
  generator: "v0.app",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Load palette from system settings (server component)
  let paletteVars: string[] = []
  let activeTheme: string | undefined
  try {
    const client = await clientPromise
    const db = client.db('cafeteria')
    const settings = await db.collection('system_settings').findOne({ id: 'core' })
    const colors: string[] = settings?.paletteColors || []
    paletteVars = colors.map((c, idx) => `--palette-${idx + 1}: ${c};`)
    activeTheme = settings?.activeTheme
  } catch {}
  return (
    <html lang="tr" className={`${inter.variable} ${poppins.variable} antialiased`}>
      <head>
        {paletteVars.length > 0 && (
          <style>{`:root{${paletteVars.join('')}}`}</style>
        )}
      </head>
      <body className={`font-sans ${activeTheme ? `theme-${activeTheme}`:''}`}>
        {activeTheme && activeTheme !== 'default' && (
          <div className="w-full text-center text-xs md:text-sm py-1 md:py-1.5 tracking-wide font-medium bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white shadow z-50">
            {activeTheme === 'republic-day' && '29 Ekim Cumhuriyet Bayramı Kutlu Olsun'}
            {activeTheme === 'ramadan' && 'Ramazan Ayı Mübarek Olsun'}
            {activeTheme === 'newyear' && 'Mutlu Yıllar'}
            {activeTheme === 'spring' && 'Bahar Hoş Geldi'}
          </div>
        )}
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
  <RamadanOverlay />
      </body>
    </html>
  )
}
