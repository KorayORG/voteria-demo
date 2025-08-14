"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users } from "lucide-react"
import type { Shift } from "@/types/menu"

interface ShiftSelectorProps {
  shifts: Shift[]
  onSelectShift: (shift: Shift) => void
}

export function ShiftSelector({ shifts, onSelectShift }: ShiftSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Vardiya Seçimi</h1>
        <p className="text-gray-300">Lütfen çalıştığınız vardiyayı seçin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {shifts.map((shift) => (
          <Card
            key={shift.id}
            className="bg-gray-800/50 border-gray-700 card-3d shadow-3d hover:bg-gray-700/50 transition-all duration-200 cursor-pointer group"
            onClick={() => onSelectShift(shift)}
          >
            <CardHeader className="text-center pb-3">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-lg text-white">{shift.label}</CardTitle>
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">{shift.code}</Badge>
            </CardHeader>

            <CardContent className="text-center space-y-4">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-white">{shift.startTime}</div>
                <div className="text-sm text-gray-400">{shift.endTime} saatine kadar</div>
              </div>

              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Users className="h-4 w-4" />
                <span className="text-sm">Vardiya Seç</span>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transform transition-all duration-200 hover:scale-105"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectShift(shift)
                }}
              >
                Bu Vardiyayı Seç
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
