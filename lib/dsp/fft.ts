/**
 * In-place radix-2 Cooley-Tukey FFT and its inverse.
 *
 * Cooley & Tukey (1965), "An Algorithm for the Machine Calculation of Complex
 * Fourier Series", Math. Comp. 19, 297–301. The recursive even/odd
 * decomposition is written here in its iterative form: a bit-reversal
 * permutation followed by log2(N) stages of butterflies over precomputed
 * twiddle factors.
 *
 * Invariant 5: real and imaginary parts live in separate Float64Arrays.
 * Invariant 4: nothing is allocated here — the tables are cached per size and
 * the transform writes through the caller's buffers.
 */

import { assertLength, assertRadix2 } from './errors'
import { tablesFor } from './tables'

/**
 * Forward transform, in place.
 *
 *   X[k] = Σ_n x[n] · e^{−2πi·kn/N}
 *
 * No normalisation on this side; the 1/N lives in `ifft`.
 */
export function fft(re: Float64Array, im: Float64Array): void {
  const N = re.length
  assertRadix2(N)
  assertLength('im', im.length, N)
  transform(re, im, N)
}

/**
 * Inverse transform, in place, normalised by 1/N.
 *
 * Uses the conjugation identity — IFFT(X) = conj(FFT(conj(X)))/N — realised by
 * swapping the roles of the real and imaginary buffers on the way in and on
 * the way out. No extra storage, no second twiddle table.
 */
export function ifft(re: Float64Array, im: Float64Array): void {
  const N = re.length
  assertRadix2(N)
  assertLength('im', im.length, N)

  transform(im, re, N) // swapped arguments = conjugated transform

  const scale = 1 / N
  for (let i = 0; i < N; i++) {
    re[i] *= scale
    im[i] *= scale
  }
}

/**
 * Convenience for real input: copies `signal` into `re`, zeroes `im`, and
 * transforms. The buffers are the caller's, so a hot loop reuses them.
 */
export function fftReal(signal: Float64Array, re: Float64Array, im: Float64Array): void {
  const N = re.length
  assertRadix2(N)
  assertLength('signal', signal.length, N)
  assertLength('im', im.length, N)

  for (let i = 0; i < N; i++) {
    re[i] = signal[i]
    im[i] = 0
  }
  transform(re, im, N)
}

/** Number of unique bins for a real input of length N, including DC and Nyquist. */
export function binCount(N: number): number {
  assertRadix2(N)
  return N / 2 + 1
}

/** Centre frequency of bin k in Hz, given the sample rate fs. */
export function binFrequency(bin: number, N: number, fs: number): number {
  return (bin * fs) / N
}

/** Spacing between adjacent bins in Hz — the frequency-resolution half of §2. */
export function binSpacing(N: number, fs: number): number {
  return fs / N
}

/** Duration of one analysis window in seconds — the time-resolution half of §2. */
export function windowDuration(N: number, fs: number): number {
  return N / fs
}

/** The shared engine. Size validation has already happened at the boundary. */
function transform(re: Float64Array, im: Float64Array, N: number): void {
  const { reverse, cos, sin } = tablesFor(N)

  // Bit-reversal permutation. Swap only when j > i so each pair moves once.
  for (let i = 0; i < N; i++) {
    const j = reverse[i]
    if (j > i) {
      const tr = re[i]
      re[i] = re[j]
      re[j] = tr
      const ti = im[i]
      im[i] = im[j]
      im[j] = ti
    }
  }

  // log2(N) stages. `half` is the butterfly span; `stride` picks this stage's
  // twiddles out of the single N/2-entry table.
  for (let half = 1; half < N; half <<= 1) {
    const span = half << 1
    const stride = N / span
    for (let base = 0; base < N; base += span) {
      for (let j = 0; j < half; j++) {
        const w = j * stride
        const wr = cos[w]
        const wi = sin[w]
        const a = base + j
        const b = a + half

        // t = W · x[b]
        const tr = re[b] * wr - im[b] * wi
        const ti = re[b] * wi + im[b] * wr

        re[b] = re[a] - tr
        im[b] = im[a] - ti
        re[a] += tr
        im[a] += ti
      }
    }
  }
}
