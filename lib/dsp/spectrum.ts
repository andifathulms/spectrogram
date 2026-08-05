/**
 * One spectrogram column, allocation-free.
 *
 * Composes the pipeline from PRD §5 — window → FFT → magnitude → dB — into a
 * reusable analyser that owns its buffers. Everything is allocated once, at
 * construction; `analyse` allocates nothing (invariant 4).
 *
 * Pure: typed arrays in, typed arrays out. No Web Audio, no DOM, no clock.
 */

import { assertLength, assertRadix2 } from './errors'
import { binCount, binSpacing, fft, windowDuration } from './fft'
import { DB_FLOOR } from './magnitude'
import { coherentGain, windowFor, type WindowKind } from './windows'

export interface SpectrumOptions {
  /** Transform size, a power of two. */
  N: number
  /** Sample rate in Hz. Carried so readouts can be labelled in real units. */
  fs: number
  window?: WindowKind
  /** Bottom of the display's dynamic range in dB. */
  minDb?: number
  /** Top of the display's dynamic range in dB. */
  maxDb?: number
}

export interface SpectrumAnalyser {
  readonly N: number
  readonly fs: number
  readonly window: WindowKind
  /** Number of one-sided bins, N/2 + 1. */
  readonly bins: number
  /** Hz between adjacent bins. */
  readonly binSpacingHz: number
  /** Seconds covered by one analysis window. */
  readonly windowSeconds: number
  /** Amplitude per bin, in the units of the input signal. Reused every frame. */
  readonly amplitude: Float64Array
  /** Amplitude per bin in dBFS. Reused every frame. */
  readonly db: Float64Array
  /** dB mapped onto [0, 1] for the energy ramp. Reused every frame. */
  readonly column: Float32Array
  /** Peak absolute sample of the last frame — drives the clip indicator. */
  peak: number
  /** True when the last frame reached full scale. */
  clipped: boolean

  analyse(frame: Float64Array): void
  /** Web Audio hands us Float32Array; conversion happens here, once, deliberately. */
  analyseFloat32(frame: Float32Array): void
  setDynamicRange(minDb: number, maxDb: number): void
}

/** Amplitude at or above this counts as clipping. */
const CLIP_THRESHOLD = 0.999

export function createSpectrumAnalyser(options: SpectrumOptions): SpectrumAnalyser {
  const { N, fs } = options
  assertRadix2(N)

  const kind: WindowKind = options.window ?? 'hann'
  const bins = binCount(N)

  const coefficients = windowFor(kind, N)
  const gain = coherentGain(coefficients)
  const scale = 1 / (N * gain)

  const re = new Float64Array(N)
  const im = new Float64Array(N)
  const amplitude = new Float64Array(bins)
  const db = new Float64Array(bins)
  const column = new Float32Array(bins)

  let minDb = options.minDb ?? DB_FLOOR
  let maxDb = options.maxDb ?? 0

  const analyser: SpectrumAnalyser = {
    N,
    fs,
    window: kind,
    bins,
    binSpacingHz: binSpacing(N, fs),
    windowSeconds: windowDuration(N, fs),
    amplitude,
    db,
    column,
    peak: 0,
    clipped: false,

    analyse(frame: Float64Array): void {
      assertLength('frame', frame.length, N)
      let peak = 0
      for (let n = 0; n < N; n++) {
        const sample = frame[n]
        const magnitude = sample < 0 ? -sample : sample
        if (magnitude > peak) peak = magnitude
        re[n] = sample * coefficients[n]
        im[n] = 0
      }
      analyser.peak = peak
      analyser.clipped = peak >= CLIP_THRESHOLD
      finish()
    },

    analyseFloat32(frame: Float32Array): void {
      assertLength('frame', frame.length, N)
      let peak = 0
      for (let n = 0; n < N; n++) {
        const sample = frame[n]
        const magnitude = sample < 0 ? -sample : sample
        if (magnitude > peak) peak = magnitude
        re[n] = sample * coefficients[n]
        im[n] = 0
      }
      analyser.peak = peak
      analyser.clipped = peak >= CLIP_THRESHOLD
      finish()
    },

    setDynamicRange(nextMin: number, nextMax: number): void {
      minDb = nextMin
      maxDb = nextMax
    },
  }

  /** Shared tail of both entry points: transform, magnitude, dB, normalise. */
  function finish(): void {
    fft(re, im)

    const last = bins - 1
    const span = maxDb - minDb
    const inverseSpan = span === 0 ? 0 : 1 / span

    for (let k = 0; k <= last; k++) {
      // DC and Nyquist have no mirrored partner to fold back in.
      const mirrored = k === 0 || k === last ? 1 : 2
      const a = mirrored * scale * Math.hypot(re[k], im[k])
      amplitude[k] = a

      const value = a <= 0 ? minDb : 20 * Math.log10(a)
      const clampedDb = value < minDb ? minDb : value
      db[k] = clampedDb

      const t = (clampedDb - minDb) * inverseSpan
      column[k] = t < 0 ? 0 : t > 1 ? 1 : t
    }
  }

  return analyser
}

/** Hop size in samples for a given overlap fraction, rounded to a whole sample. */
export function hopFor(N: number, overlap: number): number {
  const clamped = overlap < 0 ? 0 : overlap > 0.95 ? 0.95 : overlap
  return Math.max(1, Math.round(N * (1 - clamped)))
}

/** Seconds between successive columns — the time resolution of the plate. */
export function hopSeconds(hop: number, fs: number): number {
  return hop / fs
}
