'use client'

/**
 * Orchestration for the plate: worker lifecycle, column storage, and painting.
 *
 * Nothing is computed in a component (invariant 15) — components render what
 * this returns. Nothing here computes a transform either; it moves buffers
 * between the worker, the store, and the bitmap.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { buildScaleMap, type FrequencyScale } from '@/lib/dsp/scales'
import { binCount } from '@/lib/dsp/fft'
import type { WindowKind } from '@/lib/dsp/windows'
import { createAnalysisClient, type AnalysisClient } from '@/lib/audio/analysis'
import type { AnalysisConfig, AnalysisInfo } from '@/lib/audio/protocol'
import { createColumnStore, paintStore, type ColumnStore } from '@/lib/render/columns'
import { createColumnRing, type ColumnRing } from '@/lib/render/ring'
import { createPlateBitmap, type PlateBitmap } from '@/lib/render/plate'

export const PLATE_WIDTH = 1024
export const PLATE_ROWS = 340
/** Bottom of the log and mel axes. A log axis cannot start at 0 Hz. */
export const MIN_PLOT_HZ = 20

export type SourceMode = 'sample' | 'mic'

export interface SpectrogramSettings {
  N: number
  overlap: number
  window: WindowKind
  minDb: number
  maxDb: number
  scale: FrequencyScale
}

export interface SpectrogramState {
  info: AnalysisInfo | null
  bitmap: PlateBitmap
  revision: number
  /** Columns currently represented on the plate. */
  columns: number
  fault: string | null
  peak: number
  clipped: boolean
  /** dB at a plate position, read from the stored column rather than the pixel. */
  dbAt(x: number, bin: number): number
  /** Seconds at a plate position; negative in live mode, where 0 is now. */
  timeAt(x: number): number
  analyseBuffer(samples: Float32Array): void
  pushSamples(samples: Float32Array): void
  reset(): void
}

export function useSpectrogram(
  settings: SpectrogramSettings,
  fs: number,
  mode: SourceMode,
): SpectrogramState {
  const { N, overlap, window: windowKind, minDb, maxDb, scale } = settings

  const clientRef = useRef<AnalysisClient | null>(null)
  const storeRef = useRef<ColumnStore | null>(null)
  const ringRef = useRef<ColumnRing | null>(null)
  const scaleMapRef = useRef<Float32Array | null>(null)
  const pooledRef = useRef<Float32Array | null>(null)
  const modeRef = useRef<SourceMode>(mode)
  const pendingRef = useRef<Float32Array | null>(null)

  const [info, setInfo] = useState<AnalysisInfo | null>(null)
  const [revision, setRevision] = useState(0)
  const [columns, setColumns] = useState(0)
  const [fault, setFault] = useState<string | null>(null)
  const [peak, setPeak] = useState(0)
  const [clipped, setClipped] = useState(false)

  const bitmap = useMemo(() => createPlateBitmap(PLATE_WIDTH, PLATE_ROWS), [])

  modeRef.current = mode

  // Scale map depends only on the axis, not on the audio — rebuilt on change,
  // never per column.
  useEffect(() => {
    scaleMapRef.current = buildScaleMap(scale, PLATE_ROWS, N, fs, MIN_PLOT_HZ)
    const store = storeRef.current
    const pooled = pooledRef.current
    if (modeRef.current === 'sample' && store !== null && pooled !== null && store.count > 0) {
      paintStore(bitmap, store, scaleMapRef.current, pooled)
      setRevision((r) => r + 1)
    }
  }, [scale, N, fs, bitmap])

  useEffect(() => {
    const client = createAnalysisClient({
      onReady(ready) {
        const bins = ready.bins
        storeRef.current = createColumnStore(bins, 2048)
        ringRef.current = createColumnRing(PLATE_WIDTH, bins)
        pooledRef.current = new Float32Array(bins)
        bitmap.clear()
        setColumns(0)
        setInfo(ready)
        setFault(null)
      },

      onColumns(batch) {
        if (batch.peak > 0) setPeak(batch.peak)
        setClipped(batch.clipped)

        if (modeRef.current === 'sample') {
          const store = storeRef.current
          if (store === null) return
          /*
           * The worker restarts its column numbering at every `analyse`, so a
           * batch that says it starts at zero is the start of a new picture.
           * Following that rather than trusting the reset issued at call time
           * is what stops a superseded analysis — a fast sample switch, or a
           * double-invoked effect — from appending its columns on top of the
           * analysis that replaced it, which drew the same sound twice.
           */
          if (batch.first === 0) store.reset()
          store.append(batch.columns, batch.count)
          return
        }

        const ring = ringRef.current
        const map = scaleMapRef.current
        if (ring === null || map === null) return
        for (let c = 0; c < batch.count; c++) {
          const column = batch.columns.subarray(c * batch.bins, (c + 1) * batch.bins)
          ring.write(column)
          bitmap.writeColumn(column, map)
        }
        setColumns(ring.filled)
        setRevision((r) => r + 1)
      },

      onComplete() {
        const store = storeRef.current
        const map = scaleMapRef.current
        const pooled = pooledRef.current
        if (store === null || map === null || pooled === null) return
        paintStore(bitmap, store, map, pooled)
        setColumns(store.count)
        setRevision((r) => r + 1)
      },

      onFault(message) {
        setFault(message)
      },
    })

    clientRef.current = client
    return () => {
      client.terminate()
      clientRef.current = null
    }
  }, [bitmap])

  // Reconfiguring rebuilds every buffer, so anything already analysed has to
  // be analysed again — which is correct: the columns would otherwise mix two
  // window sizes on one plate.
  useEffect(() => {
    const config: AnalysisConfig = { N, fs, overlap, window: windowKind, minDb, maxDb }
    clientRef.current?.configure(config)
  }, [N, fs, overlap, windowKind, minDb, maxDb])

  useEffect(() => {
    if (info === null || mode !== 'sample') return
    const samples = pendingRef.current
    if (samples === null) return
    storeRef.current?.reset()
    void clientRef.current?.analyse(samples)
  }, [info, mode])

  const analyseBuffer = useCallback((samples: Float32Array) => {
    pendingRef.current = samples
    storeRef.current?.reset()
    void clientRef.current?.analyse(samples)
  }, [])

  const pushSamples = useCallback((samples: Float32Array) => {
    clientRef.current?.push(samples)
  }, [])

  const reset = useCallback(() => {
    storeRef.current?.reset()
    ringRef.current?.clear()
    bitmap.clear()
    clientRef.current?.reset()
    setColumns(0)
    setPeak(0)
    setClipped(false)
    setRevision((r) => r + 1)
  }, [bitmap])

  const dbAt = useCallback(
    (x: number, bin: number): number => {
      const span = maxDb - minDb
      const roundedBin = Math.round(bin)

      if (modeRef.current === 'sample') {
        const store = storeRef.current
        if (store === null || store.count === 0) return minDb
        const index = Math.min(store.count - 1, Math.max(0, Math.floor(x * store.count)))
        return minDb + store.valueAt(index, roundedBin) * span
      }

      const ring = ringRef.current
      if (ring === null || ring.filled === 0) return minDb
      const i = Math.min(PLATE_WIDTH - 1, Math.max(0, Math.floor(x * PLATE_WIDTH)))
      const age = ring.filled - 1 - i
      return minDb + ring.valueAt(age, roundedBin) * span
    },
    [maxDb, minDb],
  )

  const timeAt = useCallback(
    (x: number): number => {
      if (info === null) return 0
      if (modeRef.current === 'sample') {
        const store = storeRef.current
        const total = store?.count ?? 0
        return x * total * info.hopSeconds
      }
      const ring = ringRef.current
      const filled = ring?.filled ?? 0
      const i = Math.min(PLATE_WIDTH - 1, Math.max(0, Math.floor(x * PLATE_WIDTH)))
      return -(filled - 1 - i) * info.hopSeconds
    },
    [info],
  )

  return {
    info,
    bitmap,
    revision,
    columns,
    fault,
    peak,
    clipped,
    dbAt,
    timeAt,
    analyseBuffer,
    pushSamples,
    reset,
  }
}

/** Expected column count for a buffer, so the store is sized once up front. */
export function expectedColumns(length: number, N: number, hop: number): number {
  return length < N ? 0 : Math.floor((length - N) / hop) + 1
}

/** One-sided bin count, re-exported so components need not import lib/dsp. */
export { binCount }
