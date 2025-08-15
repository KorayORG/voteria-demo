"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import {
  Building2,
  Users,
  Activity,
  Plus,
  Edit,
  Trash2,
  Search,
  TerminalSquare,
  Shield,
  Wrench,
  RefreshCcw,
  Slash,
  AlertTriangle,
  Crown,
} from "lucide-react"

interface Tenant {
  _id: string
  name: string
  slug: string
  isActive: boolean
  createdAt: string
  userCount: number
  lastActivity: string
}

interface SystemStats {
  totalTenants: number
  activeTenants: number
  totalUsers: number
  totalSuggestions: number
  totalVotes: number
}

interface AuditLog {
  id: string
  action: string
  actorName: string
  actorIdentityNumber?: string
  entity: string
  targetName?: string
  tenantId?: string
  createdAt: string
  meta?: Record<string, any>
}

interface GlobalUserRow {
  id: string
  identityNumber: string
  fullName: string
  phone: string
  role: string
  isActive: boolean
  tenantId?: string
  createdAt?: string
  lastLogin?: string
}

export default function MasterDashboard() {
  const { user } = useAuth()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  // Audit states
  const [activeTab, setActiveTab] = useState("companies")
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditSearch, setAuditSearch] = useState("")
  const [auditActionFilter, setAuditActionFilter] = useState("")
  const [auditTenantFilter, setAuditTenantFilter] = useState("")
  const [auditCursor, setAuditCursor] = useState<string | null>(null)
  const [auditHasMore, setAuditHasMore] = useState(false)

  // Global users state
  const [globalUsers, setGlobalUsers] = useState<GlobalUserRow[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersSearch, setUsersSearch] = useState("")
  const [usersRole, setUsersRole] = useState("")
  const [usersTenant, setUsersTenant] = useState("")
  const [usersStatus, setUsersStatus] = useState<"all" | "active" | "inactive">("all")
  const [usersCursor, setUsersCursor] = useState<string | null>(null)
  const [usersHasMore, setUsersHasMore] = useState(false)
  const [maintenanceLoading, setMaintenanceLoading] = useState(false)
  const [maintenanceGlobal, setMaintenanceGlobal] = useState<{
    maintenanceMode: boolean
    message?: string
    until?: string | null
  }>({ maintenanceMode: false })
  const [maintenanceTenants, setMaintenanceTenants] = useState<
    { tenantId: string; maintenanceMode: boolean; message?: string; until?: string | null }[]
  >([])
  const [maintenanceMessage, setMaintenanceMessage] = useState("")
  const [maintenanceUntil, setMaintenanceUntil] = useState("")
  const [securityLoading, setSecurityLoading] = useState(false)
  const [securityData, setSecurityData] = useState<any>(null)
  const [securityRange, setSecurityRange] = useState<"24h" | "7d" | "30d">("24h")
  const [securityAutoRefresh, setSecurityAutoRefresh] = useState(true)
  useEffect(() => {
    if (!securityAutoRefresh) return
    const id = setInterval(() => {
      if (activeTab === "security") fetchSecurity()
    }, 15000)
    return () => clearInterval(id)
  }, [securityAutoRefresh, activeTab, securityRange])

  const loadGlobalUsers = async (reset = false) => {
    try {
      setUsersLoading(true)
      const params: Record<string, string> = { limit: "50" }
      if (usersSearch) params.search = usersSearch
      if (usersRole) params.role = usersRole
      if (usersTenant) params.tenant = usersTenant
      if (usersStatus === "active") params.isActive = "true"
      if (usersStatus === "inactive") params.isActive = "false"
      if (!reset && usersCursor) params.cursor = usersCursor
      const qs = serializeQuery(params)
      const res = await fetch(`/api/master/users?${qs}`)
      if (!res.ok) throw new Error("fetch failed")
      const data = await res.json()
      setUsersHasMore(data.hasMore)
      setUsersCursor(data.nextCursor)
      setGlobalUsers((prev) => (reset ? data.users : [...prev, ...data.users]))
    } catch (e) {
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" })
    } finally {
      setUsersLoading(false)
    }
  }

  const toggleUserActive = async (row: GlobalUserRow) => {
    const old = row.isActive
    setGlobalUsers((prev) => prev.map((u) => (u.id === row.id ? { ...u, isActive: !old } : u)))
    try {
      const res = await fetch("/api/master/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: row.id, isActive: !old }),
      })
      if (!res.ok) throw new Error()
      toast({ title: "Updated", description: `${row.fullName} ${!old ? "activated" : "deactivated"}` })
    } catch (e) {
      // revert
      setGlobalUsers((prev) => prev.map((u) => (u.id === row.id ? { ...u, isActive: old } : u)))
      toast({ title: "Error", description: "Failed to update user status", variant: "destructive" })
    }
  }

  const loadAuditLogs = async (reset = false) => {
    try {
      setAuditLoading(true)
      const params: Record<string, string> = { limit: "50" }
      if (auditSearch) params.search = auditSearch
      if (auditActionFilter) params.action = auditActionFilter
      if (auditTenantFilter) params.tenant = auditTenantFilter
      if (!reset && auditCursor) params.cursor = auditCursor
      const qs = serializeQuery(params)
      const res = await fetch(`/api/master/audit-logs?${qs}`)
      if (!res.ok) throw new Error("fetch failed")
      const data = await res.json()
      setAuditHasMore(data.hasMore)
      setAuditCursor(data.nextCursor)
      setAuditLogs((prev) => (reset ? data.logs : [...prev, ...data.logs]))
    } catch (e) {
      toast({ title: "Error", description: "Failed to load audit logs", variant: "destructive" })
    } finally {
      setAuditLoading(false)
    }
  }

  const exportAuditCsv = () => {
    if (auditLogs.length === 0) return
    const headers = ["createdAt", "action", "actorName", "actorIdentityNumber", "entity", "targetName", "tenantId"]
    const rows = auditLogs.map((l) => headers.map((h) => (l as any)[h] || ""))
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-logs-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (!user || user.currentRole !== "master" || user.currentTenant !== "secye") {
      window.location.href = "/auth/login"
      return
    }
    fetchSystemData()
    fetchMaintenance()
    fetchSecurity()
  }, [user])

  const fetchSystemData = async () => {
    try {
      setLoading(true)
      const [tenantsResponse, statsResponse] = await Promise.all([
        fetch("/api/master/tenants"),
        fetch("/api/master/stats"),
      ])

      if (tenantsResponse.ok) {
        const tenantsData = await tenantsResponse.json()
        setTenants(tenantsData)
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setSystemStats(statsData)
      }
    } catch (error) {
      console.error("Error fetching system data:", error)
      toast({
        title: "Error",
        description: "Failed to load system data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMaintenance = async () => {
    try {
      setMaintenanceLoading(true)
      const res = await fetch("/api/master/maintenance")
      if (res.ok) {
        const data = await res.json()
        setMaintenanceGlobal(data.global)
        setMaintenanceMessage(data.global.message || "")
        setMaintenanceUntil(data.global.until ? new Date(data.global.until).toISOString().slice(0, 16) : "")
        setMaintenanceTenants(data.tenants)
      }
    } finally {
      setMaintenanceLoading(false)
    }
  }
  const updateMaintenance = async (
    scope: "global" | "tenant",
    tenantId?: string,
    values?: { maintenanceMode?: boolean; message?: string; until?: string },
  ) => {
    try {
      const body: any = { scope }
      if (scope === "tenant") body.tenantId = tenantId
      if (values?.maintenanceMode !== undefined) body.maintenanceMode = values.maintenanceMode
      if (values?.message !== undefined) body.message = values.message
      if (values?.until !== undefined) body.until = values.until || null
      const res = await fetch("/api/master/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast({ title: "Saved", description: "Maintenance settings updated" })
      fetchMaintenance()
    } catch (e) {
      toast({ title: "Error", description: "Failed to update maintenance", variant: "destructive" })
    }
  }
  const fetchSecurity = async () => {
    try {
      setSecurityLoading(true)
      const res = await fetch(`/api/master/security?range=${securityRange}`)
      if (res.ok) setSecurityData(await res.json())
    } finally {
      setSecurityLoading(false)
    }
  }

  // Company CRUD handlers (inside component scope)
  const handleCreateTenant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    try {
      const response = await fetch("/api/master/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          description: formData.get("description"),
        }),
      })
      if (response.ok) {
        toast({ title: "Success", description: "Tenant created successfully" })
        setIsCreateDialogOpen(false)
        fetchSystemData()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.message || "Failed to create tenant", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create tenant", variant: "destructive" })
    }
  }

  const handleEditTenant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedTenant) return
    const formData = new FormData(e.currentTarget)
    try {
      const response = await fetch(`/api/master/tenants/${selectedTenant._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          isActive: formData.get("isActive") === "on",
        }),
      })
      if (response.ok) {
        toast({ title: "Success", description: "Tenant updated successfully" })
        setIsEditDialogOpen(false)
        setSelectedTenant(null)
        fetchSystemData()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.message || "Failed to update tenant", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update tenant", variant: "destructive" })
    }
  }

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm("Are you sure you want to delete this tenant? This action cannot be undone.")) return
    try {
      const response = await fetch(`/api/master/tenants/${tenantId}`, { method: "DELETE" })
      if (response.ok) {
        toast({ title: "Success", description: "Tenant deleted successfully" })
        fetchSystemData()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.message || "Failed to delete tenant", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete tenant", variant: "destructive" })
    }
  }

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="h-8 w-8 text-amber-500" />
          <h1 className="text-3xl font-bold">Master Admin Dashboard</h1>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            Seç Ye Platform
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Manage tenants, monitor system-wide activity, and control platform settings
        </p>
      </div>

      {/* System Stats */}
      {systemStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalTenants}</div>
              <p className="text-xs text-muted-foreground">{systemStats.activeTenants} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Suggestions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalSuggestions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalVotes}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v)
          if (v === "audit" && auditLogs.length === 0) loadAuditLogs(true)
        }}
        className="space-y-4"
      >
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="companies">Tenants</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tenant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Tenant</DialogTitle>
                  <DialogDescription>Add a new tenant to the system</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTenant} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Tenant Name</Label>
                    <Input id="name" name="name" placeholder="Enter tenant name" required />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" placeholder="Enter tenant description" />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Tenant</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tenants List */}
          <div className="grid gap-4">
            {filteredTenants.map((tenant) => (
              <Card key={tenant._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {tenant.name}
                        <Badge variant={tenant.isActive ? "default" : "secondary"}>
                          {tenant.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Slug: {tenant.slug} • {tenant.userCount} users
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTenant(tenant)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteTenant(tenant._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(tenant.createdAt).toLocaleDateString()} • Last Activity:{" "}
                    {tenant.lastActivity ? new Date(tenant.lastActivity).toLocaleDateString() : "Never"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
              <CardDescription>Analytics functionality coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Detailed analytics and reporting features will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Global Users
                  </CardTitle>
                  <CardDescription>Cross-tenant user directory & controls</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => loadGlobalUsers(true)} disabled={usersLoading}>
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-col md:flex-row md:items-end gap-2">
                <div className="relative md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search (name, id, phone)"
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    className="pl-7"
                  />
                </div>
                <Input
                  placeholder="Role (admin/kitchen/member)"
                  value={usersRole}
                  onChange={(e) => setUsersRole(e.target.value)}
                  className="md:w-48"
                />
                <Input
                  placeholder="Tenant (slug)"
                  value={usersTenant}
                  onChange={(e) => setUsersTenant(e.target.value)}
                  className="md:w-40"
                />
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant={usersStatus === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUsersStatus("all")}
                  >
                    All
                  </Button>
                  <Button
                    type="button"
                    variant={usersStatus === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUsersStatus("active")}
                  >
                    Active
                  </Button>
                  <Button
                    type="button"
                    variant={usersStatus === "inactive" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUsersStatus("inactive")}
                  >
                    Inactive
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setUsersCursor(null)
                    loadGlobalUsers(true)
                  }}
                  disabled={usersLoading}
                >
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setUsersSearch("")
                    setUsersRole("")
                    setUsersTenant("")
                    setUsersStatus("all")
                    setUsersCursor(null)
                    loadGlobalUsers(true)
                  }}
                >
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border rounded-md overflow-hidden">
                <div className="grid grid-cols-12 bg-muted/40 text-xs font-medium uppercase tracking-wide px-3 py-2">
                  <div className="col-span-3">User</div>
                  <div className="col-span-2">Identity</div>
                  <div className="col-span-2">Phone</div>
                  <div className="col-span-1">Role</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2">Tenant</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
                {globalUsers.map((u) => (
                  <div
                    key={u.id}
                    className="grid grid-cols-12 px-3 py-2 text-sm items-center border-t border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="col-span-3 truncate" title={u.fullName}>
                      {u.fullName}
                    </div>
                    <div className="col-span-2 font-mono text-xs" title={u.identityNumber}>
                      {u.identityNumber}
                    </div>
                    <div className="col-span-2 text-xs" title={u.phone}>
                      {u.phone}
                    </div>
                    <div className="col-span-1">
                      <span className="inline-block rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                        {u.role}
                      </span>
                    </div>
                    <div className="col-span-1">
                      {u.isActive ? (
                        <span className="text-green-500 text-[11px] font-medium">Active</span>
                      ) : (
                        <span className="text-red-500 text-[11px] font-medium">Inactive</span>
                      )}
                    </div>
                    <div className="col-span-2 truncate text-xs" title={u.tenantId}>
                      {u.tenantId || "-"}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[11px] bg-transparent"
                        onClick={() => toggleUserActive(u)}
                      >
                        {u.isActive ? (
                          <>
                            <Slash className="h-3 w-3 mr-1" />
                            Disable
                          </>
                        ) : (
                          "Enable"
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
                {usersLoading && globalUsers.length === 0 && (
                  <div className="px-3 py-4 text-sm text-muted-foreground">Loading...</div>
                )}
                {!usersLoading && globalUsers.length === 0 && (
                  <div className="px-3 py-4 text-sm text-muted-foreground">No users found</div>
                )}
              </div>
              {usersHasMore && (
                <div className="flex justify-center">
                  <Button variant="outline" size="sm" disabled={usersLoading} onClick={() => loadGlobalUsers(false)}>
                    {usersLoading ? "Loading..." : "Load more"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-col gap-1">
                <CardTitle className="flex items-center gap-2">
                  <TerminalSquare className="h-4 w-4" />
                  Audit Logs
                </CardTitle>
                <CardDescription>System-wide immutable activity feed</CardDescription>
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative md:w-60">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="pl-7"
                  />
                </div>
                <Input
                  placeholder="Action (e.g. ROLE_CREATED)"
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value.toUpperCase())}
                  className="md:w-56"
                />
                <Input
                  placeholder="Tenant (slug/id)"
                  value={auditTenantFilter}
                  onChange={(e) => setAuditTenantFilter(e.target.value)}
                  className="md:w-48"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    setAuditCursor(null)
                    loadAuditLogs(true)
                  }}
                  disabled={auditLoading}
                >
                  Apply
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportAuditCsv()} disabled={auditLogs.length === 0}>
                  Export CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAuditSearch("")
                    setAuditActionFilter("")
                    setAuditTenantFilter("")
                    setAuditCursor(null)
                    loadAuditLogs(true)
                  }}
                >
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border rounded-md divide-y bg-background/40">
                {auditLogs.map((log) => {
                  const badgeClass =
                    log.action === "ACCOUNT_LOCKED"
                      ? "bg-red-600 text-white"
                      : log.action === "ACCOUNT_UNLOCKED"
                        ? "bg-green-600 text-white"
                        : log.action === "MAINTENANCE_UPDATED"
                          ? "bg-amber-600 text-white"
                          : "bg-muted text-foreground"
                  return (
                    <div key={log.id} className="p-3 text-sm hover:bg-muted/40 transition-colors">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-1">
                        <span className={`font-semibold px-1.5 py-0.5 rounded ${badgeClass}`}>{log.action}</span>
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                        {log.tenantId && <span className="bg-muted rounded px-1.5 py-0.5">{log.tenantId}</span>}
                        <span className="bg-muted rounded px-1.5 py-0.5">{log.entity}</span>
                      </div>
                      <div className="leading-tight">
                        <span className="font-medium">{log.actorName}</span>
                        {log.actorIdentityNumber && (
                          <span className="text-muted-foreground"> ({log.actorIdentityNumber})</span>
                        )}
                        {" → "}
                        <span>{log.targetName || "-"}</span>
                      </div>
                      {log.meta && Object.keys(log.meta).length > 0 && (
                        <details className="mt-1 group">
                          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                            Meta
                          </summary>
                          <pre className="mt-1 bg-black/30 rounded p-2 text-[11px] max-h-48 overflow-auto">
                            {JSON.stringify(log.meta, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  )
                })}
                {auditLoading && auditLogs.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground">Loading...</div>
                )}
                {!auditLoading && auditLogs.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground">No logs found</div>
                )}
              </div>
              {auditHasMore && (
                <div className="flex justify-center">
                  <Button variant="outline" size="sm" disabled={auditLoading} onClick={() => loadAuditLogs(false)}>
                    {auditLoading ? "Loading..." : "Load more"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security Center
                  </CardTitle>
                  <CardDescription>Login attempt metrics (initial)</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex border rounded overflow-hidden">
                    {["24h", "7d", "30d"].map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setSecurityRange(r as any)
                        }}
                        className={`px-2 py-1 text-xs ${securityRange === r ? "bg-primary text-primary-foreground" : "bg-transparent"} transition-colors`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setSecurityAutoRefresh((v) => !v)}
                    className={`text-xs px-2 py-1 rounded border ${securityAutoRefresh ? "bg-green-600 text-white" : "bg-transparent"}`}
                  >
                    {securityAutoRefresh ? "Auto" : "Manual"}
                  </button>
                  <Button variant="outline" size="sm" onClick={() => fetchSecurity()} disabled={securityLoading}>
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {securityLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
              {securityData && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-3 rounded border bg-background/50">
                      <div className="text-xs uppercase text-muted-foreground">Failed ({securityRange})</div>
                      <div className="text-2xl font-semibold text-red-500">{securityData.failedWindow}</div>
                    </div>
                    <div className="p-3 rounded border bg-background/50">
                      <div className="text-xs uppercase text-muted-foreground">Success ({securityRange})</div>
                      <div className="text-2xl font-semibold text-green-500">{securityData.successWindow}</div>
                    </div>
                    <div className="p-3 rounded border bg-background/50">
                      <div className="text-xs uppercase text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Top Risk ID
                      </div>
                      <div className="text-sm font-medium">
                        {securityData.topFailedIdentities?.[0]?.identityNumber || "-"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {securityData.topFailedIdentities?.[0]?.count || 0} failures (7d)
                      </div>
                    </div>
                  </div>
                  {securityData.bruteForce &&
                    (securityData.bruteForce.identities.length > 0 || securityData.bruteForce.ips.length > 0) && (
                      <div className="border rounded p-3 bg-amber-50/10">
                        <h4 className="text-sm font-medium flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="h-4 w-4" />
                          Brute-force Alerts (last {securityData.bruteForce.shortWindowMinutes}m)
                        </h4>
                        <div className="mt-2 grid gap-4 md:grid-cols-2">
                          <div>
                            <div className="text-xs font-semibold mb-1">
                              Identities over threshold ({securityData.bruteForce.threshold}+ fails)
                            </div>
                            <div className="space-y-1 text-xs max-h-40 overflow-auto pr-1">
                              {securityData.bruteForce.identities.map((i: any) => (
                                <div key={i.identityNumber} className="flex justify-between gap-2">
                                  <span className="font-mono">{i.identityNumber}</span>
                                  <span className="font-medium">{i.count}</span>
                                </div>
                              ))}
                              {securityData.bruteForce.identities.length === 0 && (
                                <div className="text-muted-foreground">None</div>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold mb-1">
                              IPs over threshold ({securityData.bruteForce.threshold}+ fails)
                            </div>
                            <div className="space-y-1 text-xs max-h-40 overflow-auto pr-1">
                              {securityData.bruteForce.ips.map((i: any) => (
                                <div key={i.ip} className="flex justify-between gap-2">
                                  <span>{i.ip}</span>
                                  <span className="font-medium">{i.count}</span>
                                </div>
                              ))}
                              {securityData.bruteForce.ips.length === 0 && (
                                <div className="text-muted-foreground">None</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Top Failed Identities (7d)</h4>
                      <div className="space-y-1 text-xs">
                        {securityData.topFailedIdentities?.map((i: any) => (
                          <div key={i.identityNumber} className="flex justify-between">
                            <span>{i.identityNumber}</span>
                            <span className="font-medium">{i.count}</span>
                          </div>
                        )) || <div>-</div>}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Top Failed IPs (7d)</h4>
                      <div className="space-y-1 text-xs">
                        {securityData.topFailedIPs?.map((i: any) => (
                          <div key={i.ip} className="flex justify-between">
                            <span>{i.ip}</span>
                            <span className="font-medium">{i.count}</span>
                          </div>
                        )) || <div>-</div>}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Recent Failures</h4>
                    <div className="border rounded divide-y bg-background/40">
                      {securityData.recentFailures?.map((f: any, idx: number) => (
                        <div key={idx} className="p-2 text-xs flex flex-wrap gap-2 items-center">
                          <span className="font-mono">{f.identityNumber}</span>
                          <span className="text-red-500">{f.reason}</span>
                          <span className="text-muted-foreground">{f.tenantSlug || "-"}</span>
                          <span className="text-muted-foreground">{f.ip}</span>
                          <span>{new Date(f.createdAt).toLocaleString()}</span>
                        </div>
                      ))}
                      {(!securityData.recentFailures || securityData.recentFailures.length === 0) && (
                        <div className="p-2 text-xs text-muted-foreground">No data</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Active Locks</h4>
                    <div className="border rounded divide-y bg-background/40">
                      {securityData.activeLocks?.map((l: any, idx: number) => (
                        <div key={idx} className="p-2 text-xs flex flex-wrap gap-2 items-center">
                          <span className="font-mono">{l.identityNumber}</span>
                          <span className="text-amber-600">LOCKED</span>
                          <span className="text-muted-foreground">{l.tenantSlug || "-"}</span>
                          <span className="text-muted-foreground">Until: {new Date(l.until).toLocaleTimeString()}</span>
                          <button
                            onClick={async () => {
                              try {
                                await fetch("/api/master/security", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ identityNumber: l.identityNumber, tenantSlug: l.tenantSlug }),
                                })
                                toast({ title: "Unlocked", description: l.identityNumber })
                                fetchSecurity()
                              } catch {
                                toast({ title: "Error", description: "Unlock failed", variant: "destructive" })
                              }
                            }}
                            className="ml-auto border px-2 py-0.5 rounded hover:bg-muted text-[10px]"
                          >
                            Unlock
                          </button>
                        </div>
                      ))}
                      {(!securityData.activeLocks || securityData.activeLocks.length === 0) && (
                        <div className="p-2 text-xs text-muted-foreground">No active locks</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Maintenance Mode
                  </CardTitle>
                  <CardDescription>Global & per-tenant controls</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchMaintenance()} disabled={maintenanceLoading}>
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Global Maintenance</h4>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={maintenanceGlobal.maintenanceMode}
                    onCheckedChange={(v) => {
                      setMaintenanceGlobal((g) => ({ ...g, maintenanceMode: v }))
                      updateMaintenance("global", undefined, {
                        maintenanceMode: v,
                        message: maintenanceMessage,
                        until: maintenanceUntil ? new Date(maintenanceUntil).toISOString() : "",
                      })
                    }}
                  />
                  <span className="text-sm">{maintenanceGlobal.maintenanceMode ? "Enabled" : "Disabled"}</span>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="maint-msg">Message</Label>
                    <Input
                      id="maint-msg"
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      placeholder="e.g. Planned maintenance until 02:00"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="maint-until">Until (optional)</Label>
                    <Input
                      id="maint-until"
                      type="datetime-local"
                      value={maintenanceUntil}
                      onChange={(e) => setMaintenanceUntil(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      updateMaintenance("global", undefined, {
                        maintenanceMode: maintenanceGlobal.maintenanceMode,
                        message: maintenanceMessage,
                        until: maintenanceUntil ? new Date(maintenanceUntil).toISOString() : "",
                      })
                    }
                    disabled={maintenanceLoading}
                  >
                    Save Global
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMaintenanceMessage(maintenanceGlobal.message || "")
                      setMaintenanceUntil(
                        maintenanceGlobal.until ? new Date(maintenanceGlobal.until).toISOString().slice(0, 16) : "",
                      )
                    }}
                  >
                    Revert
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Per-Tenant Overrides</h4>
                <div className="border rounded divide-y bg-background/40">
                  {tenants.map((t) => {
                    const entry = maintenanceTenants.find((m) => m.tenantId === t.slug)
                    const enabled = entry?.maintenanceMode || false
                    return (
                      <div key={t._id} className="p-2 flex flex-wrap items-center gap-3 text-sm">
                        <span className="font-medium">{t.name}</span>
                        <div className="flex items-center gap-2 ml-auto">
                          <Switch
                            checked={enabled}
                            onCheckedChange={(v) => updateMaintenance("tenant", t.slug, { maintenanceMode: v })}
                          />
                          <span className="text-xs text-muted-foreground w-16">{enabled ? "Enabled" : "Disabled"}</span>
                        </div>
                      </div>
                    )
                  })}
                  {tenants.length === 0 && <div className="p-2 text-xs text-muted-foreground">No tenants</div>}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>Update tenant information</DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <form onSubmit={handleEditTenant} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Tenant Name</Label>
                <Input id="edit-name" name="name" defaultValue={selectedTenant.name} required />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="edit-active" name="isActive" defaultChecked={selectedTenant.isActive} />
                <Label htmlFor="edit-active">Active</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setSelectedTenant(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Tenant</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
      /* subtle animation for list items */
      [data-radix-tabs-content] .p-3 { animation: fadeIn .25s ease }
      @keyframes fadeIn { from { opacity:0; transform:translateY(2px) } to { opacity:1; transform:translateY(0) } }
    `}</style>
    </div>
  )
}

// Client-side helper functions appended (kept inside file for now)
function serializeQuery(params: Record<string, string | number | undefined | null>) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v))
  })
  return sp.toString()
}
