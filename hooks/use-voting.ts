"use client"

import { useState, useEffect } from "react"
import type { Vote, VotingProgress, WeekMenu, Shift } from "@/types/menu"
import { useAuth } from "@/components/auth/auth-provider"
import { getCurrentWeekMenu, defaultShifts } from "@/lib/menu-data"

export function useVoting() {
  const { user } = useAuth()
  const [currentWeekMenu, setCurrentWeekMenu] = useState<WeekMenu | null>(null)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [votingProgress, setVotingProgress] = useState<VotingProgress | null>(null)
  const [votes, setVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadVotingData()
    }
  }, [user])

  const loadVotingData = async () => {
    try {
      setLoading(true)

      // Load current week menu
      const weekMenu = getCurrentWeekMenu()
      setCurrentWeekMenu(weekMenu)

      // Load user's voting progress from localStorage
      const progressKey = `voting_progress_${user?.id}_${weekMenu.weekOfISO}`
      const savedProgress = localStorage.getItem(progressKey)

      if (savedProgress) {
        const progress: VotingProgress = JSON.parse(savedProgress)
        setVotingProgress(progress)

        // Find the selected shift
        const shift = defaultShifts.find((s) => s.id === progress.shiftId)
        setSelectedShift(shift || null)
      }

      // Load user's votes from localStorage
      const votesKey = `votes_${user?.id}_${weekMenu.weekOfISO}`
      const savedVotes = localStorage.getItem(votesKey)

      if (savedVotes) {
        setVotes(JSON.parse(savedVotes))
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
      completedDays: [],
      currentStep: 0,
      totalSteps: 7,
      lastUpdated: new Date(),
    }

    setVotingProgress(progress)

    // Save to localStorage
    const progressKey = `voting_progress_${user.id}_${currentWeekMenu.weekOfISO}`
    localStorage.setItem(progressKey, JSON.stringify(progress))
  }

  const submitVote = (dayIndex: number, choice: "traditional" | "alternative") => {
    if (!user || !currentWeekMenu || !selectedShift || !votingProgress) return

    const dayMenu = currentWeekMenu.days[dayIndex]
    if (!dayMenu) return

    const vote: Vote = {
      id: `vote_${user.id}_${dayMenu.date.toISOString().split("T")[0]}`,
      userId: user.id,
      date: dayMenu.date,
      weekOfISO: currentWeekMenu.weekOfISO,
      shiftId: selectedShift.id,
      choice,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Update votes
    const newVotes = votes.filter((v) => v.date.toDateString() !== dayMenu.date.toDateString())
    newVotes.push(vote)
    setVotes(newVotes)

    // Update progress
    const dayKey = dayMenu.date.toISOString().split("T")[0]
    const updatedProgress = {
      ...votingProgress,
      completedDays: [...votingProgress.completedDays.filter((d) => d !== dayKey), dayKey],
      currentStep: Math.min(votingProgress.currentStep + 1, 7),
      lastUpdated: new Date(),
    }
    setVotingProgress(updatedProgress)

    // Save to localStorage
    const votesKey = `votes_${user.id}_${currentWeekMenu.weekOfISO}`
    const progressKey = `voting_progress_${user.id}_${currentWeekMenu.weekOfISO}`

    localStorage.setItem(votesKey, JSON.stringify(newVotes))
    localStorage.setItem(progressKey, JSON.stringify(updatedProgress))
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
    shifts: defaultShifts,
    selectShift,
    submitVote,
    getVoteForDay,
    getCompletionPercentage,
  }
}
