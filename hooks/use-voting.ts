"use client"

import { useState, useEffect } from "react"
import type { Vote, VotingProgress, WeekMenu, Shift } from "@/types/menu"
import { useAuth } from "@/components/auth/auth-provider"
import { getCurrentWeekMenu } from "@/lib/menu-data"
import { computeISOWeek } from '@/lib/utils'
import type { StoredMenuDocument } from '@/types/menu'

export function useVoting() {
  const { user } = useAuth()
  const [currentWeekMenu, setCurrentWeekMenu] = useState<WeekMenu | null>(null)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [votingProgress, setVotingProgress] = useState<VotingProgress | null>(null)
  const [votes, setVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(true)
  const [shifts, setShifts] = useState<Shift[]>([])

  useEffect(() => {
    if (user) {
      loadVotingData()
    }
  }, [user])

  const loadVotingData = async () => {
    try {
      setLoading(true)

      // Load current week menu from backend
      const fallback = getCurrentWeekMenu()
      // Haftayı util ile yeniden hesapla (fallback.weekOfISO hatalıysa düzelt)
      const correctWeek = computeISOWeek()
      if (fallback.weekOfISO !== correctWeek) {
        fallback.weekOfISO = correctWeek as any // basit override
      }
      let resolvedMenu = fallback

  const resMenu = await fetch(`/api/menus?week=${fallback.weekOfISO}`)
      if (resMenu.ok) {
        const data = await resMenu.json()
        const doc: StoredMenuDocument | undefined = data.menus?.[0]
        if (doc) {
          const monday = new Date()
          const days = doc.days.map((d, idx) => ({
            id: `day-${idx}`,
            date: d.date ? new Date(d.date) : new Date(monday.getTime()+idx*86400000),
            traditional: d.traditional ? { id:`t-${idx}`, name:d.traditional.name, description:d.traditional.description, imageUrl:d.traditional.imageUrl, tags:d.traditional.tags||[], pairTags: {} } : { id:'', name:'Menü Yok', tags:[], pairTags:{} },
            alternative: d.alternative ? { id:`a-${idx}`, name:d.alternative.name, description:d.alternative.description, imageUrl:d.alternative.imageUrl, tags:d.alternative.tags||[], pairTags: {} } : { id:'', name:'Menü Yok', tags:[], pairTags:{} },
            categoriesSchemaVersion:1
          }))
          resolvedMenu = { id: doc.weekOfISO, weekOfISO: doc.weekOfISO, days, isPublished: doc.isPublished, createdBy: doc.createdBy, createdAt: new Date(doc.createdAt) }
        }
      }
      setCurrentWeekMenu(resolvedMenu)

      // Shifts backend
      try {
        const shiftsRes = await fetch('/api/shifts')
        if (shiftsRes.ok) {
          const data = await shiftsRes.json()
            const loaded = (data.shifts || []).map((s:any) => ({
              id: s._id?.toString() || s.id,
              code: s.code,
              label: s.label,
              startTime: s.startTime,
              endTime: s.endTime,
              order: s.order ?? 99,
              isActive: s.isActive !== false,
            })) as Shift[]
          setShifts(loaded.filter(s=>s.isActive))
        } else {
          setShifts([])
        }
      } catch {
        setShifts([])
      }

      // Backend'den kullanıcının oyları
  const res = await fetch(`/api/votes?userId=${user?.id}&week=${resolvedMenu.weekOfISO}`)
      if (res.ok) {
        const data = await res.json()
        const loadedVotes: Vote[] = (data.votes || []).map((v: any) => ({
          id: v._id?.toString() || v.id,
          userId: v.userId,
            date: new Date(v.date),
            weekOfISO: v.weekOfISO,
            shiftId: v.shiftId,
            choice: v.choice,
            createdAt: new Date(v.createdAt),
            updatedAt: new Date(v.updatedAt),
        }))
        setVotes(loadedVotes)
        // progress hesapla
        const completedDays = loadedVotes.map(v => new Date(v.date).toISOString().split('T')[0])
        const shiftId = loadedVotes[0]?.shiftId
        if (shiftId) {
          const shift = (shifts || []).find(s => s.id === shiftId) || null
          setSelectedShift(shift)
        } else {
          setSelectedShift(null)
        }
        const progress: VotingProgress = {
          userId: user!.id,
          weekOfISO: resolvedMenu.weekOfISO,
          shiftId: shiftId || '',
          completedDays,
          currentStep: completedDays.length,
          totalSteps: 7,
          lastUpdated: new Date(),
        }
        setVotingProgress(progress)
      }
    } catch (error) {
      console.error("Failed to load voting data:", error)
    } finally {
      setLoading(false)
    }
  }

  const selectShift = (shift: Shift) => {
    if (!user || !currentWeekMenu) return

    setSelectedShift(shift)

  const progress: VotingProgress = {
      userId: user.id,
      weekOfISO: currentWeekMenu.weekOfISO,
      shiftId: shift.id,
      completedDays: votingProgress?.completedDays || [],
      currentStep: votingProgress?.completedDays.length || 0,
      totalSteps: 7,
      lastUpdated: new Date(),
    }
    setVotingProgress(progress)
  }

  const submitVote = (dayIndex: number, choice: "traditional" | "alternative") => {
    if (!user || !currentWeekMenu || !selectedShift || !votingProgress) return

    const dayMenu = currentWeekMenu.days[dayIndex]
    if (!dayMenu) return

    // Backend'e gönder
  fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        date: dayMenu.date,
        weekOfISO: currentWeekMenu.weekOfISO,
        shiftId: selectedShift.id,
        choice,
      })
    }).then(async (r) => {
      if (r.ok) {
        // local state güncelle
        const newVotes = votes.filter(v => v.date.toDateString() !== dayMenu.date.toDateString())
        const now = new Date()
        newVotes.push({
          id: `vote_${user.id}_${dayMenu.date.toISOString().split('T')[0]}`,
          userId: user.id,
          date: dayMenu.date,
          weekOfISO: currentWeekMenu.weekOfISO,
          shiftId: selectedShift.id,
          choice,
          createdAt: now,
          updatedAt: now,
        })
        setVotes(newVotes)
        const dayKey = dayMenu.date.toISOString().split('T')[0]
        const updatedProgress: VotingProgress = {
          userId: user.id,
          weekOfISO: currentWeekMenu.weekOfISO,
          shiftId: selectedShift.id,
          completedDays: [...new Set([...(votingProgress?.completedDays || []).filter(d => d !== dayKey), dayKey])],
          currentStep: Math.min((votingProgress?.currentStep || 0) + 1, 7),
          totalSteps: 7,
          lastUpdated: new Date(),
        }
        setVotingProgress(updatedProgress)
  // İstatistik panelleri dinleyebilsin diye custom event
  try { window.dispatchEvent(new CustomEvent('votes:updated', { detail: { week: currentWeekMenu.weekOfISO } })) } catch {}
      }
    }).catch(e => console.error('Oy gönderilemedi', e))
  }

  const getVoteForDay = (dayIndex: number): Vote | null => {
    if (!currentWeekMenu) return null

    const dayMenu = currentWeekMenu.days[dayIndex]
    if (!dayMenu) return null

    return votes.find((v) => v.date.toDateString() === dayMenu.date.toDateString()) || null
  }

  const getCompletionPercentage = (): number => {
    if (!votingProgress) return 0
    return Math.round((votingProgress.completedDays.length / votingProgress.totalSteps) * 100)
  }

  return {
    currentWeekMenu,
    selectedShift,
    votingProgress,
    votes,
    loading,
  shifts,
    selectShift,
    submitVote,
    getVoteForDay,
    getCompletionPercentage,
  }
}
