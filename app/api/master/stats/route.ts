import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db()

    // Get system-wide statistics
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalSuggestions,
      totalVotes
    ] = await Promise.all([
      db.collection('tenants').countDocuments(),
      db.collection('tenants').countDocuments({ isActive: true }),
      db.collection('users').countDocuments(),
      db.collection('suggestions').countDocuments(),
      db.collection('votes').countDocuments()
    ])

    return NextResponse.json({
      totalTenants,
      activeTenants,
      totalUsers,
      totalSuggestions,
      totalVotes
    })
  } catch (error) {
    console.error('Error fetching system stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system statistics' },
      { status: 500 }
    )
  }
}
