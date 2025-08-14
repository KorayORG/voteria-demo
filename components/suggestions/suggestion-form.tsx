"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { X, Send } from "lucide-react"
import { categoryLabels, priorityLabels } from "@/lib/suggestion-data"
import { useAuth } from "@/components/auth/auth-provider"
import type { SuggestionCategory, SuggestionPriority } from "@/types/suggestion"

interface SuggestionFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function SuggestionForm({ onSubmit, onCancel }: SuggestionFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "" as SuggestionCategory,
    priority: "medium" as SuggestionPriority,
    tags: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        ...formData,
        submittedBy: user?.fullName || "Anonim",
        status: "pending",
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-2xl glass-effect max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-white">Yeni Öneri Gönder</h2>
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-gray-400 hover:text-white button-3d">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Başlık *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Önerinizin başlığını yazın"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 glass-effect-light text-sm sm:text-base"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Kategori *</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as SuggestionCategory })}
                  required
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white glass-effect-light text-sm sm:text-base">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-white hover:bg-gray-700">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Öncelik</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as SuggestionPriority })}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white glass-effect-light text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {Object.entries(priorityLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-white hover:bg-gray-700">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Açıklama *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Önerinizi detaylı olarak açıklayın..."
                rows={4}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 resize-none glass-effect-light text-sm sm:text-base"
                required
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Etiketler</label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Etiketleri virgülle ayırın (örn: vegan, sağlık, hızlı)"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 glass-effect-light text-sm sm:text-base"
              />
              <p className="text-xs text-gray-500 mt-1">Önerinizi kategorize etmek için etiketler ekleyebilirsiniz</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="order-2 sm:order-1 flex-1 text-gray-400 hover:text-white hover:bg-gray-700 button-3d text-sm sm:text-base py-2.5 sm:py-3"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.description.trim() || !formData.category}
                className="order-1 sm:order-2 flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg button-3d text-sm sm:text-base py-2.5 sm:py-3"
              >
                {loading ? (
                  "Gönderiliyor..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Gönder
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
