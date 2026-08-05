/**
 * Synthesis mode's claim is that the spectrum recovers exactly what the user
 * entered. That is a testable claim, so it is tested — the page is then a
 * demonstration of something already known to hold, not the only evidence.
 */

import { describe, expect, it } from 'vitest'

import { apparentFrequency, isAliased, peakOf, renderPartials } from '../../lib/dsp/additive'
import { binCount, fft } from '../../lib/dsp/fft'
import { amplitudeSpectrum } from '../../lib/dsp/magnitude'
import { coherentGain, windowFor } from '../../lib/dsp/windows'
import { expectParseval } from '../support/parseval'
import { expectClose } from '../support/tolerance'

const FS = 48_000
const N = 4096

function recoveredAmplitudes(
  partials: { frequencyHz: number; amplitude: number; phase: number }[],
  kind: 'blackman' | 'rectangular' = 'blackman',
): number[] {
  const signal = new Float32Array(N)
  renderPartials(partials, signal, FS)

  const coefficients = windowFor(kind, N)
  const re = new Float64Array(N)
  const im = new Float64Array(N)
  for (let n = 0; n < N; n++) re[n] = signal[n] * coefficients[n]

  expectParseval({ re: Float64Array.from(re), im: new Float64Array(N) }, 'synthesised frame')

  fft(re, im)
  const amplitude = new Float64Array(binCount(N))
  amplitudeSpectrum(re, im, amplitude, coherentGain(coefficients))

  return partials.map((partial) => {
    const bin = Math.round((apparentFrequency(partial.frequencyHz, FS) * N) / FS)
    let best = 0
    for (let k = bin - 4; k <= bin + 4; k++) best = Math.max(best, amplitude[k])
    return best
  })
}

describe('the spectrum recovers what was put in', () => {
  it('recovers amplitudes of bin-centred partials exactly', () => {
    // Bin-centred, so there is no scalloping to account for.
    const spacing = FS / N
    const partials = [
      { frequencyHz: spacing * 20, amplitude: 0.6, phase: 0 },
      { frequencyHz: spacing * 45, amplitude: 0.3, phase: 1.1 },
      { frequencyHz: spacing * 110, amplitude: 0.15, phase: 2.7 },
    ]

    const recovered = recoveredAmplitudes(partials)
    for (let i = 0; i < partials.length; i++) {
      expectClose(recovered[i], partials[i].amplitude, 1e-6, `partial ${i}`)
    }
  })

  it('is insensitive to phase, as a magnitude spectrum must be', () => {
    const spacing = FS / N
    const base = [{ frequencyHz: spacing * 30, amplitude: 0.5, phase: 0 }]
    const shifted = [{ frequencyHz: spacing * 30, amplitude: 0.5, phase: 1.9 }]
    expectClose(recoveredAmplitudes(base)[0], recoveredAmplitudes(shifted)[0], 1e-9, 'phase')
  })

  it('recovers off-bin partials to within a window’s scallop loss', () => {
    const spacing = FS / N
    const partials = [{ frequencyHz: spacing * 30.5, amplitude: 0.5, phase: 0 }]
    const [recovered] = recoveredAmplitudes(partials)

    // Blackman's worst-case scallop loss is 1.10 dB, i.e. a factor of 0.881.
    expect(recovered).toBeGreaterThan(0.5 * 0.87)
    expect(recovered).toBeLessThan(0.5 * 1.001)
  })
})

describe('aliasing', () => {
  it('folds a tone above Nyquist back down', () => {
    expect(apparentFrequency(30_000, FS)).toBeCloseTo(18_000, 6)
    expect(apparentFrequency(24_000, FS)).toBeCloseTo(24_000, 6)
    expect(apparentFrequency(1000, FS)).toBeCloseTo(1000, 6)
    expect(isAliased(30_000, FS)).toBe(true)
    expect(isAliased(20_000, FS)).toBe(false)
  })

  it('the transform sees the alias, not the requested frequency', () => {
    const partials = [{ frequencyHz: 30_000, amplitude: 0.5, phase: 0 }]
    const signal = new Float32Array(N)
    renderPartials(partials, signal, FS)

    const re = new Float64Array(N)
    const im = new Float64Array(N)
    const coefficients = windowFor('blackman', N)
    for (let n = 0; n < N; n++) re[n] = signal[n] * coefficients[n]
    fft(re, im)

    const amplitude = new Float64Array(binCount(N))
    amplitudeSpectrum(re, im, amplitude, coherentGain(coefficients))

    let peakBin = 0
    for (let k = 1; k < amplitude.length; k++) {
      if (amplitude[k] > amplitude[peakBin]) peakBin = k
    }
    expect((peakBin * FS) / N).toBeCloseTo(18_000, -1)
  })

  it('renders above-Nyquist components rather than filtering them out', () => {
    const out = new Float32Array(64)
    renderPartials([{ frequencyHz: 40_000, amplitude: 1, phase: 0 }], out, FS)
    expect(peakOf(out)).toBeGreaterThan(0.5)
  })
})

describe('rendering', () => {
  it('sums components linearly', () => {
    const a = new Float32Array(128)
    const b = new Float32Array(128)
    const both = new Float32Array(128)

    renderPartials([{ frequencyHz: 400, amplitude: 0.3, phase: 0 }], a, FS)
    renderPartials([{ frequencyHz: 900, amplitude: 0.2, phase: 1 }], b, FS)
    renderPartials(
      [
        { frequencyHz: 400, amplitude: 0.3, phase: 0 },
        { frequencyHz: 900, amplitude: 0.2, phase: 1 },
      ],
      both,
      FS,
    )

    for (let n = 0; n < 128; n++) {
      expectClose(both[n], a[n] + b[n], 1e-7, `sample ${n}`)
    }
  })

  it('renders silence for no components', () => {
    const out = new Float32Array(32)
    out.fill(9)
    renderPartials([], out, FS)
    expect(peakOf(out)).toBe(0)
  })
})
