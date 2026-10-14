/**
 * Whether a correctness figure shown to a visitor counts as "the same".
 *
 * This is a display threshold, not a test tolerance: the tolerances that gate
 * the transform live in tests/support/tolerance.ts and are set from the
 * analytic fixtures. A round trip or a Parseval ratio within 1e-9 of exact is
 * floating-point arithmetic; anything larger would be worth a visitor's
 * attention, and the page says so rather than rounding it away.
 */
export const DISPLAY_EXACT = 1e-9

export function isExact(error: number): boolean {
  return Number.isFinite(error) && Math.abs(error) <= DISPLAY_EXACT
}

/** Fills `{name}` slots in a dictionary string. Unknown slots are left visible. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (slot, name: string) => values[name] ?? slot)
}
