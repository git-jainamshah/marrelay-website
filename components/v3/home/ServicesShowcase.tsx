'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SlotMedia } from '../Media'

export type ShowcaseItem = {
  key: string
  n: string
  full: string
  short: string
  intro: string
  url: string
  param: string
  hook: string
  chips: string[]
  price: string
  unit: string
  media: string
  poster: string
}

/**
 * Desktop: auto-advancing list + media panel (7s per service, pauses on hover).
 * Narrow screens: a plain linked list (CSS switches between the two).
 */
export default function ServicesShowcase({ items }: { items: ShowcaseItem[] }) {
  const [act, setAct] = useState(0)
  const [paused, setPaused] = useState(false)

  return (
    <>
      <div
        className={`v-show${paused ? ' paused' : ''}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        data-reveal
      >
        <div className="v-show-list">
          <div>
            {items.map((s, i) => (
              <Link
                key={s.key}
                href={s.url}
                className={`v-show-item${act === i ? ' on' : ''}`}
                onMouseEnter={() => act !== i && setAct(i)}
                onFocus={() => setAct(i)}
              >
                <span className="row">
                  <span className="n">{s.n}</span>
                  <span className="nm">{s.full}</span>
                </span>
                <span className="ds"><span>{s.intro}</span></span>
                <span
                  className="bar"
                  onAnimationEnd={() => act === i && setAct((i + 1) % items.length)}
                ></span>
              </Link>
            ))}
          </div>
          <div className="v-show-foot">
            <span>One team, one channel, one invoice.</span>
            <Link href="/pricing">Compare pricing →</Link>
          </div>
        </div>

        <div className="v-show-stage">
          {items.map((s, i) => (
            <div key={s.key} className={`v-panel${act === i ? ' on' : ''}`} aria-hidden={act !== i}>
              <SlotMedia src={s.media} poster={s.poster} eager />
              <div className="scrim"></div>
              <div className="body">
                <div className="hd">
                  <span>{s.n} / {String(items.length).padStart(2, '0')}</span>
                  <span>{s.full}</span>
                </div>
                <div className="bt">
                  <span className="hook">{s.hook}</span>
                  <div className="chips">{s.chips.map((c) => <span key={c}>{c}</span>)}</div>
                  <div className="ft">
                    {s.price && (
                      <span className="p">
                        <span className="v-label">Starting at</span>
                        <b>{s.price}{s.unit && <small> {s.unit}</small>}</b>
                      </span>
                    )}
                    <span className="a">
                      <Link href={s.url} className="btn btn-light btn-sm" tabIndex={act === i ? 0 : -1}>Explore {s.short} →</Link>
                      <Link href={`/contact?service=${s.param}`} className="btn btn-ghost-light btn-sm" tabIndex={act === i ? 0 : -1}>Get a quote</Link>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Narrow screens: a swipeable strip of the same media panels, so phones
          get the same gateway into each service instead of a flat text list. */}
      <div className="v-svc-strip" role="list">
        {items.map((s, i) => (
          <Link key={s.key} href={s.url} className="v-svc-card" role="listitem" data-reveal data-delay={String(Math.min(i, 3))}>
            <SlotMedia src={s.media} poster={s.poster} eager={i < 2} />
            <span className="scrim"></span>
            <span className="body">
              <span className="hd"><span>{s.n} / {String(items.length).padStart(2, '0')}</span><span>{s.full}</span></span>
              <span className="bt">
                <span className="hook">{s.hook}</span>
                <span className="chips">{s.chips.slice(0, 3).map((c) => <span key={c}>{c}</span>)}</span>
                <span className="ft">
                  {s.price ? <span className="p"><span className="v-label">Starting at</span><b>{s.price}{s.unit && <small> {s.unit}</small>}</b></span> : <span />}
                  <span className="go">Explore {s.short} →</span>
                </span>
              </span>
            </span>
          </Link>
        ))}
      </div>
      <div className="v-svc-strip-foot">
        <span>Swipe for more · One team, one channel, one invoice.</span>
        <Link href="/pricing">Compare pricing →</Link>
      </div>
    </>
  )
}
