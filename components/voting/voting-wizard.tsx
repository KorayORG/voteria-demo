"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChevronLeft, ChevronRight, Clock, Calendar, Check, AlertTriangle, Lock } from "lucide-react"
import { useVoting } from "@/hooks/use-voting"
import { getWeekDays, getShortWeekDays } from "@/lib/menu-data"
import { ShiftSelector } from "./shift-selector"
import { DayVoting } from "./day-voting"
import { useToast } from "@/hooks/use-toast"

export function VotingWizard() {
  const {
    currentWeekMenu,
    selectedShift,
    votingProgress,
    loading,
    shifts,
    selectShift,
    submitVote,
    getVoteForDay,
    getCompletionPercentage,
    isVotingLocked,
    lockVotes,
  } = useVoting()

  const [currentStep, setCurrentStep] = useState(0)
  const [showLockConfirm, setShowLockConfirm] = useState(false)
  const { toast } = useToast()

  const weekDays = getWeekDays()
  const shortWeekDays = getShortWeekDays()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === "INPUT") return

      if (e.key === "ArrowUp" && currentStep > 0) {
        e.preventDefault()
        setCurrentStep(currentStep - 1)
      } else if (e.key === "ArrowDown" && currentStep < 6) {
        e.preventDefault()
        setCurrentStep(currentStep + 1)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentStep])

  useEffect(() => {
    if (votingProgress && currentWeekMenu) {
      const draftKey = `voting_draft_${currentWeekMenu.weekOfISO}_${votingProgress.shiftId}`
      const draft = {
        currentStep,
        lastUpdated: new Date().toISOString(),
      }
      localStorage.setItem(draftKey, JSON.stringify(draft))
    }
  }, [currentStep, votingProgress, currentWeekMenu])

  // Load draft on mount
  useEffect(() => {
    if (votingProgress && currentWeekMenu) {
      const draftKey = `voting_draft_${currentWeekMenu.weekOfISO}_${votingProgress.shiftId}`
      const savedDraft = localStorage.getItem(draftKey)
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft)
          setCurrentStep(draft.currentStep || 0)
        } catch (error) {
          console.error("Failed to load draft:", error)
        }
      }
    }
  }, [votingProgress, currentWeekMenu])

  if (loading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-white text-lg">Yükleniyor...</div>
      </div>
    )
  }

  if (!currentWeekMenu) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="bg-gray-800/50 border-gray-700 glass-effect">
          <CardContent className="p-4 sm:p-6 text-center">
            <p className="text-gray-300">Bu hafta için menü bulunamadı.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!shifts || shifts.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="bg-gray-800/60 border-gray-700">
          <CardContent className="p-6 text-center space-y-3">
            <h2 className="text-xl font-semibold text-white">Vardiya Bulunamadı</h2>
            <p className="text-gray-300 text-sm max-w-md mx-auto">
              Şu anda sistemde tanımlı aktif vardiya yok. Lütfen yetkili / yönetici ile iletişime geçiniz.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!selectedShift) {
    return (
      <div className="p-4 sm:p-6">
        <ShiftSelector shifts={shifts} onSelectShift={selectShift} />
      </div>
    )
  }

  const handleDayVote = (choice: "traditional" | "alternative") => {
    if (isVotingLocked) {
      toast({
        title: "Oylar Kilitli",
        description: "Oylarınız kilitlenmiş durumda, değişiklik yapamazsınız.",
        variant: "destructive",
      })
      return
    }
    submitVote(currentStep, choice)
  }

  const handleLockVotes = async () => {
    const success = await lockVotes()
    if (success) {
      toast({
        title: "Oylar Kilitlendi",
        description: "Oylarınız başarıyla kilitlendi. Artık değişiklik yapamazsınız.",
      })
      setShowLockConfirm(false)
    } else {
      toast({
        title: "Hata",
        description: "Oylar kilitlenirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleNextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleDayClick = (dayIndex: number) => {
    setCurrentStep(dayIndex)
  }

  const currentDayMenu = currentWeekMenu.days[currentStep]
  const currentVote = getVoteForDay(currentStep)
  const completionPercentage = getCompletionPercentage()

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="text-center">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 text-glow">Haftalık Menü Oylaması</h1>
        <p className="text-gray-300 text-sm sm:text-base">
          Seçilen vardiya: <span className="text-orange-500 font-semibold">{selectedShift.label}</span>
          {isVotingLocked && (
            <span className="ml-2 inline-flex items-center gap-1 text-amber-400">
              <Lock className="h-4 w-4" />
              Kilitli
            </span>
          )}
        </p>
      </div>

      {isVotingLocked && (
        <Alert className="bg-amber-900/20 border-amber-700">
          <Lock className="h-4 w-4" />
          <AlertDescription className="text-amber-200">
            Oylarınız kilitlenmiş durumda. Artık değişiklik yapamazsınız.
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                <span className="text-white font-medium text-sm sm:text-base">İlerleme Durumu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-300">
                  {votingProgress?.completedDays.length || 0}/7 gün
                </span>
                {completionPercentage === 100 && !isVotingLocked && (
                  <Button size="sm" variant="outline" onClick={() => setShowLockConfirm(true)} className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Kilitle
                  </Button>
                )}
              </div>
            </div>

            <Progress value={completionPercentage} className="h-2" />

            <div className="flex justify-center gap-1.5 sm:gap-2 mt-4 overflow-x-auto pb-2">
              <div className="flex gap-1.5 sm:gap-2 min-w-max px-2">
                {shortWeekDays.map((day, index) => {
                  const vote = getVoteForDay(index)
                  const isCompleted = !!vote
                  const isCurrent = index === currentStep

                  return (
                    <button
                      key={index}
                      onClick={() => handleDayClick(index)}
                      className={`
                        w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 transform hover:scale-105 button-3d flex-shrink-0
                        ${
                          isCurrent
                            ? "bg-orange-500 text-white shadow-lg pulse-glow"
                            : isCompleted
                              ? "bg-green-600 text-white shadow-3d"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600 glass-effect-light"
                        }
                      `}
                    >
                      {isCompleted && !isCurrent ? <Check className="h-3 w-3 sm:h-4 sm:w-4 mx-auto" /> : day}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="text-center px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl lg:text-2xl text-white">
            {weekDays[currentStep]} - {currentDayMenu.date.toLocaleDateString("tr-TR")}
          </CardTitle>
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">
              {selectedShift.startTime} - {selectedShift.endTime}
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <DayVoting
            dayMenu={currentDayMenu}
            currentVote={currentVote}
            onVote={handleDayVote}
            disabled={isVotingLocked}
          />
        </CardContent>
      </Card>

      <div className="flex justify-between gap-3">
        <Button
          variant="outline"
          onClick={handlePrevStep}
          disabled={currentStep === 0}
          className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent button-3d flex-1 sm:flex-none text-sm sm:text-base py-2.5 sm:py-3"
        >
          <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Önceki Gün</span>
          <span className="sm:hidden">Önceki</span>
        </Button>

        <Button
          onClick={handleNextStep}
          disabled={currentStep === 6}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 button-3d flex-1 sm:flex-none text-sm sm:text-base py-2.5 sm:py-3"
        >
          <span className="hidden sm:inline">Sonraki Gün</span>
          <span className="sm:hidden">Sonraki</span>
          <ChevronRight className="h-4 w-4 ml-1 sm:ml-2" />
        </Button>
      </div>

      {completionPercentage === 100 && !isVotingLocked && (
        <Card className="bg-green-900/20 border-green-700 glass-effect">
          <CardContent className="p-4 sm:p-6 text-center space-y-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto shadow-3d">
              <Check className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Tebrikler!</h3>
              <p className="text-green-200 text-sm sm:text-base mb-4">Bu hafta için tüm oylarınızı tamamladınız.</p>
              <Button onClick={() => setShowLockConfirm(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
                <Lock className="h-4 w-4 mr-2" />
                Oyları Kilitle
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lock Confirmation Dialog */}
      {showLockConfirm && (
        <Card className="bg-amber-900/20 border-amber-700 glass-effect">
          <CardContent className="p-4 sm:p-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Oyları Kilitle</h3>
              <p className="text-amber-200 text-sm mb-4">
                Oylarınızı kilitledikten sonra değişiklik yapamazsınız. Emin misiniz?
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setShowLockConfirm(false)}>
                  İptal
                </Button>
                <Button onClick={handleLockVotes} className="bg-amber-600 hover:bg-amber-700">
                  <Lock className="h-4 w-4 mr-2" />
                  Evet, Kilitle
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
