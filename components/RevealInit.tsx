'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Global scroll-reveal.
 * Observes [data-reveal] / [data-reveal-stagger] elements and adds `.in`
 * when they enter the viewport. Re-runs on route change, and also picks up
 * elements rendered later (filters, tabs, client-side lists) via a
 * MutationObserver, so nothing can get stuck invisible.
 */
export default function RevealInit() {
  const pathname = usePathname()

  useEffect(() => {
    const SEL = '[data-reveal], [data-reveal-stagger]'
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll(SEL).forEach((el) => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    const watch = (root: ParentNode) => {
      root.querySelectorAll(SEL).forEach((el) => {
        if (!el.classList.contains('in')) io.observe(el)
      })
    }
    watch(document)

    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes.forEach((n) => {
          if (!(n instanceof Element)) return
          if (n.matches(SEL) && !n.classList.contains('in')) io.observe(n)
          watch(n)
        })
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })

    // Safety net: anything already on screen after load is shown even if the
    // observer never fired (very tall elements, odd zoom levels).
    const safe = window.setTimeout(() => {
      document.querySelectorAll(SEL).forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in')
      })
    }, 2500)

    return () => {
      io.disconnect()
      mo.disconnect()
      window.clearTimeout(safe)
    }
  }, [pathname])

  return null
}
