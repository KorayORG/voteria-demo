"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, ArrowLeft, ArrowRight, Utensils, Sparkles, Crown } from "lucide-react"
import type { Dish } from "@/types/menu"
import { cn } from "@/lib/utils"

interface DuelPickerProps {
  traditional: Dish
  alternative: Dish
  currentChoice?: "traditional" | "alternative" | null
  onChoice: (choice: "traditional" | "alternative") => void
  disabled?: boolean
  showKeyboardHints?: boolean
}

export function DuelPicker({
  traditional,
  alternative,
  currentChoice,
  onChoice,
  disabled = false,
  showKeyboardHints = true,
}: DuelPickerProps) {
  const [hoveredSide, setHoveredSide] = useState<"traditional" | "alternative" | null>(null)
  const [animationClass, setAnimationClass] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return

      if (e.key === "ArrowLeft") {
        e.preventDefault()
        onChoice("traditional")
        setAnimationClass("animate-pulse-left")
        setTimeout(() => setAnimationClass(""), 300)
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        onChoice("alternative")
        setAnimationClass("animate-pulse-right")
        setTimeout(() => setAnimationClass(""), 300)
      }
    }

    if (containerRef.current) {
      containerRef.current.addEventListener("keydown", handleKeyDown)
      containerRef.current.focus()
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("keydown", handleKeyDown)
      }
    }
  }, [disabled, onChoice])

  const handleChoice = (choice: "traditional" | "alternative") => {
    if (disabled) return
    onChoice(choice)
    setAnimationClass(choice === "traditional" ? "animate-pulse-left" : "animate-pulse-right")
    setTimeout(() => setAnimationClass(""), 300)
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={cn("relative focus:outline-none", animationClass)}
      onMouseLeave={() => setHoveredSide(null)}
    >
      {/* VS Indicator */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20 backdrop-blur-sm">
          <span className="text-white font-bold text-lg">VS</span>
        </div>
      </div>

      {/* Keyboard Hints */}
      {showKeyboardHints && !disabled && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white/80">
            <ArrowLeft className="h-3 w-3" />
            <span>Sol</span>
            <span className="text-white/40">•</span>
            <span>Sağ</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 relative">
        {/* Traditional Option */}
        <Card
          className={cn(
            "border-2 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] card-3d shadow-3d relative overflow-hidden",
            currentChoice === "traditional"
              ? "border-orange-500 bg-orange-500/10 shadow-orange-500/20"
              : hoveredSide === "traditional"
                ? "border-orange-400 bg-orange-400/5 shadow-orange-400/10"
                : "border-gray-600 bg-gray-800/50 hover:border-orange-300",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          onClick={() => handleChoice("traditional")}
          onMouseEnter={() => !disabled && setHoveredSide("traditional")}
        >
          {/* Selection Indicator */}
          {currentChoice === "traditional" && (
            <div className="absolute top-3 right-3 z-10">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Check className="h-5 w-5 text-white" />
              </div>
            </div>
          )}

          {/* Crown for Traditional */}
          <div className="absolute top-3 left-3 z-10">
            <Crown className="h-5 w-5 text-orange-400" />
          </div>

          <CardContent className="p-4 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-bold text-white mb-2">Geleneksel</h3>
              <div className="flex flex-wrap gap-1 justify-center mb-3">
                {traditional.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="aspect-square bg-gray-700 rounded-lg overflow-hidden relative group">
              <img
                src={traditional.imageUrl || "/placeholder.svg?height=200&width=200&query=traditional turkish food"}
                alt={traditional.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="text-center">
              <h4 className="font-semibold text-white mb-1 line-clamp-2">{traditional.name}</h4>
              {traditional.description && (
                <p className="text-sm text-gray-300 line-clamp-2">{traditional.description}</p>
              )}
            </div>

            <Button
              className={cn(
                "w-full transition-all duration-200 transform hover:scale-105",
                currentChoice === "traditional"
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white",
              )}
              onClick={(e) => {
                e.stopPropagation()
                handleChoice("traditional")
              }}
              disabled={disabled}
            >
              <Utensils className="h-4 w-4 mr-2" />
              {currentChoice === "traditional" ? "Seçildi" : "Geleneksel Seç"}
            </Button>
          </CardContent>
        </Card>

        {/* Alternative Option */}
        <Card
          className={cn(
            "border-2 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] card-3d shadow-3d relative overflow-hidden",
            currentChoice === "alternative"
              ? "border-green-500 bg-green-500/10 shadow-green-500/20"
              : hoveredSide === "alternative"
                ? "border-green-400 bg-green-400/5 shadow-green-400/10"
                : "border-gray-600 bg-gray-800/50 hover:border-green-300",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          onClick={() => handleChoice("alternative")}
          onMouseEnter={() => !disabled && setHoveredSide("alternative")}
        >
          {/* Selection Indicator */}
          {currentChoice === "alternative" && (
            <div className="absolute top-3 right-3 z-10">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <Check className="h-5 w-5 text-white" />
              </div>
            </div>
          )}

          {/* Sparkles for Alternative */}
          <div className="absolute top-3 left-3 z-10">
            <Sparkles className="h-5 w-5 text-green-400" />
          </div>

          <CardContent className="p-4 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-bold text-white mb-2">Alternatif</h3>
              <div className="flex flex-wrap gap-1 justify-center mb-3">
                {alternative.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="aspect-square bg-gray-700 rounded-lg overflow-hidden relative group">
              <img
                src={alternative.imageUrl || "/placeholder.svg?height=200&width=200&query=healthy alternative food"}
                alt={alternative.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="text-center">
              <h4 className="font-semibold text-white mb-1 line-clamp-2">{alternative.name}</h4>
              {alternative.description && (
                <p className="text-sm text-gray-300 line-clamp-2">{alternative.description}</p>
              )}
            </div>

            <Button
              className={cn(
                "w-full transition-all duration-200 transform hover:scale-105",
                currentChoice === "alternative"
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white",
              )}
              onClick={(e) => {
                e.stopPropagation()
                handleChoice("alternative")
              }}
              disabled={disabled}
            >
              <Utensils className="h-4 w-4 mr-2" />
              {currentChoice === "alternative" ? "Seçildi" : "Alternatif Seç"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
