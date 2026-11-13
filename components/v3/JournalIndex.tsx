'use client'

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from 'react'
import Link from 'next/link'
import MediaCard from './MediaCard'

export type PostCard = {
  slug: string; title: string; card: string; excerpt: string; category: string
  date: string; mins: number; tags: string[]
}

/** Journal index: category chips + search, filtered in the browser. Same /blogs URL. */
export default function JournalIndex({ posts, image }: { posts: PostCard[]; image: string }) {
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')
  const cats = useMemo(() => ['All', ...Array.from(new Set(posts.map((p) => p.category)))], [posts])

  const query = q.trim().toLowerCase()
  const unfiltered = cat === 'All' && !query
  const filtered = posts.filter((p) =>
    (cat === 'All' || p.category === cat) &&
    (!query || `${p.title} ${p.excerpt} ${p.category} ${p.tags.join(' ')}`.toLowerCase().includes(query)))
  const [featured, ...rest] = posts
  const grid = unfiltered ? rest : filtered

  return (
    <>
      <div className="v-jbar" data-reveal>
        <div className="chips">
          {cats.map((c) => (
            <button key={c} type="button" className={`v-chip${cat === c ? ' on' : ''}`} onClick={() => setCat(c)} aria-pressed={cat === c}>
              {c}
            </button>
          ))}
        </div>
        <label className="v-jsearch">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles" aria-label="Search articles" />
        </label>
      </div>

      {unfiltered && featured && (
        <div style={{ paddingTop: 'clamp(40px,5vw,64px)' }}>
          <MediaCard href={`/blogs/${featured.slug}`} className="v-jfeat" data-reveal>
            <div className="m" data-reveal="wipe">
              <img src={image} alt="" />
              <span className="v-label badge">Most read</span>
            </div>
            <div className="bd">
              <div>
                <div className="v-label mt"><span className="c">{featured.category}</span><span>{featured.date}</span><span>{featured.mins} min read</span></div>
                <span className="tt">{featured.title}</span>
                <span className="ex">{featured.excerpt}</span>
              </div>
              <span className="go"><i aria-hidden="true">→</i>Read the guide</span>
            </div>
          </MediaCard>
        </div>
      )}

      <div style={{ paddingTop: 'clamp(56px,7vw,96px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span className="v-label">{unfiltered ? 'All articles' : cat === 'All' ? 'Results' : cat}</span>
          <span className="v-num">{(unfiltered ? posts.length : filtered.length)} articles</span>
        </div>
        {filtered.length === 0 && (
          <p style={{ marginTop: 24, fontSize: 17, color: 'var(--v-mut)' }}>
            Nothing matches that yet. Try another word, or{' '}
            <button type="button" onClick={() => { setQ(''); setCat('All') }} style={{ textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer', font: 'inherit', color: 'inherit', padding: 0 }}>
              clear the filters
            </button>.
          </p>
        )}
        <div className="v-pgrid">
          {grid.map((p) => (
            <Link key={p.slug} href={`/blogs/${p.slug}`} className="v-pcard">
              <div className="v-label mt"><span>{p.category}</span><span>{p.mins} min</span></div>
              <span className="tt">{p.card}</span>
              <span className="ex">{p.excerpt}</span>
              <span className="v-num dt">{p.date}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
