'use client'

import { positionOf, type FrequencyScale } from '@/lib/dsp/scales'
import { hz as formatHz } from '@/lib/ui/format'

const LOG_TICKS = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10_000, 20_000]

/** Ticks in Hz for the current scale, always real units (invariant 10). */
export function frequencyTicks(scale: FrequencyScale, minHz: number, maxHz: number): number[] {
  if (scale === 'linear') {
    const step = niceStep(maxHz / 8)
    const ticks: number[] = []
    for (let hz = 0; hz <= maxHz + 1; hz += step) ticks.push(hz)
    return ticks
  }
  return LOG_TICKS.filter((tick) => tick >= minHz && tick <= maxHz)
}

function niceStep(rough: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const normalised = rough / magnitude
  const step = normalised >= 5 ? 5 : normalised >= 2 ? 2 : 1
  return step * magnitude
}

interface Props {
  scale: FrequencyScale
  minHz: number
  maxHz: number
  /** Height of the plate in CSS pixels, so labels line up with their rows. */
  height: number
}

export function FrequencyAxis({ scale, minHz, maxHz, height }: Props) {
  const ticks = frequencyTicks(scale, minHz, maxHz)

  return (
    <div className="relative w-[68px] shrink-0 border-r border-emulsion" style={{ height }}>
      {ticks.map((tick) => {
        const t = positionOf(scale, tick, minHz, maxHz)
        if (t < -0.001 || t > 1.001) return null
        const top = (1 - t) * height

        return (
          <div
            key={tick}
            className="absolute right-1.5 flex -translate-y-1/2 items-center gap-1.5"
            style={{ top }}
          >
            <span className="tabular text-[10px] leading-none text-inkMuted">
              {formatHz(tick)}
            </span>
            <span className="block h-px w-1.5 bg-emulsion" />
          </div>
        )
      })}
    </div>
  )
}
