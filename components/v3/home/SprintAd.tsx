'use client'

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Dates = { start: string; startDay: string; launch: string; launchDay: string; launchLong: string }

/** Next Monday as kickoff, launch 14 days later (computed in the browser, so it never goes stale in the cache). */
function sprintDates(): Dates {
  const now = new Date()
  const kick = new Date(now)
  kick.setDate(now.getDate() + (((8 - now.getDay()) % 7) || 7))
  const live = new Date(kick)
  live.setDate(kick.getDate() + 14)
  const md = (d: Date) => d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }).replace('.', '')
  const wd = (d: Date) => d.toLocaleDateString('en-CA', { weekday: 'long' }).toUpperCase()
  return { start: md(kick), startDay: wd(kick), launch: md(live), launchDay: wd(live), launchLong: live.toLocaleDateString('en-CA', { month: 'long', day: 'numeric' }) }
}

export default function SprintAd({ price, image, logo }: { price: string; image: string; logo: string }) {
  const [d, setD] = useState<Dates | null>(null)
  useEffect(() => setD(sprintDates()), [])

  return (
    <section className="v-dark v-sprint v-sec-gap" aria-label="The Launch Sprint">
      <img src={image} alt="" loading="lazy" />
      <div className="scrim"></div>
      <div className="v-wrap inner">
        <div className="l">
          <span className="v-label" data-reveal>The Launch Sprint · {price} fixed</span>
          <h2>
            <span data-reveal="line"><span>Start Monday.</span></span>
            <span data-reveal="line" data-delay="1"><span className="g">{d ? `Live by ${d.launchLong}.` : 'Live in 14 days.'}</span></span>
          </h2>
          <p data-reveal data-delay="2">
            A landing page designed, built and launched in 14 days. One price agreed before we start, a demo on
            Friday, and every file is yours at the end.
          </p>
          <div className="ctas" data-reveal data-delay="3">
            <Link href="/contact?package=sprint" className="btn btn-light">Book your start date <span aria-hidden="true">→</span></Link>
            <Link href="/pricing" className="btn btn-ghost-light">What&apos;s included</Link>
          </div>
        </div>

        <div className="v-ticket" data-reveal data-delay="2">
          <div className="th">
            <span><img src={logo} alt="" />Marrelay</span>
            <span className="v-label">Sprint pass</span>
          </div>
          <div className="dates">
            <span className="dt">
              <span className="v-label">Kickoff</span>
              <b>{d?.start ?? 'Mon'}</b>
              <span className="v-num">{d?.startDay ?? 'MONDAY'}</span>
            </span>
            <span className="line"><i></i><em>14 DAYS</em></span>
            <span className="dt r">
              <span className="v-label">Launch</span>
              <b>{d?.launch ?? '+14d'}</b>
              <span className="v-num">{d?.launchDay ?? 'MONDAY'}</span>
            </span>
          </div>
          <div className="perf"></div>
          <div className="facts">
            <span><span className="v-label">Price</span><b>{price}, fixed</b></span>
            <span><span className="v-label">Demo</span><b>Every Friday</b></span>
            <span><span className="v-label">Ownership</span><b>100% yours</b></span>
            <span><span className="v-label">Lock-in</span><b>None</b></span>
          </div>
          <Link href="/contact?package=sprint" className="claim">
            <span>{d ? `Claim the ${d.start} kickoff` : 'Claim the next kickoff'}</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
