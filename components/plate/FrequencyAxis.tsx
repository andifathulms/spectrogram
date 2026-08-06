'use client'

import { positionOf, type FrequencyScale } from '@/lib/dsp/scales'
import { axisHz } from '@/lib/ui/format'

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

/**
 * Width of the tick gutter. Compact labels ("20 kHz", not "20.00 kHz") fit in
 * 56px, and on a 390px phone the twelve pixels saved are plate.
 */
export const AXIS_GUTTER_PX = 56

/** No two labels closer than this, or the top of a log axis becomes a smudge. */
const MIN_LABEL_GAP_PX = 18

export function FrequencyAxis({ scale, minHz, maxHz, height }: Props) {
  const ticks = frequencyTicks(scale, minHz, maxHz)

  /*
   * A log axis packs its decades towards the top, and at plate heights below
   * about 400px the highest three labels collide into an unreadable block.
   * Ticks are laid out from the bottom and any that lands too close to the
   * last one drawn is dropped — the axis stays legible at every height, which
   * matters because the hero plate is 260px and the live one is 340.
   */
  const placed: { tick: number; top: number }[] = []
  let lastTop = Number.POSITIVE_INFINITY
  for (const tick of ticks) {
    const t = positionOf(scale, tick, minHz, maxHz)
    if (t < -0.001 || t > 1.001) continue
    const top = (1 - t) * height
    if (lastTop - top < MIN_LABEL_GAP_PX) continue
    placed.push({ tick, top })
    lastTop = top
  }

  return (
    <div className="relative shrink-0 border-r border-emulsion" style={{ height, width: AXIS_GUTTER_PX }}>
      {placed.map(({ tick, top }) => {
        return (
          <div
            key={tick}
            className="absolute right-1.5 flex -translate-y-1/2 items-center gap-1.5"
            style={{ top }}
          >
            <span className="tabular whitespace-nowrap text-[10px] leading-none text-inkMuted">
              {axisHz(tick)}
            </span>
            <span className="block h-px w-1.5 bg-emulsion" />
          </div>
        )
      })}
    </div>
  )
}
