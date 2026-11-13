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
    v.addEventListener('canplay', onReady)
    v.addEventListener('loadeddata', onReady)
    v.addEventListener('error', onError, true)
    if (v.readyState >= 3) onReady()
    window.addEventListener('pageshow', play)
    return () => {
      v.removeEventListener('canplay', onReady)
      v.removeEventListener('loadeddata', onReady)
      v.removeEventListener('error', onError, true)
      window.removeEventListener('pageshow', play)
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
export function SlotMedia({ src, poster, alt = '' }: { src: string; poster?: string; alt?: string }) {
  if (isVideo(src)) {
    return (
      <>
        {poster && <img src={poster} alt={alt} loading="lazy" />}
        <BgVideo src={src} poster={poster} />
      </>
    )
  }
  return <img src={src} alt={alt} loading="lazy" />
}
