/**
 * The palette as literals, for canvas code.
 *
 * A canvas cannot read a Tailwind class, so the waveform, the axes and the
 * comparison traces need the hex value itself. Everything that draws takes it
 * from here rather than typing a colour into a fillStyle, and
 * tests/ui/tokens.test.ts asserts that every value below still matches
 * tailwind.config.ts — the two cannot drift apart silently.
 *
 * JSX never imports this. Components use the Tailwind token.
 */
export const CANVAS = {
  plate: '#14171A',
  emulsion: '#2A3138',
  hairline: '#242B32',
  ink: '#E6ECF2',
  inkMuted: '#A9B5C1',
  inkFaint: '#7C8995',
  instrument: '#5FA8B5',
  energyHigh: '#F5E9D0',
  clip: '#C4453A',
} as const

/**
 * A CANVAS colour at reduced alpha, as an rgba() string, for canvas
 * fillStyle/strokeStyle. Keeps translucent annotation strokes tied to the
 * same hex the opaque draws use, instead of a second, hand-typed rgba().
 */
export function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
