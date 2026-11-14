/* eslint-disable @next/next/no-img-element */
import { Suspense } from 'react'
import Link from 'next/link'
import { getSlots } from '@/lib/media-slots-server'
import { getPackageOverrides } from '@/lib/pricing'
import { SERVICES_V3, CASES_V3, PROCESS_V3, startingPrice } from '@/lib/v3-content'
import { SlotMedia } from '@/components/v3/Media'
import MediaCard from '@/components/v3/MediaCard'
import ServicesShowcase, { ShowcaseItem } from '@/components/v3/home/ServicesShowcase'
import SprintAd from '@/components/v3/home/SprintAd'
import JournalTeaser from '@/components/v3/home/JournalTeaser'
import LeadForm from '@/components/home/LeadForm'
import { getCompany } from '@/lib/site-config'

export default async function Home() {
  const [slots, company, homePkgs, ...svcPkgs] = await Promise.all([
    getSlots(),
    getCompany(),
    getPackageOverrides('home'),
    ...SERVICES_V3.map((s) => getPackageOverrides(s.pricingKey)),
  ])

  const showcase: ShowcaseItem[] = SERVICES_V3.map((s, i) => {
    const { price, unit } = startingPrice(svcPkgs[i])
    const poster = slots[s.posterSlot]
    return {
      key: s.key, n: `0${i + 1}`, full: s.full, short: s.short, intro: s.intro, url: s.url, param: s.param,
      hook: s.hook, chips: s.chips, price, unit, poster,
      media: poster,
    }
  })
  const sprintPrice = homePkgs[0]?.price || '$2,400'

  return (
    <>
      {/* HERO */}
      <section className="v-phero full v-hero svc-hero" id="top">
        <img src={slots['home-hero-poster']} alt="Toronto skyline at night" />
        <div className="scrim"></div>
        <div className="v-wrap inner">
          <div className="meta" data-reveal>
            <span>Founder-led digital studio</span>
            <span>Toronto, Canada</span>
          </div>
          <h1>
            <span data-reveal="line" data-delay="1"><span>We design, build</span></span>
            <span data-reveal="line" data-delay="2"><span>and grow digital</span></span>
            <span data-reveal="line" data-delay="3"><span className="v-muted">products.</span></span>
          </h1>
          <div className="foot" data-reveal data-delay="4">
            <p>
              A founder-led studio for startups and small businesses. Web, data, marketing and engineering, at a
              fixed price, with a working demo every Friday.
            </p>
            <div className="ctas">
              <Link href="/#start" className="btn btn-light">Tell us about your project <span aria-hidden="true">→</span></Link>
              <Link href="/#work" className="btn btn-ghost-light">See the work</Link>
            </div>
          </div>
        </div>
      </section>

      {/* STATEMENT */}
      <section className="v-wrap v-sec v-statement">
        <p data-reveal>
          The person who answers your first email is the person who builds your project.{' '}
          <span className="v-muted">
            We agree the price before we begin, show progress every week, and hand over everything at the end.
          </span>
        </p>
      </section>

      {/* SERVICES */}
      <section id="what" className="v-wrap v-sec">
        <div className="v-head" data-reveal>
          <div>
            <span className="v-kick"><i>01</i>Services</span>
            <h2 className="v-h2"><span>Five disciplines.</span><span>One small team.</span></h2>
          </div>
          <p className="v-body">
            The people who build your site also set up the tracking and run the ads, so nothing gets lost between
            agencies.
          </p>
        </div>
        <ServicesShowcase items={showcase} />
      </section>

      {/* CASE STUDIES */}
      <section id="work" className="v-dark v-sec-gap">
        <div className="v-wrap" style={{ paddingTop: 'clamp(80px,10vw,140px)', paddingBottom: 'clamp(80px,10vw,140px)' }}>
          <div className="v-head" style={{ marginBottom: 48 }} data-reveal>
            <div>
              <span className="v-kick"><i>02</i>Case studies</span>
              <h2 className="v-h2">How we would approach it.</h2>
            </div>
            <p className="v-body" style={{ maxWidth: '28em' }}>
              Worked examples, end to end. We&apos;re a young studio, so instead of borrowed logos we show exactly how
              we think.
            </p>
          </div>
          <div className="v-work-grid">
            {CASES_V3.map((c, i) => (
              <MediaCard key={c.key} href={c.url} data-reveal data-delay={String(i + 1)}>
                <div className="m" data-reveal="wipe">
                  <SlotMedia src={slots[c.poster]} />
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
        </div>
      </section>

      {/* PROCESS */}
      <section id="how" className="v-wrap v-sec">
        <div className="v-split">
          <div className="l sticky" data-reveal>
            <span className="v-kick"><i>03</i>Process</span>
            <h2 className="v-h2">Four steps. No surprises.</h2>
            <p className="v-body">
              Most projects take four to six weeks. You&apos;ll know the price, the timeline and who&apos;s doing the
              work before you pay anything.
            </p>
          </div>
          <div className="r v-steps">
            {PROCESS_V3.map((st) => (
              <div key={st.n} className="v-step" data-reveal>
                <span className="n">{st.n}</span>
                <div className="b">
                  <span className="t">{st.title}</span>
                  <span className="d">{st.body}</span>
                  <span className="w">{st.when}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LAUNCH SPRINT */}
      <SprintAd price={sprintPrice} image={slots['home-sprint-image']} logo={company.logoIcon || '/assets/marrelay-mark.png'} video={slots['home-hero-video']} />

      {/* JOURNAL */}
      <JournalTeaser image={slots['home-journal-image']} />

      {/* START HERE (lead form: same component, ids and tracking as before) */}
      <section id="start" className="v-wrap v-sec v-sec-b">
        <div className="v-start" data-reveal>
          <div className="l">
            <span className="v-kick"><i>05</i>Start here</span>
            <h2>Tell us about your project.</h2>
            <p>A founder reads every enquiry and replies within one business day with a few times for a 30-minute call.</p>
            <Link href="/contact" className="v-link">Prefer the full brief? Contact page →</Link>
          </div>
          <div className="r">
            <Suspense fallback={null}>
              <LeadForm />
            </Suspense>
          </div>
        </div>
      </section>
    </>
  )
}
