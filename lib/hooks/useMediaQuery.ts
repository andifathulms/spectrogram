'use client'

import { useEffect, useState } from 'react'

/**
 * Whether a media query matches, for the few layout values CSS cannot set —
 * a canvas's pixel height is a number, not a class. False on the server and
 * on the first client render, so the static export and hydration agree.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const list = window.matchMedia(query)
    const update = () => setMatches(list.matches)
    update()
    list.addEventListener('change', update)
    return () => list.removeEventListener('change', update)
  }, [query])

  return matches
}
