/**
 * Complex bins → magnitude → decibels.
 *
 * Everything here writes into caller-owned buffers (invariant 4) and every
 * exported number carries a documented unit (invariant 10).
 */

import { assertLength, assertRadix2 } from './errors'
import { binCount } from './fft'

/** Amplitude floor below which a bin is reported as `floorDb`, not −Infinity. */
export const DB_FLOOR = -100

/**
 * One-sided magnitude spectrum, |X[k]| for k in [0, N/2].
 *
 * Raw transform magnitude — no scaling. Use `amplitudeSpectrum` when the
 * number should mean "the amplitude of the sinusoid that produced this bin".
 */
export function magnitudeSpectrum(re: Float64Array, im: Float64Array, out: Float64Array): void {
  const N = re.length
  assertRadix2(N)
  assertLength('im', im.length, N)
  assertLength('out', out.length, binCount(N))

  for (let k = 0; k < out.length; k++) {
    out[k] = Math.hypot(re[k], im[k])
  }
}

/**
 * One-sided amplitude spectrum in the units of the input signal.
 *
 * A real sinusoid of amplitude A splits its energy between bins k and N−k, so
 * the one-sided bins are doubled — except DC and Nyquist, which have no
 * mirror. Dividing by N undoes the transform's scaling; dividing by the
 * window's coherent gain undoes the taper's attenuation.
 */
export function amplitudeSpectrum(
  re: Float64Array,
  im: Float64Array,
  out: Float64Array,
  coherentGain = 1,
): void {
  const N = re.length
  assertRadix2(N)
  assertLength('im', im.length, N)
  assertLength('out', out.length, binCount(N))

  const scale = 1 / (N * coherentGain)
  const last = out.length - 1
  for (let k = 0; k <= last; k++) {
    const mirrored = k === 0 || k === last ? 1 : 2
    out[k] = mirrored * scale * Math.hypot(re[k], im[k])
  }
}

/** Amplitude ratio → dB, floored rather than allowed to reach −Infinity. */
export function amplitudeToDb(amplitude: number, reference = 1, floorDb = DB_FLOOR): number {
  if (amplitude <= 0) return floorDb
  const db = 20 * Math.log10(amplitude / reference)
  return db < floorDb ? floorDb : db
}

/** In-place-safe conversion of an amplitude array to dB. */
export function toDecibels(
  amplitudes: Float64Array,
  out: Float64Array,
  reference = 1,
  floorDb = DB_FLOOR,
): void {
  assertLength('out', out.length, amplitudes.length)
  for (let k = 0; k < amplitudes.length; k++) {
    out[k] = amplitudeToDb(amplitudes[k], reference, floorDb)
  }
}

/**
 * Maps dB onto [0, 1] for the energy ramp. Values outside the range clamp;
 * the range itself is the display's dynamic window, not a property of the data.
 */
export function normaliseDb(
  db: Float64Array,
  out: Float32Array,
  minDb: number,
  maxDb: number,
): void {
  assertLength('out', out.length, db.length)
  const span = maxDb - minDb
  const inverseSpan = span === 0 ? 0 : 1 / span
  for (let k = 0; k < db.length; k++) {
    const t = (db[k] - minDb) * inverseSpan
    out[k] = t < 0 ? 0 : t > 1 ? 1 : t
  }
}

/**
 * Total energy Σ|x[n]|² of a complex signal. Parseval's identity relates this
 * to the same sum over the full two-sided spectrum divided by N; the test
 * suite asserts it on every input.
 */
export function energy(re: Float64Array, im: Float64Array): number {
  assertLength('im', im.length, re.length)
  let total = 0
  for (let i = 0; i < re.length; i++) {
    total += re[i] * re[i] + im[i] * im[i]
  }
  return total
}
