"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Utensils } from "lucide-react"
import type { DayMenu, Vote } from "@/types/menu"

interface DayVotingProps {
  dayMenu: DayMenu
  currentVote: Vote | null
  onVote: (choice: "traditional" | "alternative") => void
}

export function DayVoting({ dayMenu, currentVote, onVote }: DayVotingProps) {
  const { traditional, alternative } = dayMenu

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Traditional Option */}
      <Card
        className={`
          border-2 transition-all duration-200 cursor-pointer card-3d shadow-3d
          ${
            currentVote?.choice === "traditional"
              ? "border-orange-500 bg-orange-500/10"
              : "border-gray-600 bg-gray-800/50 hover:border-orange-400"
          }
        `}
        onClick={() => onVote("traditional")}
      >
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-white">Geleneksel</CardTitle>
            {currentVote?.choice === "traditional" && (
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <Check className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {traditional.tags.map((tag) => (
              <Badge key={tag} className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden">
            <img
              src={traditional.imageUrl || "/placeholder.svg"}
              alt={traditional.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">{traditional.name}</h3>
            {traditional.description && <p className="text-sm text-gray-300">{traditional.description}</p>}
          </div>

          <Button
            className={`
              w-full transition-all duration-200 transform hover:scale-105
              ${
                currentVote?.choice === "traditional"
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              }
            `}
            onClick={(e) => {
              e.stopPropagation()
              onVote("traditional")
            }}
          >
            <Utensils className="h-4 w-4 mr-2" />
            {currentVote?.choice === "traditional" ? "Seçildi" : "Geleneksel Seç"}
          </Button>
        </CardContent>
      </Card>

      {/* Alternative Option */}
      <Card
        className={`
          border-2 transition-all duration-200 cursor-pointer card-3d shadow-3d
          ${
            currentVote?.choice === "alternative"
              ? "border-green-500 bg-green-500/10"
              : "border-gray-600 bg-gray-800/50 hover:border-green-400"
          }
        `}
        onClick={() => onVote("alternative")}
      >
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-white">Alternatif</CardTitle>
            {currentVote?.choice === "alternative" && (
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {alternative.tags.map((tag) => (
              <Badge key={tag} className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden">
            <img
              src={alternative.imageUrl || "/placeholder.svg"}
              alt={alternative.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">{alternative.name}</h3>
            {alternative.description && <p className="text-sm text-gray-300">{alternative.description}</p>}
          </div>

          <Button
            className={`
              w-full transition-all duration-200 transform hover:scale-105
              ${
                currentVote?.choice === "alternative"
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              }
            `}
            onClick={(e) => {
              e.stopPropagation()
              onVote("alternative")
            }}
          >
            <Utensils className="h-4 w-4 mr-2" />
            {currentVote?.choice === "alternative" ? "Seçildi" : "Alternatif Seç"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
