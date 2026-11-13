'use client'

import { useEffect, useRef, useState } from 'react'
import { dlPush } from '@/analytics/datalayer'

type Props = { slug: string; title: string; category: string; readMinutes: number }

/**
 * Client-side article behaviour:
 *  - counts the read (once per hour per visitor, enforced server-side)
 *  - reading progress bar
 *  - scroll-depth milestones + a "read" event, pushed to the dataLayer
 *  - copy-link / share buttons
 */
export default function ArticleClient({ slug, title, category, readMinutes }: Props) {
  const [progress, setProgress] = useState(0)
  const fired = useRef<Set<number>>(new Set())
  const counted = useRef(false)

  // Count the view + fire blog_view once per mount.
  useEffect(() => {
    if (counted.current) return
    counted.current = true

    dlPush('blog_view', {
      blog_slug: slug,
      blog_title: title,
      blog_category: category,
      blog_read_minutes: readMinutes,
    })

    fetch('/api/blog/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {})
  }, [slug, title, category, readMinutes])

  // Reading progress + scroll depth milestones.
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const doc = document.documentElement
        const max = doc.scrollHeight - window.innerHeight
        const pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0
        setProgress(pct)

        for (const mark of [25, 50, 75, 100]) {
          if (pct >= mark && !fired.current.has(mark)) {
            fired.current.add(mark)
            dlPush('blog_read_progress', { blog_slug: slug, blog_title: title, percent_scrolled: mark })
            if (mark === 100) {
              dlPush('blog_read_complete', { blog_slug: slug, blog_title: title })
            }
          }
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [slug, title])

  return (
    <div className="v-progress" aria-hidden="true">
      <span style={{ width: `${progress}%` }} />
    </div>
  )
}

/** Share row for the article byline. Pushes the same `blog_share` event as before. */
export function ShareButtons({ slug, title }: { slug: string; title: string }) {
  const [copied, setCopied] = useState(false)

  const share = (network: 'linkedin' | 'x' | 'copy') => {
    const url = window.location.href
    dlPush('blog_share', { blog_slug: slug, blog_title: title, share_method: network })

    if (network === 'copy') {
      navigator.clipboard?.writeText(url).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => {})
      return
    }
    const target =
      network === 'linkedin'
        ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
        : `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    window.open(target, '_blank', 'noopener,noreferrer,width=600,height=520')
  }

  return (
    <div className="v-share" role="group" aria-label="Share this article">
      <span className="v-label">Share</span>
      <button type="button" onClick={() => share('linkedin')} aria-label="Share on LinkedIn" title="Share on LinkedIn">in</button>
      <button type="button" onClick={() => share('x')} aria-label="Share on X" title="Share on X">X</button>
      <button type="button" onClick={() => share('copy')} aria-label="Copy link" title="Copy link">{copied ? 'Copied' : 'Copy link'}</button>
    </div>
  )
}

/** "On this page" list that highlights the section being read. */
export function ArticleToc({ items, minutes }: { items: { id: string; text: string }[]; minutes: number }) {
  const [act, setAct] = useState(0)
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      let a = 0
      items.forEach((t, i) => {
        const el = document.getElementById(t.id)
        if (el && el.getBoundingClientRect().top < 160) a = i
      })
      setAct(a)
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      setPct(max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [items])
  const left = Math.max(0, Math.ceil(minutes * (1 - pct / 100)))
  return (
    <aside className="v-toc" aria-label="On this page">
      <span className="v-label">On this page</span>
      <nav>
        {items.map((t, i) => (
          <a key={t.id} href={`#${t.id}`} className={i === act ? 'on' : undefined}>{t.text}</a>
        ))}
      </nav>
      <span className="v-num" style={{ marginTop: 8 }}>{left ? `${left} MIN LEFT` : 'FINISHED'}</span>
    </aside>
  )
}

/** CTA whose clicks are attributed to the article that produced them. */
export function ArticleCta({ slug, title }: { slug: string; title: string }) {
  return (
    <a
      href="/contact"
      className="bp-cta-btn v-btnlike"
      onClick={() => dlPush('blog_cta_click', { blog_slug: slug, blog_title: title, cta: 'book_discovery_call' })}
    >
      Book a discovery call <span aria-hidden="true">↗</span>
    </a>
  )
}
