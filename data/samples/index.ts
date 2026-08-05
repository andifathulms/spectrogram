/**
 * Bundled sample audio.
 *
 * Every sample is *generated*, not recorded. That is a deliberate choice and
 * not a shortcut: a synthesised signal has a ground truth the visitor can
 * check the plate against, it costs no bytes in the bundle, and it removes the
 * licensing question entirely (see LICENSES.md). Each generator is pure —
 * sample rate in, Float32Array out — so it runs identically in Node and in the
 * browser, and the tests can assert what its spectrum ought to look like.
 *
 * The app is fully functional with microphone permission denied (invariant
 * 13). These are what make that true.
 */

export interface SampleDefinition {
  readonly id: string
  /** Indonesian label for the interface. */
  readonly label: string
  /** What the visitor should look for on the plate. */
  readonly hint: string
  readonly seconds: number
  /** Renders the sample at a given sample rate. */
  readonly render: (fs: number, seconds: number) => Float32Array
}

/** mulberry32, so noise samples are identical on every device and every run. */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Short raised-cosine fades, so the sample's own edges do not leak. */
function applyFades(out: Float32Array, fs: number, fadeSeconds = 0.01): void {
  const fade = Math.min(Math.floor(fs * fadeSeconds), out.length >> 1)
  for (let n = 0; n < fade; n++) {
    const g = 0.5 - 0.5 * Math.cos((Math.PI * n) / fade)
    out[n] *= g
    out[out.length - 1 - n] *= g
  }
}

function normalise(out: Float32Array, target = 0.85): void {
  let peak = 0
  for (let n = 0; n < out.length; n++) {
    const m = Math.abs(out[n])
    if (m > peak) peak = m
  }
  if (peak === 0) return
  const g = target / peak
  for (let n = 0; n < out.length; n++) out[n] *= g
}

/**
 * A plucked string: a fundamental plus its integer overtones, each decaying
 * faster than the one below it. The harmonic stack is the most satisfying
 * thing in the app (PRD §4.5) and this is the signal that shows it.
 */
function guitarString(fs: number, seconds: number): Float32Array {
  const out = new Float32Array(Math.floor(fs * seconds))
  const f0 = 196 // G3
  const partials = 12

  for (let h = 1; h <= partials; h++) {
    const frequency = f0 * h
    if (frequency >= fs / 2) break
    const amplitude = 1 / (h * h)
    const decay = 2.2 + h * 0.55 // higher partials die first
    const phase = (h * 1.37) % (2 * Math.PI)

    for (let n = 0; n < out.length; n++) {
      const t = n / fs
      out[n] += amplitude * Math.exp(-decay * t) * Math.sin(2 * Math.PI * frequency * t + phase)
    }
  }

  applyFades(out, fs)
  normalise(out)
  return out
}

/** A rising whistle — one clean streak climbing the plate. */
function whistle(fs: number, seconds: number): Float32Array {
  const out = new Float32Array(Math.floor(fs * seconds))
  const startHz = 600
  const endHz = 2400

  // Exponential sweep, so the streak is straight on a log axis.
  const k = Math.log(endHz / startHz) / seconds
  for (let n = 0; n < out.length; n++) {
    const t = n / fs
    const phase = ((2 * Math.PI * startHz) / k) * (Math.exp(k * t) - 1)
    out[n] = Math.sin(phase)
  }

  applyFades(out, fs, 0.05)
  normalise(out)
  return out
}

/** "sss" — broadband noise shaped towards the high end, as a fricative is. */
function sibilant(fs: number, seconds: number): Float32Array {
  const out = new Float32Array(Math.floor(fs * seconds))
  const next = rng(0x51b1a17)

  // One-pole high-pass on white noise, then a broad resonance around 6 kHz.
  let previous = 0
  let highPassed = 0
  let resonator1 = 0
  let resonator2 = 0
  const omega = (2 * Math.PI * 6000) / fs
  const r = 0.96
  const a1 = 2 * r * Math.cos(omega)
  const a2 = -r * r

  for (let n = 0; n < out.length; n++) {
    const white = next() * 2 - 1
    highPassed = 0.97 * (highPassed + white - previous)
    previous = white

    const y = highPassed + a1 * resonator1 + a2 * resonator2
    resonator2 = resonator1
    resonator1 = y
    out[n] = y
  }

  applyFades(out, fs, 0.03)
  normalise(out, 0.7)
  return out
}

/** Three notes at once — a chord, so the plate shows three stacks side by side. */
function chord(fs: number, seconds: number): Float32Array {
  const out = new Float32Array(Math.floor(fs * seconds))
  const roots = [261.626, 329.628, 391.995] // C4, E4, G4

  for (const f0 of roots) {
    for (let h = 1; h <= 6; h++) {
      const frequency = f0 * h
      if (frequency >= fs / 2) break
      const amplitude = 1 / (h * 1.6)
      for (let n = 0; n < out.length; n++) {
        const t = n / fs
        out[n] += amplitude * Math.exp(-1.1 * t) * Math.sin(2 * Math.PI * frequency * t)
      }
    }
  }

  applyFades(out, fs)
  normalise(out)
  return out
}

/**
 * A linear sweep that runs past Nyquist and folds back down the plate
 * (PRD §4.8). Generated by sampling the ideal continuous tone, so the aliasing
 * is the real thing rather than a drawing of it.
 */
function nyquistSweep(fs: number, seconds: number): Float32Array {
  const out = new Float32Array(Math.floor(fs * seconds))
  const startHz = 200
  const endHz = fs * 0.9 // comfortably past fs/2

  const rate = (endHz - startHz) / seconds
  for (let n = 0; n < out.length; n++) {
    const t = n / fs
    out[n] = Math.sin(2 * Math.PI * (startHz * t + 0.5 * rate * t * t))
  }

  applyFades(out, fs, 0.02)
  normalise(out, 0.8)
  return out
}

/** A drum-like transient — the case that wants a short window, unlike the chord. */
function drumHit(fs: number, seconds: number): Float32Array {
  const out = new Float32Array(Math.floor(fs * seconds))
  const next = rng(0x0d2b17)
  const hits = [0.1, 0.55, 1.0, 1.45]

  for (const at of hits) {
    const start = Math.floor(at * fs)
    if (start >= out.length) continue
    for (let n = start; n < out.length; n++) {
      const t = (n - start) / fs
      const envelope = Math.exp(-24 * t)
      if (envelope < 1e-4) break
      const body = Math.sin(2 * Math.PI * 90 * t) * Math.exp(-30 * t)
      out[n] += envelope * (0.6 * (next() * 2 - 1)) + 0.8 * body
    }
  }

  applyFades(out, fs, 0.005)
  normalise(out)
  return out
}

export const SAMPLES: readonly SampleDefinition[] = [
  {
    id: 'senar-gitar',
    label: 'Senar gitar',
    hint: 'Satu fundamental di 196 Hz dengan overtone berjarak sama di atasnya — harmonic stack.',
    seconds: 3,
    render: guitarString,
  },
  {
    id: 'siulan',
    label: 'Siulan naik',
    hint: 'Satu garis bersih memanjat plate. Lurus pada skala log, melengkung pada linear.',
    seconds: 3,
    render: whistle,
  },
  {
    id: 'desis',
    label: 'Desis "sss"',
    hint: 'Broadband noise — energi tersebar di seluruh frekuensi tinggi, tanpa garis.',
    seconds: 2.5,
    render: sibilant,
  },
  {
    id: 'akor',
    label: 'Akor C mayor',
    hint: 'Tiga harmonic stack sekaligus. Perbesar window untuk memisahkannya.',
    seconds: 3,
    render: chord,
  },
  {
    id: 'ketukan',
    label: 'Ketukan',
    hint: 'Transien pendek. Perkecil window agar waktunya tajam — dan lihat pitch-nya kabur.',
    seconds: 2,
    render: drumHit,
  },
  {
    id: 'sapuan-nyquist',
    label: 'Sapuan melewati Nyquist',
    hint: 'Nada naik terus, tetapi pantulannya turun lagi setelah melewati fs/2 — aliasing.',
    seconds: 4,
    render: nyquistSweep,
  },
]

export function sampleById(id: string): SampleDefinition | undefined {
  return SAMPLES.find((sample) => sample.id === id)
}
