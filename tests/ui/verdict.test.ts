import { describe, expect, it } from 'vitest'

import { COPY, LOCALES } from '../../lib/i18n'
import { fill, isExact } from '../../lib/ui/verdict'

describe('isExact', () => {
  it('accepts floating-point residue and nothing larger', () => {
    expect(isExact(2.2e-16)).toBe(true)
    expect(isExact(0)).toBe(true)
    expect(isExact(1e-6)).toBe(false)
    expect(isExact(Number.NaN)).toBe(false)
  })
})

describe('fill', () => {
  it('replaces known slots and leaves unknown ones visible', () => {
    expect(fill('within {db} near {where}', { db: '0.02 dB' })).toBe('within 0.02 dB near {where}')
  })

  it.each(LOCALES)('the %s verdict sentence has its one slot', (locale) => {
    expect(COPY[locale].comparisonVerdict).toContain('{db}')
  })
})
