/**
 * The render layer is not the transform, but a ring-buffer indexing bug looks
 * exactly like a DSP bug on screen — so it gets its own tests.
 */

import { describe, expect, it } from 'vitest'

import { buildPalette, ENERGY_PALETTE, ENERGY_RAMP, luminance, PALETTE_SIZE, rampColor } from '../../lib/render/palette'
import { createColumnRing } from '../../lib/render/ring'
import { createPlateBitmap } from '../../lib/render/plate'
import { buildScaleMap } from '../../lib/dsp/scales'

describe('energy palette', () => {
  it('rises monotonically in luminance', () => {
    let previous = -1
    for (let i = 0; i < PALETTE_SIZE; i++) {
      const l = luminance(ENERGY_PALETTE[i * 3], ENERGY_PALETTE[i * 3 + 1], ENERGY_PALETTE[i * 3 + 2])
      expect(l).toBeGreaterThan(previous)
      previous = l
    }
  })

  it('starts at the plate colour and ends at near-white', () => {
    expect(Array.from(ENERGY_PALETTE.subarray(0, 3))).toEqual([0x14, 0x17, 0x1a])
    const last = (PALETTE_SIZE - 1) * 3
    expect(Array.from(ENERGY_PALETTE.subarray(last, last + 3))).toEqual([0xf5, 0xe9, 0xd0])
  })

  it('never emits instrument cyan, which belongs to the annotation layer', () => {
    // Cyan is distinguished by blue and green both exceeding red.
    for (let i = 0; i < PALETTE_SIZE; i++) {
      const r = ENERGY_PALETTE[i * 3]
      const g = ENERGY_PALETTE[i * 3 + 1]
      const b = ENERGY_PALETTE[i * 3 + 2]
      expect(g > r && b > r && g > 0x60).toBe(false)
    }
  })

  it('passes through every named ramp stop', () => {
    for (const stop of ENERGY_RAMP) {
      const i = Math.round(stop.at * (PALETTE_SIZE - 1)) * 3
      expect(Math.abs(ENERGY_PALETTE[i] - stop.r)).toBeLessThanOrEqual(1)
      expect(Math.abs(ENERGY_PALETTE[i + 1] - stop.g)).toBeLessThanOrEqual(1)
      expect(Math.abs(ENERGY_PALETTE[i + 2] - stop.b)).toBeLessThanOrEqual(1)
    }
  })

  it('clamps out-of-range positions', () => {
    expect(rampColor(-5)).toBe(rampColor(0))
    expect(rampColor(5)).toBe(rampColor(1))
  })

  it('is rebuildable with a different ramp', () => {
    const lut = buildPalette([
      { at: 0, r: 0, g: 0, b: 0 },
      { at: 1, r: 255, g: 255, b: 255 },
    ])
    expect(lut[0]).toBe(0)
    expect(lut[(PALETTE_SIZE - 1) * 3]).toBe(255)
  })
})

describe('column ring', () => {
  it('returns columns newest-first', () => {
    const ring = createColumnRing(4, 2)
    const out = new Float32Array(2)

    for (let i = 1; i <= 3; i++) ring.write(Float32Array.from([i, i * 10]))

    expect(ring.filled).toBe(3)
    expect(ring.written).toBe(3)

    ring.read(0, out)
    expect(Array.from(out)).toEqual([3, 30])
    ring.read(2, out)
    expect(Array.from(out)).toEqual([1, 10])
    expect(ring.read(3, out)).toBe(false)
  })

  it('overwrites the oldest column once full', () => {
    const ring = createColumnRing(3, 1)
    for (let i = 1; i <= 5; i++) ring.write(Float32Array.from([i]))

    const out = new Float32Array(1)
    expect(ring.filled).toBe(3)
    expect(ring.written).toBe(5)

    ring.read(0, out)
    expect(out[0]).toBe(5)
    ring.read(2, out)
    expect(out[0]).toBe(3)
    expect(ring.read(3, out)).toBe(false)
  })

  it('wraps the head without ever growing', () => {
    const ring = createColumnRing(8, 4)
    const bytes = ring.data.byteLength
    for (let i = 0; i < 1000; i++) ring.write(new Float32Array(4))
    expect(ring.data.byteLength).toBe(bytes)
    expect(ring.head).toBe(1000 % 8)
  })

  it('rejects a column of the wrong length', () => {
    const ring = createColumnRing(2, 4)
    expect(() => ring.write(new Float32Array(3))).toThrow(/3 bins/)
  })

  it('clears back to empty', () => {
    const ring = createColumnRing(2, 2)
    ring.write(Float32Array.from([1, 1]))
    ring.clear()
    expect(ring.filled).toBe(0)
    expect(ring.written).toBe(0)
    expect(ring.read(0, new Float32Array(2))).toBe(false)
  })
})

describe('plate bitmap', () => {
  const BINS = 513 // N = 1024
  const HEIGHT = 64
  const scaleMap = buildScaleMap('linear', HEIGHT, 1024, 48_000)

  it('starts as an opaque field of the plate colour', () => {
    const plate = createPlateBitmap(16, HEIGHT)
    for (let i = 0; i < plate.data.length; i += 4) {
      expect(plate.data[i]).toBe(0x14)
      expect(plate.data[i + 3]).toBe(255)
    }
  })

  it('writes one column per call and wraps at the width', () => {
    const plate = createPlateBitmap(4, HEIGHT)
    const column = new Float32Array(BINS)
    column.fill(1)

    for (let i = 0; i < 6; i++) plate.writeColumn(column, scaleMap)
    expect(plate.head).toBe(2)
    expect(plate.filled).toBe(4)
  })

  it('puts high frequencies at the top', () => {
    const plate = createPlateBitmap(2, HEIGHT)
    const column = new Float32Array(BINS)
    // Energy only in the top quarter of the spectrum.
    column.fill(0, 0, Math.floor(BINS * 0.75))
    column.fill(1, Math.floor(BINS * 0.75))

    plate.writeColumn(column, scaleMap)

    const stride = plate.width * 4
    const topRow = plate.data[0 * stride]
    const bottomRow = plate.data[(HEIGHT - 1) * stride]
    expect(topRow).toBeGreaterThan(bottomRow)
  })

  it('maps an energy level to the palette entry for that level', () => {
    const plate = createPlateBitmap(1, 1)
    const map = Float32Array.from([0])
    const column = Float32Array.from([1, 0])

    plate.writeColumn(column, map)
    const last = (PALETTE_SIZE - 1) * 3
    expect(plate.data[0]).toBe(ENERGY_PALETTE[last])
    expect(plate.data[1]).toBe(ENERGY_PALETTE[last + 1])
    expect(plate.data[2]).toBe(ENERGY_PALETTE[last + 2])
  })

  it('rejects a scale map that does not match its height', () => {
    const plate = createPlateBitmap(4, 32)
    expect(() => plate.writeColumn(new Float32Array(BINS), scaleMap)).toThrow(/64 rows/)
  })

  it('does not allocate while scrolling', () => {
    const plate = createPlateBitmap(256, HEIGHT)
    const column = new Float32Array(BINS)
    const bytes = plate.data.byteLength
    for (let i = 0; i < 2000; i++) {
      column.fill((i % 100) / 100)
      plate.writeColumn(column, scaleMap)
    }
    expect(plate.data.byteLength).toBe(bytes)
  })
})
