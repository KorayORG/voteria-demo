"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Search, Filter, UserCheck, UserX } from "lucide-react"
import { useAdminData } from "@/hooks/use-admin-data"
import type { User } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"

export function UserManagement() {
  const { users, roles, createUser, updateUser, deleteUser, userCreationCooldown } = useAdminData()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const [newUser, setNewUser] = useState({
    identityNumber: "",
    fullName: "",
    phone: "",
    roleId: "",
    isActive: true,
  })

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.identityNumber.includes(searchTerm) ||
      user.phone.includes(searchTerm)

    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? user.isActive : !user.isActive)

    return matchesSearch && matchesRole && matchesStatus
  })

  const handleCreateUser = async () => {
  if (!newUser.identityNumber || !newUser.fullName || !newUser.phone) {
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doldurun",
        variant: "destructive",
      })
      return
    }

    if (newUser.identityNumber.length !== 11) {
      toast({
        title: "Hata",
        description: "Kimlik numarası 11 haneli olmalıdır",
        variant: "destructive",
      })
      return
    }

    if (users.some((u) => u.identityNumber === newUser.identityNumber)) {
      toast({
        title: "Hata",
        description: "Bu kimlik numarası zaten kayıtlı",
        variant: "destructive",
      })
      return
    }

  const payload: any = { ...newUser }
  if (!payload.roleId) delete payload.roleId
  // backend geriye dönük uyum için role alanı isterse roleId eşleşen code'ya göre doldururuz
  const selectedRole = roles.find(r => r.id === payload.roleId)
  if (selectedRole) payload.role = selectedRole.code || 'member'
  const success = await createUser(payload)

    if (success) {
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla oluşturuldu",
      })
  setNewUser({ identityNumber: "", fullName: "", phone: "", roleId: "", isActive: true })
      setIsCreateDialogOpen(false)
    } else {
      toast({
        title: "Hata",
        description: userCreationCooldown > 0 ? `${userCreationCooldown} saniye bekleyin` : "Kullanıcı oluşturulamadı",
        variant: "destructive",
      })
    }
  }

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    const success = await updateUser(userId, updates)

    if (success) {
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla güncellendi",
      })
      setEditingUser(null)
    } else {
      toast({
        title: "Hata",
        description: "Kullanıcı güncellenemedi",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const success = await deleteUser(userId)

    if (success) {
      toast({
        title: "Başarılı",
        description: "Kullanıcı başarıyla silindi",
      })
    } else {
      toast({
        title: "Hata",
        description: "Kullanıcı silinemedi",
        variant: "destructive",
      })
    }
  }

  const getRoleBadgeColor = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      case "kitchen":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30"
      case "member":
      default:
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
    }
  }

  const getRoleLabel = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return "Yönetici"
      case "kitchen":
        return "Mutfak"
      case "member":
      default:
        return "Üye"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-500" />
              Kullanıcı Yönetimi
            </CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700" disabled={userCreationCooldown > 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  {userCreationCooldown > 0 ? `Bekleyin (${userCreationCooldown}s)` : "Yeni Kullanıcı"}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Yeni Kullanıcı Oluştur</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="identityNumber" className="text-gray-200">
                      Kimlik/Pasaport Numarası
                    </Label>
                    <Input
                      id="identityNumber"
                      value={newUser.identityNumber}
                      onChange={(e) =>
                        setNewUser((prev) => ({
                          ...prev,
                          identityNumber: e.target.value.replace(/\D/g, "").slice(0, 11),
                        }))
                      }
                      className="bg-gray-700 border-gray-600 text-white"
                      maxLength={11}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-200">
                      Ad Soyad
                    </Label>
                    <Input
                      id="fullName"
                      value={newUser.fullName}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, fullName: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-200">
                      Telefon
                    </Label>
                    <Input
                      id="phone"
                      value={newUser.phone}
                      onChange={(e) =>
                        setNewUser((prev) => ({
                          ...prev,
                          phone: e.target.value.replace(/\D/g, "").slice(0, 11),
                        }))
                      }
                      className="bg-gray-700 border-gray-600 text-white"
                      maxLength={11}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-200">Rol</Label>
                    <Select value={newUser.roleId || undefined} onValueChange={(value) => setNewUser(prev => ({ ...prev, roleId: value }))}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white"><SelectValue placeholder="Rol seç" /></SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600 max-h-72 overflow-y-auto">
                        {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleCreateUser} className="bg-blue-600 hover:bg-blue-700">
                      Oluştur
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="border-gray-600 text-gray-300 bg-transparent"
                    >
                      İptal
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Ad, kimlik numarası veya telefon ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all">Tüm Roller</SelectItem>
                  <SelectItem value="admin">Yönetici</SelectItem>
                  <SelectItem value="kitchen">Mutfak</SelectItem>
                  <SelectItem value="member">Üye</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700">
                <tr className="text-left">
                  <th className="p-4 text-gray-300 font-medium">Kullanıcı</th>
                  <th className="p-4 text-gray-300 font-medium">Kimlik No</th>
                  <th className="p-4 text-gray-300 font-medium">Telefon</th>
                  <th className="p-4 text-gray-300 font-medium">Rol</th>
                  <th className="p-4 text-gray-300 font-medium">Durum</th>
                  <th className="p-4 text-gray-300 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/25">
                    <td className="p-4">
                      <div>
                        <p className="text-white font-medium">{user.fullName}</p>
                        {user.activeFrom && user.activeTo && (
                          <p className="text-xs text-gray-400">
                            {user.activeFrom.toLocaleDateString("tr-TR")} - {user.activeTo.toLocaleDateString("tr-TR")}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">{user.identityNumber}</td>
                    <td className="p-4 text-gray-300">{user.phone}</td>
                    <td className="p-4">
                      <Badge className={getRoleBadgeColor(user.role)}>{getRoleLabel(user.role)}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge
                        className={user.isActive ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}
                      >
                        {user.isActive ? (
                          <>
                            <UserCheck className="h-3 w-3 mr-1" />
                            Aktif
                          </>
                        ) : (
                          <>
                            <UserX className="h-3 w-3 mr-1" />
                            Pasif
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Eski kullanıcıda roleId yoksa role code -> roleId eşle
                            const derivedRoleId = (user as any).roleId || roles.find(r => r.code === user.role)?.id
                            setEditingUser({ ...(user as any), roleId: derivedRoleId })
                          }}
                          className="border-gray-600 text-gray-300 bg-transparent"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateUser(user.id, { isActive: !user.isActive })}
                          className={user.isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                        >
                          {user.isActive ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-800 border-gray-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Kullanıcıyı Sil</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-300">
                                {user.fullName} kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri
                                alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-gray-600 text-gray-300 bg-transparent">
                                İptal
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="p-8 text-center">
                <UserX className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Kullanıcı bulunamadı</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Kullanıcı Düzenle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Ad Soyad</Label>
                <Input
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-200">Telefon</Label>
                <Input
                  value={editingUser.phone}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })
                  }
                  className="bg-gray-700 border-gray-600 text-white"
                  maxLength={11}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-gray-200">Rol</Label>
                  <Select
                    value={(editingUser as any).roleId || roles.find(r => r.code === editingUser.role)?.id || undefined}
                    onValueChange={(value) =>
                      setEditingUser((prev) => (prev ? { ...(prev as any), roleId: value } : prev))
                    }
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white"><SelectValue placeholder="Rol seç" /></SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 max-h-72 overflow-y-auto">
                      {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleUpdateUser(editingUser.id, editingUser as any)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Güncelle
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  className="border-gray-600 text-gray-300 bg-transparent"
                >
                  İptal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
