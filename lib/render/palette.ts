/**
 * The energy ramp — PRD §8.
 *
 * Plate → deep indigo → amber → near-white: a blackbody-like progression that
 * reads as intensity without inventing a false rainbow. Baked once into a
 * 256-entry RGB lookup table, because a per-pixel colour computation at
 * 60 fps is not affordable and does not need to be.
 *
 * Instrument cyan is deliberately absent. It is the annotation layer only
 * (invariant 12); if it appeared here, a bright band and a cursor would be the
 * same colour and the plate would stop being an instrument.
 */

export interface RampStop {
  /** Position in [0, 1]. */
  readonly at: number
  readonly r: number
  readonly g: number
  readonly b: number
}

/**
 * Silence sits at the plate colour rather than at indigo, so an empty plate is
 * the dark ground the design calls for and the first real energy is the first
 * visible light.
 */
export const ENERGY_RAMP: readonly RampStop[] = [
  { at: 0.0, r: 0x14, g: 0x17, b: 0x1a }, // plate
  { at: 0.22, r: 0x24, g: 0x34, b: 0x5c }, // energyLow — deep indigo
  { at: 0.68, r: 0xc9, g: 0x7b, b: 0x24 }, // energyMid — amber
  { at: 1.0, r: 0xf5, g: 0xe9, b: 0xd0 }, // energyHigh — near-white
]

export const PALETTE_SIZE = 256

/** Packed RGB triples, 3 bytes per level, indexed by round(t · 255). */
export function buildPalette(stops: readonly RampStop[] = ENERGY_RAMP): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(PALETTE_SIZE * 3)

  for (let i = 0; i < PALETTE_SIZE; i++) {
    const t = i / (PALETTE_SIZE - 1)

    let lower = stops[0]
    let upper = stops[stops.length - 1]
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s].at && t <= stops[s + 1].at) {
        lower = stops[s]
        upper = stops[s + 1]
        break
      }
    }

    const span = upper.at - lower.at
    const f = span === 0 ? 0 : (t - lower.at) / span

    lut[i * 3] = lower.r + (upper.r - lower.r) * f
    lut[i * 3 + 1] = lower.g + (upper.g - lower.g) * f
    lut[i * 3 + 2] = lower.b + (upper.b - lower.b) * f
  }

  return lut
}

/** Shared table. Immutable in practice; never written to after construction. */
export const ENERGY_PALETTE = buildPalette()

/** Relative luminance, ITU-R BT.709. Used by the tests to assert monotonicity. */
export function luminance(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

/** CSS colour for a ramp position — for legends and swatches, never per pixel. */
export function rampColor(t: number, lut: Uint8ClampedArray = ENERGY_PALETTE): string {
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t
  const i = Math.round(clamped * (PALETTE_SIZE - 1)) * 3
  return `rgb(${lut[i]}, ${lut[i + 1]}, ${lut[i + 2]})`
}
