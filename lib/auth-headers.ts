export interface HeaderUserContext {
  userId?: string
  role?: string // legacy simple role code ('admin','kitchen','member') or dynamic role id
  permissions?: {
    canVote?: boolean
    kitchenView?: boolean
    kitchenManage?: boolean
    isAdmin?: boolean
  }
}

// Geçici header tabanlı kimlik çıkarımı (yerine JWT doğrulama gelmeli)
export function parseUserFromHeaders(headers: Headers): HeaderUserContext {
  return {
    userId: headers.get('x-user-id') || undefined,
    role: headers.get('x-user-role') || undefined,
  }
}

export function requireRole(ctx: HeaderUserContext, roles: string[]): { ok: boolean; error?: string } {
  if (!ctx.role) return { ok: false, error: 'Yetki yok' }
  if (!roles.includes(ctx.role)) return { ok: false, error: 'Yetki yok' }
  return { ok: true }
}

export function requirePermission(ctx: HeaderUserContext, perm: keyof NonNullable<HeaderUserContext['permissions']>): { ok: boolean; error?: string } {
  if (ctx.permissions?.isAdmin) return { ok: true }
  if (!ctx.permissions) return { ok: false, error: 'Yetki yok' }
  return ctx.permissions[perm] ? { ok: true } : { ok: false, error: 'Yetki yok' }
}

// ---- Dynamic permission resolution ----
// Caches role documents by id for a short TTL to reduce DB hits.
import clientPromise from '@/lib/mongodb'

interface CachedRole { permissions: any; expires: number; normalizedCode?: string }
const roleCache = new Map<string, CachedRole>()
const ROLE_TTL_MS = 60_000

// Fallback permission sets for legacy role strings if no roleId found
const legacyPermissionMap: Record<string, Required<NonNullable<HeaderUserContext['permissions']>>> = {
  admin: { canVote: true, kitchenView: true, kitchenManage: true, isAdmin: true },
  kitchen: { canVote: true, kitchenView: true, kitchenManage: false, isAdmin: false },
  member: { canVote: true, kitchenView: false, kitchenManage: false, isAdmin: false },
}

/**
 * Resolves permissions for the current request user.
 * Strategy:
 * 1. Load user by ctx.userId; if user has roleId, load role doc (cached) and copy permissions.
 * 2. If only legacy role string present, map via legacyPermissionMap.
 * 3. Ensure isAdmin implies all other permissions (inheritance).
 */
export async function resolvePermissions(ctx: HeaderUserContext): Promise<HeaderUserContext> {
  if (!ctx.userId) {
    // No user -> no permissions
    return ctx
  }
  try {
    const client = await clientPromise
    const db = client.db('cafeteria')
    const usersCol = db.collection('users')
    const user = await usersCol.findOne({ _id: new (require('mongodb').ObjectId)(ctx.userId) }).catch(() => null)
    if (user) {
      const roleId = (user as any).roleId
      if (roleId) {
        let cached = roleCache.get(roleId)
        const now = Date.now()
        if (!cached || cached.expires < now) {
          const roleDoc = await db.collection('roles').findOne({ _id: new (require('mongodb').ObjectId)(roleId) })
          if (roleDoc) {
            cached = {
              permissions: roleDoc.permissions || {},
              expires: now + ROLE_TTL_MS,
              normalizedCode: (roleDoc.name || '').toString().toLowerCase(),
            }
            roleCache.set(roleId, cached)
          }
        }
        if (cached) {
          ctx.role = roleId // treat as dynamic role id
          ctx.permissions = { ...(cached.permissions || {}) }
        }
      }
      // Fallback if still no permissions
      if (!ctx.permissions) {
        const legacyRole = (user as any).role || ctx.role
        if (legacyRole && legacyPermissionMap[legacyRole]) {
          ctx.permissions = { ...legacyPermissionMap[legacyRole] }
        }
      }
    } else if (ctx.role && legacyPermissionMap[ctx.role]) {
      ctx.permissions = { ...legacyPermissionMap[ctx.role] }
    }
  } catch (e) {
    // Silently fail -> no permissions applied
    console.error('resolvePermissions error', e)
  }
  // isAdmin inheritance
  if (ctx.permissions?.isAdmin) {
    ctx.permissions.canVote = true
    ctx.permissions.kitchenView = true
    ctx.permissions.kitchenManage = true
  }
  return ctx
}
