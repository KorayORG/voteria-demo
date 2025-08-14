"use client"

import { useState, useEffect, useCallback } from "react"
import type { Suggestion, SuggestionFilter } from "@/types/suggestion"
import { useAuth } from "@/components/auth/auth-provider"

export function useSuggestions() {
  const { user } = useAuth()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filter, setFilter] = useState<SuggestionFilter>({})
  const [refreshKey, setRefreshKey] = useState(0)

  const anonymizeName = (name: string) => {
    if (!name || name === "Anonim") return "Anonim"
    const parts = name.trim().split(/\s+/)
    return parts
      .map((p, i) => {
        if (i === 0) return p[0] + "*".repeat(Math.max(p.length - 1, 1))
        return p[0] + "."
      })
      .join(" ")
  }

  const loadSuggestions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter.category) params.append("category", filter.category)
      if (filter.priority) params.append("priority", filter.priority)
      if (filter.status) params.append("status", filter.status)
      if (filter.search) params.append("search", filter.search)
      if (user?.id) params.append("viewerId", user.id)
      const res = await fetch(`/api/suggestions?${params.toString()}`)
      if (!res.ok) {
        setSuggestions([])
        return
      }
      const data = await res.json()
      setSuggestions(
        (data.suggestions || []).map((s: any) => ({
          id: s._id?.toString() || s.id,
          title: s.title,
          description: s.description,
          category: s.category,
          priority: s.priority,
          status: s.status,
          submittedBy: anonymizeName(s.submittedByName || "Anonim"),
          submittedAt: new Date(s.submittedAt),
          assignedTo: s.assignedTo || undefined,
          response: s.response || undefined,
          respondedAt: s.respondedAt ? new Date(s.respondedAt) : undefined,
          respondedBy: s.respondedBy || undefined,
          votes: s.votesCount || 0,
          tags: s.tags || [],
          userHasVoted: s.userHasVoted || false,
        }))
      )
    } catch (e) {
      console.error("Öneriler yüklenemedi", e)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [filter, user?.id])

  useEffect(() => {
    loadSuggestions()
  }, [loadSuggestions, refreshKey])

  const submitSuggestion = async (data: {
    title: string
    description: string
    category: string
    priority: string
    tags: string[]
    status: string
    submittedBy: string
  }) => {
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
            description: data.description,
            category: data.category,
            priority: data.priority,
            submittedByUserId: user?.id,
            submittedByName: user?.fullName || data.submittedBy || "Anonim",
            tags: data.tags,
        }),
      })
      if (res.ok) {
        setRefreshKey((k) => k + 1)
      }
    } catch (e) {
      console.error("Öneri gönderilemedi", e)
    }
  }

  const updateSuggestionStatus = async (
    id: string,
    status: Suggestion["status"],
    response?: string,
    assignedTo?: string
  ) => {
    try {
      const res = await fetch(`/api/suggestions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, response, assignedTo }),
      })
      if (res.ok) setRefreshKey((k) => k + 1)
    } catch (e) {
      console.error("Öneri güncellenemedi", e)
    }
  }

  const voteSuggestion = async (id: string) => {
    if (!user) return
    try {
      const res = await fetch(`/api/suggestions/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })
      if (res.ok) {
        const data = await res.json()
        if (!data.already) {
          // Optimistic update
          setSuggestions((prev) =>
            prev.map((s) =>
              s.id === id
                ? { ...s, votes: s.votes + 1, userHasVoted: true }
                : s
            )
          )
        }
      }
    } catch (e) {
      console.error("Oy kullanılamadı", e)
    }
  }

  return {
    suggestions,
    loading,
    filter,
    setFilter,
    submitSuggestion,
    updateSuggestionStatus,
    voteSuggestion,
    refresh: () => setRefreshKey((k) => k + 1),
  }
}
