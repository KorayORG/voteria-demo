"use client"

import type { DayMenu, Vote } from "@/types/menu"
import { DuelPicker } from "./duel-picker"

interface DayVotingProps {
  dayMenu: DayMenu
  currentVote: Vote | null
  onVote: (choice: "traditional" | "alternative") => void
  disabled?: boolean
}

export function DayVoting({ dayMenu, currentVote, onVote, disabled = false }: DayVotingProps) {
  const { traditional, alternative } = dayMenu

  return (
    <div className="space-y-4">
      <DuelPicker
        traditional={traditional}
        alternative={alternative}
        currentChoice={currentVote?.choice || null}
        onChoice={onVote}
        disabled={disabled}
        showKeyboardHints={true}
      />

      {currentVote && (
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Seçiminiz:{" "}
            <span className="font-semibold text-white">
              {currentVote.choice === "traditional" ? "Geleneksel" : "Alternatif"}
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(currentVote.createdAt).toLocaleString("tr-TR")} tarihinde seçildi
          </p>
        </div>
      )}
    </div>
  )
}
