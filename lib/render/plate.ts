/**
 * The plate bitmap.
 *
 * An RGBA byte buffer, `width` columns by `height` rows, written one column at
 * a time and blitted whole (invariant 8). Row 0 is the top of the display and
 * therefore the *highest* frequency; the scale map is built low-to-high, so it
 * is read backwards here.
 *
 * Environment-free: this produces bytes, not pixels on a screen. The component
 * wraps them in an ImageData and hands them to a canvas.
 */

import { sampleAt } from '../dsp/scales'
import { ENERGY_PALETTE, PALETTE_SIZE } from './palette'

export interface PlateBitmap {
  readonly width: number
  readonly height: number
  /** RGBA, row-major, `width * height * 4` bytes. */
  readonly data: Uint8ClampedArray
  /** Column the next write lands in. Also where the scan edge is drawn. */
  readonly head: number
  readonly filled: number

  /** Resamples a column through the scale map and writes it at the head. */
  writeColumn(column: Float32Array, scaleMap: Float32Array): void
  clear(): void
}

export function createPlateBitmap(width: number, height: number): PlateBitmap {
  const data = new Uint8ClampedArray(width * height * 4)
  const lut = ENERGY_PALETTE
  const maxLevel = PALETTE_SIZE - 1

  // Fully opaque once, so the hot loop writes three bytes per pixel, not four.
  for (let i = 3; i < data.length; i += 4) data[i] = 255
  fillWithPlateColour()

  let head = 0
  let filled = 0

  function fillWithPlateColour(): void {
    const r = lut[0]
    const g = lut[1]
    const b = lut[2]
    for (let i = 0; i < data.length; i += 4) {
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
    }
  }

  return {
    width,
    height,
    data,

    get head() {
      return head
    },
    get filled() {
      return filled
    },

    writeColumn(column: Float32Array, scaleMap: Float32Array): void {
      if (scaleMap.length !== height) {
        throw new Error(`scale map has ${scaleMap.length} rows; plate has ${height}`)
      }

      const stride = width * 4
      for (let row = 0; row < height; row++) {
        // scaleMap ascends in frequency; the display descends.
        const level = sampleAt(column, scaleMap[height - 1 - row])
        const index = (level <= 0 ? 0 : level >= 1 ? maxLevel : (level * maxLevel) | 0) * 3

        const pixel = row * stride + head * 4
        data[pixel] = lut[index]
        data[pixel + 1] = lut[index + 1]
        data[pixel + 2] = lut[index + 2]
      }

      head = (head + 1) % width
      if (filled < width) filled++
    },

    clear(): void {
      fillWithPlateColour()
      head = 0
      filled = 0
    },
  }
}
