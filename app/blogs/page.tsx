import type { Metadata } from 'next'
import Link from 'next/link'
import { POSTS, sortByPopularity, formatPostDate } from '@/lib/blog'
import { getSlot } from '@/lib/media-slots-server'
import JournalIndex, { PostCard } from '@/components/v3/JournalIndex'
import { getViewCounts } from '@/lib/blog/views-server'
import { plainText } from '@/lib/blog/richtext'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Practical guides on analytics, web performance, and engineering/CAD for small and mid-size businesses. Written to be used, not skimmed.',
  alternates: { canonical: '/blogs' },
  openGraph: {
    title: 'Marrelay - Blog',
    description: 'Practical guides on analytics, web performance, and engineering/CAD for small and mid-size businesses.',
    url: '/blogs',
  },
}

export default async function BlogsPage() {
  const [views, image] = await Promise.all([getViewCounts(), getSlot('home-journal-image')])
  // Most-read first (real view counts), exactly as before; the top post is featured.
  const posts: PostCard[] = sortByPopularity(POSTS, views).map((p) => ({
    slug: p.slug,
    title: p.title,
    card: p.cardTitle ?? p.title,
    excerpt: plainText(p.excerpt),
    category: p.category,
    date: formatPostDate(p.date),
    mins: p.readMinutes,
    tags: p.tags,
  }))

  return (
    <section className="v-wrap v-top v-sec-b">
      <div className="v-crumb">
        <Link href="/">Home</Link><span>/</span><span className="here">Journal</span>
      </div>
      <div className="v-phead">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <span className="v-label" data-reveal>The Marrelay journal</span>
          <h1 className="v-big" data-reveal data-delay="1">Journal</h1>
        </div>
        <p data-reveal data-delay="2" style={{ maxWidth: '24em' }}>
          Practical guides on websites, analytics, ads and engineering files. Written by the people who do the work,
          with primary sources linked.
        </p>
      </div>
      <JournalIndex posts={posts} image={image} />
      <p className="v-body" style={{ marginTop: 48 }}>
        More guides are on the way. Got a question you want answered properly?{' '}
        <Link href="/contact" className="v-link" style={{ fontSize: 'inherit' }}>Ask us</Link> and we may write it up.
      </p>
    </section>
  )
}
