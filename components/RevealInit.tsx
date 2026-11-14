'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Global scroll-reveal, fail-safe by design.
 *
 * Elements marked [data-reveal] start transparent and get `.in` when they
 * scroll into view. Three guarantees so nothing can ever stay hidden:
 *  1. Anything already in or above the viewport is revealed immediately.
 *  2. Elements added later (client components, filters, re-renders) are
 *     picked up by a MutationObserver and revealed when visible.
 *  3. Whatever the observer missed is force-revealed shortly after load,
 *     and hard-revealed if the Intersection API is unavailable.
 * The animation is a progressive enhancement, never a gate.
 */
export default function RevealInit() {
  const pathname = usePathname()

  useEffect(() => {
    const SEL = '[data-reveal], [data-reveal-stagger]'
    const show = (el: Element) => el.classList.add('in')
    const all = () => document.querySelectorAll(SEL)

    if (!('IntersectionObserver' in window)) { all().forEach(show); return }

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target) } }),
      { threshold: 0.05, rootMargin: '0px 0px -5% 0px' }
    )
    const consider = (el: Element) => {
      if (el.classList.contains('in')) return
      const r = el.getBoundingClientRect()
      // above the fold, or already scrolled past: reveal now, no animation gate
      if (r.top < window.innerHeight * 0.95 && r.bottom > -1) show(el)
      else io.observe(el)
    }
    all().forEach(consider)

    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes.forEach((n) => {
          if (!(n instanceof Element)) return
          if (n.matches(SEL)) consider(n)
          n.querySelectorAll(SEL).forEach(consider)
        })
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })

    // Safety nets: reveal anything visible that the observer missed, and after
    // a few seconds reveal everything regardless (slow devices, odd zoom, print).
    const sweep = () => all().forEach((el) => {
      if (el.classList.contains('in')) return
      const r = el.getBoundingClientRect()
      if (r.top < window.innerHeight && r.bottom > 0) show(el)
    })
    const t1 = window.setTimeout(sweep, 1200)
    const t2 = window.setTimeout(() => all().forEach(show), 4000)
    window.addEventListener('resize', sweep)

    return () => {
      io.disconnect(); mo.disconnect()
      window.clearTimeout(t1); window.clearTimeout(t2)
      window.removeEventListener('resize', sweep)
    }
  }, [pathname])

  return null
}
