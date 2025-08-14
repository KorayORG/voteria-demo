import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { parseUserFromHeaders, resolvePermissions, requirePermission } from '@/lib/auth-headers'

// Maps legacy role string -> role name substring to match
const matchMap: Record<string,string> = { admin: 'admin', kitchen: 'mutfak', member: 'üye' }

export async function POST(req: Request) {
  const ctx = await resolvePermissions(parseUserFromHeaders((req as any).headers))
  const authz = requirePermission(ctx, 'kitchenManage')
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: 403 })
  try {
    const client = await clientPromise
    const db = client.db('cafeteria')
    const roles = await db.collection('roles').find({}).toArray()
    const usersCol = db.collection('users')
    let updated = 0
    for await (const user of usersCol.find({ roleId: { $exists: false } })) {
      const legacy = (user as any).role
      if (!legacy) continue
      const target = roles.find(r => r.name.toLowerCase().includes(matchMap[legacy] || legacy))
      if (target) {
        await usersCol.updateOne({ _id: new ObjectId(user._id) }, { $set: { roleId: target._id, updatedAt: new Date() } })
        updated++
      }
    }
    return NextResponse.json({ migrated: updated })
  } catch (e:any) {
    console.error('POST /api/admin/migrate-users error', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
