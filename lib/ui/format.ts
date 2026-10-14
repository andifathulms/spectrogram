/**
 * Number formatting for readouts.
 *
 * Invariant 10: every readout carries units. Invariant 11: tabular figures, so
 * a value does not reflow as its digits change. The width is fixed here by
 * always emitting the same number of decimals for a given quantity, not by
 * letting the formatter choose.
 */

export function hz(value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (Math.abs(value) >= 10_000) return `${(value / 1000).toFixed(2)} kHz`
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(3)} kHz`
  if (Math.abs(value) >= 100) return `${value.toFixed(1)} Hz`
  return `${value.toFixed(2)} Hz`
}

/**
 * Axis ticks only. They are round numbers by construction, so the extra digits
 * hz() emits carry no information and cost the width the label needs to fit in
 * the plate's gutter. The unit stays — invariant 10 has no exceptions.
 */
export function axisHz(value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (Math.abs(value) >= 1000) {
    const k = value / 1000
    return `${Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1)} kHz`
  }
  return `${value.toFixed(0)} Hz`
}

export function db(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)} dB`
}

export function seconds(value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (Math.abs(value) < 1) return `${(value * 1000).toFixed(1)} ms`
  return `${value.toFixed(3)} s`
}

export function milliseconds(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return `${value.toFixed(2)} ms`
}

export function count(value: number): string {
  return Number.isFinite(value) ? value.toFixed(0) : '—'
}

export function ratio(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return `${(value * 100).toFixed(0)} %`
}

/** Scientific notation for round-trip and comparison error figures. */
export function scientific(value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (value === 0) return '0'
  return value.toExponential(2)
}

/**
 * A formatted readout split into its number and its unit, so the two can be
 * set at different weights. Nothing is dropped: joining the parts with a
 * space gives back the input, and a string with no trailing unit — or prose,
 * like a placeholder hint — comes back whole as the value.
 */
export function splitUnit(formatted: string): { value: string; unit: string } {
  const match = /^(.*\d)\s+([^\s\d−+.,-][^\s\d]*)$/.exec(formatted)
  if (match === null) return { value: formatted, unit: '' }
  return { value: match[1], unit: match[2] }
}
