/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import MediaCard from '@/components/v3/MediaCard'
import { SlotMedia } from '@/components/v3/Media'
import { CASES_V3 } from '@/lib/v3-content'
import type { SlotValues } from '@/lib/media-slots-server'

export default function CaseStudiesPageView({ slots }: { slots: SlotValues }) {
  return (
    <>
      <section className="v-wrap v-top">
        <div className="v-crumb">
          <Link href="/">Home</Link><span>/</span><span className="here">Case studies</span>
        </div>
        <div className="v-phead">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <span className="v-label" data-reveal>Case studies · Worked examples</span>
            <h1 className="v-big" data-reveal data-delay="1">How we&apos;d approach it.</h1>
          </div>
          <p data-reveal data-delay="2">
            We are a young studio, so rather than borrow logos we did something more honest: worked-through
            hypothetical examples of how we would approach common problems, end to end.
          </p>
        </div>
        <p className="v-note" style={{ marginTop: 32 }} data-reveal>Hypothetical examples · assumptions, not delivered client work</p>
      </section>

      <section className="v-wrap" style={{ paddingTop: 'clamp(56px,7vw,96px)' }}>
        <div className="v-work-grid light">
          {CASES_V3.map((c, i) => (
            <MediaCard key={c.key} href={c.url} data-reveal data-delay={String(i + 1)}>
              <div className="m" data-reveal="wipe">
                <SlotMedia src={slots[c.slot]} poster={slots[c.poster]} />
                <div className="cap">
                  <span className="v-label">{c.cat}</span>
                  <span className="arr" aria-hidden="true">→</span>
                </div>
              </div>
              <span className="tt">{c.title}</span>
              <span className="dd">{c.desc}</span>
            </MediaCard>
          ))}
        </div>
      </section>

      <section className="v-wrap v-sec v-sec-b">
        <div className="v-split">
          <div className="l" data-reveal>
            <span className="v-label">Your project</span>
            <h2 className="v-h2-sm">Could be the next one.</h2>
          </div>
          <div className="r" data-reveal style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: 'var(--v-ink-2)', maxWidth: '34em' }}>
              Tell us what you are trying to build or fix. We will show you exactly how we would approach it, with a
              plan and a price, no pressure.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/contact" className="btn btn-dark">Book a discovery call <span aria-hidden="true">→</span></Link>
              <Link href="/about" className="btn btn-ghost">Meet the studio</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
