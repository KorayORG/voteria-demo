"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, TrendingUp, PlusCircle, Pencil, Trash2, Save } from "lucide-react"
import { useAdminData } from "@/hooks/use-admin-data"
import { getShortWeekDays } from "@/lib/menu-data"

export function ExternalAdjustments() {
  const { externalAdjustments, shifts, createExternalAdjustment, updateExternalAdjustment, deleteExternalAdjustment } = useAdminData()
  const [form, setForm] = React.useState({ date: new Date().toISOString().split('T')[0], shiftId: '', addAbsolute: 0, note: '' })
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editDraft, setEditDraft] = React.useState<{ addAbsolute?: number; note?: string }>({})

  const shortWeekDays = getShortWeekDays()

  const getShiftLabel = (shiftId: string) => {
    const shift = shifts.find((s) => s.id === shiftId)
    return shift ? shift.label : shiftId
  }

  const groupedAdjustments = externalAdjustments.reduce(
    (acc, adj) => {
      const dateKey = adj.date.toISOString().split("T")[0]
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(adj)
      return acc
    },
    {} as Record<string, typeof externalAdjustments>,
  )

  return (
    <div className="space-y-6">
  <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-green-500" />
            Harici Adet Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid md:grid-cols-5 gap-3 mb-6" onSubmit={async (e) => {
            e.preventDefault(); setSubmitting(true); setError(null)
            if (!form.shiftId) { setError('Vardiya seçin'); setSubmitting(false); return }
            const ok = await createExternalAdjustment({
              date: new Date(form.date), shiftId: form.shiftId, addAbsolute: Number(form.addAbsolute)||0, note: form.note,
            })
            if (ok) setForm(f => ({ ...f, addAbsolute: 0, note: '' }))
            else setError('Kaydedilemedi')
            setSubmitting(false)
          }}>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tarih</label>
              <input type="date" value={form.date} onChange={e=> setForm(f=> ({...f, date: e.target.value}))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Vardiya</label>
              <select value={form.shiftId} onChange={e=> setForm(f=> ({...f, shiftId: e.target.value}))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white">
                <option value="">Seçiniz</option>
                {shifts.map(s=> <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">+ Adet</label>
              <input type="number" min={0} value={form.addAbsolute} onChange={e=> setForm(f=> ({...f, addAbsolute: e.target.valueAsNumber}))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white" />
            </div>
            <div className="md:col-span-1 md:col-start-4 md:col-end-5">
              <label className="block text-xs text-gray-400 mb-1">Not</label>
              <input value={form.note} maxLength={120} onChange={e=> setForm(f=> ({...f, note: e.target.value}))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white" placeholder="Opsiyonel" />
            </div>
            <div className="flex items-end">
              <button disabled={submitting} className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded">
                <PlusCircle className="h-4 w-4" /> Ekle
              </button>
            </div>
            {error && <div className="col-span-full text-xs text-red-400">{error}</div>}
          </form>
          <div className="space-y-4">
            {Object.entries(groupedAdjustments)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .slice(0, 7)
              .map(([dateKey, adjustments]) => {
                const date = new Date(dateKey)
                const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1 // Convert to Monday = 0

                return (
                  <Card key={dateKey} className="bg-gray-700/50 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-white font-medium">
                            {shortWeekDays[dayIndex]} - {date.toLocaleDateString("tr-TR")}
                          </h4>
                        </div>
                        <Badge className="bg-green-500/20 text-green-300">{adjustments.length} ayar</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {adjustments.map((adj) => {
                          const isEditing = editingId === adj.id
                          return (
                            <div key={adj.id} className="p-3 bg-gray-800/50 rounded-lg relative group">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-300">{getShiftLabel(adj.shiftId)}</span>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 text-green-400">
                                    <TrendingUp className="h-3 w-3" />
                                    {isEditing ? (
                                      <input type="number" className="w-14 bg-gray-900 border border-gray-700 rounded px-1 py-0.5 text-xs text-white" value={editDraft.addAbsolute ?? adj.addAbsolute ?? 0} onChange={e=> setEditDraft(d=> ({...d, addAbsolute: e.target.valueAsNumber}))} />
                                    ) : (
                                      <span className="text-sm font-semibold">+{adj.addAbsolute || 0}</span>
                                    )}
                                  </div>
                                  {isEditing ? (
                                    <button onClick={async ()=> { await updateExternalAdjustment(adj.id, { addAbsolute: editDraft.addAbsolute }) ; setEditingId(null) }} className="text-xs text-green-300 hover:text-green-200"><Save className="h-4 w-4" /></button>
                                  ) : (
                                    <button onClick={()=> { setEditingId(adj.id); setEditDraft({ addAbsolute: adj.addAbsolute, note: adj.note }) }} className="text-xs text-gray-400 hover:text-white"><Pencil className="h-4 w-4" /></button>
                                  )}
                                  <button onClick={async ()=> { if (confirm('Silinsin mi?')) await deleteExternalAdjustment(adj.id) }} className="text-xs text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              </div>
                              {isEditing ? (
                                <input value={editDraft.note ?? adj.note ?? ''} onChange={e=> setEditDraft(d=> ({...d, note: e.target.value}))} className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white" placeholder="Not" />
                              ) : (
                                adj.note && <p className="text-xs text-gray-400">{adj.note}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

            {Object.keys(groupedAdjustments).length === 0 && (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Henüz harici adet ayarı bulunmuyor</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
