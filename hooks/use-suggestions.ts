"use client"

import { useState, useEffect } from "react"
import type { Suggestion, SuggestionFilter } from "@/types/suggestion"
import { mockSuggestions } from "@/lib/suggestion-data"

export function useSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<SuggestionFilter>({})

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSuggestions(mockSuggestions)
      setLoading(false)
    }, 500)
  }, [])

  const filteredSuggestions = suggestions.filter((suggestion) => {
    if (filter.category && suggestion.category !== filter.category) return false
    if (filter.priority && suggestion.priority !== filter.priority) return false
    if (filter.status && suggestion.status !== filter.status) return false
    if (filter.search) {
      const searchLower = filter.search.toLowerCase()
      return (
        suggestion.title.toLowerCase().includes(searchLower) ||
        suggestion.description.toLowerCase().includes(searchLower) ||
        suggestion.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      )
    }
    return true
  })

  const submitSuggestion = async (suggestionData: Omit<Suggestion, "id" | "submittedAt" | "votes">) => {
    const newSuggestion: Suggestion = {
      ...suggestionData,
      id: Date.now().toString(),
      submittedAt: new Date(),
      votes: 0,
    }

    setSuggestions((prev) => [newSuggestion, ...prev])
    return newSuggestion
  }

  const updateSuggestionStatus = async (id: string, status: Suggestion["status"], response?: string) => {
    setSuggestions((prev) =>
      prev.map((suggestion) =>
        suggestion.id === id
          ? {
              ...suggestion,
              status,
              response,
              respondedAt: response ? new Date() : undefined,
              respondedBy: response ? "Admin" : undefined,
            }
          : suggestion,
      ),
    )
  }

  const voteSuggestion = async (id: string) => {
    setSuggestions((prev) =>
      prev.map((suggestion) => (suggestion.id === id ? { ...suggestion, votes: suggestion.votes + 1 } : suggestion)),
    )
  }

  return {
    suggestions: filteredSuggestions,
    loading,
    filter,
    setFilter,
    submitSuggestion,
    updateSuggestionStatus,
    voteSuggestion,
  }
}
