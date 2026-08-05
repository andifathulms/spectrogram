/**
 * Parseval's identity, asserted on every DSP test input.
 *
 *   Σ_n |x[n]|²  =  (1/N) · Σ_k |X[k]|²
 *
 * One scalar, always true, no reference implementation involved. It catches
 * whole classes of scaling and indexing bugs on its own — which is why every
 * suite in this project runs it over its own inputs rather than leaving it to
 * a single dedicated test.
 */

import { energy } from '../../lib/dsp/magnitude'
import { fft } from '../../lib/dsp/fft'
import { PARSEVAL_RELATIVE_TOLERANCE, expectClose } from './tolerance'
import type { ComplexSignal } from './signals'

/** Asserts the identity for a signal, transforming a copy so the input survives. */
export function expectParseval(signal: ComplexSignal, what: string): void {
  const N = signal.re.length
  const timeEnergy = energy(signal.re, signal.im)

  const re = Float64Array.from(signal.re)
  const im = Float64Array.from(signal.im)
  fft(re, im)
  const spectralEnergy = energy(re, im) / N

  const scale = Math.max(timeEnergy, 1)
  expectClose(
    spectralEnergy,
    timeEnergy,
    PARSEVAL_RELATIVE_TOLERANCE * scale,
    `Parseval (${what}, N=${N})`,
  )
}
