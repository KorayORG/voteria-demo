"use client"

import { useEffect, useState } from 'react'

interface DriftLantern { id: number; dx: number; dy: number; dur: number; delay: number; scale: number; opacity: number }

// Single render ephemeral Ramadan effect: only on full page reload & when ramadan theme active
export function RamadanOverlay() {
  const [lanterns, setLanterns] = useState<DriftLantern[]>([])
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!document.body.classList.contains('theme-ramadan')) return
    // Detect full reload (not SPA navigation)
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const isReload = nav ? nav.type === 'reload' : (performance as any).navigation?.type === 1
    if (!isReload) return
    // Prevent double-run in same session (fast refresh etc.)
    if ((window as any).__ramadanEffectDone) return
    ;(window as any).__ramadanEffectDone = true
    const count = 20
    const created: DriftLantern[] = []
    for (let i=0;i<count;i++) {
      const angle = Math.random()*Math.PI*2
      const radius = 260 + Math.random()*420 // 260-680px uzaklaşma
      const dx = Math.cos(angle)*radius
      const dy = Math.sin(angle)*radius
      const dur = 4200 + Math.random()*3600 // 4.2s - 7.8s
      const delay = Math.random()*500 // 0-0.5s gecikme
      const scale = 0.35 + Math.random()*0.55
      const opacity = 0.08 + Math.random()*0.10 // daha şeffaf
      created.push({ id:i, dx, dy, dur, delay, scale, opacity })
    }
    setLanterns(created)
    setActive(true)
    // Auto cleanup after max duration + small buffer
    const maxDur = Math.max(...created.map(l=> l.dur + l.delay))
    const t = setTimeout(()=> setActive(false), maxDur + 800)
    return () => clearTimeout(t)
  }, [])

  if (!active || lanterns.length===0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[999] overflow-hidden select-none">
      {lanterns.map(l => (
        <LanternInstance key={l.id} data={l} />
      ))}
    </div>
  )
}

function LanternInstance({ data }: { data: DriftLantern }) {
  const { dx, dy, dur, delay, scale, opacity } = data
  const style: React.CSSProperties = {
    '--dx': `${dx}px`,
    '--dy': `${dy}px`,
    '--s': scale.toString(),
    '--o': opacity.toString(),
    '--dur': `${dur}ms`,
    '--delay': `${delay}ms`,
  } as any
  return (
    <div
      className="absolute top-1/2 left-1/2 lantern-anim"
      style={style}
    >
      <LanternSVG />
    </div>
  )
}

function LanternSVG() {
  return (
    <svg width="42" height="92" viewBox="0 0 56 120" fill="none" style={{ transform: 'translate(-50%, -50%) scale(var(--s))' }} className="absolute top-1/2 left-1/2">
      <defs>
        <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <rect x="22" y="6" width="12" height="8" rx="2" fill="#F8AF17" opacity="0.25" />
      <rect x="16" y="14" width="24" height="52" rx="6" fill="url(#rg)" stroke="#fcd34d" strokeOpacity="0.25" strokeWidth="1" />
      <rect x="22" y="66" width="12" height="8" rx="2" fill="#F8AF17" opacity="0.25" />
      <circle cx="28" cy="40" r="8" fill="#fff8e1" fillOpacity="0.25" />
    </svg>
  )
}
