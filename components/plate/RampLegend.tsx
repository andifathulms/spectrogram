'use client'

import { useMemo } from 'react'

import { ENERGY_PALETTE, PALETTE_SIZE, rampColor } from '@/lib/render/palette'

/**
 * The energy ramp as a swatch, so the plate's brightness has a stated meaning.
 * Built from the same LUT the plate uses — never a hand-written gradient that
 * could drift away from it.
 */
export function RampBar({ className = 'h-2 w-40' }: { className?: string }) {
  const gradient = useMemo(() => {
    const steps: string[] = []
    for (let i = 0; i <= 16; i++) {
      const t = i / 16
      steps.push(`${rampColor(t, ENERGY_PALETTE)} ${(t * 100).toFixed(1)}%`)
    }
    return `linear-gradient(to right, ${steps.join(', ')})`
  }, [])

  return (
    <div
      className={`rounded-full border border-hairline ${className}`}
      style={{ background: gradient }}
      aria-hidden
      title={`${PALETTE_SIZE}-step energy ramp`}
    />
  )
}

interface Props {
  className?: string
  /** Localised ends of the ramp. The defaults keep the component standalone. */
  quiet?: string
  loud?: string
}

export function RampLegend({ className = '', quiet = 'quiet', loud = 'loud' }: Props) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="control-label">{quiet}</span>
      <RampBar className="h-2 w-20 sm:w-32" />
      <span className="control-label">{loud}</span>
    </div>
  )
}
