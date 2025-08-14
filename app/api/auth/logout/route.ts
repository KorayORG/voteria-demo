import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.set('uid', '', { path: '/', maxAge: 0 })
  res.cookies.set('urole', '', { path: '/', maxAge: 0 })
  return res
}
