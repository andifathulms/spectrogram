/**
 * Readouts are split into number and unit for display. The split must never
 * lose the unit (invariant 10) or invent one.
 */

import { describe, expect, it } from 'vitest'

import { db, dbSize, hz, ratio, seconds, splitUnit } from '../../lib/ui/format'

describe('splitUnit', () => {
  it.each([
    ['220.0 Hz', '220.0', 'Hz'],
    ['1.024 kHz', '1.024', 'kHz'],
    ['−12.0 dB', '−12.0', 'dB'],
    ['42.7 ms', '42.7', 'ms'],
    ['2048 samples', '2048', 'samples'],
    ['0.33 π', '0.33', 'π'],
    ['75 %', '75', '%'],
  ])('%s → %s | %s', (input, value, unit) => {
    expect(splitUnit(input)).toEqual({ value, unit })
  })

  it('leaves a unitless value whole', () => {
    expect(splitUnit('0.60')).toEqual({ value: '0.60', unit: '' })
    expect(splitUnit('—')).toEqual({ value: '—', unit: '' })
    expect(splitUnit('1.23e-15')).toEqual({ value: '1.23e-15', unit: '' })
  })

  it('leaves prose whole', () => {
    expect(splitUnit('Point at the picture')).toEqual({ value: 'Point at the picture', unit: '' })
  })

  it.each([hz(440), hz(12_345), db(-3), seconds(0.0427), seconds(2), ratio(0.75)])(
    'round-trips the formatter output %s',
    (formatted) => {
      const { value, unit } = splitUnit(formatted)
      expect(unit.length).toBeGreaterThan(0)
      expect(`${value} ${unit}`).toBe(formatted)
    },
  )
})

describe('dbSize', () => {
  it('drops the sign and keeps the unit', () => {
    expect(dbSize(-0.0234)).toBe('0.02 dB')
    expect(dbSize(Number.NaN)).toBe('—')
  })
})
