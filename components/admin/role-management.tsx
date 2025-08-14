"use client"
import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminData } from '@/hooks/use-admin-data'
import { Plus, Trash2, Save, Shield } from 'lucide-react'

const defaultPerms = { canVote:true, kitchenView:false, kitchenManage:false, isAdmin:false }

export function RoleManagement() {
  const { roles, createRole, updateRole, deleteRole } = useAdminData()
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ name:'', color:'#888888', order: roles.length+1, permissions: defaultPerms })
  const [editingId, setEditingId] = useState<string|null>(null)
  const [editDraft, setEditDraft] = useState<any>(null)

  const startAdd = () => { setDraft({ name:'', color:'#888888', order: roles.length+1, permissions: defaultPerms }); setAdding(true); setEditingId(null) }
  const cancel = () => { setAdding(false); setEditingId(null); setEditDraft(null) }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2"><Shield className="h-5 w-5 text-purple-400"/> Roller</CardTitle>
        {!adding && !editingId && <Button size="sm" onClick={startAdd} className="bg-purple-600"><Plus className="h-4 w-4 mr-1"/>Yeni Rol</Button>}
      </CardHeader>
      <CardContent className="space-y-6">
        {(adding) && (
          <div className="p-4 bg-gray-700/40 rounded-lg space-y-3">
            <div className="grid md:grid-cols-6 gap-3 text-sm">
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">İsim</label>
                <Input value={draft.name} onChange={e=> setDraft(d=> ({...d, name: e.target.value}))} className="bg-gray-800 border-gray-600 text-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Renk</label>
                <Input type="color" value={draft.color} onChange={e=> setDraft(d=> ({...d, color: e.target.value}))} className="bg-gray-800 border-gray-600 h-10" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Sıra</label>
                <Input type="number" min={1} value={draft.order} onChange={e=> setDraft(d=> ({...d, order: e.target.valueAsNumber}))} className="bg-gray-800 border-gray-600" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <span className="block text-xs text-gray-400">İzinler</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(draft.permissions).map(([k,v]) => (
                    <button type="button" key={k} onClick={()=> setDraft(d=> ({...d, permissions:{...d.permissions, [k]: !v}}))} className={`px-2 py-1 rounded text-xs border ${v? 'bg-green-600/60 border-green-500 text-white':'bg-gray-700 border-gray-600 text-gray-300'}`}>{k}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={cancel} className="border-gray-600 text-gray-300">İptal</Button>
              <Button size="sm" disabled={!draft.name} onClick={async ()=> { const ok = await createRole(draft); if(ok) cancel() }} className="bg-green-600"><Save className="h-4 w-4 mr-1"/>Kaydet</Button>
            </div>
          </div>
        )}
        <div className="grid md:grid-cols-3 gap-4">
          {roles.map(r => {
            const isEditing = editingId === r.id
            return (
              <div key={r.id} className="p-4 bg-gray-700/40 rounded-lg border border-gray-600 space-y-3">
                {isEditing ? (
                  <Input value={editDraft?.name} onChange={e=> setEditDraft((d:any)=> ({...d, name:e.target.value}))} className="bg-gray-800 border-gray-600 text-white" />
                ) : (
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{background:r.color}}></span><span className="text-white font-medium">{r.name}</span></div>
                )}
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {Object.entries(r.permissions).map(([k,v]) => (
                    <span key={k} className={`px-1.5 py-0.5 rounded border ${v?'bg-green-600/50 border-green-500 text-white':'bg-gray-800 border-gray-600 text-gray-400 line-through'}`}>{k}</span>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(editDraft.permissions).map(([k,v]:any) => (
                      <button key={k} type="button" onClick={()=> setEditDraft((d:any)=> ({...d, permissions:{...d.permissions,[k]:!v}}))} className={`px-2 py-1 rounded text-xs border ${v? 'bg-green-600/60 border-green-500 text-white':'bg-gray-700 border-gray-600 text-gray-300'}`}>{k}</button>
                    ))}
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  {isEditing ? (
                    <>
                      <Button size="sm" variant="outline" onClick={()=> { setEditingId(null); setEditDraft(null) }} className="border-gray-600 text-gray-300">İptal</Button>
                      <Button size="sm" onClick={async ()=> { const ok = await updateRole(r.id, editDraft); if(ok) { setEditingId(null); setEditDraft(null) } }} className="bg-green-600">Kaydet</Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={()=> { setEditingId(r.id); setEditDraft({ name:r.name, color:r.color, order:r.order, permissions:{...r.permissions} }) }} className="border-gray-600 text-gray-300">Düzenle</Button>
                      <Button size="sm" variant="outline" onClick={()=> deleteRole(r.id)} className="border-red-500 text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4"/></Button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
