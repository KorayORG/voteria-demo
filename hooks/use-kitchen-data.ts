"use client"

import { useState, useEffect } from "react"
import type { WeekStatistics, Suggestion } from "@/types/statistics"
import { generateMockStatistics, generateMockSuggestions } from "@/lib/statistics-data"

export function useKitchenData() {
  const [weekStatistics, setWeekStatistics] = useState<WeekStatistics | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadKitchenData()
  }, [])

  const loadKitchenData = async () => {
    try {
      setLoading(true)

      // Load statistics
      const stats = generateMockStatistics()
      setWeekStatistics(stats)

      // Load suggestions
      const suggestionData = generateMockSuggestions()
      setSuggestions(suggestionData)
    } catch (error) {
      console.error("Failed to load kitchen data:", error)
    } finally {
      setLoading(false)
    }
  }

  const markSuggestionAsRead = (suggestionId: string) => {
    setSuggestions((prev) =>
      prev.map((suggestion) =>
        suggestion.id === suggestionId
          ? {
              ...suggestion,
              isRead: true,
              readAt: new Date(),
            }
          : suggestion,
      ),
    )
  }

  const getUnreadSuggestionsCount = (): number => {
    return suggestions.filter((s) => !s.isRead).length
  }

  return {
    weekStatistics,
    suggestions,
    loading,
    markSuggestionAsRead,
    getUnreadSuggestionsCount,
    refreshData: loadKitchenData,
  }
}
