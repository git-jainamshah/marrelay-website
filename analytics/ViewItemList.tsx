'use client'

import { useEffect, useRef } from 'react'
import { trackViewItemList } from './events'

/**
 * Fires a GA4 `view_item_list` once when a service list mounts.
 * Pair it with `data-list-name` on the list container and
 * `data-service-key` on each card, so AutoTrack can fire the matching
 * `select_item` when one is clicked.
 */
export default function ViewItemList({ listName }: { listName: string }) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    trackViewItemList(listName)
  }, [listName])
  return null
}
