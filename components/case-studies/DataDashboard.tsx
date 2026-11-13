'use client'

import { useState } from 'react'

/**
 * Illustrative mini-dashboard for the data case study. Sample data only -
 * a way to show the kind of clarity clean tracking gives, not real figures.
 */
const CHANNELS = [
  { k: 'Organic', sessions: 4200, conversions: 92 },
  { k: 'Paid', sessions: 3100, conversions: 74 },
  { k: 'Direct', sessions: 2400, conversions: 48 },
  { k: 'Social', sessions: 1800, conversions: 26 },
  { k: 'Email', sessions: 900, conversions: 31 },
]

export default function DataDashboard() {
  const [metric, setMetric] = useState<'sessions' | 'conversions'>('sessions')
  const [active, setActive] = useState<string | null>(null)
  const vals = CHANNELS.map((c) => c[metric])
  const max = Math.max(...vals)
  const total = vals.reduce((a, b) => a + b, 0)
  const top = CHANNELS.reduce((a, b) => (b[metric] > a[metric] ? b : a))
  const sel = CHANNELS.find((c) => c.k === active)
  const share = sel ? Math.round((sel[metric] / total) * 100) : null

  const W = 640, H = 240, padL = 8, padR = 8, base = H - 30, top0 = 26
  const slot = (W - padL - padR) / CHANNELS.length
  const bw = Math.min(64, slot * 0.56)
  const grid = [0.25, 0.5, 0.75, 1]

  return (
    <div className="vx">
      <div className="vx-top">
        <span className="vx-title">A dashboard you&apos;d actually open</span>
        <div className="vx-seg" role="group" aria-label="Metric">
          <button type="button" className={metric === 'sessions' ? 'on' : ''} aria-pressed={metric === 'sessions'} onClick={() => setMetric('sessions')}>Sessions</button>
          <button type="button" className={metric === 'conversions' ? 'on' : ''} aria-pressed={metric === 'conversions'} onClick={() => setMetric('conversions')}>Conversions</button>
        </div>
      </div>

      <div className="vx-kpis">
        <div><span className="vx-lab">Total {metric}</span><span className="vx-big">{total.toLocaleString()}</span></div>
        <div><span className="vx-lab">Top channel</span><span className="vx-big">{top.k}</span></div>
        <div>
          <span className="vx-lab">Selected</span>
          <span className={`vx-big${sel ? ' red' : ' mute'}`}>{sel ? `${sel.k} · ${share}%` : 'Tap a bar'}</span>
        </div>
      </div>

      <svg className="vx-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${metric} by channel`}>
        {grid.map((g) => (
          <line key={g} x1={padL} x2={W - padR} y1={base - (base - top0) * g} y2={base - (base - top0) * g} className="gl" />
        ))}
        <line x1={padL} x2={W - padR} y1={base} y2={base} className="axis" />
        {CHANNELS.map((c, i) => {
          const v = c[metric]
          const bh = Math.round(((base - top0) * v) / max)
          const x = padL + i * slot + (slot - bw) / 2
          const y = base - bh
          const on = active === c.k
          const dim = !!active && !on
          return (
            <g key={c.k} className="bw" onClick={() => setActive(on ? null : c.k)} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(on ? null : c.k) } }}
              aria-pressed={on} aria-label={`${c.k}: ${v.toLocaleString()} ${metric}`}>
              <rect x={x - 6} y={top0 - 18} width={bw + 12} height={base - top0 + 18} fill="transparent" />
              <rect className={`bar${on ? ' on' : ''}${dim ? ' dim' : ''}`} x={x} y={y} width={bw} height={bh} />
              <text className="val" x={x + bw / 2} y={y - 8} textAnchor="middle">{v.toLocaleString()}</text>
              <text className="cat" x={x + bw / 2} y={H - 10} textAnchor="middle">{c.k.toUpperCase()}</text>
            </g>
          )
        })}
      </svg>

      <p className="vx-note">
        Switch the metric, tap a bar to focus a channel. Sample numbers only: the point is that once tracking is clean,
        you can finally see which channels earn and which just spend.
      </p>
    </div>
  )
}
