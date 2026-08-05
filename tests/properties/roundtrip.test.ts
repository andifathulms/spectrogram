/**
 * FFT → inverse FFT returns the original signal to tolerance, across the
 * corpus and every supported size. This is what makes synthesis mode's
 * build-transform-invert loop a real check rather than a demonstration.
 */

import { describe, it } from 'vitest'

import { FFT_SIZES } from '../../lib/dsp/errors'
import { fft, ifft } from '../../lib/dsp/fft'
import { chord, complexExponential, impulse, randomComplex, randomReal } from '../support/signals'
import { expectParseval } from '../support/parseval'
import { expectArrayClose, roundTripTolerance } from '../support/tolerance'
import type { ComplexSignal } from '../support/signals'

function expectRoundTrip(signal: ComplexSignal, what: string): void {
  const N = signal.re.length
  const re = Float64Array.from(signal.re)
  const im = Float64Array.from(signal.im)

  fft(re, im)
  ifft(re, im)

  const tol = roundTripTolerance(N)
  expectArrayClose(re, signal.re, tol, `${what} real, N=${N}`)
  expectArrayClose(im, signal.im, tol, `${what} imag, N=${N}`)
}

describe('the transform round-trips', () => {
  it.each(FFT_SIZES)('random complex corpus, N=%i', (N) => {
    for (let seed = 1; seed <= 3; seed++) {
      const signal = randomComplex(N, N * 13 + seed)
      expectParseval(signal, `round-trip corpus seed ${seed}`)
      expectRoundTrip(signal, `complex seed ${seed}`)
    }
  })

  it.each(FFT_SIZES)('real corpus, N=%i', (N) => {
    const signal = randomReal(N, N * 17 + 3)
    expectParseval(signal, 'round-trip real corpus')
    expectRoundTrip(signal, 'real noise')
    expectRoundTrip(impulse(N, N >> 1), 'impulse')
    expectRoundTrip(complexExponential(N, 3.5), 'off-bin exponential')
  })

  it.each([512, 4096])('a synthesised chord survives the round trip, N=%i', (N) => {
    const signal = chord(N, [2, 4, 8, 16, 32, 64], 7)
    expectParseval(signal, 'chord')
    expectRoundTrip(signal, 'chord')
  })

  it('inverse then forward is also the identity', () => {
    const N = 1024
    const spectrum = randomComplex(N, 555)
    const re = Float64Array.from(spectrum.re)
    const im = Float64Array.from(spectrum.im)

    ifft(re, im)
    fft(re, im)

    const tol = roundTripTolerance(N)
    expectArrayClose(re, spectrum.re, tol, 'inverse-first real')
    expectArrayClose(im, spectrum.im, tol, 'inverse-first imag')
  })
})
