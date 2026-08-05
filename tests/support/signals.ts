/**
 * Deterministic test signals.
 *
 * No Math.random anywhere: a failing FFT test must be reproducible from the
 * seed alone, otherwise "investigate our FFT first" is unactionable advice.
 */

/** mulberry32 — small, fast, and good enough for a correctness corpus. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface ComplexSignal {
  re: Float64Array
  im: Float64Array
}

export function zeros(N: number): ComplexSignal {
  return { re: new Float64Array(N), im: new Float64Array(N) }
}

export function copy(signal: ComplexSignal): ComplexSignal {
  return { re: Float64Array.from(signal.re), im: Float64Array.from(signal.im) }
}

/** Uniform noise in [−1, 1) in both components. */
export function randomComplex(N: number, seed: number): ComplexSignal {
  const next = rng(seed)
  const re = new Float64Array(N)
  const im = new Float64Array(N)
  for (let n = 0; n < N; n++) {
    re[n] = next() * 2 - 1
    im[n] = next() * 2 - 1
  }
  return { re, im }
}

/** Uniform noise in the real part only — the shape audio actually arrives in. */
export function randomReal(N: number, seed: number): ComplexSignal {
  const next = rng(seed)
  const re = new Float64Array(N)
  for (let n = 0; n < N; n++) re[n] = next() * 2 - 1
  return { re, im: new Float64Array(N) }
}

/** cos(2π·bin·n/N + phase) · amplitude. `bin` may be fractional. */
export function realCosine(N: number, bin: number, amplitude = 1, phase = 0): ComplexSignal {
  const re = new Float64Array(N)
  for (let n = 0; n < N; n++) {
    re[n] = amplitude * Math.cos((2 * Math.PI * bin * n) / N + phase)
  }
  return { re, im: new Float64Array(N) }
}

/** e^{+2πi·bin·n/N} — one-sided, so its spectrum is a single Dirichlet kernel. */
export function complexExponential(N: number, bin: number, amplitude = 1): ComplexSignal {
  const re = new Float64Array(N)
  const im = new Float64Array(N)
  for (let n = 0; n < N; n++) {
    const angle = (2 * Math.PI * bin * n) / N
    re[n] = amplitude * Math.cos(angle)
    im[n] = amplitude * Math.sin(angle)
  }
  return { re, im }
}

export function constant(N: number, value = 1): ComplexSignal {
  const re = new Float64Array(N)
  re.fill(value)
  return { re, im: new Float64Array(N) }
}

export function impulse(N: number, at = 0, amplitude = 1): ComplexSignal {
  const re = new Float64Array(N)
  re[at] = amplitude
  return { re, im: new Float64Array(N) }
}

/** Sum of several cosines — the synthesis-mode signal, and a harder corpus entry. */
export function chord(N: number, bins: readonly number[], seed = 1): ComplexSignal {
  const next = rng(seed)
  const re = new Float64Array(N)
  for (const bin of bins) {
    const amplitude = 0.2 + next() * 0.8
    const phase = next() * 2 * Math.PI
    for (let n = 0; n < N; n++) {
      re[n] += amplitude * Math.cos((2 * Math.PI * bin * n) / N + phase)
    }
  }
  return { re, im: new Float64Array(N) }
}
