/**
 * The samples claim to contain specific frequencies. The plate is only
 * trustworthy if that claim is true, so it is asserted here against our own
 * transform — which by this point has its own four independent checks.
 */

import { describe, expect, it } from 'vitest'

import { SAMPLES, sampleById } from '../../data/samples'
import { createSpectrumAnalyser } from '../../lib/dsp/spectrum'
import { binFrequency } from '../../lib/dsp/fft'

const FS = 48_000
const N = 8192

/** Loudest bin over the whole sample, in Hz. */
function dominantFrequency(signal: Float32Array, at = 0): number {
  const analyser = createSpectrumAnalyser({ N, fs: FS, window: 'blackman' })
  const frame = signal.subarray(at, at + N)
  const padded = new Float32Array(N)
  padded.set(frame)
  analyser.analyseFloat32(padded)

  let best = 0
  let bestBin = 0
  for (let k = 1; k < analyser.bins; k++) {
    if (analyser.amplitude[k] > best) {
      best = analyser.amplitude[k]
      bestBin = k
    }
  }
  return binFrequency(bestBin, N, FS)
}

describe('every sample renders', () => {
  it.each(SAMPLES.map((s) => [s.id, s] as const))('%s', (_id, sample) => {
    const audio = sample.render(FS, sample.seconds)
    expect(audio.length).toBe(Math.floor(FS * sample.seconds))
    expect(audio).toBeInstanceOf(Float32Array)

    let peak = 0
    for (let n = 0; n < audio.length; n++) {
      expect(Number.isFinite(audio[n])).toBe(true)
      peak = Math.max(peak, Math.abs(audio[n]))
    }

    // Audible but never clipping — the clip indicator must mean something.
    expect(peak).toBeGreaterThan(0.5)
    expect(peak).toBeLessThan(1)

    // Fades reach zero at both ends, so the sample's edges do not leak.
    expect(Math.abs(audio[0])).toBeLessThan(1e-6)
    expect(Math.abs(audio[audio.length - 1])).toBeLessThan(1e-6)
  })

  it('renders identically twice — the generators are deterministic', () => {
    for (const sample of SAMPLES) {
      const a = sample.render(FS, 0.5)
      const b = sample.render(FS, 0.5)
      expect(Array.from(a.subarray(0, 2000))).toEqual(Array.from(b.subarray(0, 2000)))
    }
  })
})

describe('samples contain the frequencies they advertise', () => {
  it('the guitar string is dominated by its 196 Hz fundamental', () => {
    const audio = sampleById('senar-gitar')!.render(FS, 3)
    expect(dominantFrequency(audio, 2000)).toBeCloseTo(196, -1)
  })

  it('the whistle climbs from 600 Hz towards 2400 Hz', () => {
    const audio = sampleById('siulan')!.render(FS, 3)
    const early = dominantFrequency(audio, Math.floor(FS * 0.3))
    const late = dominantFrequency(audio, Math.floor(FS * 2.4))
    expect(early).toBeGreaterThan(550)
    expect(early).toBeLessThan(900)
    expect(late).toBeGreaterThan(early * 1.8)
    expect(late).toBeLessThan(2600)
  })

  it('the sibilant puts its energy high and spreads it wide', () => {
    const audio = sampleById('desis')!.render(FS, 2.5)
    const analyser = createSpectrumAnalyser({ N, fs: FS, window: 'hann' })
    const frame = new Float32Array(N)
    frame.set(audio.subarray(20_000, 20_000 + N))
    analyser.analyseFloat32(frame)

    let low = 0
    let high = 0
    for (let k = 1; k < analyser.bins; k++) {
      const hz = binFrequency(k, N, FS)
      if (hz < 1000) low += analyser.amplitude[k]
      else if (hz > 3000) high += analyser.amplitude[k]
    }
    expect(high).toBeGreaterThan(low * 3)
  })

  it('the chord holds three distinct roots at once', () => {
    const audio = sampleById('akor')!.render(FS, 3)
    const analyser = createSpectrumAnalyser({ N, fs: FS, window: 'blackman' })
    const frame = new Float32Array(N)
    frame.set(audio.subarray(4000, 4000 + N))
    analyser.analyseFloat32(frame)

    // The floor is the median bin below 4 kHz. A fixed "quiet" reference
    // frequency is not safe here: at 5.9 Hz bin spacing, anything within a
    // semitone of a root is only a few bins away from it.
    const upper = Math.round((4000 * N) / FS)
    const below = Array.from(analyser.amplitude.subarray(1, upper)).sort((a, b) => a - b)
    const floor = below[below.length >> 1]

    for (const hz of [261.626, 329.628, 391.995]) {
      const bin = Math.round((hz * N) / FS)
      let local = 0
      for (let k = bin - 3; k <= bin + 3; k++) local = Math.max(local, analyser.amplitude[k])
      expect(local).toBeGreaterThan(floor * 100)
    }

    // And each root is a genuine local maximum, not the shoulder of a neighbour.
    for (const hz of [261.626, 329.628, 391.995]) {
      const bin = Math.round((hz * N) / FS)
      let peakBin = bin - 3
      for (let k = bin - 3; k <= bin + 3; k++) {
        if (analyser.amplitude[k] > analyser.amplitude[peakBin]) peakBin = k
      }
      expect(analyser.amplitude[peakBin]).toBeGreaterThan(analyser.amplitude[peakBin - 8])
      expect(analyser.amplitude[peakBin]).toBeGreaterThan(analyser.amplitude[peakBin + 8])
    }
  })

  it('the Nyquist sweep folds back down instead of climbing forever', () => {
    const audio = sampleById('sapuan-nyquist')!.render(FS, 4)

    // The tone passes fs/2 partway through; after that its apparent frequency
    // must be falling, which is the whole demonstration.
    const beforeFold = dominantFrequency(audio, Math.floor(FS * 1.0))
    const atFold = dominantFrequency(audio, Math.floor(FS * 2.3))
    const afterFold = dominantFrequency(audio, Math.floor(FS * 3.5))

    expect(atFold).toBeGreaterThan(beforeFold)
    expect(afterFold).toBeLessThan(atFold)
    expect(afterFold).toBeLessThan(FS / 2)
  })
})
