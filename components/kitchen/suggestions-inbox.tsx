"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Clock, Check, Eye, Filter } from "lucide-react"
import type { Suggestion } from "@/types/statistics"
import { useKitchenData } from "@/hooks/use-kitchen-data"

interface SuggestionsInboxProps {
  suggestions: Suggestion[]
  onMarkRead?: (id: string) => void | Promise<void>
}

export function SuggestionsInbox({ suggestions, onMarkRead }: SuggestionsInboxProps) {
  const { markSuggestionAsRead } = useKitchenData()
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null)
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")

  const filteredSuggestions = suggestions.filter((suggestion) => {
    if (filter === "unread") return !suggestion.isRead
    if (filter === "read") return suggestion.isRead
    return true
  })

  const unreadCount = suggestions.filter((s) => !s.isRead).length

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion)
    if (!suggestion.isRead) {
      if (onMarkRead) onMarkRead(suggestion.id)
      else markSuggestionAsRead(suggestion.id)
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes} dakika önce`
    } else if (diffInHours < 24) {
      return `${diffInHours} saat önce`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} gün önce`
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-orange-500" />
              İstek ve Öneriler
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-500/20 text-orange-300">{suggestions.length} toplam</Badge>
              {unreadCount > 0 && <Badge className="bg-red-500 text-white">{unreadCount} okunmadı</Badge>}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Suggestions List */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Gelen Kutusu</h3>
                <div className="flex items-center gap-1">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-700">
                  <TabsTrigger value="all" className="text-xs">
                    Tümü
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="text-xs">
                    Okunmadı
                  </TabsTrigger>
                  <TabsTrigger value="read" className="text-xs">
                    Okundu
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {filteredSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`p-3 cursor-pointer transition-colors border-l-4 ${
                      selectedSuggestion?.id === suggestion.id
                        ? "bg-orange-500/10 border-l-orange-500"
                        : suggestion.isRead
                          ? "hover:bg-gray-700/50 border-l-transparent"
                          : "bg-blue-500/5 hover:bg-blue-500/10 border-l-blue-500"
                    }`}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white truncate">{suggestion.maskedIdentity}</span>
                          {!suggestion.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>}
                        </div>
                        <p className="text-xs text-gray-300 line-clamp-2">{suggestion.text}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-500">{formatTimeAgo(suggestion.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredSuggestions.length === 0 && (
                  <div className="p-6 text-center">
                    <MessageSquare className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">
                      {filter === "unread" ? "Okunmamış öneri yok" : "Öneri bulunamadı"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suggestion Detail */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
            {selectedSuggestion ? (
              <>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{selectedSuggestion.maskedIdentity}</h3>
                      <p className="text-sm text-gray-400">{formatTimeAgo(selectedSuggestion.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedSuggestion.isRead ? (
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                          <Check className="h-3 w-3 mr-1" />
                          Okundu
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Yeni</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-200 leading-relaxed">{selectedSuggestion.text}</p>
                  </div>

                  {selectedSuggestion.readAt && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Okunma tarihi: {selectedSuggestion.readAt.toLocaleString("tr-TR")}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-gray-700">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => (onMarkRead ? onMarkRead(selectedSuggestion.id) : markSuggestionAsRead(selectedSuggestion.id))}
                      disabled={selectedSuggestion.isRead}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {selectedSuggestion.isRead ? "Okundu" : "Görüldü Olarak İşaretle"}
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Öneri Seçin</h3>
                <p className="text-gray-400">Detaylarını görmek için sol taraftan bir öneri seçin</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
