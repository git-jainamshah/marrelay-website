'use client'

/**
 * First-party page-view beacon. Reuses the site's own traffic identification
 * (channel group, source/medium, session id) so the admin's numbers agree with
 * the attribution already stored on leads. No cookies: the visitor id lives in
 * the visitor's own localStorage and is a random string, not a person.
 */
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { getTrafficData } from '@/analytics/traffic-identification'

const VID_KEY = 'mr_vid'
const SID_KEY = 'mr_sid'

function id() {
  try { return crypto.randomUUID().replace(/-/g, '').slice(0, 24) } catch { return Math.random().toString(36).slice(2) + Date.now().toString(36) }
}
function visitorId() {
  try {
    let v = localStorage.getItem(VID_KEY)
    if (!v) { v = id(); localStorage.setItem(VID_KEY, v) }
    return v
  } catch { return '' }
}
function sessionId(fallback: string) {
  try {
    if (fallback) return fallback
    let v = sessionStorage.getItem(SID_KEY)
    if (!v) { v = id(); sessionStorage.setItem(SID_KEY, v) }
    return v
  } catch { return '' }
}

export default function PageViews() {
  const pathname = usePathname()
  const last = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || last.current === pathname) return
    last.current = pathname

    // Let the page settle so the title is the new one, then send.
    const t = setTimeout(() => {
      let tr: any = null
      try { tr = getTrafficData() } catch { /* traffic lib optional */ }
      const body = JSON.stringify({
        visitorId: visitorId(),
        sessionId: sessionId(tr?.sessionId || ''),
        path: pathname,
        title: document.title,
        referrer: document.referrer || tr?.referrerUrl || '',
        channel: tr?.sessionChannelGroup || tr?.firstChannelGroup || '',
        source: tr?.sessionSource || tr?.firstSource || '',
        medium: tr?.sessionMedium || tr?.firstMedium || '',
        campaign: tr?.sessionCampaign || tr?.firstCampaign || '',
      })
      // sendBeacon survives the page being closed; fetch is the fallback.
      try {
        if (navigator.sendBeacon) navigator.sendBeacon('/api/public/pv', new Blob([body], { type: 'application/json' }))
        else fetch('/api/public/pv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
      } catch { /* ignore */ }
    }, 350)
    return () => clearTimeout(t)
  }, [pathname])

  return null
}
