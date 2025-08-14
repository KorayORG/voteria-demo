"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Utensils, User, LogOut, Menu, X } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const navigationItems = [
    { label: "Ana Sayfa", href: "/dashboard" },
    { label: "Oylama", href: "/voting" },
    { label: "İstek/Öneri", href: "/suggestions" },
    ...(user?.role === "kitchen" || user?.role === "admin" ? [{ label: "Mutfak", href: "/kitchen" }] : []),
    ...(user?.role === "admin" ? [{ label: "Admin", href: "/admin" }] : []),
  ]

  const disableMotion = pathname.startsWith('/admin')
  return (
    <div className={`min-h-screen layered-bg ${disableMotion ? 'admin-static' : ''}`}>
  <header className={`sticky top-0 z-50 ${disableMotion ? 'bg-gray-900/80 border-b border-gray-800' : 'nav-3d'}`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className={`flex items-center gap-3 ${disableMotion ? '' : 'floating-element'}`}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <Utensils className={`h-6 w-6 text-orange-500 ${disableMotion ? '' : 'text-glow'}`} />
                    <Utensils className={`h-6 w-6 text-orange-500 rotate-45 ${disableMotion ? '' : 'text-glow'}`} />
                  </div>
                  <h1 className={`text-xl font-bold text-white ${disableMotion ? '' : 'text-glow'}`}>Seç Ye</h1>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navigationItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`text-sm font-medium px-3 py-2 rounded-lg ${disableMotion ? 'bg-gray-800/40 hover:bg-gray-700/60' : 'transition-all duration-300 button-3d'} ${
                    pathname === item.href
                      ? "text-orange-500 bg-orange-500/10 border-glow"
                      : "text-gray-300 hover:text-white glass-effect-light"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className={`hidden md:flex items-center gap-3 rounded-lg p-2 ${disableMotion ? 'bg-gray-800/60 border border-gray-700' : 'glass-effect-light'}`}>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{user?.fullName}</div>
                  <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
                </div>
                <Avatar className="h-8 w-8 ring-2 ring-orange-500/30 shadow-3d">
                  <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className={`text-gray-300 hover:text-white hover:bg-gray-700/50 ${disableMotion ? '' : 'button-3d glass-effect-light'}`}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline ml-2">Çıkış</span>
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className={`md:hidden text-gray-300 hover:text-white ${disableMotion ? '' : 'button-3d'}`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-gray-700/50 glass-effect rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4 glass-effect-light rounded-lg p-3">
                <Avatar className="h-10 w-10 ring-2 ring-orange-500/30 shadow-3d">
                  <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium text-white">{user?.fullName}</div>
                  <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
                </div>
              </div>
              <nav className="space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 card-hover-lift ${
                      pathname === item.href
                        ? "text-orange-500 bg-orange-500/10 border-glow"
                        : "text-gray-300 hover:text-white glass-effect-light"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 perspective-container">{children}</main>
    </div>
  )
}
