/**
 * Window functions.
 *
 * Coefficients from Harris (1978), "On the Use of Windows for Harmonic
 * Analysis with the Discrete Fourier Transform", Proc. IEEE 66(1), 51–83,
 * Table I. All four are members of the generalised cosine family
 *
 *   w[n] = a0 − a1·cos(2πn/D) + a2·cos(4πn/D)
 *
 * where D = N for the periodic (DFT-even) form and D = N−1 for the symmetric
 * form. Periodic is the default: it is the correct choice for spectral
 * analysis of a continuous stream, and it is the form for which Harris's
 * coherent gains are exact. The symmetric form is kept because it is what the
 * symmetry and endpoint assertions in the test suite are written against, and
 * what a reader holding the textbook will expect to find.
 */

import { assertLength } from './errors'

export type WindowKind = 'rectangular' | 'hann' | 'hamming' | 'blackman'
export type WindowSymmetry = 'periodic' | 'symmetric'

export const WINDOW_KINDS: readonly WindowKind[] = ['rectangular', 'hann', 'hamming', 'blackman']

interface CosineCoefficients {
  readonly a0: number
  readonly a1: number
  readonly a2: number
}

/** Harris (1978) Table I. */
const COEFFICIENTS: Record<WindowKind, CosineCoefficients> = {
  rectangular: { a0: 1, a1: 0, a2: 0 },
  hann: { a0: 0.5, a1: 0.5, a2: 0 },
  hamming: { a0: 0.54, a1: 0.46, a2: 0 },
  blackman: { a0: 0.42, a1: 0.5, a2: 0.08 },
}

/**
 * Coherent gain — the mean of the window coefficients, and the factor by
 * which the window attenuates a sinusoid's measured amplitude. Equal to a0 for
 * every periodic generalised cosine window, because the cosine terms sum to
 * zero over a whole number of periods. Harris (1978) Table I.
 */
export const PUBLISHED_COHERENT_GAIN: Record<WindowKind, number> = {
  rectangular: 1,
  hann: 0.5,
  hamming: 0.54,
  blackman: 0.42,
}

/** Indonesian labels for the interface; the term itself stays in English. */
export const WINDOW_LABELS: Record<WindowKind, string> = {
  rectangular: 'Rectangular — tanpa taper',
  hann: 'Hann — taper kosinus',
  hamming: 'Hamming — skirt lebih rendah',
  blackman: 'Blackman — leakage paling kecil',
}

const cache = new Map<string, Float64Array>()

/** Cached coefficient array. Invariant 4: built once per (kind, N, symmetry). */
export function windowFor(
  kind: WindowKind,
  N: number,
  symmetry: WindowSymmetry = 'periodic',
): Float64Array {
  const key = `${kind}:${N}:${symmetry}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit

  const coefficients = new Float64Array(N)
  fillWindow(kind, coefficients, symmetry)
  cache.set(key, coefficients)
  return coefficients
}

/** Test and benchmark hook. Never called from application code. */
export function clearWindowCache(): void {
  cache.clear()
}

/** Writes the window into `out`, whose length fixes N. */
export function fillWindow(
  kind: WindowKind,
  out: Float64Array,
  symmetry: WindowSymmetry = 'periodic',
): void {
  const N = out.length
  const { a0, a1, a2 } = COEFFICIENTS[kind]

  if (kind === 'rectangular') {
    out.fill(1)
    return
  }

  // A symmetric window of length 1 would divide by zero; it is also degenerate.
  const denominator = symmetry === 'periodic' ? N : Math.max(N - 1, 1)
  for (let n = 0; n < N; n++) {
    const phase = (2 * Math.PI * n) / denominator
    out[n] = a0 - a1 * Math.cos(phase) + a2 * Math.cos(2 * phase)
  }
}

/** Multiplies a frame by a window. `out` may alias `frame`. */
export function applyWindow(frame: Float64Array, coefficients: Float64Array, out: Float64Array): void {
  const N = frame.length
  assertLength('coefficients', coefficients.length, N)
  assertLength('out', out.length, N)
  for (let n = 0; n < N; n++) out[n] = frame[n] * coefficients[n]
}

/** Measured coherent gain: the mean coefficient. Compared against the table in tests. */
export function coherentGain(coefficients: Float64Array): number {
  let sum = 0
  for (let n = 0; n < coefficients.length; n++) sum += coefficients[n]
  return sum / coefficients.length
}

/**
 * Noise-equivalent bandwidth in bins — how much wider than one bin the window
 * makes a spectral line. Harris (1978) §3.C.
 */
export function equivalentNoiseBandwidth(coefficients: Float64Array): number {
  let sum = 0
  let sumSquares = 0
  for (let n = 0; n < coefficients.length; n++) {
    sum += coefficients[n]
    sumSquares += coefficients[n] * coefficients[n]
  }
  return (coefficients.length * sumSquares) / (sum * sum)
}
