import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Maintenance mode gate: block all non-auth routes when active (simple redirect)
export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const path = url.pathname
  if (path.startsWith('/api') || path.startsWith('/_next') || path.startsWith('/favicon') || path.startsWith('/public')) {
    return NextResponse.next()
  }
  if (path.startsWith('/auth')) {
    return NextResponse.next()
  }
  try {
    const apiUrl = new URL('/api/admin/system-settings', req.url)
    const resp = await fetch(apiUrl.toString(), { headers: { 'x-mw': '1' }, cache: 'no-store' })
    if (resp.ok) {
      const data = await resp.json().catch(()=>null)
      const settings = data?.settings
      if (settings?.maintenanceMode) {
        const role = req.cookies.get('urole')?.value
        if (role !== 'admin') {
          const loginUrl = new URL('/auth/login', req.url)
          loginUrl.searchParams.set('m', '1')
          return NextResponse.redirect(loginUrl)
        }
      }
    }
  } catch {}
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
