/**
 * Framing bugs shift every column by a fraction of a window, which on the
 * plate looks like a smear rather than like a bug. So: exact indices.
 */

import { describe, expect, it } from 'vitest'

import { createFramer } from '../../lib/dsp/framer'
import { hopFor } from '../../lib/dsp/spectrum'

/** Collects frames as plain arrays so the assertions read directly. */
function collect(N: number, hop: number) {
  const seen: number[][] = []
  const framer = createFramer(N, hop, (frame) => {
    seen.push(Array.from(frame))
  })
  return { framer, seen }
}

function ramp(length: number, from = 0): Float32Array {
  return Float32Array.from({ length }, (_, i) => from + i)
}

describe('framer', () => {
  it('emits its first frame exactly when N samples have arrived', () => {
    const { framer, seen } = collect(8, 4)

    framer.push(ramp(7))
    expect(seen).toHaveLength(0)

    framer.push(ramp(1, 7))
    expect(seen).toHaveLength(1)
    expect(seen[0]).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })

  it('advances by exactly hop samples', () => {
    const { framer, seen } = collect(8, 4)
    framer.push(ramp(16))

    expect(seen).toEqual([
      [0, 1, 2, 3, 4, 5, 6, 7],
      [4, 5, 6, 7, 8, 9, 10, 11],
      [8, 9, 10, 11, 12, 13, 14, 15],
    ])
  })

  it('gives the same frames whatever the chunk size', () => {
    const reference = collect(16, 5)
    reference.framer.push(ramp(100))

    for (const chunk of [1, 3, 7, 16, 64]) {
      const { framer, seen } = collect(16, 5)
      for (let i = 0; i < 100; i += chunk) {
        framer.push(ramp(Math.min(chunk, 100 - i), i))
      }
      expect(seen).toEqual(reference.seen)
    }
  })

  it('handles hop equal to N — no overlap at all', () => {
    const { framer, seen } = collect(4, 4)
    framer.push(ramp(12))
    expect(seen).toEqual([
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [8, 9, 10, 11],
    ])
  })

  it('handles hop of one sample', () => {
    const { framer, seen } = collect(4, 1)
    framer.push(ramp(6))
    expect(seen).toHaveLength(3)
    expect(seen[2]).toEqual([2, 3, 4, 5])
  })

  it('reports the number of frames a push produced', () => {
    const { framer } = collect(8, 4)
    expect(framer.push(ramp(8))).toBe(1)
    expect(framer.push(ramp(3, 8))).toBe(0)
    // consumed goes 11 → 16, crossing both the 12- and 16-sample marks.
    expect(framer.push(ramp(5, 11))).toBe(2)
    expect(framer.frames).toBe(3)
    expect(framer.consumed).toBe(16)
  })

  it('resets to empty', () => {
    const { framer, seen } = collect(8, 4)
    framer.push(ramp(32))
    const count = seen.length
    framer.reset()
    framer.push(ramp(7))
    expect(seen).toHaveLength(count)
    expect(framer.consumed).toBe(7)
  })

  it('reuses one scratch frame rather than allocating per frame', () => {
    const seen = new Set<Float64Array>()
    const framer = createFramer(64, 16, (frame) => {
      seen.add(frame)
    })
    framer.push(new Float32Array(4096))
    expect(seen.size).toBe(1)
  })

  it('rejects an invalid hop', () => {
    expect(() => createFramer(8, 0, () => {})).toThrow(/hop must be/)
    expect(() => createFramer(8, 9, () => {})).toThrow(/hop must be/)
  })

  it('rejects a non-power-of-two frame size', () => {
    expect(() => createFramer(100, 10, () => {})).toThrow(/power of two/)
  })
})

describe('hop arithmetic', () => {
  it('matches the overlap the slider reports', () => {
    expect(hopFor(2048, 0.75)).toBe(512)
    expect(hopFor(2048, 0.5)).toBe(1024)
    expect(hopFor(1024, 0)).toBe(1024)
  })

  it('never returns a hop of zero, however extreme the overlap', () => {
    expect(hopFor(256, 1)).toBeGreaterThanOrEqual(1)
    expect(hopFor(2, 0.99)).toBe(1)
  })
})
