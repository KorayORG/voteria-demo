import { NextRequest, NextResponse } from 'next/server'

export function assertMaster(request: NextRequest): NextResponse | null {
  const role = request.cookies.get('urole')?.value
  if (role !== 'master-admin') {
    return NextResponse.json({ error: 'Yetkisiz (master-admin gerekli)' }, { status: 401 })
  }
  return null
}

export function isMaster(request: NextRequest): boolean {
  return request.cookies.get('urole')?.value === 'master-admin'
}
