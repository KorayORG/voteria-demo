"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, Search, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Tenant {
  _id: string
  slug: string
  name: string
  displayName?: string
  status: "active" | "suspended" | "trial" | "expired"
  subscription?: {
    plan: string
    endDate?: Date
  }
}

interface TenantSelectorProps {
  value?: string
  onValueChange: (tenantSlug: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  showStatus?: boolean
}

export function TenantSelector({
  value,
  onValueChange,
  className,
  placeholder = "Firma seçin...",
  disabled,
  showStatus = true,
}: TenantSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTenants()
  }, [])

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchTenants = async () => {
    try {
      const response = await fetch("/api/tenants")
      if (response.ok) {
        const data = await response.json()
        setTenants(data.tenants || [])
      }
    } catch (error) {
      console.error("Failed to fetch tenants:", error)
    } finally {
      setLoading(false)
    }
  }

  const secYeTenant: Tenant = {
    _id: "secye",
    slug: "secye",
    name: "Seç Ye",
    displayName: "Seç Ye Platform",
    status: "active",
  }

  let filteredTenants = tenants.filter(
    (tenant) =>
      tenant.status === "active" &&
      (tenant.name.toLowerCase().includes(search.toLowerCase()) ||
        tenant.slug.toLowerCase().includes(search.toLowerCase()) ||
        tenant.displayName?.toLowerCase().includes(search.toLowerCase())),
  )

  // Remove 'secye' if it exists in tenants to avoid duplicate
  filteredTenants = filteredTenants.filter((t) => t.slug !== "secye")
  const allTenants = [secYeTenant, ...filteredTenants]
  const selectedTenant = allTenants.find((t) => t.slug === value)

  const handleSelect = (tenantSlug: string) => {
    onValueChange(tenantSlug)
    setIsOpen(false)
    setSearch("")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
      case "trial":
        return <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
      case "suspended":
        return <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
      case "expired":
        return <span className="inline-block w-2 h-2 bg-gray-500 rounded-full"></span>
      default:
        return null
    }
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-left bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200",
          isOpen && "border-orange-500 ring-1 ring-orange-500",
          "hover:border-gray-500",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className={cn("block truncate", !selectedTenant && "text-gray-400")}>
            {selectedTenant ? selectedTenant.displayName || selectedTenant.name : placeholder}
          </span>
          {selectedTenant && showStatus && <div className="flex-shrink-0">{getStatusBadge(selectedTenant.status)}</div>}
        </div>
        <ChevronDown
          className={cn("h-4 w-4 text-gray-400 transition-transform flex-shrink-0", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-xl backdrop-blur-sm">
          <div className="p-2 border-b border-gray-600">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Firma ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none text-sm transition-colors"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-auto">
            {loading ? (
              <div className="px-3 py-2 text-gray-400 text-sm">Yükleniyor...</div>
            ) : allTenants.length === 0 ? (
              <div className="px-3 py-2 text-gray-400 text-sm">
                {search ? "Firma bulunamadı" : "Henüz firma kayıtlı değil"}
              </div>
            ) : (
              allTenants.map((tenant) => (
                <button
                  key={tenant._id}
                  type="button"
                  onClick={() => handleSelect(tenant.slug)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-700 transition-colors",
                    value === tenant.slug && "bg-orange-500/20 text-orange-400",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-white text-sm truncate">{tenant.displayName || tenant.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs truncate">{tenant.slug}</span>
                        {showStatus && getStatusBadge(tenant.status)}
                      </div>
                    </div>
                  </div>
                  {value === tenant.slug && <Check className="h-4 w-4 text-orange-400 flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
