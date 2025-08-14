"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChevronRight, MoreHorizontal, Clock, Calendar, Vote, MessageSquare } from "lucide-react"
import { useVoting } from "@/hooks/use-voting"
import { getShortWeekDays } from "@/lib/menu-data"
import Link from "next/link"

export function MemberDashboard() {
  const { currentWeekMenu, selectedShift, getCompletionPercentage, loading } = useVoting()

  const shortWeekDays = getShortWeekDays()
  const completionPercentage = getCompletionPercentage()

  if (loading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-white text-lg">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="text-center py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-glow">Hoş Geldiniz!</h1>
        <p className="text-gray-300 text-sm sm:text-base px-4">Bu hafta için menü tercihlerinizi yapabilirsiniz</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Weekly Menu - Full width on mobile */}
        <div className="xl:col-span-1 order-2 xl:order-1">
          <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d glass-effect">
            <CardHeader className="flex flex-row items-center justify-between pb-3 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg text-white">Haftalık Menü</CardTitle>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 px-4 sm:px-6">
              {currentWeekMenu?.days.map((dayMenu, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-2 sm:px-3 rounded-lg hover:bg-gray-700/50 transition-all duration-200 card-hover-lift"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <span className="text-xs sm:text-sm text-gray-400 w-6 sm:w-8 font-medium flex-shrink-0">
                      {shortWeekDays[index]}
                    </span>
                    <span className="text-xs sm:text-sm text-white truncate">{dayMenu.traditional.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 flex-shrink-0">
                    {dayMenu.traditional.tags.slice(0, 1).map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-orange-500/20 text-orange-300 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )) || (
                <div className="text-center py-6 sm:py-4">
                  <p className="text-gray-400 text-sm">Menü yükleniyor...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6 order-1 xl:order-2">
          <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d glass-effect">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg text-white">Oylama Durumu</CardTitle>
              <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 self-end sm:self-auto" />
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-4">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <Clock className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <div className="flex-1 min-w-0">
                    {selectedShift ? (
                      <div>
                        <p className="text-white font-medium text-sm sm:text-base">
                          Seçilen vardiya: {selectedShift.label}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-400">
                          {selectedShift.startTime} - {selectedShift.endTime}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-white font-medium text-sm sm:text-base">Vardiya seçimi yapılmadı</p>
                        <p className="text-xs sm:text-sm text-gray-400">Oylama yapmak için vardiya seçin</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-300">Tamamlanan günler</span>
                    <span className="text-gray-300">{Math.round((completionPercentage / 100) * 7)}/7</span>
                  </div>
                  <Progress value={completionPercentage} className="h-2 sm:h-2" />
                </div>

                <Link href="/voting" className="block">
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg button-3d text-sm sm:text-base py-2.5 sm:py-3">
                    <Vote className="h-4 w-4 mr-2" />
                    {selectedShift ? "Oylama Devam Et" : "Oylama Yap"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Link href="/voting" className="block">
              <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d glass-effect hover:bg-gray-700/50 transition-all duration-300 card-hover-lift cursor-pointer">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-3d">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">Haftalık Menü</h3>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                    Bu haftanın menüsünü görüntüle ve oy ver
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/suggestions" className="block">
              <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d glass-effect hover:bg-gray-700/50 transition-all duration-300 card-hover-lift cursor-pointer">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-3d">
                    <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">İstek/Öneri</h3>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">Görüş ve önerilerinizi paylaşın</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
