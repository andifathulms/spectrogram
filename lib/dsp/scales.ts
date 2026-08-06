/**
 * Frequency scales — linear, logarithmic, mel.
 *
 * Linear is what the FFT gives you, log is how pitch works, mel is how hearing
 * works (PRD §4.6). Each is expressed as a map from display row to a
 * *fractional* bin index, so the plate resamples the spectrum by interpolation
 * rather than by picking a nearest bin and aliasing the display.
 *
 * Row 0 is the lowest frequency. The renderer flips for screen coordinates.
 */

import { assertRadix2 } from './errors'

export type FrequencyScale = 'linear' | 'log' | 'mel'

export const FREQUENCY_SCALES: readonly FrequencyScale[] = ['linear', 'log', 'mel']

/** O'Shaughnessy (1987), the form used throughout speech processing. */
export function hzToMel(hz: number): number {
  return 2595 * Math.log10(1 + hz / 700)
}

export function melToHz(mel: number): number {
  return 700 * (10 ** (mel / 2595) - 1)
}

/**
 * Frequency in Hz at normalised position t ∈ [0, 1] up the axis.
 *
 * The log scale cannot start at 0 Hz, so `minHz` is a real parameter and not a
 * detail — it is the bottom of the visible axis and is labelled as such.
 */
export function frequencyAt(scale: FrequencyScale, t: number, minHz: number, maxHz: number): number {
  switch (scale) {
    case 'linear':
      return minHz + t * (maxHz - minHz)
    case 'log': {
      const low = Math.max(minHz, 1)
      return low * (maxHz / low) ** t
    }
    case 'mel': {
      const lowMel = hzToMel(minHz)
      return melToHz(lowMel + t * (hzToMel(maxHz) - lowMel))
    }
    default: {
      const never: never = scale
      throw new Error(`Unknown frequency scale: ${String(never)}`)
    }
  }
}

/** Inverse of `frequencyAt` — where a frequency sits on the axis, for cursors and labels. */
export function positionOf(scale: FrequencyScale, hz: number, minHz: number, maxHz: number): number {
  switch (scale) {
    case 'linear':
      return (hz - minHz) / (maxHz - minHz)
    case 'log': {
      const low = Math.max(minHz, 1)
      return Math.log(Math.max(hz, low) / low) / Math.log(maxHz / low)
    }
    case 'mel': {
      const lowMel = hzToMel(minHz)
      return (hzToMel(hz) - lowMel) / (hzToMel(maxHz) - lowMel)
    }
    default: {
      const never: never = scale
      throw new Error(`Unknown frequency scale: ${String(never)}`)
    }
  }
}

/**
 * Fractional bin index for each display row, ascending in frequency.
 *
 * Built once per (scale, rows, N, fs) by the renderer and reused for every
 * column; nothing here runs per frame.
 */
export function buildScaleMap(
  scale: FrequencyScale,
  rows: number,
  N: number,
  fs: number,
  minHz = 20,
): Float32Array {
  assertRadix2(N)
  const nyquist = fs / 2
  const binsPerHz = N / fs
  const map = new Float32Array(rows)
  const lastBin = N / 2

  for (let row = 0; row < rows; row++) {
    const t = rows === 1 ? 0 : row / (rows - 1)
    const hz = frequencyAt(scale, t, scale === 'linear' ? 0 : minHz, nyquist)
    const bin = hz * binsPerHz
    map[row] = bin < 0 ? 0 : bin > lastBin ? lastBin : bin
  }
  return map
}

/** Linear interpolation of a spectrum at a fractional bin index. */
export function sampleAt(spectrum: Float32Array | Float64Array, bin: number): number {
  const low = Math.floor(bin)
  const high = low + 1
  if (high >= spectrum.length) return spectrum[spectrum.length - 1]
  const frac = bin - low
  return spectrum[low] * (1 - frac) + spectrum[high] * frac
}
