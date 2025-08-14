"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Users } from "lucide-react"
import { useAdminData } from "@/hooks/use-admin-data"

export function ShiftManagement() {
  const { shifts } = useAdminData()

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Vardiya Yönetimi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shifts.map((shift) => (
              <Card key={shift.id} className="bg-gray-700/50 border-gray-600">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{shift.label}</h3>
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 mb-3">{shift.code}</Badge>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-white">{shift.startTime}</div>
                    <div className="text-sm text-gray-400">{shift.endTime} saatine kadar</div>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-4 text-gray-400">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Sıra: {shift.order}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
