"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Save, X, Upload, Calendar, Copy } from "lucide-react"
import { getCurrentWeekMenu, getWeekDays } from "@/lib/menu-data"
import type { WeekMenu, Dish, StoredMenuDocument, Shift } from "@/types/menu"
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Loader2, Check } from 'lucide-react'

export function MenuManagement() {
  const [currentWeekMenu, setCurrentWeekMenu] = useState<WeekMenu>(getCurrentWeekMenu())
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [editingType, setEditingType] = useState<"traditional" | "alternative" | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [weekISO, setWeekISO] = useState(currentWeekMenu.weekOfISO)
  const [importPreview, setImportPreview] = useState<any | null>(null)
  const [importing, setImporting] = useState(false)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [activeShiftId, setActiveShiftId] = useState<string>('') // override görüntülemek için
  const { toast } = useToast()

  // ISO week hesap & önceki hafta
  const computePrevWeek = (w: string) => {
    const m = /(\d{4})-W(\d{2})/.exec(w)
    if (!m) return w
    let year = +m[1]; let week = +m[2]
    week -= 1
    if (week < 1) { year -= 1; week = 52 }
    return `${year}-W${String(week).padStart(2,'0')}`
  }

  const loadMenu = useCallback(async (targetWeek: string) => {
    try {
      setLoading(true)
      const q = activeShiftId ? `&shift=${activeShiftId}` : ''
      const res = await fetch(`/api/menus?week=${targetWeek}${q}`)
      if (res.ok) {
        const data = await res.json()
        const doc: StoredMenuDocument | undefined = data.menus?.[0]
        if (doc) {
          // Convert to WeekMenu shape (keeping existing Dish shape minimal)
            const monday = new Date()
            const days = doc.days.map((d, idx) => {
              return {
                id: `day-${idx}`,
                date: d.date ? new Date(d.date) : new Date(monday.getTime() + idx*86400000),
                traditional: d.traditional ? { id: `t-${idx}`, name: d.traditional.name, description: d.traditional.description, imageUrl: d.traditional.imageUrl, tags: d.traditional.tags || [], pairTags: {} } : { id: '', name: 'Menü Yok', tags: [], pairTags: {} },
                alternative: d.alternative ? { id: `a-${idx}`, name: d.alternative.name, description: d.alternative.description, imageUrl: d.alternative.imageUrl, tags: d.alternative.tags || [], pairTags: {} } : { id: '', name: 'Menü Yok', tags: [], pairTags: {} },
                categoriesSchemaVersion: 1,
              }
            })
            setCurrentWeekMenu({ id: doc.weekOfISO, weekOfISO: doc.weekOfISO, days, isPublished: doc.isPublished, createdBy: doc.createdBy, createdAt: new Date(doc.createdAt) })
        } else {
          // Reset blank
          setCurrentWeekMenu(getCurrentWeekMenu())
        }
      } else {
        setCurrentWeekMenu(getCurrentWeekMenu())
      }
    } catch (e:any) {
      toast({ title: 'Menü yüklenemedi', description: e.message })
    } finally { setLoading(false) }
  }, [toast])

  useEffect(() => { loadMenu(weekISO) }, [weekISO, activeShiftId, loadMenu])

  // Shifts load
  useEffect(() => {
    (async () => {
      try { const r = await fetch('/api/shifts'); if (r.ok) { const d = await r.json(); setShifts((d.shifts||[]).map((s:any)=>({ id:s._id?.toString()||s.id, code:s.code, label:s.label, startTime:s.startTime, endTime:s.endTime, order:s.order??99, isActive: s.isActive!==false })) ) } }
      catch { setShifts([]) }
    })()
  }, [])

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
                name: (updatedDish.name ?? day[type].name) as string,
                description: updatedDish.description ?? day[type].description,
                tags: (updatedDish.tags as string[] | undefined) ?? day[type].tags,
                imageUrl: updatedDish.imageUrl ?? day[type].imageUrl,
              },
            }
          : day
      ),
    }))
    setEditingDay(null)
    setEditingType(null)
  }

  const buildPayload = (): StoredMenuDocument => {
    return {
      weekOfISO: currentWeekMenu.weekOfISO,
      days: currentWeekMenu.days.map(d => ({
        date: d.date.toISOString().slice(0,10),
        traditional: d.traditional.name === 'Menü Yok' ? null : {
          name: d.traditional.name,
          description: d.traditional.description,
          imageUrl: d.traditional.imageUrl,
          tags: d.traditional.tags,
        },
        alternative: d.alternative.name === 'Menü Yok' ? null : {
          name: d.alternative.name,
          description: d.alternative.description,
          imageUrl: d.alternative.imageUrl,
          tags: d.alternative.tags,
        },
        // shift override taslağı: aktif shift seçili ise değişiklikleri shifts objesine koy
        shifts: activeShiftId ? { [activeShiftId]: {
          traditional: d.traditional.name === 'Menü Yok' ? null : { name: d.traditional.name, description: d.traditional.description, imageUrl: d.traditional.imageUrl, tags: d.traditional.tags },
          alternative: d.alternative.name === 'Menü Yok' ? null : { name: d.alternative.name, description: d.alternative.description, imageUrl: d.alternative.imageUrl, tags: d.alternative.tags }
        } } : undefined
      })),
      isPublished: currentWeekMenu.isPublished,
      createdAt: new Date().toISOString(),
      createdBy: 'system'
    }
  }

  const saveMenu = async () => {
    try {
      setSaving(true)
      const payload = buildPayload()
      const res = await fetch('/api/menus', { method: 'POST', headers: { 'Content-Type':'application/json', 'x-user-role': 'kitchen' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Kaydetme başarısız')
      toast({ title: 'Menü kaydedildi' })
    } catch (e:any) { toast({ title: 'Hata', description: e.message }) } finally { setSaving(false) }
  }

  const publishMenu = async () => {
    try { setPublishing(true); const payload = { ...buildPayload(), isPublished: true }
      const res = await fetch('/api/menus', { method: 'POST', headers: { 'Content-Type':'application/json', 'x-user-role': 'kitchen' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Yayınlama başarısız')
      setCurrentWeekMenu(p => ({ ...p, isPublished: true }))
      toast({ title: 'Menü yayınlandı' })
    } catch (e:any) { toast({ title: 'Hata', description: e.message }) } finally { setPublishing(false) }
  }

  const copyPreviousWeek = async () => {
    const prev = computePrevWeek(weekISO)
    try { setLoading(true)
      const res = await fetch(`/api/menus?week=${prev}`)
      if (res.ok) {
        const data = await res.json(); const doc: StoredMenuDocument | undefined = data.menus?.[0]
        if (!doc) { toast({ title: 'Önceki hafta bulunamadı' }); return }
        // Adapt and set but keep current weekISO
        const adapted = { ...doc, weekOfISO: weekISO }
        const monday = new Date()
        const days = adapted.days.map((d, idx) => ({
          id: `day-${idx}`,
          date: d.date ? new Date(d.date) : new Date(monday.getTime()+idx*86400000),
          traditional: d.traditional ? { id:`t-${idx}`, name:d.traditional.name, description:d.traditional.description, imageUrl:d.traditional.imageUrl, tags:d.traditional.tags||[], pairTags: {} } : { id:'', name:'Menü Yok', tags:[], pairTags: {} },
          alternative: d.alternative ? { id:`a-${idx}`, name:d.alternative.name, description:d.alternative.description, imageUrl:d.alternative.imageUrl, tags:d.alternative.tags||[], pairTags: {} } : { id:'', name:'Menü Yok', tags:[], pairTags: {} },
          categoriesSchemaVersion:1
        }))
        setCurrentWeekMenu(p => ({ ...p, days }))
        toast({ title: 'Önceki hafta kopyalandı' })
      }
    } catch(e:any){ toast({ title:'Hata', description:e.message }) } finally { setLoading(false) }
  }

  const handlePdfPreview = async (file: File) => {
    setImporting(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('weekOfISO', weekISO)
      const res = await fetch('/api/menus/import', { method:'POST', headers: { 'x-user-role':'kitchen' }, body: fd })
      if (!res.ok) throw new Error('Önizleme alınamadı')
      const data = await res.json(); setImportPreview(data.preview)
      toast({ title: 'PDF önizleme hazır' })
    } catch(e:any) { toast({ title:'Hata', description:e.message }) } finally { setImporting(false) }
  }

  const commitPdfImport = async () => {
    if (!importPreview) return
    setImporting(true)
    try {
      // Tekrar upload gerektirebilir; şimdilik skip -> kullanıcı yeniden seçmeli bu basit taslak.
      // Burada advanced: importPreview içeriğini manuel güncelle API eklenebilir.
      toast({ title: 'Önizleme sadece; commit için PDF tekrar yüklenecek (geliştirilecek)' })
    } finally { setImporting(false) }
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
      name: dish.name || "",
      description: dish.description || "",
      tags: dish.tags || [],
      imageUrl: dish.imageUrl || "",
    })
  const [errors, setErrors] = useState<{ name?: string; imageUrl?: string }>({})
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggest, setShowSuggest] = useState(false)
  const [loadingSuggest, setLoadingSuggest] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const cacheRef = useRef<{ q: string; data: any[] }[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [focused, setFocused] = useState(false)
    const [touched, setTouched] = useState<{ name?: boolean; imageUrl?: boolean }>({})

    const sanitizeName = (value: string) =>
      value
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\s{2,}/g, " ")
        .slice(0, 80)

    const validate = (state = editedDish) => {
      const next: { name?: string; imageUrl?: string } = {}
      if (!state.name || !state.name.trim()) next.name = "İsim zorunlu"
      if (state.imageUrl && !/^https?:\/\//i.test(state.imageUrl)) next.imageUrl = "Tam URL girin (http/https)"
      setErrors(next)
      return next
    }

    const handleBlur = (field: keyof typeof touched) => {
      setTouched((p) => ({ ...p, [field]: true }))
      validate()
    }

    // Fetch suggestions
    useEffect(() => {
      const q = editedDish.name?.trim() || ''
      if (!focused) return
      let cancelled = false
      setLoadingSuggest(true)
      const t = setTimeout(async () => {
        try {
          const lookupKey = q // allow empty string caching
          const hit = cacheRef.current.find(c => c.q === lookupKey)
          if (hit) {
            setSuggestions(hit.data); setActiveIndex(0); setShowSuggest(true); setLoadingSuggest(false); return
          }
          const res = await fetch(`/api/dishes/suggest?q=${encodeURIComponent(q)}`)
          if (!res.ok) throw new Error('Öneriler alınamadı')
          const data = await res.json()
          if (!cancelled) { setSuggestions(data.suggestions || []); setActiveIndex(0); setShowSuggest(true) }
          cacheRef.current.unshift({ q: lookupKey, data: data.suggestions || [] })
          cacheRef.current = cacheRef.current.slice(0,20)
        } catch { if (!cancelled) setSuggestions([]) } finally { if (!cancelled) setLoadingSuggest(false) }
      }, 250)
      return () => { cancelled = true; clearTimeout(t) }
    }, [editedDish.name, focused])

    const applySuggestion = (s: any) => {
      setEditedDish(prev => ({ ...prev, name: s.name || prev.name, description: s.description || prev.description, imageUrl: s.imageUrl || prev.imageUrl, tags: s.tags && s.tags.length ? s.tags : prev.tags }))
      setShowSuggest(false)
      // register recent pick via fire-and-forget (non-blocking) - optional future endpoint
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!showSuggest || suggestions.length === 0) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => (i + 1) % suggestions.length) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => (i - 1 + suggestions.length) % suggestions.length) }
      else if (e.key === 'Enter') { e.preventDefault(); const s = suggestions[activeIndex]; if (s) applySuggestion(s) }
      else if (e.key === 'Escape') { setShowSuggest(false) }
    }

    const handleTagAdd = (tag: string) => {
      const clean = tag.trim()
      if (clean && !editedDish.tags?.includes(clean)) {
        setEditedDish((prev) => ({
          ...prev,
          tags: [...(prev.tags || []), clean],
        }))
      }
    }

    const handleTagRemove = (tagToRemove: string) => {
      setEditedDish((prev) => ({
        ...prev,
        tags: prev.tags?.filter((t) => t !== tagToRemove) || [],
      }))
    }

  // (Outside click & global shortcuts removed – only explicit Kaydet / İptal kullanılacak.)

    return (
      <div className="space-y-4 p-4 bg-gray-700/50 rounded-lg relative">
        <div className="space-y-2">
          <Label htmlFor="dishName" className="text-gray-200">
            Yemek Adı
          </Label>
          <div className="relative">
          <Input
            id="dishName"
            ref={inputRef}
            value={editedDish.name || ""}
            onChange={(e) => {
              // Serbest yazım; sanitizasyon kaydet/blur anında
              const val = e.target.value
              setEditedDish((prev) => ({ ...prev, name: val }))
              setShowSuggest(true)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => { setFocused(true); setShowSuggest(true) }}
            onBlur={() => {
              setEditedDish((prev) => ({ ...prev, name: sanitizeName(prev.name || "") }))
              handleBlur("name")
              // Delay hiding to allow click selection
              setTimeout(()=> { setFocused(false); setShowSuggest(false) }, 150)
            }}
            autoFocus
            className="bg-gray-800 border-gray-600 text-white"
            placeholder="Örn: Mercimek Çorbası"
          />
          {showSuggest && suggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-gray-900 border border-gray-700 rounded shadow-lg max-h-60 overflow-auto text-sm">
              {suggestions.map((s, idx) => (
                <button
                  key={s.name + idx}
                  type="button"
                  onMouseDown={(e)=> { e.preventDefault(); applySuggestion(s) }}
                  onMouseEnter={()=> setActiveIndex(idx)}
                  className={cn('w-full text-left px-3 py-2 hover:bg-gray-700 focus:bg-gray-700 focus:outline-none', idx===activeIndex && 'bg-gray-700')}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-gray-200 font-medium">{s.name}</span>
                    {s.usageCount && <span className="text-[10px] text-gray-500">{s.usageCount}x</span>}
                  </div>
                  <div className="text-[11px] text-gray-400 truncate">{s.description || '—'}{s.tags?.length ? ' • ' + s.tags.join(', ') : ''}</div>
                </button>
              ))}
            </div>
          )}
          {loadingSuggest && <div className="absolute right-2 top-2 text-[10px] text-gray-500">...</div>}
          </div>
          {touched.name && errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
          <p className="text-[10px] text-gray-500">Maks 80 karakter, otomatik trim.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dishDescription" className="text-gray-200">
            Açıklama
          </Label>
          <Textarea
            id="dishDescription"
            value={editedDish.description || ""}
            onChange={(e) => setEditedDish((prev) => ({ ...prev, description: e.target.value.slice(0, 300) }))}
            className="bg-gray-800 border-gray-600 text-white"
            rows={3}
            placeholder="Kısa açıklama (opsiyonel)"
          />
            <p className="text-[10px] text-gray-500">Maks 300 karakter.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dishImageUrl" className="text-gray-200 flex items-center justify-between">
            <span>Görsel URL</span>
            {editedDish.imageUrl && (
              <a
                href={editedDish.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-orange-400 hover:underline"
              >
                Aç
              </a>
            )}
          </Label>
          <Input
            id="dishImageUrl"
            type="url"
            value={editedDish.imageUrl || ""}
            onChange={(e) => setEditedDish((prev) => ({ ...prev, imageUrl: e.target.value.trim() }))}
            onBlur={() => handleBlur("imageUrl")}
            className="bg-gray-800 border-gray-600 text-white"
            placeholder="https://... (opsiyonel)"
          />
          {touched.imageUrl && errors.imageUrl && <p className="text-xs text-red-400">{errors.imageUrl}</p>}
          <div className="mt-2 flex items-center gap-3">
            <div className="w-28 h-20 bg-gray-900 rounded overflow-hidden flex items-center justify-center text-[10px] text-gray-500">
              {editedDish.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={editedDish.imageUrl}
                  alt="Önizleme"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).src = "/placeholder.svg"
                  }}
                />
              ) : (
                "Önizleme"
              )}
            </div>
            <p className="text-[10px] text-gray-500 leading-snug">Harici link yeterli; upload gerekmez.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-200">Etiketler</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {editedDish.tags?.map((tag) => (
              <Badge key={tag} className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                {tag}
                <button
                  type="button"
                  onClick={() => handleTagRemove(tag)}
                  className="ml-1 text-orange-300 hover:text-orange-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Yeni etiket"
              className="bg-gray-800 border-gray-600 text-white"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleTagAdd((e.currentTarget as HTMLInputElement).value)
                  ;(e.currentTarget as HTMLInputElement).value = ""
                }
              }}
            />
            <Button
              size="sm"
              type="button"
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
          <Button
            type="button"
            onClick={() => {
              const errs = validate()
              if (Object.keys(errs).length) return
              onSave({
                ...editedDish,
                name: sanitizeName(editedDish.name || ""),
                imageUrl: editedDish.imageUrl?.trim() || undefined,
              })
            }}
            disabled={!!errors.name}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" /> Kaydet
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-gray-600 text-gray-300 bg-transparent"
          >
            <X className="h-4 w-4 mr-2" /> İptal
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 menu-management-static">
      {/* Header */}
          <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              Menü Yönetimi
            </CardTitle>
            <div className="flex gap-2 items-center flex-wrap">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span>Hafta:</span>
                <Input value={weekISO} onChange={e=> setWeekISO(e.target.value)} className="h-7 w-28 bg-gray-900 border-gray-600 text-white text-xs" />
              </div>
              {shifts.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <span>Vardiya:</span>
                  <select value={activeShiftId} onChange={e=> setActiveShiftId(e.target.value)} className="h-7 bg-gray-900 border border-gray-600 rounded text-white text-xs px-1">
                    <option value=''>Genel</option>
                    {shifts.map(s=> <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              )}
              <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 bg-transparent" onClick={copyPreviousWeek} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Copy className="h-4 w-4 mr-2" />}
                Önceki Haftadan Kopyala
              </Button>
              <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 bg-transparent" onClick={saveMenu} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Kaydet
              </Button>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={publishMenu} disabled={publishing}>
                {publishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {currentWeekMenu.isPublished ? 'Tekrar Yayınla' : 'Menüyü Yayınla'}
              </Button>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <label className="cursor-pointer font-medium bg-gray-700 px-2 py-1 rounded hover:bg-gray-600 transition">
                  <span>PDF Seç</span>
                  <input type="file" accept="application/pdf" className="hidden" onChange={e=> { const f = e.target.files?.[1] || e.target.files?.[0]; if (f) handlePdfPreview(f) }} />
                </label>
                {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                {importPreview && <Button size="sm" variant="outline" onClick={commitPdfImport} className="border-gray-600 text-gray-300">Önizleme (Taslak)</Button>}
              </div>
            </div>
          </div>
          {importPreview && <div className="mt-2 text-xs text-gray-400">PDF gün sayısı: {importPreview.extracted?.days?.length || 0}</div>}
        </CardHeader>
      </Card>

      {/* Weekly Menu Editor */}
      <div className="space-y-4">
  {currentWeekMenu.days.map((dayMenu, dayIndex) => (
          <Card key={dayIndex} className="bg-gray-800/50 border-gray-700">
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
