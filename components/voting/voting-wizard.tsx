"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Clock, Calendar, Check } from "lucide-react"
import { useVoting } from "@/hooks/use-voting"
import { getWeekDays, getShortWeekDays } from "@/lib/menu-data"
import { ShiftSelector } from "./shift-selector"
import { DayVoting } from "./day-voting"

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
  } = useVoting()

  const [currentStep, setCurrentStep] = useState(0)
  const weekDays = getWeekDays()
  const shortWeekDays = getShortWeekDays()

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

  // If no shift selected, show shift selector
  if (!selectedShift) {
    return (
      <div className="p-4 sm:p-6">
        <ShiftSelector shifts={shifts} onSelectShift={selectShift} />
      </div>
    )
  }

  const handleDayVote = (choice: "traditional" | "alternative") => {
    submitVote(currentStep, choice)
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
        </p>
      </div>

      <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d glass-effect">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                <span className="text-white font-medium text-sm sm:text-base">İlerleme Durumu</span>
              </div>
              <span className="text-xs sm:text-sm text-gray-300">
                {votingProgress?.completedDays.length || 0}/7 gün
              </span>
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

      <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d glass-effect">
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
          <DayVoting dayMenu={currentDayMenu} currentVote={currentVote} onVote={handleDayVote} />
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

      {completionPercentage === 100 && (
        <Card className="bg-green-900/20 border-green-700 glass-effect">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-3d">
              <Check className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Tebrikler!</h3>
            <p className="text-green-200 text-sm sm:text-base">Bu hafta için tüm oylarınızı tamamladınız.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
