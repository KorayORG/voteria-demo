import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { getDb } from '@/lib/mongodb'

export async function GET() {
  try {
    const db = await getDb()

    // Get all tenants with user counts
    const tenants = await db.collection('tenants').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'tenantId',
          as: 'users'
        }
      },
      {
        $addFields: {
          userCount: { $size: '$users' },
          lastActivity: {
            $max: '$users.lastLogin'
          }
        }
      },
      {
        $project: {
          name: 1,
          slug: 1,
          isActive: 1,
          status: 1,
          createdAt: 1,
          userCount: 1,
          lastActivity: 1
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]).toArray()

    return NextResponse.json(tenants)
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')

    const db = await getDb()

    // Check if slug already exists
    const existingTenant = await db.collection('tenants').findOne({ slug })
    if (existingTenant) {
      return NextResponse.json(
        { error: 'A company with this name already exists' },
        { status: 400 }
      )
    }

    // Create new tenant
    const newTenant = {
      name: name.trim(),
      slug,
      description: description?.trim() || '',
      isActive: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('tenants').insertOne(newTenant)

    return NextResponse.json({
      _id: result.insertedId,
      ...newTenant
    })
  } catch (error) {
    console.error('Error creating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    )
  }
}
