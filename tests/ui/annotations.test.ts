import { describe, expect, it } from 'vitest'

import { COPY, LOCALES } from '../../lib/i18n'
import { HANN_PATH, blurBars, plotPoint, windowFraction } from '../../lib/ui/annotations'
import { emphasis, plain } from '../../lib/ui/emphasis'

describe('emphasis', () => {
  it('splits one marked word out of a headline', () => {
    expect(emphasis('See what sound *looks* like')).toEqual([
      { text: 'See what sound ', em: false },
      { text: 'looks', em: true },
      { text: ' like', em: false },
    ])
  })

  it('leaves unmarked text whole, and plain() strips markers', () => {
    expect(emphasis('Plain')).toEqual([{ text: 'Plain', em: false }])
    expect(plain('See what sound *looks* like')).toBe('See what sound looks like')
  })

  it.each(LOCALES)('every %s string has balanced markers', (locale) => {
    const unbalanced: string[] = []
    const walk = (value: unknown, path: string): void => {
      if (typeof value === 'string') {
        if ((value.match(/\*/g) ?? []).length % 2 !== 0) unbalanced.push(path)
        return
      }
      if (typeof value === 'object' && value !== null) {
        for (const [key, inner] of Object.entries(value)) walk(inner, `${path}.${key}`)
      }
    }
    walk(COPY[locale], locale)
    expect(unbalanced).toEqual([])
  })
})

describe('plotPoint', () => {
  it('puts the bottom of a log axis at 100% and the top at 0%', () => {
    expect(plotPoint('log', 0, 20, 3, 20, 24_000).top).toBeCloseTo(100)
    expect(plotPoint('log', 3, 24_000, 3, 20, 24_000)).toEqual({ left: 100, top: expect.closeTo(0) })
  })

  it('places time linearly', () => {
    expect(plotPoint('linear', 1.5, 0, 3, 0, 24_000).left).toBeCloseTo(50)
  })
})

describe('windowFraction', () => {
  it('is the window length over the plate duration', () => {
    expect(windowFraction(2048, 48_000, 2.5)).toBeCloseTo(2048 / 48_000 / 2.5)
  })

  it('the Hann bump starts and ends on the baseline', () => {
    expect(HANN_PATH.startsWith('M0.00,10.00')).toBe(true)
    expect(HANN_PATH.endsWith('100.00,10.00')).toBe(true)
  })
})

describe('blurBars', () => {
  it('trades one bar for the other, and never reaches zero', () => {
    const short = blurBars(128, 128, 8192)
    const long = blurBars(8192, 128, 8192)
    expect(short.timing).toBeLessThan(short.pitch)
    expect(long.timing).toBeGreaterThan(long.pitch)
    expect(Math.min(short.timing, long.pitch)).toBeGreaterThan(0)
  })

  it('moves the two by the same amount', () => {
    const a = blurBars(512, 128, 8192)
    const b = blurBars(2048, 128, 8192)
    expect(b.timing - a.timing).toBeCloseTo(a.pitch - b.pitch)
  })
})
