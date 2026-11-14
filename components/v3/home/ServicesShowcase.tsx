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
 * Desktop: a fixed list on the left, a fixed image pane on the right.
 * Hovering a service brings its panel to the front. Every panel (image +
 * its copy) stays mounted and painted the whole time; we only cross-fade
 * opacity, so nothing is ever hidden, nothing re-decodes, and the image
 * and its text always change together.
 *
 * The scroll-reveal lives on a STATIC wrapper (no React-controlled props),
 * so React can never wipe the `.in` class the reveal script adds. The inner
 * grid re-renders freely on hover / auto-advance without the section ever
 * dropping back to its hidden state.
 */
export default function ServicesShowcase({ items }: { items: ShowcaseItem[] }) {
  const [act, setAct] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = String(items.length).padStart(2, '0')

  useEffect(() => {
    if (paused) return
    const id = setTimeout(() => setAct((a) => (a + 1) % items.length), 6000)
    return () => clearTimeout(id)
  }, [act, paused, items.length])

  return (
    <>
      <div className="v-show-wrap" data-reveal>
        <div
          className={`v-show${paused ? ' paused' : ''}`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
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
              <div key={s.key} className={`v-panel${act === i ? ' on' : ''}`} aria-hidden={act !== i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.poster || s.media} alt="" loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
                <span className="scrim" />
                <div className="body">
                  <div className="hd">
                    <span>{s.n} / {total}</span>
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
      </div>

      {/* Narrow screens: a swipeable strip of the same media panels. */}
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
