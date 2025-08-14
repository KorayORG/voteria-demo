"use client"

import type { SuggestionFilter } from "@/types/suggestion"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { categoryLabels, priorityLabels, statusLabels } from "@/lib/suggestion-data"

interface SuggestionFiltersProps {
  filter: SuggestionFilter
  onFilterChange: (filter: SuggestionFilter) => void
}

export function SuggestionFilters({ filter, onFilterChange }: SuggestionFiltersProps) {
  const clearFilters = () => {
    onFilterChange({})
  }

  const hasActiveFilters = filter.category || filter.priority || filter.status || filter.search

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 shadow-lg">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Öneri ara..."
            value={filter.search || ""}
            onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
            className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
        </div>

        {/* Category Filter */}
        <Select
          value={filter.category || "all"}
          onValueChange={(value) => onFilterChange({ ...filter, category: (value as any) || undefined })}
        >
          <SelectTrigger className="w-full lg:w-48 bg-gray-700 border-gray-600 text-white">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key} className="text-white hover:bg-gray-700">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select
          value={filter.priority || "all"}
          onValueChange={(value) => onFilterChange({ ...filter, priority: (value as any) || undefined })}
        >
          <SelectTrigger className="w-full lg:w-48 bg-gray-700 border-gray-600 text-white">
            <SelectValue placeholder="Öncelik" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">Tüm Öncelikler</SelectItem>
            {Object.entries(priorityLabels).map(([key, label]) => (
              <SelectItem key={key} value={key} className="text-white hover:bg-gray-700">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filter.status || "all"}
          onValueChange={(value) => onFilterChange({ ...filter, status: (value as any) || undefined })}
        >
          <SelectTrigger className="w-full lg:w-48 bg-gray-700 border-gray-600 text-white">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            {Object.entries(statusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key} className="text-white hover:bg-gray-700">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="text-gray-400 hover:text-white hover:bg-gray-700">
            <X className="h-4 w-4 mr-2" />
            Temizle
          </Button>
        )}
      </div>
    </div>
  )
}
