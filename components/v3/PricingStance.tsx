import Link from 'next/link'
import { PRICING_NOTE } from '@/lib/v3-content'

/** The pricing stance block: fixed starting points, custom for the rest. */
export default function PricingStance({ contactHref = '/contact' }: { contactHref?: string }) {
  return (
    <div className="v-stance" data-reveal>
      <div>
        <span className="v-kick">{PRICING_NOTE.kicker}</span>
        <h3>{PRICING_NOTE.title}</h3>
      </div>
      <div>
        <p>{PRICING_NOTE.body}</p>
        <p className="ex">{PRICING_NOTE.examples}</p>
        <Link href={contactHref} className="v-link">{PRICING_NOTE.cta} →</Link>
      </div>
    </div>
  )
}
