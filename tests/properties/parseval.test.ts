/**
 * Parseval's identity across the corpus and every supported size.
 *
 * Σ|x[n]|² = (1/N)·Σ|X[k]|². The cheapest total property available: one
 * scalar, no reference implementation, true for every input.
 */

import { describe } from 'vitest'
import { it } from 'vitest'

import { FFT_SIZES } from '../../lib/dsp/errors'
import { windowFor, applyWindow, WINDOW_KINDS } from '../../lib/dsp/windows'
import { expectParseval } from '../support/parseval'
import { chord, complexExponential, constant, impulse, randomComplex, randomReal, realCosine } from '../support/signals'

describe("Parseval's identity holds", () => {
  it.each(FFT_SIZES)('random complex corpus, N=%i', (N) => {
    for (let seed = 1; seed <= 3; seed++) {
      expectParseval(randomComplex(N, N + seed * 104729), `complex seed ${seed}`)
    }
  })

  it.each(FFT_SIZES)('real corpus, N=%i', (N) => {
    expectParseval(randomReal(N, N * 3 + 1), 'real noise')
    expectParseval(constant(N, 0.3), 'DC')
    expectParseval(impulse(N, 0), 'impulse')
    expectParseval(realCosine(N, 3.25, 0.9), 'off-bin cosine')
    expectParseval(complexExponential(N, N / 8 + 0.5), 'half-bin exponential')
  })

  it.each([256, 2048])('windowed frames, N=%i', (N) => {
    const source = chord(N, [5, 10, 20, 41], 99)
    for (const kind of WINDOW_KINDS) {
      const coefficients = windowFor(kind, N)
      const re = new Float64Array(N)
      applyWindow(source.re, coefficients, re)
      expectParseval({ re, im: new Float64Array(N) }, `${kind}-windowed chord`)
    }
  })

  it('holds for the all-zero signal', () => {
    expectParseval({ re: new Float64Array(512), im: new Float64Array(512) }, 'silence')
  })
})
