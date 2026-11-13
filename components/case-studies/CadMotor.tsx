'use client'

import { useState } from 'react'

/**
 * Illustrative exploded electric-motor assembly for the engineering case study.
 * Pure SVG (no 3D libraries) rendered as a CAD "viewport". Drag to explode,
 * spin the rotor and fan, tilt the view, and toggle labels/dimensions.
 * A sample part - dimensions are invented to show how we document, not a real drawing.
 */

const CY = 200
// v3 viewport palette: paper linework on ink, red for dimensions and highlights
const LINE = 'rgba(242,241,236,.88)'
const DIM = 'rgba(242,241,236,.42)'
const ACC = '#FF6B6F'
const VOID = '#0E0E0D'

function Cyl({ x1, x2, ry, rx, fill, stroke = LINE, sw = 1.4 }: {
  x1: number; x2: number; ry: number; rx: number; fill: string; stroke?: string; sw?: number
}) {
  return (
    <g>
      <ellipse cx={x1} cy={CY} rx={rx} ry={ry} fill={fill} stroke={DIM} strokeWidth={sw} />
      <rect x={x1} y={CY - ry} width={x2 - x1} height={ry * 2} fill={fill} />
      <line x1={x1} y1={CY - ry} x2={x2} y2={CY - ry} stroke={stroke} strokeWidth={sw} />
      <line x1={x1} y1={CY + ry} x2={x2} y2={CY + ry} stroke={stroke} strokeWidth={sw} />
      <ellipse cx={x2} cy={CY} rx={rx} ry={ry} fill={fill} stroke={stroke} strokeWidth={sw} />
    </g>
  )
}

function Ring({ cx, ry, rx, inner }: { cx: number; ry: number; rx: number; inner: number }) {
  const bolts = [0.55, -0.55]
  return (
    <g>
      <ellipse cx={cx} cy={CY} rx={rx} ry={ry} fill="rgba(242,241,236,.06)" stroke={LINE} strokeWidth="1.4" />
      <ellipse cx={cx} cy={CY} rx={rx * 0.72} ry={inner} fill={VOID} stroke={DIM} strokeWidth="1.2" />
      {bolts.map((b) => (
        <ellipse key={b} cx={cx} cy={CY + b * ry} rx={3} ry={4.5} fill="none" stroke={DIM} strokeWidth="1" />
      ))}
    </g>
  )
}

function Blades({ cx }: { cx: number }) {
  return (
    <g>
      {Array.from({ length: 7 }).map((_, i) => (
        <path key={i} transform={`rotate(${(360 / 7) * i} ${cx} ${CY})`}
          d={`M${cx} ${CY} q 10 -6 30 -30 q -6 22 -30 30 Z`}
          fill="rgba(255,107,111,.16)" stroke={ACC} strokeWidth="1" />
      ))}
      <circle cx={cx} cy={CY} r="9" fill="#1A1A18" stroke={LINE} strokeWidth="1.3" />
    </g>
  )
}

const LABELS = [
  { x: 175, y: 118, t: 'Output shaft', lx: 175, ly: 190 },
  { x: 250, y: 300, t: 'Drive-end cap', lx: 250, ly: 250 },
  { x: 400, y: 84, t: 'Stator housing', lx: 380, ly: 128 },
  { x: 330, y: 312, t: 'Rotor & windings', lx: 330, ly: 234 },
  { x: 470, y: 300, t: 'Cooling fan', lx: 452, ly: 240 },
]

export default function CadMotor() {
  const [explode, setExplode] = useState(38)
  const [tilt, setTilt] = useState(50)
  const [spin, setSpin] = useState(true)
  const [labels, setLabels] = useState(true)
  const [dims, setDims] = useState(false)
  const [wire, setWire] = useState(false)

  const e = explode / 100
  const tiltDeg = (tilt - 50) / 5
  const body = wire ? 'none' : 'url(#cadBody)'
  const core = wire ? 'none' : 'rgba(255,107,111,.12)'

  const shaftDx = -e * 150
  const driveDx = -e * 112
  const rotorDx = -e * 46
  const ndDx = e * 112
  const fanDx = e * 168
  const coverDx = e * 206
  const termLift = -e * 74

  return (
    <div className="vx">
      <div className="vx-top">
        <span className="vx-title">Exploded motor assembly</span>
        <div className="vx-chips">
          <button type="button" className={spin ? 'on' : ''} aria-pressed={spin} onClick={() => setSpin((v) => !v)}>Spin</button>
          <button type="button" className={labels ? 'on' : ''} aria-pressed={labels} onClick={() => setLabels((v) => !v)}>Labels</button>
          <button type="button" className={dims ? 'on' : ''} aria-pressed={dims} onClick={() => setDims((v) => !v)}>Dimensions</button>
          <button type="button" className={wire ? 'on' : ''} aria-pressed={wire} onClick={() => setWire((v) => !v)}>Wireframe</button>
        </div>
      </div>

      <div className="vx-cad">
        <div className="vx-cad-bar">
          <span>MOTOR-ASSY-01</span><span>REV A</span><span className="sp" /><span>SCALE 1:2</span><span>UNITS MM</span>
        </div>

        <svg viewBox="0 0 680 380" style={{ width: '100%', display: 'block' }} role="img" aria-label="Interactive exploded electric motor assembly">
          <defs>
            <linearGradient id="cadBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(242,241,236,.16)" />
              <stop offset="0.5" stopColor="rgba(242,241,236,.06)" />
              <stop offset="1" stopColor="rgba(242,241,236,.02)" />
            </linearGradient>
            <pattern id="cadGrid" width="26" height="26" patternUnits="userSpaceOnUse">
              <path d="M26 0 H0 V26" fill="none" stroke="#262624" strokeWidth="1" />
            </pattern>
          </defs>

          <rect x="0" y="0" width="680" height="380" fill="url(#cadGrid)" opacity="0.6" />
          <line x1="40" y1={CY} x2="640" y2={CY} stroke="rgba(255,107,111,.45)" strokeWidth="1" strokeDasharray="10 4 2 4" />

          <g transform={`rotate(${tiltDeg} 340 ${CY})`}>
            {/* Output shaft */}
            <g transform={`translate(${shaftDx} 0)`}>
              <Cyl x1={150} x2={252} ry={8} rx={4} fill={wire ? 'none' : 'rgba(242,241,236,.18)'} />
            </g>

            {/* Drive-end cap */}
            <g transform={`translate(${driveDx} 0)`}>
              <Ring cx={252} ry={62} rx={14} inner={30} />
            </g>

            {/* Rotor: shaft + laminated core + windings (spins) */}
            <g transform={`translate(${rotorDx} 0)`}>
              <Cyl x1={252} x2={452} ry={8} rx={4} fill={wire ? 'none' : 'rgba(242,241,236,.18)'} />
              <Cyl x1={288} x2={372} ry={38} rx={12} fill={core} stroke={ACC} />
              {!wire && Array.from({ length: 9 }).map((_, i) => (
                <line key={i} x1={288 + i * 10.5} y1={CY - 34} x2={288 + i * 10.5} y2={CY + 34} stroke="rgba(255,107,111,.35)" strokeWidth="1" />
              ))}
              {/* spinning end star on the output side */}
              <g className={spin ? 'cad-spin' : ''}>
                <g stroke={ACC} strokeWidth="1.2" fill="none">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <line key={i} transform={`rotate(${60 * i} 288 ${CY})`} x1={288} y1={CY} x2={288} y2={CY - 30} />
                  ))}
                </g>
                <circle cx={288} cy={CY} r={6} fill="#1A1A18" stroke={LINE} strokeWidth="1.2" />
              </g>
            </g>

            {/* Stator housing + fins + terminal box */}
            <g>
              <Cyl x1={288} x2={402} ry={74} rx={18} fill={body} />
              {!wire && Array.from({ length: 10 }).map((_, i) => (
                <line key={i} x1={294 + i * 11} y1={CY - 74} x2={294 + i * 11} y2={CY - 40} stroke="rgba(242,241,236,.3)" strokeWidth="1.4" />
              ))}
              <ellipse cx={402} cy={CY} rx={18} ry={40} fill={VOID} stroke={DIM} strokeWidth="1.2" />
              <g transform={`translate(0 ${termLift})`}>
                <rect x={316} y={CY - 104} width={48} height={30} rx={5} fill="rgba(242,241,236,.08)" stroke={LINE} strokeWidth="1.3" />
              </g>
            </g>

            {/* Non-drive-end cap */}
            <g transform={`translate(${ndDx} 0)`}>
              <Ring cx={410} ry={62} rx={14} inner={28} />
            </g>

            {/* Cooling fan (spins) */}
            <g transform={`translate(${fanDx} 0)`}>
              <g className={spin ? 'cad-spin' : ''}>
                <Blades cx={452} />
              </g>
            </g>

            {/* Fan cover */}
            <g transform={`translate(${coverDx} 0)`}>
              <ellipse cx={476} cy={CY} rx={16} ry={58} fill="rgba(242,241,236,.05)" stroke={LINE} strokeWidth="1.4" />
              {Array.from({ length: 5 }).map((_, i) => (
                <line key={i} x1={476} y1={CY - 44 + i * 22} x2={476} y2={CY - 44 + i * 22} stroke={DIM} />
              ))}
              <ellipse cx={476} cy={CY} rx={9} ry={30} fill="none" stroke={DIM} strokeWidth="1" />
            </g>

            {/* Dimensions */}
            {dims && (
              <g fontFamily="var(--v-f2)" fontSize="10.5" fill={ACC} style={{ fontStretch: '125%' }}>
                <line x1={288} y1={90} x2={402} y2={90} stroke={ACC} strokeWidth="1" />
                <line x1={288} y1={86} x2={288} y2={94} stroke={ACC} strokeWidth="1" />
                <line x1={402} y1={86} x2={402} y2={94} stroke={ACC} strokeWidth="1" />
                <text x={345} y={84} textAnchor="middle">L 180.0</text>
                <text x={430} y={CY + 4}>&#8709;148 h7</text>
                <text x={150} y={CY - 14} fill={DIM}>&#8709;24 shaft</text>
              </g>
            )}

            {/* Labels */}
            {labels && (
              <g fontFamily="var(--v-sans)" fontSize="10" fill={LINE}>
                {LABELS.map((l) => (
                  <g key={l.t}>
                    <line x1={l.x} y1={l.y > CY ? l.y - 12 : l.y + 4} x2={l.lx} y2={l.ly} stroke={DIM} strokeWidth="1" />
                    <circle cx={l.lx} cy={l.ly} r={2.4} fill={ACC} />
                    <text x={l.x} y={l.y} textAnchor="middle">{l.t}</text>
                  </g>
                ))}
              </g>
            )}
          </g>
        </svg>
      </div>

      <div className="vx-ctrls">
        <label className="vx-ctrl">
          <span className="vx-lab">Explode</span>
          <input className="vx-range" type="range" min={0} max={100} value={explode} onChange={(e2) => setExplode(Number(e2.target.value))} aria-label="Explode assembly" />
        </label>
        <label className="vx-ctrl">
          <span className="vx-lab">Tilt view</span>
          <input className="vx-range" type="range" min={0} max={100} value={tilt} onChange={(e2) => setTilt(Number(e2.target.value))} aria-label="Tilt view" />
        </label>
      </div>

      <div className="vx-specs">
        <div><span className="vx-lab">Tolerance</span><b>±0.02 mm</b></div>
        <div><span className="vx-lab">Material</span><b>6061-T6 / steel</b></div>
        <div><span className="vx-lab">Fit</span><b>H7/h6</b></div>
        <div><span className="vx-lab">Frame</span><b>IEC 90</b></div>
      </div>

      <p className="vx-note">
        Drag <b>Explode</b> to pull the assembly apart, <b>Tilt</b> to change the view, and toggle spin, labels, or
        dimensions. A sample motor with invented figures: a real drawing would come from your actual geometry and tolerances.
      </p>
    </div>
  )
}
