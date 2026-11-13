'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

/**
 * Link card whose media goes from greyscale to colour on hover. On touch
 * screens (no hover) it lights up while it sits in the middle of the viewport.
 */
export default function MediaCard({
  href, className = '', children, ...rest
}: { href: string; className?: string; children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const ref = useRef<HTMLAnchorElement>(null)
  const [lit, setLit] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || !window.matchMedia?.('(hover: none)').matches || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver((es) => es.forEach((e) => setLit(e.intersectionRatio > 0.6)), { threshold: [0, 0.6, 1] })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Link ref={ref} href={href} className={`v-mcard${lit ? ' lit' : ''} ${className}`} {...rest}>
      {children}
    </Link>
  )
}
