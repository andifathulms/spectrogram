/**
 * The backbone: our FFT must agree with the naive DFT to tolerance, across
 * every supported size and a corpus of deterministic random signals.
 *
 * The DFT is O(N²), so the oracle runs up to 1024 points; sizes above that are
 * covered by round-trip, Parseval and the analytic fixtures, which have no
 * quadratic cost.
 */

import { describe, expect, it } from 'vitest'

import { dft, idft } from '../../lib/dsp/dft'
import { fft, ifft } from '../../lib/dsp/fft'
import { FFT_SIZES } from '../../lib/dsp/errors'
import { chord, impulse, randomComplex, randomReal, realCosine } from '../support/signals'
import { expectParseval } from '../support/parseval'
import { expectArrayClose, transformTolerance } from '../support/tolerance'

const ORACLE_SIZES = FFT_SIZES.filter((N) => N <= 1024)

describe('FFT agrees with the naive DFT', () => {
  it.each(ORACLE_SIZES)('random complex input, N=%i', (N) => {
    for (let seed = 1; seed <= 4; seed++) {
      const signal = randomComplex(N, seed * 7919 + N)
      expectParseval(signal, `oracle corpus seed ${seed}`)

      const fastRe = Float64Array.from(signal.re)
      const fastIm = Float64Array.from(signal.im)
      fft(fastRe, fastIm)

      const slowRe = new Float64Array(N)
      const slowIm = new Float64Array(N)
      dft(signal.re, signal.im, slowRe, slowIm)

      const tol = transformTolerance(N)
      expectArrayClose(fastRe, slowRe, tol, `real part, N=${N}, seed=${seed}`)
      expectArrayClose(fastIm, slowIm, tol, `imag part, N=${N}, seed=${seed}`)
    }
  })

  it.each(ORACLE_SIZES)('real-only input, N=%i', (N) => {
    const signal = randomReal(N, N * 31 + 5)
    expectParseval(signal, 'oracle real corpus')

    const fastRe = Float64Array.from(signal.re)
    const fastIm = Float64Array.from(signal.im)
    fft(fastRe, fastIm)

    const slowRe = new Float64Array(N)
    const slowIm = new Float64Array(N)
    dft(signal.re, signal.im, slowRe, slowIm)

    const tol = transformTolerance(N)
    expectArrayClose(fastRe, slowRe, tol, `real part, N=${N}`)
    expectArrayClose(fastIm, slowIm, tol, `imag part, N=${N}`)
  })

  it.each([64, 256, 1024])('structured inputs, N=%i', (N) => {
    const cases = [
      { name: 'impulse at 0', signal: impulse(N, 0) },
      { name: 'impulse offset', signal: impulse(N, N >> 2) },
      { name: 'bin-centred cosine', signal: realCosine(N, 5) },
      { name: 'off-bin cosine', signal: realCosine(N, 5.37) },
      { name: 'harmonic stack', signal: chord(N, [3, 6, 9, 12, 15]) },
    ]

    for (const { name, signal } of cases) {
      expectParseval(signal, name)

      const fastRe = Float64Array.from(signal.re)
      const fastIm = Float64Array.from(signal.im)
      fft(fastRe, fastIm)

      const slowRe = new Float64Array(N)
      const slowIm = new Float64Array(N)
      dft(signal.re, signal.im, slowRe, slowIm)

      const tol = transformTolerance(N)
      expectArrayClose(fastRe, slowRe, tol, `${name} real, N=${N}`)
      expectArrayClose(fastIm, slowIm, tol, `${name} imag, N=${N}`)
    }
  })
})

describe('inverse FFT agrees with the naive inverse DFT', () => {
  it.each(ORACLE_SIZES)('N=%i', (N) => {
    const spectrum = randomComplex(N, N * 977 + 13)

    const fastRe = Float64Array.from(spectrum.re)
    const fastIm = Float64Array.from(spectrum.im)
    ifft(fastRe, fastIm)

    const slowRe = new Float64Array(N)
    const slowIm = new Float64Array(N)
    idft(spectrum.re, spectrum.im, slowRe, slowIm)

    const tol = transformTolerance(N)
    expectArrayClose(fastRe, slowRe, tol, `inverse real, N=${N}`)
    expectArrayClose(fastIm, slowIm, tol, `inverse imag, N=${N}`)
  })
})

describe('the oracle is not silently mirroring our implementation', () => {
  it('a deliberately corrupted spectrum fails the comparison', () => {
    const N = 64
    const signal = randomComplex(N, 4242)
    const slowRe = new Float64Array(N)
    const slowIm = new Float64Array(N)
    dft(signal.re, signal.im, slowRe, slowIm)

    const corrupted = Float64Array.from(slowRe)
    corrupted[7] += 1e-3

    expect(() =>
      expectArrayClose(corrupted, slowRe, transformTolerance(N), 'sanity'),
    ).toThrow()
  })
})
