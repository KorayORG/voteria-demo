"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useSuggestions } from "@/hooks/use-suggestions"
import { SuggestionAdminPanel } from "@/components/admin/suggestion-admin-panel"

export default function AdminSuggestionsManagePage() {
  const { suggestions, loading, refresh } = useSuggestions()

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Öneri Yönetimi</h1>
          <p className="text-gray-400 text-sm">Durum güncelle, yanıt ekle ve süreçleri takip et</p>
        </div>
        {loading && <div className="text-gray-400">Yükleniyor...</div>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {suggestions.map(s => (
            <SuggestionAdminPanel key={s.id} suggestion={s} onUpdated={refresh} />
          ))}
        </div>
        {!loading && suggestions.length === 0 && <div className="text-gray-500 text-sm">Öneri bulunamadı</div>}
      </div>
    </DashboardLayout>
  )
}
