/**
 * Where annotations sit on a plate, and how wide an analysis window is drawn.
 *
 * Kept out of components (invariant 15): a marker's position is the same
 * frequency mapping the plate's rows use, so it comes from lib/dsp/scales and
 * not from a guess at a call site.
 */

import { positionOf, type FrequencyScale } from '../dsp/scales'

export interface PlotPoint {
  /** Percent from the left edge. */
  left: number
  /** Percent from the top edge. */
  top: number
}

export function plotPoint(
  scale: FrequencyScale,
  timeSeconds: number,
  hz: number,
  durationSeconds: number,
  minHz: number,
  maxHz: number,
): PlotPoint {
  return {
    left: (timeSeconds / durationSeconds) * 100,
    top: (1 - positionOf(scale, hz, minHz, maxHz)) * 100,
  }
}

/** One analysis window as a fraction of a plate `durationSeconds` wide. */
export function windowFraction(N: number, fs: number, durationSeconds: number): number {
  return N / fs / durationSeconds
}

/**
 * The Hann window's shape as an SVG path in a 100 × 10 box, baseline at the
 * bottom — the bump drawn above each plate in the tradeoff figure. Drawn
 * from the definition w[n] = 0.5 − 0.5·cos(2πn/(N−1)) (Harris 1978).
 */
export const HANN_PATH: string = (() => {
  const points: string[] = []
  const steps = 48
  for (let i = 0; i <= steps; i++) {
    const u = i / steps
    const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * u)
    points.push(`${(u * 100).toFixed(2)},${(10 - w * 9.5).toFixed(2)}`)
  }
  return `M${points.join('L')}`
})()

/**
 * The Detail control's two bars: how blurred timing and pitch are at window
 * size N, each as a fraction of the bar, on the log2 scale the slider moves
 * along. One grows exactly as the other shrinks — that is the point — and
 * neither reaches zero, because neither ever becomes perfectly sharp.
 */
export function blurBars(N: number, smallest: number, largest: number): { timing: number; pitch: number } {
  const span = Math.log2(largest) - Math.log2(smallest)
  const t = span > 0 ? (Math.log2(N) - Math.log2(smallest)) / span : 0.5
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t
  return { timing: 0.08 + clamped * 0.92, pitch: 1 - clamped * 0.92 }
}
