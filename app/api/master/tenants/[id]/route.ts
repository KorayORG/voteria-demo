import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, isActive } = await request.json()
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid tenant ID' },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()

    // Update tenant
    const result = await db.collection('tenants').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: name.trim(),
          isActive: Boolean(isActive),
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid tenant ID' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()

    // Check if tenant has users
    const userCount = await db.collection('users').countDocuments({
      tenantId: new ObjectId(id)
    })

    if (userCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete tenant with existing users. Please transfer or delete users first.' },
        { status: 400 }
      )
    }

    // Delete tenant and all related data
    await Promise.all([
      db.collection('tenants').deleteOne({ _id: new ObjectId(id) }),
      db.collection('suggestions').deleteMany({ tenantId: new ObjectId(id) }),
      db.collection('votes').deleteMany({ tenantId: new ObjectId(id) }),
      db.collection('menuItems').deleteMany({ tenantId: new ObjectId(id) })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tenant:', error)
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    )
  }
}
