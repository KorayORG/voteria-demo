"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SuggestionList } from "@/components/suggestions/suggestion-list"
import { SuggestionForm } from "@/components/suggestions/suggestion-form"
import { SuggestionFilters } from "@/components/suggestions/suggestion-filters"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useSuggestions } from "@/hooks/use-suggestions"

export default function SuggestionsPage() {
  const [showForm, setShowForm] = useState(false)
  const { suggestions, loading, filter, setFilter, submitSuggestion, voteSuggestion } = useSuggestions()

  const handleSubmit = async (data: any) => {
    await submitSuggestion(data)
    setShowForm(false)
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">İstek & Öneri</h1>
            <p className="text-gray-400">Kafeterya hizmetlerini geliştirmek için önerilerinizi paylaşın</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Öneri
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 shadow-lg">
            <div className="text-2xl font-bold text-white">{suggestions.length}</div>
            <div className="text-sm text-gray-400">Toplam Öneri</div>
          </div>
          <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-xl p-4 border border-blue-700/50 shadow-lg">
            <div className="text-2xl font-bold text-blue-400">
              {suggestions.filter((s) => s.status === "under-review").length}
            </div>
            <div className="text-sm text-blue-300">İnceleniyor</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/50 rounded-xl p-4 border border-yellow-700/50 shadow-lg">
            <div className="text-2xl font-bold text-yellow-400">
              {suggestions.filter((s) => s.status === "in-progress").length}
            </div>
            <div className="text-sm text-yellow-300">Devam Ediyor</div>
          </div>
          <div className="bg-gradient-to-br from-green-900/50 to-green-800/50 rounded-xl p-4 border border-green-700/50 shadow-lg">
            <div className="text-2xl font-bold text-green-400">
              {suggestions.filter((s) => s.status === "completed").length}
            </div>
            <div className="text-sm text-green-300">Tamamlandı</div>
          </div>
        </div>

        {/* Filters */}
        <SuggestionFilters filter={filter} onFilterChange={setFilter} />

        {/* Suggestions List */}
        <SuggestionList suggestions={suggestions} loading={loading} onVote={voteSuggestion} />

        {/* Suggestion Form Modal */}
        {showForm && <SuggestionForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />}
      </div>
    </DashboardLayout>
  )
}
