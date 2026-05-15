import { useState, useEffect } from 'react'

const TARGET = new Date('2032-07-23T20:00:00+10:00')

function calc() {
  const diff = TARGET - Date.now()
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 }
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  }
}

export default function OlympicsCountdown({ large = false }) {
  const [t, setT] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000)
    return () => clearInterval(id)
  }, [])

  const numCls = large
    ? 'text-4xl lg:text-5xl font-black text-white tabular-nums'
    : 'text-2xl font-black text-white tabular-nums'
  const lblCls = large
    ? 'text-xs text-amber-400 font-semibold uppercase tracking-widest mt-1.5'
    : 'text-[10px] text-amber-400 font-semibold uppercase tracking-wider mt-1'
  const sepCls = large
    ? 'text-3xl font-bold text-white/25 pb-6'
    : 'text-xl font-bold text-white/25 pb-5'

  const units = [
    { v: t.d, l: 'Days' },
    { v: t.h, l: 'Hours' },
    { v: t.m, l: 'Mins' },
    { v: t.s, l: 'Secs' },
  ]

  return (
    <div className="flex items-center justify-center gap-1">
      {units.map(({ v, l }, i) => (
        <div key={l} className="flex items-center gap-1">
          <div className="text-center">
            <div className={numCls}>{String(v).padStart(2, '0')}</div>
            <div className={lblCls}>{l}</div>
          </div>
          {i < 3 && <div className={sepCls}>:</div>}
        </div>
      ))}
    </div>
  )
}
