/**
 * Additive synthesis — the ground truth for synthesis mode.
 *
 * The user names the components; this renders them and nothing else. Pure, so
 * the same function the page uses is the one the tests check.
 */

export interface Partial {
  /** Frequency in Hz. */
  frequencyHz: number
  /** Linear amplitude, 0 to 1. */
  amplitude: number
  /** Phase offset in radians. */
  phase: number
}

/**
 * Renders Σ aᵢ·cos(2π·fᵢ·t + φᵢ) into `out`, whose length fixes N.
 *
 * Components at or above Nyquist are still rendered rather than filtered: an
 * alias is the demonstration in PRD §4.8, and silently dropping one would hide
 * the thing the page exists to show.
 */
export function renderPartials(partials: readonly Partial[], out: Float32Array, fs: number): void {
  out.fill(0)
  for (const partial of partials) {
    const omega = (2 * Math.PI * partial.frequencyHz) / fs
    for (let n = 0; n < out.length; n++) {
      out[n] += partial.amplitude * Math.cos(omega * n + partial.phase)
    }
  }
}

/**
 * Where a partial will actually appear, given the sample rate.
 *
 * Above Nyquist a tone folds back: sampling cannot distinguish f from fs − f.
 * Reported here so the readout can say what the plate is going to show rather
 * than what the user typed.
 */
export function apparentFrequency(frequencyHz: number, fs: number): number {
  const nyquist = fs / 2
  const wrapped = Math.abs(frequencyHz % fs)
  const folded = wrapped > nyquist ? fs - wrapped : wrapped
  return folded
}

export function isAliased(frequencyHz: number, fs: number): boolean {
  return frequencyHz > fs / 2
}

/** Peak absolute value, so the builder can warn before it clips. */
export function peakOf(samples: Float32Array): number {
  let peak = 0
  for (let n = 0; n < samples.length; n++) {
    const m = Math.abs(samples[n])
    if (m > peak) peak = m
  }
  return peak
}
