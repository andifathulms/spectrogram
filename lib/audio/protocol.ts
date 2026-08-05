/**
 * Message protocol between the main thread and the analysis worker.
 *
 * Pure types plus one helper — no Web Audio, no DOM — so both ends and the
 * tests can import it.
 *
 * Column buffers are transferred, not copied, and the main thread hands them
 * back with `recycle` once it has blitted them. That keeps the steady state
 * allocation-free across the thread boundary as well as inside it
 * (invariant 4).
 */

import type { WindowKind } from '../dsp/windows'

export interface AnalysisConfig {
  /** Transform size, a power of two. */
  N: number
  /** Sample rate in Hz, taken from the AudioContext. */
  fs: number
  /** Fraction of each window shared with the previous one, in [0, 0.95]. */
  overlap: number
  window: WindowKind
  /** Bottom of the display's dynamic range in dB. */
  minDb: number
  /** Top of the display's dynamic range in dB. */
  maxDb: number
}

export interface AnalysisInfo {
  N: number
  fs: number
  window: WindowKind
  /** One-sided bins, N/2 + 1. */
  bins: number
  /** Hz between adjacent bins. */
  binSpacingHz: number
  /** Seconds covered by one window. */
  windowSeconds: number
  /** Samples between successive columns. */
  hop: number
  /** Seconds between successive columns. */
  hopSeconds: number
}

export type AnalyserRequest =
  | { type: 'configure'; config: AnalysisConfig }
  /** Streaming input — live capture. */
  | { type: 'push'; samples: Float32Array }
  /** A whole buffer at once — sample playback and synthesis. */
  | { type: 'analyse'; id: number; samples: Float32Array }
  | { type: 'recycle'; buffer: ArrayBuffer }
  | { type: 'reset' }
  /**
   * One-shot inspection of a single N-point frame: amplitude spectrum plus the
   * round-trip residual. Used by synthesis mode, where the user supplies the
   * ground truth and wants to check the tool against it.
   */
  | { type: 'inspect'; id: number; samples: Float32Array; window: WindowKind; fs: number }

export type AnalyserResponse =
  | { type: 'ready'; info: AnalysisInfo }
  /** `count` columns of `bins` floats each, packed column-major. */
  | {
      type: 'columns'
      buffer: ArrayBuffer
      count: number
      bins: number
      /** Index of the first column in this batch, counted from the last reset. */
      first: number
      /** Largest absolute sample seen in this batch. */
      peak: number
      clipped: boolean
    }
  | { type: 'complete'; id: number; count: number }
  | {
      type: 'inspection'
      id: number
      N: number
      fs: number
      /** One-sided amplitude spectrum, N/2 + 1 floats, window gain corrected. */
      amplitude: ArrayBuffer
      /** Largest absolute deviation after FFT then inverse FFT. */
      roundTripError: number
      /** Time-domain energy and its spectral counterpart — Parseval, live. */
      timeEnergy: number
      spectralEnergy: number
    }
  | { type: 'fault'; message: string }

export const DEFAULT_CONFIG: AnalysisConfig = {
  N: 2048,
  fs: 48_000,
  overlap: 0.75,
  window: 'hann',
  minDb: -90,
  maxDb: -10,
}

/** Columns per second at a given configuration — the plate's scroll rate. */
export function columnsPerSecond(info: AnalysisInfo): number {
  return info.fs / info.hop
}
