import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

function getMondayOfISOWeek(week: string) {
  // week format: YYYY-Www
  const m = /(\d{4})-W(\d{2})/.exec(week)
  if (!m) return null
  const year = parseInt(m[1],10)
  const weekNo = parseInt(m[2],10)
  const simple = new Date(Date.UTC(year,0,1 + (weekNo - 1) * 7))
  const dow = simple.getUTCDay() || 7
  if (dow !== 1) simple.setUTCDate(simple.getUTCDate() - (dow - 1))
  return simple
}

// Aggregated weekly voting statistics based on real votes.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const week = searchParams.get('week')
    const shiftId = searchParams.get('shift')
    if (!week) return NextResponse.json({ error: 'week param gerekli' }, { status: 400 })
    const client = await clientPromise
    const db = client.db('cafeteria')
    const votesCol = db.collection('votes')

    const findQuery: any = { weekOfISO: week }
    if (shiftId) findQuery.shiftId = shiftId
    const votes = await votesCol.find(findQuery).project({ date: 1, choice: 1 }).toArray()
    const byDate: Record<string, { traditional: number; alternative: number }> = {}
    for (const v of votes) {
      const dayKey = new Date(v.date).toISOString().split('T')[0]
      if (!byDate[dayKey]) byDate[dayKey] = { traditional: 0, alternative: 0 }
      if (v.choice === 'traditional') byDate[dayKey].traditional++
      else byDate[dayKey].alternative++
    }
    // Build full 7-day array for the requested week
    const monday = getMondayOfISOWeek(week)
    const dayNamesTr = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi']
    const days = [] as any[]
    if (monday) {
      for (let i=0;i<7;i++) {
        const d = new Date(monday)
        d.setUTCDate(monday.getUTCDate() + i)
        const dayKey = d.toISOString().split('T')[0]
        const counts = byDate[dayKey] || { traditional: 0, alternative: 0 }
        const total = counts.traditional + counts.alternative
        days.push({
          date: d,
          dayName: dayNamesTr[d.getUTCDay()],
          traditional: { votes: counts.traditional, percentage: total ? Math.round(counts.traditional / total * 100) : 0 },
          alternative: { votes: counts.alternative, percentage: total ? Math.round(counts.alternative / total * 100) : 0 },
          totalVotes: total,
          externalAdjustment: { traditional: 0, alternative: 0 },
          finalCount: { traditional: counts.traditional, alternative: counts.alternative }
        })
      }
    }
    const totalVotes = days.reduce((s,d)=> s + d.totalVotes, 0)
    const averageParticipation = days.length ? Math.round(totalVotes / days.length) : 0
    return NextResponse.json({ weekOfISO: week, days, totalVotes, averageParticipation })
  } catch (e) {
    console.error('GET /api/statistics/weekly', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
