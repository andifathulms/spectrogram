/**
 * Our FFT beside the browser's AnalyserNode.
 *
 * Invariant 2: this is the only place in the app where AnalyserNode appears,
 * and it is labelled as the reference implementation everywhere it is shown.
 * No spectrogram column the plate draws comes from here.
 *
 * Making the comparison fair takes some care, and the choices are all
 * deliberate:
 *
 *  - **Stationary input.** We cannot know which 128-sample boundary the
 *    browser's analyser happened to land on, so aligning two arbitrary frames
 *    of a changing signal is impossible. With a signal that is identical in
 *    every window — a sum of sinusoids at exact bin centres, so it is periodic
 *    in N — alignment stops mattering, and any residual difference is a real
 *    difference between the transforms.
 *  - **The same window.** The spec has AnalyserNode apply a Blackman window
 *    with α = 0.16, which is the conventional 0.42/0.50/0.08 Blackman in
 *    lib/dsp. We apply ours.
 *  - **The same scaling.** The spec defines its output as
 *    20·log10(|X[k]| / fftSize) — no one-sided doubling and no coherent-gain
 *    correction. We match that here rather than correcting ours and then
 *    calling the offset a divergence.
 *
 * Whatever remains after all three is reported as-is. Divergences are
 * investigated and documented, never auto-aligned.
 */

import { fft } from '../dsp/fft'
import { windowFor } from '../dsp/windows'
import { renderPartials, type Partial } from '../dsp/additive'

export interface ComparisonResult {
  N: number
  fs: number
  /** AnalyserNode reports fftSize/2 bins; Nyquist is not among them. */
  bins: number
  /** dB per bin from our transform, scaled the way the spec scales theirs. */
  ours: Float32Array
  /** dB per bin from AnalyserNode. */
  theirs: Float32Array
  /** theirs − ours, in dB. */
  difference: Float32Array
  worstDb: number
  meanAbsDb: number
  /** Worst difference restricted to bins above the noise floor. */
  worstNearPeaksDb: number
  /** Milliseconds for one of our transforms, averaged. */
  oursMs: number
  /** Milliseconds per getFloatFrequencyData call, averaged. */
  theirsMs: number
  partials: readonly Partial[]
}

export type ComparisonOutcome =
  | { type: 'ok'; result: ComparisonResult }
  | { type: 'unavailable'; reason: string }

/** Bin-centred partials, so the test signal is exactly periodic in N. */
function testPartials(N: number, fs: number): Partial[] {
  const spacing = fs / N
  return [
    { frequencyHz: spacing * Math.round(N * 0.02), amplitude: 0.5, phase: 0 },
    { frequencyHz: spacing * Math.round(N * 0.06), amplitude: 0.25, phase: 0.7 },
    { frequencyHz: spacing * Math.round(N * 0.15), amplitude: 0.12, phase: 2.1 },
    { frequencyHz: spacing * Math.round(N * 0.31), amplitude: 0.06, phase: 4.0 },
  ]
}

const TIMED_ITERATIONS = 200

export async function runComparison(
  context: AudioContext,
  N: number,
): Promise<ComparisonOutcome> {
  if (typeof context.createAnalyser !== 'function') {
    return { type: 'unavailable', reason: 'AnalyserNode' }
  }

  const fs = context.sampleRate
  const partials = testPartials(N, fs)

  // Several seconds of the stationary signal, looped, so the analyser has a
  // steady input by the time we read it.
  const seconds = 2
  const audio = new Float32Array(Math.floor(fs * seconds))
  renderPartials(partials, audio, fs)

  const buffer = context.createBuffer(1, audio.length, fs)
  buffer.copyToChannel(audio, 0)

  const source = context.createBufferSource()
  source.buffer = buffer
  source.loop = true

  const analyser = context.createAnalyser()
  analyser.fftSize = N
  analyser.smoothingTimeConstant = 0
  analyser.minDecibels = -200
  analyser.maxDecibels = 0

  // Silent sink: the graph must be pulled for the analyser to see anything,
  // but the comparison should not make a noise.
  const silent = context.createGain()
  silent.gain.value = 0

  source.connect(analyser)
  analyser.connect(silent).connect(context.destination)
  source.start()

  // Long enough for the analyser's internal buffer to fill with the signal
  // rather than with the silence that preceded it.
  const settle = Math.max(200, (N / fs) * 1000 * 3)
  await new Promise((resolve) => setTimeout(resolve, settle))

  const bins = analyser.frequencyBinCount
  const theirs = new Float32Array(bins)
  analyser.getFloatFrequencyData(theirs)

  const startedTheirs = performance.now()
  for (let i = 0; i < TIMED_ITERATIONS; i++) analyser.getFloatFrequencyData(theirs)
  const theirsMs = (performance.now() - startedTheirs) / TIMED_ITERATIONS

  source.stop()
  source.disconnect()
  analyser.disconnect()
  silent.disconnect()

  // Ours, on one frame of the same audio.
  const coefficients = windowFor('blackman', N)
  const re = new Float64Array(N)
  const im = new Float64Array(N)
  const offset = Math.floor(fs * 0.5)

  const load = (): void => {
    for (let n = 0; n < N; n++) {
      re[n] = audio[offset + n] * coefficients[n]
      im[n] = 0
    }
  }

  for (let i = 0; i < 20; i++) {
    load()
    fft(re, im)
  }

  const startedOurs = performance.now()
  for (let i = 0; i < TIMED_ITERATIONS; i++) {
    load()
    fft(re, im)
  }
  const oursMs = (performance.now() - startedOurs) / TIMED_ITERATIONS

  load()
  fft(re, im)

  const ours = new Float32Array(bins)
  for (let k = 0; k < bins; k++) {
    const magnitude = Math.hypot(re[k], im[k]) / N
    ours[k] = magnitude <= 0 ? -Infinity : 20 * Math.log10(magnitude)
  }

  const difference = new Float32Array(bins)
  let worstDb = 0
  let worstNearPeaksDb = 0
  let total = 0
  let counted = 0

  for (let k = 0; k < bins; k++) {
    if (!Number.isFinite(ours[k]) || !Number.isFinite(theirs[k])) {
      difference[k] = 0
      continue
    }
    const delta = theirs[k] - ours[k]
    difference[k] = delta

    const magnitude = Math.abs(delta)
    if (magnitude > worstDb) worstDb = magnitude
    // Below the floor both are quantisation noise, and a dB difference between
    // two tiny numbers is not informative.
    if (ours[k] > -140 && magnitude > worstNearPeaksDb) worstNearPeaksDb = magnitude
    total += magnitude
    counted++
  }

  return {
    type: 'ok',
    result: {
      N,
      fs,
      bins,
      ours,
      theirs,
      difference,
      worstDb,
      meanAbsDb: counted === 0 ? 0 : total / counted,
      worstNearPeaksDb,
      oursMs,
      theirsMs,
      partials,
    },
  }
}
