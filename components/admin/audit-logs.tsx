"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, User } from "lucide-react"
import { useAdminData } from "@/hooks/use-admin-data"

export function AuditLogs() {
  const { auditLogs } = useAdminData()

  const getActionBadgeColor = (action: string) => {
    if (action.includes("CREATED")) return "bg-green-500/20 text-green-300 border-green-500/30"
    if (action.includes("UPDATED")) return "bg-blue-500/20 text-blue-300 border-blue-500/30"
    if (action.includes("DELETED")) return "bg-red-500/20 text-red-300 border-red-500/30"
    if (action.includes("MAINTENANCE")) return "bg-orange-500/20 text-orange-300 border-orange-500/30"
    return "bg-gray-500/20 text-gray-300 border-gray-500/30"
  }

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          Audit Logları
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-4 bg-gray-700/50 rounded-lg border-l-4 border-l-blue-500">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getActionBadgeColor(log.action)}>{formatAction(log.action)}</Badge>
                    <span className="text-sm text-gray-400">{log.entity}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-white">{log.actorName}</span>
                  </div>

                  {log.meta && Object.keys(log.meta).length > 0 && (
                    <div className="text-xs text-gray-400 bg-gray-800/50 p-2 rounded mt-2">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(log.meta, null, 2)}</pre>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 text-gray-500 text-xs flex-shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>
                    {log.createdAt.toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {auditLogs.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Henüz audit kaydı bulunmuyor</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
