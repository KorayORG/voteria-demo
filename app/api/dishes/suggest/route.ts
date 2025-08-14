import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

interface AggregatedDish {
  name: string
  description?: string
  imageUrl?: string
  tags?: string[]
  usageCount: number
}

// In-memory cache + recent picks
const dishCache: { timestamp: number; data: AggregatedDish[]; tagCounts: Map<string, number> } = { timestamp: 0, data: [], tagCounts: new Map() }
let recentPicks: string[] = [] // lower-case
const CACHE_TTL_MS = 60_000

export function registerDishPick(name: string) {
  const k = name.toLowerCase()
  recentPicks = [k, ...recentPicks.filter(x=>x!==k)].slice(0,50)
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  const la = a.length; const lb = b.length
  if (la === 0) return lb; if (lb === 0) return la
  const v0 = new Array(lb + 1)
  const v1 = new Array(lb + 1)
  for (let i = 0; i <= lb; i++) v0[i] = i
  for (let i = 0; i < la; i++) {
    v1[0] = i + 1
    for (let j = 0; j < lb; j++) {
      const cost = a[i] === b[j] ? 0 : 1
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost)
    }
    for (let j = 0; j <= lb; j++) v0[j] = v1[j]
  }
  return v1[lb]
}

function scoreDish(query: string, dish: AggregatedDish): number {
  const q = query.toLowerCase()
  const n = dish.name.toLowerCase()
  if (!q) return dish.usageCount
  let score = 0
  if (n === q) score += 100
  if (n.startsWith(q)) score += 40
  if (n.includes(q)) score += 15
  const dist = levenshtein(n, q)
  const maxLen = Math.max(n.length, q.length)
  const similarity = 1 - dist / maxLen
  score += similarity * 25
  score += Math.min(dish.usageCount, 10) // small bonus for frequency
  return score
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = (searchParams.get('q') || '').trim()

    // Build cache if stale
    if (Date.now() - dishCache.timestamp > CACHE_TTL_MS) {
      const client = await clientPromise
      const db = client.db('cafeteria')
      const col = db.collection('menus')
      const menus = await col.find({}, { projection: { days: 1 } }).toArray()
      const map = new Map<string, AggregatedDish>()
      const tagCounts = new Map<string, number>()
      for (const m of menus) {
        const days = (m as any).days || []
        for (const d of days) {
          for (const key of ['traditional','alternative'] as const) {
            const dish = d[key]
            if (dish && dish.name) {
              const name = dish.name.trim()
              const k = name.toLowerCase()
              if (!map.has(k)) {
                map.set(k, { name, description: dish.description, imageUrl: dish.imageUrl, tags: dish.tags, usageCount: 1 })
              } else {
                const agg = map.get(k)!
                agg.usageCount++
                if (!agg.description && dish.description) agg.description = dish.description
                if (!agg.imageUrl && dish.imageUrl) agg.imageUrl = dish.imageUrl
                if (dish.tags && dish.tags.length) {
                  const existing = new Set(agg.tags || [])
                  for (const t of dish.tags) existing.add(t)
                  agg.tags = Array.from(existing)
                }
              }
              if (dish.tags) for (const t of dish.tags) tagCounts.set(t, (tagCounts.get(t) || 0) + 1)
            }
          }
        }
      }
      const base = Array.from(map.values())
      base.forEach(d => { if (d.tags) d.tags = d.tags.sort((a,b)=> (tagCounts.get(b)||0) - (tagCounts.get(a)||0)) })
      dishCache.timestamp = Date.now()
      dishCache.data = base
      dishCache.tagCounts = tagCounts
    }

    let dishes = dishCache.data.slice()
    if (query.length >= 2) {
      dishes = dishes
        .map(d => ({ d, s: scoreDish(query, d) }))
        .filter(x => x.s > 0)
        .sort((a,b) => b.s - a.s)
        .slice(0, 10)
        .map(x => x.d)
    } else {
      if (recentPicks.length) {
        const order = new Map<string, number>()
        recentPicks.forEach((n, idx) => order.set(n, idx))
        dishes = dishes.sort((a,b) => {
          const ao = order.has(a.name.toLowerCase()) ? -1000 + (order.get(a.name.toLowerCase())||0) : 0
          const bo = order.has(b.name.toLowerCase()) ? -1000 + (order.get(b.name.toLowerCase())||0) : 0
          if (ao !== bo) return ao - bo
            return b.usageCount - a.usageCount
        }).slice(0,10)
      } else {
        dishes = dishes.sort((a,b) => b.usageCount - a.usageCount).slice(0, 10)
      }
    }

    return NextResponse.json({ suggestions: dishes })
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
