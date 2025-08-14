"use client"

import type { Suggestion } from "@/types/suggestion"
import { SuggestionCard } from "./suggestion-card"
import { Loader2 } from "lucide-react"

interface SuggestionListProps {
  suggestions: Suggestion[]
  loading: boolean
  onVote: (id: string) => void
}

export function SuggestionList({ suggestions, loading, onVote }: SuggestionListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">Henüz öneri bulunmuyor</div>
        <div className="text-gray-500 text-sm">İlk öneriyi siz gönderin!</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion) => (
        <SuggestionCard key={suggestion.id} suggestion={suggestion} onVote={onVote} />
      ))}
    </div>
  )
}
