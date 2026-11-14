'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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
 * Desktop: a fixed list on the left and a fixed image pane on the right.
 * Hovering a service just updates which image is on top and swaps the copy.
 * Every image stays mounted and painted the whole time (we only cross-fade
 * opacity), so nothing is ever hidden and no image has to re-decode when it
 * comes back, which is what used to cause the brief blank between services.
 *
 * Narrow screens get a swipeable strip of the same cards (CSS switches).
 */
export default function ServicesShowcase({ items }: { items: ShowcaseItem[] }) {
  const [act, setAct] = useState(0)
  const [paused, setPaused] = useState(false)
  const cur = items[act]
  const total = String(items.length).padStart(2, '0')

  // Gentle auto-advance; pauses while the pointer is over the section.
  useEffect(() => {
    if (paused) return
    const id = setTimeout(() => setAct((a) => (a + 1) % items.length), 6000)
    return () => clearTimeout(id)
  }, [act, paused, items.length])

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
                onMouseEnter={() => setAct(i)}
                onFocus={() => setAct(i)}
              >
                <span className="row">
                  <span className="n">{s.n}</span>
                  <span className="nm">{s.full}</span>
                </span>
                <span className="ds"><span>{s.intro}</span></span>
                <span className="bar" />
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
            <img
              key={s.key}
              className={`v-stage-img${act === i ? ' on' : ''}`}
              src={s.poster || s.media}
              alt=""
              aria-hidden={act !== i}
              loading={i < 2 ? 'eager' : 'lazy'}
              decoding="async"
            />
          ))}
          <div className="scrim" />
          <div className="body" key={act}>
            <div className="hd">
              <span>{cur.n} / {total}</span>
              <span>{cur.full}</span>
            </div>
            <div className="bt">
              <span className="hook">{cur.hook}</span>
              <div className="chips">{cur.chips.map((c) => <span key={c}>{c}</span>)}</div>
              <div className="ft">
                {cur.price && (
                  <span className="p">
                    <span className="v-label">Starting at</span>
                    <b>{cur.price}{cur.unit && <small> {cur.unit}</small>}</b>
                  </span>
                )}
                <span className="a">
                  <Link href={cur.url} className="btn btn-light btn-sm">Explore {cur.short} →</Link>
                  <Link href={`/contact?service=${cur.param}`} className="btn btn-ghost-light btn-sm">Get a quote</Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Narrow screens: a swipeable strip of the same media panels, so phones
          get the same gateway into each service instead of a flat text list. */}
      <div className="v-svc-strip" role="list">
        {items.map((s, i) => (
          <Link key={s.key} href={s.url} className="v-svc-card" role="listitem" data-reveal data-delay={String(Math.min(i, 3))}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.poster || s.media} alt="" loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
            <span className="scrim"></span>
            <span className="body">
              <span className="hd"><span>{s.n} / {total}</span><span>{s.full}</span></span>
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
