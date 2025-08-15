import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collections = await db.listCollections().toArray();
    return NextResponse.json({
      status: 'healthy',
      dbStatus: 'connected',
      collections: collections.map(c => c.name),
    });
  } catch (error: any) {
    console.error('[health] DB connection error:', error?.message);
    return NextResponse.json({
      status: 'degraded',
      dbStatus: 'unavailable',
      error: error?.message,
    }, { status: 503 });
  }
}
