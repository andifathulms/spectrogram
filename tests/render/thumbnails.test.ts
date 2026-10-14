/**
 * The sample thumbnails on the Listen page are pictures of our transform's
 * output, so they are produced by it: this suite renders every bundled sample
 * through lib/render/thumbnail and compares the result with the PNG committed
 * in public/thumbs/. A changed sample, transform, ramp or scale fails here
 * until the thumbnails are regenerated with `pnpm thumbs`.
 *
 * The comparison allows a small per-channel difference, because Math.sin and
 * Math.exp may round differently on another platform; a wrong picture differs
 * by far more than that.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { SAMPLES } from '../../data/samples'
import { renderThumbnail, type ThumbnailOptions } from '../../lib/render/thumbnail'
import { THUMBNAIL } from '../../lib/render/thumbnailSpec'
import { decodePng, encodePng } from '../support/png'

const ROOT = new URL('../..', import.meta.url).pathname
const DIRECTORY = join(ROOT, 'public', 'thumbs')
const UPDATE = process.env.UPDATE_THUMBS === '1'

const OPTIONS: ThumbnailOptions = { ...THUMBNAIL }

describe('sample thumbnails are this transform’s output', () => {
  if (UPDATE) mkdirSync(DIRECTORY, { recursive: true })

  it.each(SAMPLES.map((sample) => [sample.id, sample] as const))('%s', (id, sample) => {
    const audio = sample.render(THUMBNAIL.fs, sample.seconds)
    const plate = renderThumbnail(audio, THUMBNAIL.fs, OPTIONS)
    const file = join(DIRECTORY, `${id}.png`)

    if (UPDATE) writeFileSync(file, encodePng(plate.width, plate.height, plate.data))

    expect(existsSync(file), `${file} is missing — run pnpm thumbs`).toBe(true)
    const committed = decodePng(readFileSync(file))
    expect([committed.width, committed.height]).toEqual([plate.width, plate.height])

    let worst = 0
    for (let p = 0, q = 0; p < plate.data.length; p += 4, q += 3) {
      for (let c = 0; c < 3; c++) worst = Math.max(worst, Math.abs(plate.data[p + c] - committed.rgb[q + c]))
    }
    expect(worst, `${id}.png is stale — run pnpm thumbs`).toBeLessThanOrEqual(3)
  })
})
