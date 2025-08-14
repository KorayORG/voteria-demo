"use client"

import { useState, useEffect } from "react"
import { computeISOWeek } from '@/lib/utils'
import type { WeekStatistics, Suggestion } from "@/types/statistics"
// import { generateMockStatistics } from "@/lib/statistics-data" // mock kaldırıldı
import { useAuth } from "@/components/auth/auth-provider"

export function useKitchenData() {
  const [weekStatistics, setWeekStatistics] = useState<WeekStatistics | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    loadKitchenData()
    const handler = (e: any) => {
      // Aynı haftaysa yenile
      loadKitchenData()
    }
    window.addEventListener('votes:updated', handler)
    return () => window.removeEventListener('votes:updated', handler)
  }, [])

  const loadKitchenData = async () => {
    try {
      setLoading(true)

      // Real statistics from backend
  const currentWeekIso = computeISOWeek()
      const statsRes = await fetch(`/api/statistics/weekly?week=${currentWeekIso}`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        // Tarihleri Date nesnesine çevir
        setWeekStatistics({
          weekOfISO: statsData.weekOfISO,
          days: (statsData.days || []).map((d: any) => ({
            date: new Date(d.date),
            dayName: d.dayName,
            traditional: d.traditional,
            alternative: d.alternative,
            totalVotes: d.totalVotes,
            externalAdjustment: d.externalAdjustment || { traditional: 0, alternative: 0 },
            finalCount: d.finalCount || { traditional: d.traditional.votes, alternative: d.alternative.votes },
          })),
          totalVotes: statsData.totalVotes || 0,
          averageParticipation: statsData.averageParticipation || 0,
        })
      } else {
        setWeekStatistics(null)
      }

      // Load real suggestions from backend
      const res = await fetch('/api/suggestions', { headers: { 'x-user-role': 'kitchen' } })
      if (res.ok) {
        const data = await res.json()
        const list = (data.suggestions || []).map((s: any) => ({
          id: s._id?.toString() || s.id,
          userId: s.submittedByUserId || 'unknown',
          text: s.description || s.title,
          maskedIdentity: anonymizeName(s.submittedByName || 'Anonim'),
          isRead: !!s.isRead,
          createdAt: new Date(s.submittedAt),
          readAt: s.readAt ? new Date(s.readAt) : undefined,
        })) as Suggestion[]
        setSuggestions(list)
      } else {
        setSuggestions([])
      }
    } catch (error) {
      console.error("Failed to load kitchen data:", error)
    } finally {
      setLoading(false)
    }
  }

  const markSuggestionAsRead = async (suggestionId: string) => {
    // Optimistic update
    const optimisticDate = new Date()
    setSuggestions(prev => prev.map(s => s.id === suggestionId ? { ...s, isRead: true, readAt: optimisticDate } : s))
    try {
      const res = await fetch(`/api/suggestions/${suggestionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'kitchen' },
        body: JSON.stringify({ markRead: true }),
      })
      if (!res.ok) throw new Error('Failed')
    } catch (e) {
      console.error('Okundu işaretlenemedi', e)
      // Rollback
      setSuggestions(prev => prev.map(s => s.id === suggestionId ? { ...s, isRead: false, readAt: undefined } : s))
    }
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

function anonymizeName(name: string) {
  if (!name || name === 'Anonim') return 'Anonim'
  const parts = name.trim().split(/\s+/)
  return parts.map((p, i) => (i === 0 ? p[0] + '*'.repeat(Math.max(p.length - 1, 1)) : p[0] + '.')).join(' ')
}

// computeISOWeek util kullanılıyor
