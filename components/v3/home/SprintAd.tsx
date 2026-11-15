'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { BgVideo } from '../Media'

export default function SprintAd({ price, image, logo, video }: { price: string; image: string; logo: string; video?: string }) {
  return (
    <section className="v-dark v-sprint v-sec-gap" aria-label="The Launch Sprint">
      <img src={image} alt="" loading="lazy" />
      {video && <BgVideo src={video} poster={image} />}
      <div className="scrim"></div>
      <div className="v-wrap inner">
        <div className="l">
          <span className="v-label" data-reveal>The Launch Sprint · {price} fixed</span>
          <h2>
            <span data-reveal="line"><span>Start when you&apos;re ready.</span></span>
            <span data-reveal="line" data-delay="1"><span className="g">Live 14 days later.</span></span>
          </h2>
          <p data-reveal data-delay="2">
            A landing page designed, built and launched in 14 days. One price agreed before we start, a demo every
            Friday, and every file is yours at the end.
          </p>
          <div className="ctas" data-reveal data-delay="3">
            <Link href="/contact?package=sprint" className="btn btn-light">Book a free 30-minute call <span aria-hidden="true">→</span></Link>
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
              <b>Day 1</b>
              <span className="v-num">YOUR DATE</span>
            </span>
            <span className="line"><i></i><em>14 DAYS</em></span>
            <span className="dt r">
              <span className="v-label">Launch</span>
              <b>Day 14</b>
              <span className="v-num">LIVE</span>
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
            <span>Pick your kickoff date</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
