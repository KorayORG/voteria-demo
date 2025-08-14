"use client"

import { useState } from "react"
import type { Suggestion } from "@/types/suggestion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const statusOptions: { value: Suggestion["status"]; label: string }[] = [
  { value: "pending", label: "Beklemede" },
  { value: "under-review", label: "İnceleniyor" },
  { value: "in-progress", label: "Devam Ediyor" },
  { value: "completed", label: "Tamamlandı" },
  { value: "rejected", label: "Reddedildi" },
]

interface SuggestionAdminPanelProps {
  suggestion: Suggestion
  onUpdated?: () => void
}

export function SuggestionAdminPanel({ suggestion, onUpdated }: SuggestionAdminPanelProps) {
  const [status, setStatus] = useState<Suggestion["status"]>(suggestion.status)
  const [response, setResponse] = useState(suggestion.response || "")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const save = async () => {
    try {
      setSaving(true)
      setMessage(null)
      const res = await fetch(`/api/suggestions/${suggestion.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          // Geçici header tabanlı yetki (server tarafında kontrol ediliyor)
          "x-user-role": "admin",
        },
        body: JSON.stringify({ status, response }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setMessage(data.error || "Kaydedilemedi")
      } else {
        setMessage("Kaydedildi")
        onUpdated?.()
      }
    } catch (e) {
      setMessage("Hata oluştu")
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  return (
    <Card className="p-4 bg-gray-800 border-gray-700 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white line-clamp-1" title={suggestion.title}>{suggestion.title}</h4>
        <span className="text-xs text-gray-400">{suggestion.submittedAt.toLocaleDateString("tr-TR")}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Durum</label>
          <Select value={status} onValueChange={(v) => setStatus(v as Suggestion["status"]) }>
            <SelectTrigger className="h-8 bg-gray-700 border-gray-600 text-xs text-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {statusOptions.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Yanıt</label>
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={3}
            className="bg-gray-700 border-gray-600 text-gray-100 text-xs resize-none"
            placeholder="Kısa yanıt"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" disabled={saving} onClick={save} className="bg-orange-600 hover:bg-orange-500 h-8 text-xs">
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </Button>
        {message && <span className="text-xs text-gray-400">{message}</span>}
      </div>
    </Card>
  )
}
