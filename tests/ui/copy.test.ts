/**
 * The interface is bilingual, and the failure mode of a bilingual interface is
 * that one language quietly falls behind: a key added for English renders as
 * `undefined` for an Indonesian reader, and nobody notices because nobody on
 * the team reads the page in both languages every time.
 *
 * These are the checks that make that impossible rather than unlikely.
 */

import { describe, expect, it } from 'vitest'

import { COPY, LOCALES, DEFAULT_LOCALE, copyFor, isLocale } from '../../lib/i18n'
import { SAMPLES } from '../../data/samples'

function keysOf(value: object): string[] {
  return Object.keys(value).sort()
}

describe('every locale says everything', () => {
  const reference = keysOf(COPY[DEFAULT_LOCALE])

  it.each(LOCALES)('%s has the same keys as the default', (locale) => {
    expect(keysOf(COPY[locale])).toEqual(reference)
  })

  it.each(LOCALES)('%s has no empty or placeholder string', (locale) => {
    const empty: string[] = []
    const walk = (value: unknown, path: string): void => {
      if (typeof value === 'string') {
        if (value.trim().length === 0 || value.includes('TODO')) empty.push(path)
        return
      }
      if (typeof value === 'object' && value !== null) {
        for (const [key, inner] of Object.entries(value)) walk(inner, `${path}.${key}`)
      }
    }
    walk(COPY[locale], locale)
    expect(empty).toEqual([])
  })

  it.each(LOCALES)('%s names and describes every bundled sample', (locale) => {
    const copy = COPY[locale]
    for (const sample of SAMPLES) {
      expect(copy.samples[sample.id]?.label, `${locale}: ${sample.id}`).toBeTruthy()
      expect(copy.samples[sample.id]?.hint, `${locale}: ${sample.id}`).toBeTruthy()
    }
  })

  it.each(LOCALES)('%s carries no sample copy for a sample that no longer exists', (locale) => {
    const ids = new Set(SAMPLES.map((sample) => sample.id))
    expect(Object.keys(COPY[locale].samples).filter((id) => !ids.has(id))).toEqual([])
  })
})

describe('locale resolution', () => {
  it('falls back to the default for anything unknown', () => {
    expect(copyFor('fr')).toBe(COPY[DEFAULT_LOCALE])
    expect(copyFor('')).toBe(COPY[DEFAULT_LOCALE])
  })

  it('recognises exactly the locales that are built', () => {
    expect(LOCALES.every(isLocale)).toBe(true)
    expect(isLocale('de')).toBe(false)
  })
})
