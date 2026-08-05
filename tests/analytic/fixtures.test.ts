/**
 * Analytically known signals — permanent fixtures.
 *
 * Every expected value here is derivable by hand from the definition of the
 * transform, and none of them depends on another implementation. This is the
 * suite that would survive if the oracle itself were wrong.
 */

import { describe, expect, it } from 'vitest'

import { amplitudeSpectrum, magnitudeSpectrum } from '../../lib/dsp/magnitude'
import { binCount, fft } from '../../lib/dsp/fft'
import { complexExponential, constant, impulse, realCosine } from '../support/signals'
import { expectParseval } from '../support/parseval'
import { expectClose, transformTolerance } from '../support/tolerance'
import type { ComplexSignal } from '../support/signals'

function spectrumOf(signal: ComplexSignal): { re: Float64Array; im: Float64Array } {
  const re = Float64Array.from(signal.re)
  const im = Float64Array.from(signal.im)
  fft(re, im)
  return { re, im }
}

function oneSidedMagnitude(signal: ComplexSignal): Float64Array {
  const { re, im } = spectrumOf(signal)
  const out = new Float64Array(binCount(re.length))
  magnitudeSpectrum(re, im, out)
  return out
}

const SIZES = [64, 256, 1024, 4096]

describe('DC produces energy in bin 0 and nowhere else', () => {
  it.each(SIZES)('N=%i', (N) => {
    const signal = constant(N, 0.75)
    expectParseval(signal, 'DC')

    const magnitude = oneSidedMagnitude(signal)
    const tol = transformTolerance(N)

    // Σ_n 0.75 = 0.75N in bin 0.
    expectClose(magnitude[0], 0.75 * N, tol, `DC bin 0, N=${N}`)
    for (let k = 1; k < magnitude.length; k++) {
      expectClose(magnitude[k], 0, tol, `DC bin ${k}, N=${N}`)
    }
  })
})

describe('a bin-centred sine produces a single bin', () => {
  it.each(SIZES)('N=%i', (N) => {
    const bin = 7
    const amplitude = 0.6
    const signal = realCosine(N, bin, amplitude)
    expectParseval(signal, 'bin-centred cosine')

    const magnitude = oneSidedMagnitude(signal)
    const tol = transformTolerance(N)

    // A real cosine splits into ±bin, each of magnitude A·N/2.
    expectClose(magnitude[bin], (amplitude * N) / 2, tol, `peak bin, N=${N}`)
    for (let k = 0; k < magnitude.length; k++) {
      if (k === bin) continue
      expectClose(magnitude[k], 0, tol, `leakage into bin ${k}, N=${N}`)
    }
  })

  it.each(SIZES)('amplitude spectrum recovers the amplitude, N=%i', (N) => {
    const bin = 11
    const amplitude = 0.42
    const { re, im } = spectrumOf(realCosine(N, bin, amplitude))
    const out = new Float64Array(binCount(N))
    amplitudeSpectrum(re, im, out)

    expectClose(out[bin], amplitude, transformTolerance(N), `recovered amplitude, N=${N}`)
  })
})

describe('a unit impulse produces a flat magnitude spectrum', () => {
  it.each(SIZES)('N=%i', (N) => {
    const signal = impulse(N, 0)
    expectParseval(signal, 'impulse at 0')

    const magnitude = oneSidedMagnitude(signal)
    for (let k = 0; k < magnitude.length; k++) {
      expectClose(magnitude[k], 1, transformTolerance(N), `impulse bin ${k}, N=${N}`)
    }
  })

  it.each(SIZES)('a shifted impulse stays flat and only rotates phase, N=%i', (N) => {
    const shift = N >> 3
    const { re, im } = spectrumOf(impulse(N, shift))
    const tol = transformTolerance(N)

    for (let k = 0; k < N; k++) {
      // X[k] = e^{−2πi·k·shift/N}
      const angle = (-2 * Math.PI * k * shift) / N
      expectClose(re[k], Math.cos(angle), tol, `shifted impulse re[${k}], N=${N}`)
      expectClose(im[k], Math.sin(angle), tol, `shifted impulse im[${k}], N=${N}`)
    }
  })
})

describe('a half-bin offset produces the known leakage shape', () => {
  /**
   * For x[n] = e^{2πi·f·n/N} the spectrum is the Dirichlet kernel exactly:
   *
   *   X[k] = Σ_n e^{2πi(f−k)n/N},  |X[k]| = |sin(π(f−k))| / |sin(π(f−k)/N)|
   *
   * At a half-bin offset the numerator is 1 for every k, so every bin's
   * magnitude is fixed by the geometry alone. Nothing is fitted here.
   */
  it.each(SIZES)('matches the Dirichlet kernel, N=%i', (N) => {
    const f = 20.5
    const signal = complexExponential(N, f)
    expectParseval(signal, 'half-bin offset exponential')

    const { re, im } = spectrumOf(signal)
    const tol = transformTolerance(N)

    for (let k = 0; k < N; k++) {
      const delta = f - k
      const expected = Math.abs(Math.sin(Math.PI * delta) / Math.sin((Math.PI * delta) / N))
      expectClose(Math.hypot(re[k], im[k]), expected, tol, `Dirichlet bin ${k}, N=${N}`)
    }
  })

  /**
   * Scallop loss: worst-case attenuation for a rectangular window, when the
   * tone sits exactly between two bins. Harris (1978) Table I gives −3.92 dB.
   *
   * That figure is the large-N limit. The exact peak is the Dirichlet kernel
   * at δ = ½, which is 1 / sin(π/2N); the familiar 2N/π is its small-angle
   * approximation and differs by (π/2N)²/6 in relative terms — 2.6e-4 at
   * N=1024, far above transform tolerance. We assert the exact value, and
   * check the approximation converges to it separately.
   */
  it.each(SIZES)('loses 3.92 dB of peak at the worst-case offset, N=%i', (N) => {
    const f = 20.5
    const magnitude = oneSidedMagnitude(complexExponential(N, f))

    const peak = Math.max(magnitude[20], magnitude[21])
    const exact = 1 / Math.sin(Math.PI / (2 * N))
    expectClose(peak, exact, transformTolerance(N), `scallop peak, N=${N}`)

    const scallopDb = 20 * Math.log10(peak / N)
    expectClose(scallopDb, -3.9224, 1e-3, `scallop loss in dB, N=${N}`)
  })

  it('the 2N/π figure is the asymptote of the exact peak', () => {
    for (const N of SIZES) {
      const exact = 1 / Math.sin(Math.PI / (2 * N))
      const asymptotic = (2 * N) / Math.PI
      const relative = Math.abs(exact - asymptotic) / exact
      expect(relative).toBeLessThan((Math.PI / (2 * N)) ** 2)
    }
  })

  it('energy spreads across the whole spectrum, unlike a bin-centred tone', () => {
    const N = 1024
    const centred = oneSidedMagnitude(complexExponential(N, 20))
    const offset = oneSidedMagnitude(complexExponential(N, 20.5))

    const far = 200
    expect(centred[far]).toBeLessThan(1e-9)
    expect(offset[far]).toBeGreaterThan(0.1)
  })
})
