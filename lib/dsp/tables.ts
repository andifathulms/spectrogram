/**
 * Precomputed twiddle factors and bit-reversal permutations, cached per size.
 *
 * Invariant 4: no allocation in the hot loop. Everything the butterfly needs
 * is built once, the first time a size is seen, and reused for every frame
 * after that. The cache is the one piece of module-level mutable state
 * lib/dsp is allowed (invariant 1).
 */

import { assertRadix2 } from './errors'

export interface FftTables {
  readonly N: number
  /** log2(N) — the number of butterfly stages. */
  readonly stages: number
  /** Destination index of each input index under bit reversal. */
  readonly reverse: Uint32Array
  /** cos(−2πj/N) for j in [0, N/2). Indexed by stride within each stage. */
  readonly cos: Float64Array
  /** sin(−2πj/N) for j in [0, N/2). */
  readonly sin: Float64Array
}

const cache = new Map<number, FftTables>()

export function tablesFor(N: number): FftTables {
  assertRadix2(N)
  const hit = cache.get(N)
  if (hit !== undefined) return hit

  const built: FftTables = {
    N,
    stages: Math.log2(N),
    reverse: bitReversal(N),
    ...twiddles(N),
  }
  cache.set(N, built)
  return built
}

/** Test and benchmark hook. Never called from application code. */
export function clearTableCache(): void {
  cache.clear()
}

/**
 * Bit-reversal permutation. reverse[i] is i with its log2(N) bits reversed,
 * built incrementally: reverse[i] = (reverse[i >> 1] >> 1) | ((i & 1) * N/2).
 */
function bitReversal(N: number): Uint32Array {
  const reverse = new Uint32Array(N)
  const half = N >>> 1
  for (let i = 1; i < N; i++) {
    reverse[i] = (reverse[i >>> 1] >>> 1) | ((i & 1) * half)
  }
  return reverse
}

/**
 * Roots of unity W_N^j = e^{−2πij/N} for j in [0, N/2).
 *
 * A stage with half-block size `len` uses every (N / (2·len))-th entry, so one
 * table of N/2 entries serves all log2(N) stages.
 */
function twiddles(N: number): { cos: Float64Array; sin: Float64Array } {
  const half = N >>> 1
  const cos = new Float64Array(half)
  const sin = new Float64Array(half)
  for (let j = 0; j < half; j++) {
    const angle = (-2 * Math.PI * j) / N
    cos[j] = Math.cos(angle)
    sin[j] = Math.sin(angle)
  }
  return { cos, sin }
}
