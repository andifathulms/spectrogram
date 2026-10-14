/**
 * The canvas constants and the Tailwind palette are the same palette written
 * twice — once for CSS, once for fillStyle. This is the test that keeps them
 * the same palette, so a colour changed in one place cannot quietly survive in
 * the other.
 */

import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
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

/** Every `.ts`/`.tsx` file under `components/`, recursively. */
function componentFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...componentFiles(path))
    else if (/\.tsx?$/.test(entry.name)) out.push(path)
  }
  return out
}

describe('no rgb()/rgba() literal outside the energy LUT', () => {
  /*
   * A canvas colour is either a CANVAS token, `withAlpha(CANVAS.x, a)`, or a
   * value built from ENERGY_PALETTE per pixel. A hand-typed rgb()/rgba() with
   * its own numbers — the shape `SpectrumChart.tsx` used to have — is exactly
   * the drift `tests/ui/tokens.test.ts` exists to catch, so it fails here too.
   */
  const files = componentFiles(join(ROOT, 'components'))

  it('found component files to scan', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files)('%s', (file) => {
    const lines = readFileSync(file, 'utf8').split('\n')
    const offenders = lines.filter(
      (line) => /rgba?\(/.test(line) && !line.includes('ENERGY_PALETTE'),
    )
    expect(offenders).toEqual([])
  })
})

describe('palette contrast', () => {
  /**
   * WCAG 2.x relative luminance and contrast ratio.
   * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
   */
  function luminance(hex: string): number {
    const channel = (v: number) => {
      const c = v / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }
    const r = channel(parseInt(hex.slice(1, 3), 16))
    const g = channel(parseInt(hex.slice(3, 5), 16))
    const b = channel(parseInt(hex.slice(5, 7), 16))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  function contrast(a: string, b: string): number {
    const L1 = luminance(a)
    const L2 = luminance(b)
    const lighter = Math.max(L1, L2)
    const darker = Math.min(L1, L2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  const BACKGROUNDS = { plate: CANVAS.plate, surface: '#181C21' } as const

  // Text-bearing foregrounds used against the two page/instrument backgrounds.
  const TEXT_FOREGROUNDS = {
    ink: CANVAS.ink,
    inkMuted: CANVAS.inkMuted,
    inkFaint: CANVAS.inkFaint,
    instrument: CANVAS.instrument,
  } as const

  it.each(
    Object.entries(BACKGROUNDS).flatMap(([bgName, bg]) =>
      Object.entries(TEXT_FOREGROUNDS).map(([fgName, fg]) => [`${fgName} on ${bgName}`, fg, bg] as const),
    ),
  )('%s is at least 4.5:1', (_label, fg, bg) => {
    const ratio = contrast(fg, bg)
    // eslint-disable-next-line no-console
    console.log(`contrast ${_label}: ${ratio.toFixed(2)}:1`)
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  // Non-text instrument colour — the window bracket, the scan edge, focus
  // rings — against the plate, at the lower non-text threshold (WCAG 1.4.11).
  // Clip red is in this group too: PRD §8 fixes its hex, and at about 3.6:1 it
  // is a signal colour, not a text colour. It marks the clipping indicator's
  // edge and dot; the words beside it are ink.
  it.each([
    ['instrument on plate', CANVAS.instrument, BACKGROUNDS.plate],
    ['instrument on surface', CANVAS.instrument, BACKGROUNDS.surface],
    ['clip on plate', CANVAS.clip, BACKGROUNDS.plate],
    ['clip on surface', CANVAS.clip, BACKGROUNDS.surface],
  ] as const)('%s is at least 3:1', (_label, fg, bg) => {
    const ratio = contrast(fg, bg)
    // eslint-disable-next-line no-console
    console.log(`contrast ${_label}: ${ratio.toFixed(2)}:1`)
    expect(ratio).toBeGreaterThanOrEqual(3)
  })
})

describe('clip red marks clipping and nothing else', () => {
  /*
   * Invariant 12. Clip red is never text (it fails 4.5:1), and it appears
   * only where the input-clipping indicator is drawn. A fault or a denied
   * microphone is not clipping, and colouring it red would teach a visitor
   * that red means "error" — after which the clipping light means nothing.
   */
  const files = componentFiles(join(ROOT, 'components'))

  it.each(files)('%s', (file) => {
    const source = readFileSync(file, 'utf8')
    expect(source).not.toMatch(/\btext-clip\b/)
    if (/\b(?:border|bg|fill|stroke|ring)-clip\b/.test(source)) {
      expect(source).toMatch(/\.clipped\b/)
    }
  })
})
