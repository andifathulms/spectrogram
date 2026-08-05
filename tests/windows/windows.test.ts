/**
 * Window properties against Harris (1978) Table I — symmetry, endpoints,
 * coherent gain, equivalent noise bandwidth, and the leakage suppression that
 * is the whole reason the controls exist.
 */

import { describe, expect, it } from 'vitest'

import {
  PUBLISHED_COHERENT_GAIN,
  WINDOW_KINDS,
  applyWindow,
  coherentGain,
  equivalentNoiseBandwidth,
  fillWindow,
  windowFor,
} from '../../lib/dsp/windows'
import { binCount, fft } from '../../lib/dsp/fft'
import { magnitudeSpectrum } from '../../lib/dsp/magnitude'
import { realCosine } from '../support/signals'
import { expectParseval } from '../support/parseval'
import { WINDOW_TOLERANCE, expectClose } from '../support/tolerance'

const SIZES = [64, 256, 1024]

/**
 * Harris (1978) Table I. For a generalised cosine window,
 * ENBW = (a0² + a1²/2 + a2²/2) / a0², exact in the periodic form.
 *
 * Harris quotes two decimals; these are the four-decimal values implied by the
 * conventional 0.42/0.50/0.08 Blackman coefficients this project uses, not the
 * "exact Blackman" variant, whose a0 is 7938/18608 and whose ENBW is 1.7269.
 */
const PUBLISHED_ENBW = {
  rectangular: 1,
  hann: 1.5,
  hamming: 1.3628,
  blackman: 1.7268,
} as const

/** Highest sidelobe level in dB relative to the mainlobe peak. Harris Table I. */
const PUBLISHED_PEAK_SIDELOBE_DB = {
  rectangular: -13.3,
  hann: -31.5,
  hamming: -42.7,
  blackman: -58.1,
} as const

/** Bins from the mainlobe centre to the first null. Harris Table I. */
const MAINLOBE_HALF_WIDTH_BINS = {
  rectangular: 1,
  hann: 2,
  hamming: 2,
  blackman: 3,
} as const

describe('coherent gain matches the published table', () => {
  it.each(WINDOW_KINDS)('%s', (kind) => {
    for (const N of SIZES) {
      expectClose(
        coherentGain(windowFor(kind, N, 'periodic')),
        PUBLISHED_COHERENT_GAIN[kind],
        WINDOW_TOLERANCE,
        `${kind} coherent gain, N=${N}`,
      )
    }
  })
})

describe('equivalent noise bandwidth matches the published table', () => {
  it.each(WINDOW_KINDS)('%s', (kind) => {
    // The published figures are quoted to four decimals.
    expectClose(
      equivalentNoiseBandwidth(windowFor(kind, 4096, 'periodic')),
      PUBLISHED_ENBW[kind],
      5e-5,
      `${kind} ENBW`,
    )
  })
})

describe('symmetric windows are symmetric', () => {
  it.each(WINDOW_KINDS)('%s', (kind) => {
    for (const N of SIZES) {
      const w = windowFor(kind, N, 'symmetric')
      for (let n = 0; n < N; n++) {
        expectClose(w[n], w[N - 1 - n], WINDOW_TOLERANCE, `${kind} symmetry at ${n}, N=${N}`)
      }
    }
  })

  it('periodic windows are symmetric about the centre excluding index 0', () => {
    for (const kind of WINDOW_KINDS) {
      const N = 256
      const w = windowFor(kind, N, 'periodic')
      for (let n = 1; n < N; n++) {
        expectClose(w[n], w[N - n], WINDOW_TOLERANCE, `${kind} periodic symmetry at ${n}`)
      }
    }
  })
})

describe('endpoint values match the definitions', () => {
  it('Hann reaches zero at both ends in the symmetric form', () => {
    const w = windowFor('hann', 512, 'symmetric')
    expectClose(w[0], 0, WINDOW_TOLERANCE, 'Hann w[0]')
    expectClose(w[511], 0, WINDOW_TOLERANCE, 'Hann w[N-1]')
  })

  it('Hamming stops at 0.08, which is why its skirts differ from Hann', () => {
    const w = windowFor('hamming', 512, 'symmetric')
    expectClose(w[0], 0.08, WINDOW_TOLERANCE, 'Hamming w[0]')
    expectClose(w[511], 0.08, WINDOW_TOLERANCE, 'Hamming w[N-1]')
  })

  it('Blackman reaches zero at both ends', () => {
    const w = windowFor('blackman', 512, 'symmetric')
    expectClose(w[0], 0, 1e-12, 'Blackman w[0]')
    expectClose(w[511], 0, 1e-12, 'Blackman w[N-1]')
  })

  it('rectangular is unity everywhere', () => {
    const w = windowFor('rectangular', 128, 'periodic')
    for (let n = 0; n < w.length; n++) expect(w[n]).toBe(1)
  })

  it('every window peaks at 1 in the symmetric form', () => {
    for (const kind of WINDOW_KINDS) {
      const N = 257 // odd, so the centre sample exists exactly
      const w = windowFor(kind, N, 'symmetric')
      expectClose(w[(N - 1) / 2], 1, WINDOW_TOLERANCE, `${kind} peak`)
    }
  })
})

/**
 * The window's own frequency response, zero-padded so the continuous transform
 * is sampled finely enough to find the true sidelobe peaks between bin
 * centres. Returns dB relative to the mainlobe peak.
 */
const OVERSAMPLE = 32

function windowResponseDb(kind: (typeof WINDOW_KINDS)[number], M: number): Float64Array {
  const N = M * OVERSAMPLE
  const re = new Float64Array(N)
  const im = new Float64Array(N)
  re.set(windowFor(kind, M, 'symmetric'))

  fft(re, im)
  const magnitude = new Float64Array(binCount(N))
  magnitudeSpectrum(re, im, magnitude)

  const peak = magnitude[0] // = Σ coefficients, the mainlobe centre
  const db = new Float64Array(magnitude.length)
  for (let k = 0; k < magnitude.length; k++) {
    db[k] = 20 * Math.log10(Math.max(magnitude[k], 1e-300) / peak)
  }
  return db
}

describe('windows suppress spectral leakage', () => {
  /**
   * The demonstration in PRD §4.3, measured rather than eyeballed: the highest
   * sidelobe of each window against Harris (1978) Table I. Tolerance is ±0.5
   * dB because the published figures are asymptotic in M and quoted to one
   * decimal.
   */
  it.each(WINDOW_KINDS)('%s has its published highest sidelobe', (kind) => {
    const M = 64
    const db = windowResponseDb(kind, M)
    const firstNull = MAINLOBE_HALF_WIDTH_BINS[kind] * OVERSAMPLE

    let highest = -Infinity
    for (let k = firstNull; k < db.length; k++) highest = Math.max(highest, db[k])

    expectClose(highest, PUBLISHED_PEAK_SIDELOBE_DB[kind], 0.5, `${kind} highest sidelobe`)
  })

  it('the highest sidelobe falls monotonically from rectangular to Blackman', () => {
    const highest = WINDOW_KINDS.map((kind) => {
      const db = windowResponseDb(kind, 64)
      let worst = -Infinity
      for (let k = MAINLOBE_HALF_WIDTH_BINS[kind] * OVERSAMPLE; k < db.length; k++) {
        worst = Math.max(worst, db[k])
      }
      return worst
    })

    for (let i = 1; i < highest.length; i++) {
      expect(highest[i]).toBeLessThan(highest[i - 1])
    }
  })

  /**
   * Hann and Hamming have nearly the same mainlobe but differ far out: Hann's
   * sidelobes roll off at 18 dB/octave, Hamming's at 6. Hamming therefore wins
   * near the peak and loses in the distance — the reason both are offered, and
   * a result the monotonic test above would hide.
   */
  it('Hann beats Hamming far from the peak, despite losing near it', () => {
    const hann = windowResponseDb('hann', 64)
    const hamming = windowResponseDb('hamming', 64)
    const far = 20 * OVERSAMPLE

    let hannFar = -Infinity
    let hammingFar = -Infinity
    for (let k = far; k < hann.length; k++) {
      hannFar = Math.max(hannFar, hann[k])
      hammingFar = Math.max(hammingFar, hamming[k])
    }

    expect(hannFar).toBeLessThan(hammingFar)
    expect(hannFar).toBeLessThan(-80)
  })

  it('a windowed tone loses far less energy to distant bins than an unwindowed one', () => {
    const N = 4096
    const tone = realCosine(N, 100.5, 1)
    expectParseval(tone, 'leakage source tone')

    const distant: Record<string, number> = {}
    for (const kind of WINDOW_KINDS) {
      const re = new Float64Array(N)
      applyWindow(tone.re, windowFor(kind, N), re)
      const im = new Float64Array(N)
      expectParseval({ re: Float64Array.from(re), im }, `${kind} windowed tone`)

      fft(re, im)
      const magnitude = new Float64Array(binCount(N))
      magnitudeSpectrum(re, im, magnitude)

      const peak = Math.max(...Array.from(magnitude.subarray(95, 106)))
      let worst = 0
      for (let k = 500; k < 1500; k++) worst = Math.max(worst, magnitude[k])
      distant[kind] = 20 * Math.log10(worst / peak)
    }

    expect(distant.rectangular).toBeGreaterThan(-70)
    expect(distant.hann).toBeLessThan(distant.rectangular - 50)
    expect(distant.blackman).toBeLessThan(-120)
  })

  it('a bin-centred tone leaks nothing, whatever the window', () => {
    const N = 2048
    const tone = realCosine(N, 64, 1)
    for (const kind of WINDOW_KINDS) {
      const re = new Float64Array(N)
      applyWindow(tone.re, windowFor(kind, N), re)
      const im = new Float64Array(N)
      fft(re, im)
      const magnitude = new Float64Array(binCount(N))
      magnitudeSpectrum(re, im, magnitude)

      // Energy confined to the mainlobe: bin 64 plus at most two either side.
      for (let k = 0; k < magnitude.length; k++) {
        if (Math.abs(k - 64) <= 2) continue
        expect(magnitude[k]).toBeLessThan(1e-9)
      }
    }
  })
})

describe('fillWindow writes into a caller-owned buffer', () => {
  it('matches the cached array', () => {
    const out = new Float64Array(128)
    fillWindow('blackman', out)
    const cached = windowFor('blackman', 128)
    for (let n = 0; n < out.length; n++) {
      expectClose(out[n], cached[n], 0, `blackman[${n}]`)
    }
  })

  it('applyWindow may write in place', () => {
    const frame = Float64Array.from({ length: 8 }, () => 2)
    const w = windowFor('hann', 8)
    applyWindow(frame, w, frame)
    for (let n = 0; n < 8; n++) expectClose(frame[n], 2 * w[n], WINDOW_TOLERANCE, `in place ${n}`)
  })
})
