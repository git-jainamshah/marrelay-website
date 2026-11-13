'use client'

import { useState } from 'react'

/**
 * Illustrative before/after for the web case study. All numbers are invented
 * to show the *kind* of shift we'd aim for - not a measured result.
 */
const ROWS = [
  { k: 'Page load (mobile)', unit: 's', before: 4.6, after: 1.8, max: 5, lowerIsBetter: true },
  { k: 'Visitors who bounce', unit: '%', before: 68, after: 41, max: 100, lowerIsBetter: true },
  { k: 'Enquiries / month', unit: '', before: 12, after: 28, max: 40, lowerIsBetter: false },
]

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

export default function WebBeforeAfter() {
  const [mode, setMode] = useState<'before' | 'after'>('after')
  const after = mode === 'after'

  return (
    <div className="vx">
      <div className="vx-top">
        <span className="vx-title">Current site vs. a reimagined one</span>
        <div className="vx-seg" role="group" aria-label="Compare">
          <button type="button" className={!after ? 'on' : ''} aria-pressed={!after} onClick={() => setMode('before')}>Current</button>
          <button type="button" className={after ? 'on' : ''} aria-pressed={after} onClick={() => setMode('after')}>Reimagined</button>
        </div>
      </div>

      <div className="vx-2col">
        {/* page mock */}
        <div className={`vx-mock${after ? ' is-after' : ''}`} aria-hidden="true">
          <div className="vx-mock-bar"><i /><i /><i /><span>{after ? 'yourbrand.com' : 'yourbrand.com/home-v2-final'}</span></div>
          {after ? (
            <div className="vx-mock-body focus">
              <span className="vx-mk-kick" />
              <span className="vx-mk-h" style={{ width: '82%' }} />
              <span className="vx-mk-h" style={{ width: '58%' }} />
              <span className="vx-mk-l" style={{ width: '64%' }} />
              <span className="vx-mk-cta">Book a call</span>
            </div>
          ) : (
            <div className="vx-mock-body busy">
              <div className="vx-mk-row"><span className="vx-mk-l" style={{ width: '22%' }} /><span className="vx-mk-l" style={{ width: '18%' }} /><span className="vx-mk-l" style={{ width: '20%' }} /><span className="vx-mk-l" style={{ width: '14%' }} /></div>
              <span className="vx-mk-blk" style={{ height: 40 }} />
              <span className="vx-mk-l" style={{ width: '94%' }} />
              <span className="vx-mk-l" style={{ width: '88%' }} />
              <span className="vx-mk-l" style={{ width: '91%' }} />
              <div className="vx-mk-row"><span className="vx-mk-blk" /><span className="vx-mk-blk" /><span className="vx-mk-blk" /></div>
              <span className="vx-mk-pop">Subscribe to our newsletter!</span>
            </div>
          )}
        </div>

        {/* metrics */}
        <div className="vx-metrics">
          {ROWS.map((r) => {
            const v = after ? r.after : r.before
            const delta = r.after - r.before
            return (
              <div key={r.k} className="vx-metric">
                <div className="vx-metric-top">
                  <span className="vx-lab">{r.k}</span>
                  {after && (
                    <span className="vx-delta">{delta > 0 ? '+' : '−'}{fmt(Math.abs(delta))}{r.unit}</span>
                  )}
                </div>
                <span className="vx-big">{fmt(v)}<small>{r.unit}</small></span>
                <span className="vx-track">
                  <span className="ghost" style={{ width: `${(r.before / r.max) * 100}%` }} />
                  <span className={`fill${after ? ' on' : ''}`} style={{ width: `${(v / r.max) * 100}%` }} />
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <p className="vx-note">
        Toggle between a cluttered, slow page and a focused, fast one. The figures are invented for illustration. A
        real project would start from your actual analytics, and the plan would be yours, not this one.
      </p>
    </div>
  )
}
