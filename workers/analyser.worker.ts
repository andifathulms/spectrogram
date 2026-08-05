/**
 * The analysis worker — the only runtime caller of lib/dsp.
 *
 * Invariant 7 requires analysis off the main thread. This is a Worker rather
 * than an AudioWorkletProcessor for one concrete reason: an AudioWorklet
 * module cannot reliably use ES imports, so putting the transform there would
 * mean either inlining a copy of lib/dsp or hand-maintaining a bundling step
 * for it — and a second copy of the FFT is exactly what the correctness suites
 * could not protect us from. The AudioWorklet in public/worklets/ is therefore
 * a pure capture tap: it forwards samples and computes nothing.
 *
 * Everything here runs on frames the framer hands over, through buffers
 * allocated once per configuration and recycled across the thread boundary.
 */

/// <reference lib="webworker" />

import { createFramer, type Framer } from '../lib/dsp/framer'
import { createSpectrumAnalyser, hopFor, hopSeconds, type SpectrumAnalyser } from '../lib/dsp/spectrum'
import { DspError } from '../lib/dsp/errors'
import type { AnalyserRequest, AnalyserResponse, AnalysisConfig, AnalysisInfo } from '../lib/audio/protocol'

/** Columns held before a batch is posted. Keeps message rate near frame rate. */
const BATCH_COLUMNS = 8

let analyser: SpectrumAnalyser | null = null
let framer: Framer | null = null
let info: AnalysisInfo | null = null

/** Batch under construction, plus a pool of buffers the main thread returned. */
let batch: Float32Array | null = null
let batchCount = 0
let batchPeak = 0
let batchClipped = false
let emitted = 0
const pool: ArrayBuffer[] = []

function post(message: AnalyserResponse, transfer?: Transferable[]): void {
  // postMessage's overloads differ between lib.dom and lib.webworker.
  ;(self as unknown as { postMessage: (m: unknown, t?: Transferable[]) => void }).postMessage(
    message,
    transfer,
  )
}

function takeBuffer(bytes: number): Float32Array {
  while (pool.length > 0) {
    const candidate = pool.pop() as ArrayBuffer
    if (candidate.byteLength === bytes) return new Float32Array(candidate)
  }
  return new Float32Array(bytes / Float32Array.BYTES_PER_ELEMENT)
}

function flush(): void {
  if (batch === null || batchCount === 0 || analyser === null) return

  const bins = analyser.bins
  const full = batch
  const used = batchCount

  post(
    {
      type: 'columns',
      buffer: full.buffer,
      count: used,
      bins,
      first: emitted - used,
      peak: batchPeak,
      clipped: batchClipped,
    },
    [full.buffer],
  )

  batch = null
  batchCount = 0
  batchPeak = 0
  batchClipped = false
}

/** The frame sink. Created once per configuration, not per frame. */
function onFrame(frame: Float64Array): void {
  const active = analyser
  if (active === null) return

  active.analyse(frame)

  if (batch === null) {
    batch = takeBuffer(BATCH_COLUMNS * active.bins * Float32Array.BYTES_PER_ELEMENT)
    batchCount = 0
    batchPeak = 0
    batchClipped = false
  }

  batch.set(active.column, batchCount * active.bins)
  batchCount++
  emitted++
  if (active.peak > batchPeak) batchPeak = active.peak
  if (active.clipped) batchClipped = true

  if (batchCount === BATCH_COLUMNS) flush()
}

function configure(config: AnalysisConfig): void {
  const hop = hopFor(config.N, config.overlap)

  analyser = createSpectrumAnalyser({
    N: config.N,
    fs: config.fs,
    window: config.window,
    minDb: config.minDb,
    maxDb: config.maxDb,
  })
  framer = createFramer(config.N, hop, onFrame)

  batch = null
  batchCount = 0
  emitted = 0
  pool.length = 0

  info = {
    N: config.N,
    fs: config.fs,
    window: config.window,
    bins: analyser.bins,
    binSpacingHz: analyser.binSpacingHz,
    windowSeconds: analyser.windowSeconds,
    hop,
    hopSeconds: hopSeconds(hop, config.fs),
  }

  post({ type: 'ready', info })
}

self.onmessage = (event: MessageEvent<AnalyserRequest>): void => {
  const message = event.data

  try {
    switch (message.type) {
      case 'configure':
        configure(message.config)
        return

      case 'push':
        if (framer === null) throw new Error('worker received samples before being configured')
        framer.push(message.samples)
        flush()
        return

      case 'analyse': {
        if (framer === null) throw new Error('worker received a buffer before being configured')
        framer.reset()
        emitted = 0
        framer.push(message.samples)
        flush()
        post({ type: 'complete', id: message.id, count: emitted })
        return
      }

      case 'recycle':
        // Bounded: a runaway pool would be a leak, not an optimisation.
        if (pool.length < 8) pool.push(message.buffer)
        return

      case 'reset':
        framer?.reset()
        batch = null
        batchCount = 0
        emitted = 0
        return

      default: {
        const never: never = message
        throw new Error(`unknown request: ${JSON.stringify(never)}`)
      }
    }
  } catch (error) {
    const detail =
      error instanceof DspError
        ? `${error.message} (${error.fault.type})`
        : error instanceof Error
          ? error.message
          : String(error)
    post({ type: 'fault', message: detail })
  }
}
