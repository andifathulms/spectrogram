/**
 * Naive discrete Fourier transform — the literal definition, O(N²).
 *
 *   X[k] = Σ_{n=0}^{N-1} x[n] · e^{−2πi·kn/N}
 *   x[n] = (1/N) · Σ_{k=0}^{N-1} X[k] · e^{+2πi·kn/N}
 *
 * TESTS ONLY. This is the oracle our radix-2 FFT is verified against
 * (invariant 3). It is never imported from app/, components/, or worklets/,
 * and eslint enforces that.
 *
 * Unlike fft.ts this accepts any N ≥ 1 — the definition has no radix
 * constraint — and it allocates freely, because nothing here is on a hot path.
 */

import { assertLength } from './errors'

/** Forward DFT. Out-of-place; `outRe`/`outIm` may not alias the inputs. */
export function dft(
  re: Float64Array,
  im: Float64Array,
  outRe: Float64Array,
  outIm: Float64Array,
): void {
  const N = re.length
  assertLength('im', im.length, N)
  assertLength('outRe', outRe.length, N)
  assertLength('outIm', outIm.length, N)

  for (let k = 0; k < N; k++) {
    let sumRe = 0
    let sumIm = 0
    for (let n = 0; n < N; n++) {
      const angle = (-2 * Math.PI * k * n) / N
      const c = Math.cos(angle)
      const s = Math.sin(angle)
      // (re + i·im)(c + i·s)
      sumRe += re[n] * c - im[n] * s
      sumIm += re[n] * s + im[n] * c
    }
    outRe[k] = sumRe
    outIm[k] = sumIm
  }
}

/** Inverse DFT, with the 1/N normalisation on this side of the pair. */
export function idft(
  re: Float64Array,
  im: Float64Array,
  outRe: Float64Array,
  outIm: Float64Array,
): void {
  const N = re.length
  assertLength('im', im.length, N)
  assertLength('outRe', outRe.length, N)
  assertLength('outIm', outIm.length, N)

  for (let n = 0; n < N; n++) {
    let sumRe = 0
    let sumIm = 0
    for (let k = 0; k < N; k++) {
      const angle = (2 * Math.PI * k * n) / N
      const c = Math.cos(angle)
      const s = Math.sin(angle)
      sumRe += re[k] * c - im[k] * s
      sumIm += re[k] * s + im[k] * c
    }
    outRe[n] = sumRe / N
    outIm[n] = sumIm / N
  }
}
