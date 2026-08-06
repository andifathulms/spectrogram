/**
 * The canvas constants and the Tailwind palette are the same palette written
 * twice — once for CSS, once for fillStyle. This is the test that keeps them
 * the same palette, so a colour changed in one place cannot quietly survive in
 * the other.
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { CANVAS } from '../../lib/ui/colors'

const ROOT = new URL('../..', import.meta.url).pathname
const config = readFileSync(join(ROOT, 'tailwind.config.ts'), 'utf8')

/** `name: '#RRGGBB',` inside the colours block. */
function tailwindColors(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of config.split('\n')) {
    const match = /^\s{8}([A-Za-z]+):\s*'(#[0-9A-Fa-f]{6})',/.exec(line)
    if (match !== null) out[match[1]] = match[2].toUpperCase()
  }
  return out
}

describe('the drawing palette matches the CSS palette', () => {
  const colors = tailwindColors()

  it('found the palette to compare against', () => {
    expect(Object.keys(colors).length).toBeGreaterThanOrEqual(10)
  })

  it.each(Object.entries(CANVAS))('%s', (name, value) => {
    expect(colors[name]).toBe(value.toUpperCase())
  })
})

describe('the energy ramp holds no annotation colour', () => {
  /** Invariant 12, stated as a test rather than as a comment. */
  it('instrument cyan is not a ramp stop', () => {
    const ramp = readFileSync(join(ROOT, 'lib/render/palette.ts'), 'utf8')
    expect(ramp).not.toMatch(/0x5f,\s*g:\s*0xa8/i)
  })
})
