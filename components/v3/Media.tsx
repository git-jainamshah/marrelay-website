'use client'

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef } from 'react'

export const isVideo = (p?: string | null) => !!p && /\.(mp4|webm|mov)(\?|$)/i.test(p)

/**
 * Muted, looping background video that fades in once it can actually play
 * and quietly disappears if the file is missing, so the poster image behind
 * it is always the fallback.
 */
export function BgVideo({ src, poster, className }: { src: string; poster?: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.muted = true
    v.defaultMuted = true
    v.setAttribute('muted', '')

    const show = () => v.classList.add('ready')
    const play = () => {
      const p = v.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    }
    const onReady = () => { show(); play() }
    const onError = () => { v.style.display = 'none' }

    // `canplay` and `loadeddata` only fire once enough data is buffered, but
    // preload="metadata" is honoured strictly on mobile, so those events can
    // wait on a play() that only fires from those same events. Listening for
    // loadedmetadata too, and calling play() directly, breaks that deadlock.
    v.addEventListener('loadedmetadata', onReady)
    v.addEventListener('loadeddata', onReady)
    v.addEventListener('canplay', onReady)
    v.addEventListener('playing', show)
    v.addEventListener('error', onError, true)
    if (v.readyState >= 1) onReady()
    play()

    // This banner sits well down the page. iOS will not start an offscreen
    // video, and nothing retries once it scrolls in, so ask again on entry.
    let io: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => { for (const e of entries) if (e.isIntersecting) { show(); play() } },
        { rootMargin: '200px' },
      )
      io.observe(v)
    }

    // Last resort: the element is opacity 0 until `ready`, so if no event ever
    // arrives the viewer sees nothing at all. Reveal it regardless, leaving a
    // still first frame rather than a hole where the video should be.
    const t = window.setTimeout(show, 1800)

    window.addEventListener('pageshow', play)
    return () => {
      v.removeEventListener('loadedmetadata', onReady)
      v.removeEventListener('loadeddata', onReady)
      v.removeEventListener('canplay', onReady)
      v.removeEventListener('playing', show)
      v.removeEventListener('error', onError, true)
      window.removeEventListener('pageshow', play)
      window.clearTimeout(t)
      io?.disconnect()
    }
  }, [src])

  return (
    <video
      ref={ref}
      className={`bgv${className ? ' ' + className : ''}`}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
    >
      <source src={src} type={src.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
    </video>
  )
}

/**
 * Image or video for a media slot. Media slots hold a single path, so the
 * same spot can be a photo or a video depending on what the admin picks.
 */
export function SlotMedia({ src, poster, alt = '', eager = false }: { src: string; poster?: string; alt?: string; eager?: boolean }) {
  if (isVideo(src)) {
    return (
      <>
        {poster && <img src={poster} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />}
        <BgVideo src={src} poster={poster} />
      </>
    )
  }
  return <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />
}
