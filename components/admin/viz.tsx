'use client'

/**
 * Minimal, interactive, dependency-free charts for the admin dashboards.
 * One restrained palette (brand red + neutrals), real hover tooltips, a
 * shared Panel/Kpi/Seg so every dashboard reads the same way.
 */
import { useMemo, useRef, useState } from 'react'

export const VIZ = {
  red: '#D7262C', ink: '#0E0E0D', mut: '#6A6964', soft: '#B9B8B2', line: '#D8D6CE', paper: '#F2F1EC',
  sage: '#5F8F7A', blue: '#7B88BE', amber: '#D9A441', plum: '#8B5A8C',
}
/** Categorical order: red first, then calm neutrals/accents. */
export const SERIES = [VIZ.red, VIZ.ink, VIZ.sage, VIZ.blue, VIZ.amber, VIZ.plum, VIZ.mut, VIZ.soft]

const nf = new Intl.NumberFormat('en-CA')
export const fmtN = (n: number) => nf.format(Math.round(n))

/* ---------------- layout primitives ---------------- */

export function Panel({ title, sub, right, children, span }: { title: string; sub?: string; right?: React.ReactNode; children: React.ReactNode; span?: boolean }) {
  return (
    <section className={`ad-viz-panel${span ? ' span' : ''}`}>
      <header>
        <div><h3>{title}</h3>{sub && <p>{sub}</p>}</div>
        {right}
      </header>
      {children}
    </section>
  )
}

export function Kpi({ label, value, exact, delta, deltaLabel = 'vs previous period', sub, href, tone }: {
  label: string; value: React.ReactNode; exact?: string; delta?: number | null; deltaLabel?: string; sub?: string; href?: string; tone?: 'red' | 'ok'
}) {
  const has = typeof delta === 'number' && isFinite(delta) && delta !== 0
  const up = (delta ?? 0) > 0
  const body = (
    <div className={`ad-kpi${tone ? ` ${tone}` : ''}`}>
      <div className="l">{label}</div>
      <div className="v" title={exact}>{value}</div>
      <div className="s">
        {has && <span className={`d ${up ? 'up' : 'down'}`} title={deltaLabel}>{up ? '▲' : '▼'} {Math.abs(delta as number)}%</span>}
        {exact && <span className="x">{exact}</span>}
        {sub && <span>{sub}</span>}
      </div>
    </div>
  )
  return href ? <a href={href} className="ad-kpi-link">{body}</a> : body
}

export function Seg<T extends string>({ value, onChange, options, small }: { value: T; onChange: (v: T) => void; options: { v: T; l: string }[]; small?: boolean }) {
  return (
    <div className={`ad-seg${small ? ' small' : ''}`} role="tablist">
      {options.map((o) => (
        <button key={o.v} type="button" role="tab" aria-selected={o.v === value} className={o.v === value ? 'on' : ''} onClick={() => onChange(o.v)}>{o.l}</button>
      ))}
    </div>
  )
}

export function Empty({ text = 'Nothing to show yet.' }: { text?: string }) {
  return <div className="ad-viz-empty">{text}</div>
}

/* ---------------- tooltip ---------------- */

function useTip() {
  const [tip, setTip] = useState<{ x: number; y: number; node: React.ReactNode } | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const show = (e: React.MouseEvent, node: React.ReactNode) => {
    const r = wrap.current?.getBoundingClientRect()
    if (!r) return
    setTip({ x: e.clientX - r.left, y: e.clientY - r.top, node })
  }
  const hide = () => setTip(null)
  const el = tip ? (
    <div className="ad-tip" style={{ left: Math.min(tip.x + 12, (wrap.current?.clientWidth ?? 400) - 170), top: Math.max(0, tip.y - 44) }}>{tip.node}</div>
  ) : null
  return { wrap, show, hide, el }
}

/* ---------------- line / area over time ---------------- */

export type Pt = { date: string; value: number }
export type LineSeries = { name: string; data: Pt[]; color?: string }

export function LineChart({ series, height = 220, format = fmtN, unit = '' }: { series: LineSeries[]; height?: number; format?: (n: number) => string; unit?: string }) {
  const { wrap, show, hide, el } = useTip()
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const vis = series.filter((s) => !hidden.has(s.name))
  const n = Math.max(...series.map((s) => s.data.length), 0)
  const W = 760, padL = 44, padR = 12, padT = 12, padB = 26
  const innerW = W - padL - padR, innerH = height - padT - padB
  const max = Math.max(1, ...vis.flatMap((s) => s.data.map((d) => d.value)))
  const niceMax = useMemo(() => {
    const p = Math.pow(10, Math.floor(Math.log10(max)))
    const m = max / p
    const step = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10
    return step * p
  }, [max])
  const x = (i: number) => padL + (n > 1 ? (i / (n - 1)) * innerW : innerW / 2)
  const y = (v: number) => padT + innerH - (v / niceMax) * innerH
  const ticks = [0, niceMax / 2, niceMax]
  const labelEvery = Math.max(1, Math.ceil(n / 7))
  const dates = series[0]?.data.map((d) => d.date) ?? []
  const [hi, setHi] = useState<number | null>(null)

  if (!n) return <Empty />
  return (
    <div className="ad-viz" ref={wrap} onMouseLeave={() => { hide(); setHi(null) }}>
      {el}
      <svg viewBox={`0 0 ${W} ${height}`} className="ad-svg">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={VIZ.line} strokeWidth="1" />
            <text x={padL - 8} y={y(t) + 3.5} textAnchor="end" className="ax">{format(t)}{unit}</text>
          </g>
        ))}
        {vis.map((s, si) => {
          const c = s.color || SERIES[series.indexOf(s) % SERIES.length]
          const line = s.data.map((d, i) => `${x(i)},${y(d.value)}`).join(' L')
          const area = `M${x(0)},${padT + innerH} L${line} L${x(s.data.length - 1)},${padT + innerH} Z`
          return (
            <g key={s.name}>
              {si === 0 && <path d={area} fill={c} opacity={0.08} />}
              <path d={`M${line}`} fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          )
        })}
        {hi !== null && <line x1={x(hi)} x2={x(hi)} y1={padT} y2={padT + innerH} stroke={VIZ.ink} strokeWidth="1" strokeDasharray="2 3" opacity={.6} />}
        {dates.map((d, i) => (
          <g key={d}>
            <rect x={x(i) - (innerW / Math.max(1, n - 1)) / 2} y={padT} width={Math.max(6, innerW / Math.max(1, n - 1))} height={innerH} fill="transparent"
              onMouseMove={(e) => { setHi(i); show(e, (
                <>
                  <b>{d}</b>
                  {vis.map((s) => <span key={s.name}><i style={{ background: s.color || SERIES[series.indexOf(s) % SERIES.length] }} />{s.name}: <b>{format(s.data[i]?.value ?? 0)}{unit}</b></span>)}
                </>
              )) }} />
            {hi === i && vis.map((s) => <circle key={s.name} cx={x(i)} cy={y(s.data[i]?.value ?? 0)} r="3.5" fill={s.color || SERIES[series.indexOf(s) % SERIES.length]} stroke="#fff" strokeWidth="1.5" />)}
            {i % labelEvery === 0 && <text x={x(i)} y={height - 7} textAnchor="middle" className="ax">{d.length > 7 ? d.slice(5) : d}</text>}
          </g>
        ))}
      </svg>
      {series.length > 1 && (
        <div className="ad-legend">
          {series.map((s, i) => (
            <button key={s.name} type="button" className={hidden.has(s.name) ? 'off' : ''}
              onClick={() => setHidden((h) => { const nh = new Set(h); nh.has(s.name) ? nh.delete(s.name) : nh.add(s.name); return nh })}>
              <i style={{ background: s.color || SERIES[i % SERIES.length] }} />{s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- vertical bars (grouped or stacked) ---------------- */

export type BarSeries = { name: string; values: number[]; color?: string }

export function BarChart({ labels, series, stacked, height = 220, format = fmtN }: { labels: string[]; series: BarSeries[]; stacked?: boolean; height?: number; format?: (n: number) => string }) {
  const { wrap, show, hide, el } = useTip()
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const vis = series.filter((s) => !hidden.has(s.name))
  const n = labels.length
  const W = 760, padL = 52, padR = 12, padT = 12, padB = 26
  const innerW = W - padL - padR, innerH = height - padT - padB
  const max = Math.max(1, ...labels.map((_, i) => stacked ? vis.reduce((a, s) => a + (s.values[i] || 0), 0) : Math.max(...vis.map((s) => s.values[i] || 0))))
  const p = Math.pow(10, Math.floor(Math.log10(max))); const m = max / p
  const niceMax = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p
  const slot = innerW / Math.max(1, n)
  const gw = Math.min(slot * 0.62, 56)
  const bw = stacked ? gw : gw / Math.max(1, vis.length)
  const y = (v: number) => padT + innerH - (v / niceMax) * innerH
  const [hi, setHi] = useState<number | null>(null)
  if (!n) return <Empty />
  return (
    <div className="ad-viz" ref={wrap} onMouseLeave={() => { hide(); setHi(null) }}>
      {el}
      <svg viewBox={`0 0 ${W} ${height}`} className="ad-svg">
        {[0, niceMax / 2, niceMax].map((t) => (
          <g key={t}><line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={VIZ.line} /><text x={padL - 8} y={y(t) + 3.5} textAnchor="end" className="ax">{format(t)}</text></g>
        ))}
        {labels.map((lab, i) => {
          const x0 = padL + i * slot + (slot - gw) / 2
          let acc = 0
          return (
            <g key={lab} opacity={hi === null || hi === i ? 1 : 0.45}>
              <rect x={padL + i * slot} y={padT} width={slot} height={innerH} fill="transparent"
                onMouseMove={(e) => { setHi(i); show(e, (<><b>{lab}</b>{vis.map((s) => <span key={s.name}><i style={{ background: s.color || SERIES[series.indexOf(s) % SERIES.length] }} />{s.name}: <b>{format(s.values[i] || 0)}</b></span>)}</>)) }} />
              {vis.map((s, si) => {
                const v = s.values[i] || 0
                const c = s.color || SERIES[series.indexOf(s) % SERIES.length]
                if (stacked) {
                  const yTop = y(acc + v), h = y(acc) - yTop
                  acc += v
                  return <rect key={s.name} x={x0} y={yTop} width={bw} height={Math.max(0, h)} fill={c} pointerEvents="none" />
                }
                return <rect key={s.name} x={x0 + si * bw} y={y(v)} width={Math.max(1, bw - 2)} height={Math.max(0, padT + innerH - y(v))} fill={c} pointerEvents="none" />
              })}
              {(n <= 14 || i % Math.ceil(n / 12) === 0) && <text x={padL + i * slot + slot / 2} y={height - 7} textAnchor="middle" className="ax">{lab}</text>}
            </g>
          )
        })}
      </svg>
      {series.length > 1 && (
        <div className="ad-legend">
          {series.map((s, i) => (
            <button key={s.name} type="button" className={hidden.has(s.name) ? 'off' : ''}
              onClick={() => setHidden((h) => { const nh = new Set(h); nh.has(s.name) ? nh.delete(s.name) : nh.add(s.name); return nh })}>
              <i style={{ background: s.color || SERIES[i % SERIES.length] }} />{s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- horizontal breakdown ---------------- */

export function Breakdown({ data, format = fmtN, top = 8, onPick, mono }: { data: { label: string; value: number }[]; format?: (n: number) => string; top?: number; onPick?: (label: string) => void; mono?: boolean }) {
  const [all, setAll] = useState(false)
  const rows = all ? data : data.slice(0, top)
  const total = data.reduce((s, d) => s + d.value, 0)
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (!data.length) return <Empty />
  return (
    <div className="ad-bd">
      {rows.map((r, i) => (
        <button type="button" key={r.label} className={`ad-bd-row${onPick ? ' pick' : ''}`} onClick={() => onPick?.(r.label)} title={total ? `${Math.round((r.value / total) * 100)}% of total` : undefined}>
          <span className="lb">{r.label}</span>
          <span className="tr"><i style={{ width: `${(r.value / max) * 100}%`, background: mono ? VIZ.ink : SERIES[i % SERIES.length] }} /></span>
          <span className="vl">{format(r.value)}</span>
          <span className="pc">{total ? `${Math.round((r.value / total) * 100)}%` : ''}</span>
        </button>
      ))}
      {data.length > top && <button type="button" className="ad-bd-more" onClick={() => setAll(!all)}>{all ? 'Show fewer' : `Show all ${data.length}`}</button>}
    </div>
  )
}

/* ---------------- share bar / donut ---------------- */

export function Share({ data, format = fmtN }: { data: { label: string; value: number }[]; format?: (n: number) => string }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return <Empty />
  const rows = data.slice(0, 6)
  return (
    <div>
      <div className="ad-share">
        {rows.map((r, i) => <i key={r.label} style={{ width: `${(r.value / total) * 100}%`, background: SERIES[i % SERIES.length] }} title={`${r.label}: ${format(r.value)} (${Math.round((r.value / total) * 100)}%)`} />)}
      </div>
      <div className="ad-legend static">
        {rows.map((r, i) => <span key={r.label}><i style={{ background: SERIES[i % SERIES.length] }} />{r.label} <b>{Math.round((r.value / total) * 100)}%</b></span>)}
      </div>
    </div>
  )
}

/* ---------------- funnel ---------------- */

export type FunnelStep = { key: string; label: string; count: number; ofTop: number; dropFromPrev: number; dropPct: number; optional?: boolean; errors?: number }

/** Vertical funnel: each step's width is its share of the top, with the
 *  people lost since the previous required step called out beside it. */
export function Funnel({ steps }: { steps: FunnelStep[] }) {
  if (!steps.length || steps[0].count === 0) return <Empty text="No form activity yet in this period." />
  return (
    <div className="ad-funnel">
      {steps.map((s, i) => (
        <div key={s.key} className={`ad-fn-step${s.optional ? ' opt' : ''}${i === steps.length - 1 ? ' last' : ''}`}>
          <div className="hd">
            <span className="lb">{s.label}{s.optional && <em> optional</em>}</span>
            <span className="ct"><b>{fmtN(s.count)}</b><small>{s.ofTop}%</small></span>
          </div>
          <div className="tr"><i style={{ width: `${Math.max(s.ofTop, s.count > 0 ? 1.5 : 0)}%` }} /></div>
          {s.dropFromPrev > 0 && !s.optional && (
            <div className="dp">
              <span className="x">−{fmtN(s.dropFromPrev)}</span> left here ({s.dropPct}% of the step before)
              {!!s.errors && <span className="er">{fmtN(s.errors)} hit a validation error</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
