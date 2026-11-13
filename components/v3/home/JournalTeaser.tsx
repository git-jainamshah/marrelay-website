/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { POSTS, sortByPopularity, formatPostDate, getPost } from '@/lib/blog'
import { getViewCounts } from '@/lib/blog/views-server'
import { plainText } from '@/lib/blog/richtext'
import MediaCard from '../MediaCard'

const ASKS: [string, string][] = [
  ['What should a website cost?', 'how-much-does-a-small-business-website-cost'],
  ['WordPress or Webflow?', 'wordpress-vs-webflow-vs-custom-built'],
  ['Will a redesign hurt my SEO?', 'website-redesign-without-losing-seo'],
  ['Is my tracking set up right?', 'google-consent-mode-v2-in-3-steps'],
  ['Which CAD file do I send?', 'dwg-vs-step-vs-stl-cad-file-formats-explained'],
]

/**
 * Home journal section. The featured post is the most-read one (real view
 * counts, as before); the side list is the next three by popularity.
 */
export default async function JournalTeaser({ image }: { image: string }) {
  const views = await getViewCounts()
  const sorted = sortByPopularity(POSTS, views)
  const [feat, ...rest] = sorted
  if (!feat) return null
  const side = rest.slice(0, 3)
  const asks = ASKS.filter(([, slug]) => getPost(slug))

  return (
    <section id="journal" className="v-wrap v-sec">
      <div className="v-head" data-reveal>
        <div style={{ maxWidth: 760 }}>
          <span className="v-label">(04) Journal</span>
          <h2 className="v-h2">Read this before you hire anyone.</h2>
          <p className="v-body" style={{ fontSize: 17, maxWidth: '34em' }}>
            Straight answers on costs, platforms and tracking, written by the people who do the work. Most readers
            never need to call us. Some do.
          </p>
        </div>
        <Link href="/blogs" className="v-link">All {POSTS.length} articles →</Link>
      </div>

      {asks.length > 0 && (
        <div className="v-asks" data-reveal>
          <span className="v-label">People ask us</span>
          {asks.map(([q, slug]) => (
            <Link key={slug} href={`/blogs/${slug}`}>{q}<span aria-hidden="true">→</span></Link>
          ))}
        </div>
      )}

      <div className="v-jgrid">
        <MediaCard href={`/blogs/${feat.slug}`} className="v-feat" data-reveal>
          <div className="m" data-reveal="wipe">
            <img src={image} alt="" loading="lazy" />
            <span className="badges"><span>Most read</span><span>{feat.readMinutes} min read</span></span>
            <span className="arr" aria-hidden="true">→</span>
          </div>
          <span className="v-label cat">{feat.category}</span>
          <span className="tt">{feat.title}</span>
          <span className="ex">{plainText(feat.excerpt)}</span>
          <span className="go"><span>Read the guide</span><span>· {formatPostDate(feat.date)}</span></span>
        </MediaCard>

        <div className="v-side">
          {side.map((p, i) => (
            <Link key={p.slug} href={`/blogs/${p.slug}`} className="v-side-i" data-reveal data-delay={String(i + 1)}>
              <span className="nn">0{i + 1}</span>
              <span className="bb">
                <span className="v-label mt"><span>{p.category}</span><span>·</span><span>{p.readMinutes} min</span></span>
                <span className="tt">{p.cardTitle ?? p.title}</span>
                <span className="ex">{plainText(p.excerpt)}</span>
              </span>
              <span className="v-arrow-circle" aria-hidden="true">→</span>
            </Link>
          ))}
          <div className="v-side-foot">
            <span>New guides most months. No newsletter, no spam.</span>
            <Link href="/blogs">Browse by topic →</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
