"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Clock, Users, Plus, Save, X, Trash2, Edit3, ToggleLeft, ToggleRight, Info } from "lucide-react"
import { useAdminData } from "@/hooks/use-admin-data"
import { useState } from "react"
import type { Shift } from "@/types/menu"

export function ShiftManagement() {
  const { shifts, createShift, updateShift, deleteShift } = useAdminData()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const empty: Omit<Shift,'id'> = { code:'', label:'', startTime:'', endTime:'', order:shifts.length+1, isActive:true }
  const [draft, setDraft] = useState<Omit<Shift,'id'>>(empty)

  const startAdd = () => { setDraft({ ...empty, order: shifts.length+1 }); setAdding(true); setEditingId(null) }
  const cancel = () => { setAdding(false); setEditingId(null); setDraft(empty) }
  const saveNew = async () => { if (!draft.code || !draft.label) return; const ok = await createShift(draft); if (ok) cancel() }
  const beginEdit = (s: Shift) => { setEditingId(s.id); setAdding(false); setDraft({ code:s.code,label:s.label,startTime:s.startTime,endTime:s.endTime,order:s.order,isActive:s.isActive }) }
  const saveEdit = async () => { if (!editingId) return; const ok = await updateShift(editingId, draft); if (ok) cancel() }

  return (
    <div className="space-y-6">
  <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Vardiya Yönetimi
            </CardTitle>
            {!adding && !editingId && (
              <Button size="sm" onClick={startAdd} className="bg-orange-600 hover:bg-orange-700 flex items-center gap-1">
                <Plus className="h-4 w-4" /> Yeni
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {(adding || editingId) && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-7 gap-3 bg-gray-700/40 p-4 rounded-lg text-sm">
              <div className="space-y-1">
                <Input placeholder="Kod (ör: 08-16)" value={draft.code} onChange={e=>setDraft(d=>({...d,code:e.target.value.trim()}))} className="bg-gray-800 border-gray-600 text-white" />
                <p className="text-[10px] text-gray-400">Kısa benzersiz kod</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Input placeholder="Etiket (ör: Sabah Vardiyası)" value={draft.label} onChange={e=>setDraft(d=>({...d,label:e.target.value}))} className="bg-gray-800 border-gray-600 text-white" />
                <p className="text-[10px] text-gray-400">Görünecek ad</p>
              </div>
              <div className="space-y-1">
                <Input type="time" title="Başlangıç saati" value={draft.startTime} onChange={e=>setDraft(d=>({...d,startTime:e.target.value}))} className="bg-gray-800 border-gray-600 text-white" />
                <p className="text-[10px] text-gray-400">Başlangıç</p>
              </div>
              <div className="space-y-1">
                <Input type="time" title="Bitiş saati" value={draft.endTime} onChange={e=>setDraft(d=>({...d,endTime:e.target.value}))} className="bg-gray-800 border-gray-600 text-white" />
                <p className="text-[10px] text-gray-400">Bitiş</p>
              </div>
              <div className="space-y-1">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  title="Sıra"
                  value={draft.order}
                  onChange={e=>{
                    const raw = e.target.value.replace(/[^0-9]/g,'')
                    const num = raw === '' ? 1 : parseInt(raw,10)
                    setDraft(d=>({...d,order: Math.max(1, num)}))
                  }}
                  onBlur={e=>{
                    if(!draft.order || draft.order < 1) setDraft(d=>({...d,order:1}))
                  }}
                  className="bg-gray-800 border-gray-600 text-white" />
                <p className="text-[10px] text-gray-400">Pozitif tam sayı (1,2,3...)</p>
              </div>
              <div className="flex flex-col items-start justify-center gap-1 pt-1">
                <button type="button" onClick={()=>setDraft(d=>({...d,isActive:!d.isActive}))} className="flex items-center gap-1 text-xs text-gray-200 px-3 py-2 rounded border border-gray-600 bg-gray-800 hover:bg-gray-700">
                  {draft.isActive ? <ToggleRight className="h-4 w-4 text-green-400"/> : <ToggleLeft className="h-4 w-4 text-gray-400"/>}
                  {draft.isActive ? 'Aktif' : 'Pasif'}
                </button>
                <p className="text-[10px] text-gray-400">Pasif ise oylamada görünmez</p>
              </div>
              <div className="flex gap-2 md:col-span-7 justify-end pt-1">
                <Button size="sm" onClick={cancel} variant="outline" className="border-gray-600 text-gray-300"><X className="h-4 w-4 mr-1"/>İptal</Button>
                {adding ? (
                  <Button size="sm" onClick={saveNew} disabled={!draft.code || !draft.label || !draft.startTime || !draft.endTime || draft.order < 1} className="bg-green-600 hover:bg-green-700"><Save className="h-4 w-4 mr-1"/>Kaydet</Button>
                ) : (
                  <Button size="sm" onClick={saveEdit} disabled={!draft.code || !draft.label || !draft.startTime || !draft.endTime || draft.order < 1} className="bg-green-600 hover:bg-green-700"><Save className="h-4 w-4 mr-1"/>Güncelle</Button>
                )}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shifts.map((shift) => (
              <Card key={shift.id} className="bg-gray-700/50 border-gray-600 relative overflow-hidden">
                <CardContent className="p-5 text-center space-y-3">
                  <div className="flex justify-end gap-2 absolute top-2 right-2">
                    <Button size="icon" variant="outline" onClick={()=>beginEdit(shift)} className="h-7 w-7 border-gray-600 text-gray-300"><Edit3 className="h-3 w-3"/></Button>
                    <Button size="icon" variant="outline" onClick={()=>deleteShift(shift.id)} className="h-7 w-7 border-gray-600 text-red-400 hover:text-red-300"><Trash2 className="h-3 w-3"/></Button>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto relative">
                    {!shift.isActive && <span className="absolute -top-1 -right-1 text-[10px] bg-gray-900 px-1 rounded border border-gray-600">PASİF</span>}
                    <Clock className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-white">{shift.label}</h3>
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 mb-1">{shift.code}</Badge>
                  <div className="text-sm text-gray-300 font-mono">{shift.startTime} - {shift.endTime}</div>
                  <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                    <Users className="h-3 w-3" /> Sıra: {shift.order}
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
