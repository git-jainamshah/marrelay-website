'use client'

import { useEffect, useState } from 'react'
import { BgVideo } from '../Media'

/**
 * Home "film" band: the studio's hero loop, re-homed as a slow, cinematic
 * strip under the opening statement. Letterboxed, desaturated, with a live
 * Toronto clock, the way a studio reel sits in a portfolio rather than a
 * background. Video comes from the admin media slot `home-hero-video`.
 */
export default function Film({ video, poster }: { video: string; poster: string }) {
  const [clock, setClock] = useState('')
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Toronto' }))
    tick()
    const id = setInterval(tick, 20000)
    return () => clearInterval(id)
  }, [])
  if (!video) return null
  return (
    <section className="v-film" aria-label="Studio reel">
      <div className="v-wrap v-film-in" data-reveal="wipe">
        <div className="v-film-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster} alt="" loading="lazy" />
          <BgVideo src={video} poster={poster} />
          <span className="v-film-scrim" />
          <span className="v-film-meta">
            <span>Toronto · {clock || '--:--'}</span>
            <span>Est. Toronto</span>
          </span>
          <span className="v-film-cap">
            <span className="v-label on-dark">The studio</span>
            <span className="t">Small by design. Senior by default.</span>
          </span>
        </div>
      </div>
    </section>
  )
}
