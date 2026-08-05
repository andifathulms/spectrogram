'use client'

import { useMemo } from 'react'

import { ENERGY_PALETTE, PALETTE_SIZE, rampColor } from '@/lib/render/palette'

/**
 * The energy ramp as a swatch, so the plate's brightness has a stated meaning.
 * Built from the same LUT the plate uses — never a hand-written gradient that
 * could drift away from it.
 */
export function RampLegend({ className = '' }: { className?: string }) {
  const gradient = useMemo(() => {
    const steps: string[] = []
    for (let i = 0; i <= 16; i++) {
      const t = i / 16
      steps.push(`${rampColor(t, ENERGY_PALETTE)} ${(t * 100).toFixed(1)}%`)
    }
    return `linear-gradient(to right, ${steps.join(', ')})`
  }, [])

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="control-label">quiet</span>
      <div
        className="h-2 w-40 border border-emulsion"
        style={{ background: gradient }}
        aria-hidden
        title={`${PALETTE_SIZE}-step energy ramp`}
      />
      <span className="control-label">loud</span>
    </div>
  )
}
