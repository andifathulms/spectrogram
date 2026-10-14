/**
 * A whole sample, analysed and painted into a small plate in one call.
 *
 * The same pipeline the worker and the plate run — framer, spectrum
 * analyser, column store, max-pooled paint — composed synchronously so it
 * can run in Node. tests/render/thumbnails.test.ts uses it to produce the
 * sample thumbnails in public/thumbs/, which is how those pictures stay our
 * transform's output rather than drawings of it.
 */

import { createFramer } from '../dsp/framer'
import { buildScaleMap, type FrequencyScale } from '../dsp/scales'
import { createSpectrumAnalyser, hopFor } from '../dsp/spectrum'
import type { WindowKind } from '../dsp/windows'
import { createColumnStore, paintStore } from './columns'
import { createPlateBitmap, type PlateBitmap } from './plate'

export interface ThumbnailOptions {
  width: number
  height: number
  N: number
  overlap: number
  window: WindowKind
  minDb: number
  maxDb: number
  scale: FrequencyScale
  minHz: number
}

export function renderThumbnail(samples: Float32Array, fs: number, options: ThumbnailOptions): PlateBitmap {
  const { width, height, N, overlap, window, minDb, maxDb, scale, minHz } = options
  const analyser = createSpectrumAnalyser({ N, fs, window, minDb, maxDb })
  const hop = hopFor(N, overlap)
  const store = createColumnStore(analyser.bins, Math.ceil(samples.length / hop))

  const framer = createFramer(N, hop, (frame) => {
    analyser.analyse(frame)
    store.append(analyser.column, 1)
  })
  framer.push(samples)

  const plate = createPlateBitmap(width, height)
  paintStore(plate, store, buildScaleMap(scale, height, N, fs, minHz), new Float32Array(analyser.bins))
  return plate
}
