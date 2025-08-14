"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Save, X, Upload, Calendar, Copy } from "lucide-react"
import { getCurrentWeekMenu, getWeekDays } from "@/lib/menu-data"
import type { WeekMenu, Dish } from "@/types/menu"

export function MenuManagement() {
  const [currentWeekMenu, setCurrentWeekMenu] = useState<WeekMenu>(getCurrentWeekMenu())
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [editingType, setEditingType] = useState<"traditional" | "alternative" | null>(null)

  const weekDays = getWeekDays()

  const handleEditDish = (dayIndex: number, type: "traditional" | "alternative") => {
    setEditingDay(dayIndex)
    setEditingType(type)
  }

  const handleSaveDish = (dayIndex: number, type: "traditional" | "alternative", updatedDish: Partial<Dish>) => {
    setCurrentWeekMenu((prev) => ({
      ...prev,
      days: prev.days.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              [type]: {
                ...day[type],
                ...updatedDish,
              },
            }
          : day,
      ),
    }))
    setEditingDay(null)
    setEditingType(null)
  }

  const handleCancelEdit = () => {
    setEditingDay(null)
    setEditingType(null)
  }

  const DishEditor = ({
    dish,
    onSave,
    onCancel,
  }: { dish: Dish; onSave: (dish: Partial<Dish>) => void; onCancel: () => void }) => {
    const [editedDish, setEditedDish] = useState<Partial<Dish>>({
      name: dish.name,
      description: dish.description || "",
      tags: dish.tags,
    })

    const handleTagAdd = (tag: string) => {
      if (tag && !editedDish.tags?.includes(tag)) {
        setEditedDish((prev) => ({
          ...prev,
          tags: [...(prev.tags || []), tag],
        }))
      }
    }

    const handleTagRemove = (tagToRemove: string) => {
      setEditedDish((prev) => ({
        ...prev,
        tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
      }))
    }

    return (
      <div className="space-y-4 p-4 bg-gray-700/50 rounded-lg">
        <div className="space-y-2">
          <Label htmlFor="dishName" className="text-gray-200">
            Yemek Adı
          </Label>
          <Input
            id="dishName"
            value={editedDish.name || ""}
            onChange={(e) => setEditedDish((prev) => ({ ...prev, name: e.target.value }))}
            className="bg-gray-800 border-gray-600 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dishDescription" className="text-gray-200">
            Açıklama
          </Label>
          <Textarea
            id="dishDescription"
            value={editedDish.description || ""}
            onChange={(e) => setEditedDish((prev) => ({ ...prev, description: e.target.value }))}
            className="bg-gray-800 border-gray-600 text-white"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-200">Etiketler</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {editedDish.tags?.map((tag) => (
              <Badge key={tag} className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                {tag}
                <button onClick={() => handleTagRemove(tag)} className="ml-1 text-orange-300 hover:text-orange-100">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Yeni etiket ekle"
              className="bg-gray-800 border-gray-600 text-white"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleTagAdd(e.currentTarget.value)
                  e.currentTarget.value = ""
                }
              }}
            />
            <Button
              size="sm"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement
                handleTagAdd(input.value)
                input.value = ""
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => onSave(editedDish)} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" />
            Kaydet
          </Button>
          <Button variant="outline" onClick={onCancel} className="border-gray-600 text-gray-300 bg-transparent">
            <X className="h-4 w-4 mr-2" />
            İptal
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              Menü Yönetimi
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 bg-transparent">
                <Copy className="h-4 w-4 mr-2" />
                Önceki Haftadan Kopyala
              </Button>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                <Upload className="h-4 w-4 mr-2" />
                Menüyü Yayınla
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Weekly Menu Editor */}
      <div className="space-y-4">
        {currentWeekMenu.days.map((dayMenu, dayIndex) => (
          <Card key={dayIndex} className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>
                  {weekDays[dayIndex]} - {dayMenu.date.toLocaleDateString("tr-TR")}
                </span>
                <Badge className="bg-gray-700 text-gray-300">
                  {dayMenu.date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Traditional Dish */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white">Geleneksel Seçenek</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditDish(dayIndex, "traditional")}
                      className="border-gray-600 text-gray-300"
                      disabled={editingDay === dayIndex && editingType === "traditional"}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Düzenle
                    </Button>
                  </div>

                  {editingDay === dayIndex && editingType === "traditional" ? (
                    <DishEditor
                      dish={dayMenu.traditional}
                      onSave={(updatedDish) => handleSaveDish(dayIndex, "traditional", updatedDish)}
                      onCancel={handleCancelEdit}
                    />
                  ) : (
                    <div className="space-y-3">
                      <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={dayMenu.traditional.imageUrl || "/placeholder.svg"}
                          alt={dayMenu.traditional.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h5 className="font-medium text-white">{dayMenu.traditional.name}</h5>
                        {dayMenu.traditional.description && (
                          <p className="text-sm text-gray-300 mt-1">{dayMenu.traditional.description}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {dayMenu.traditional.tags.map((tag) => (
                          <Badge key={tag} className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Alternative Dish */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white">Alternatif Seçenek</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditDish(dayIndex, "alternative")}
                      className="border-gray-600 text-gray-300"
                      disabled={editingDay === dayIndex && editingType === "alternative"}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Düzenle
                    </Button>
                  </div>

                  {editingDay === dayIndex && editingType === "alternative" ? (
                    <DishEditor
                      dish={dayMenu.alternative}
                      onSave={(updatedDish) => handleSaveDish(dayIndex, "alternative", updatedDish)}
                      onCancel={handleCancelEdit}
                    />
                  ) : (
                    <div className="space-y-3">
                      <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={dayMenu.alternative.imageUrl || "/placeholder.svg"}
                          alt={dayMenu.alternative.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h5 className="font-medium text-white">{dayMenu.alternative.name}</h5>
                        {dayMenu.alternative.description && (
                          <p className="text-sm text-gray-300 mt-1">{dayMenu.alternative.description}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {dayMenu.alternative.tags.map((tag) => (
                          <Badge key={tag} className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
