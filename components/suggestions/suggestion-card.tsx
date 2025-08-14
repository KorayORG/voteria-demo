"use client"

import type { Suggestion } from "@/types/suggestion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, Calendar, User, MessageSquare } from "lucide-react"
import { categoryLabels, priorityLabels, statusLabels, priorityColors, statusColors } from "@/lib/suggestion-data"
import { useState, useEffect } from "react"

interface SuggestionCardProps {
  suggestion: Suggestion
  onVote: (id: string) => void
}

export function SuggestionCard({ suggestion, onVote }: SuggestionCardProps) {
  const [hasVoted, setHasVoted] = useState<boolean>(suggestion.userHasVoted || false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setHasVoted(suggestion.userHasVoted || false)
  }, [suggestion.userHasVoted])

  const handleVote = () => {
    if (!hasVoted) {
      onVote(suggestion.id)
      setHasVoted(true)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">{suggestion.title}</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className={`${priorityColors[suggestion.priority]} border`}>
                {priorityLabels[suggestion.priority]}
              </Badge>
              <Badge className={`${statusColors[suggestion.status]} border`}>{statusLabels[suggestion.status]}</Badge>
              <Badge variant="outline" className="text-gray-400 border-gray-600">
                {categoryLabels[suggestion.category]}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleVote}
            disabled={hasVoted}
            className={`flex items-center gap-2 ${
              hasVoted
                ? "text-orange-500 bg-orange-500/10"
                : "text-gray-400 hover:text-orange-500 hover:bg-orange-500/10"
            }`}
          >
            <ThumbsUp className="h-4 w-4" />
            {suggestion.votes}
          </Button>
        </div>

        {/* Description */}
        <p className={`text-gray-300 mb-4 ${expanded ? "" : "line-clamp-2"}`}>{suggestion.description}</p>

        {suggestion.description.length > 150 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-orange-500 hover:text-orange-400 p-0 h-auto"
          >
            {expanded ? "Daha az göster" : "Devamını oku"}
          </Button>
        )}

        {/* Tags */}
        {suggestion.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {suggestion.tags.map((tag) => (
              <span key={tag} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Response */}
        {suggestion.response && (
          <div className="bg-gray-700/50 rounded-lg p-4 mb-4 border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-400">Yanıt</span>
            </div>
            <p className="text-gray-300 text-sm">{suggestion.response}</p>
            {suggestion.respondedAt && (
              <div className="text-xs text-gray-500 mt-2">
                {suggestion.respondedBy} • {suggestion.respondedAt.toLocaleDateString("tr-TR")}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {suggestion.submittedBy}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {suggestion.submittedAt.toLocaleDateString("tr-TR")}
            </div>
          </div>
          {suggestion.assignedTo && <div className="text-orange-400">Atanan: {suggestion.assignedTo}</div>}
        </div>
      </div>
    </Card>
  )
}
