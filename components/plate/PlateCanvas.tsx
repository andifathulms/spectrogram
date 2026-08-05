'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { PlateBitmap } from '@/lib/render/plate'
import { frequencyAt, positionOf, type FrequencyScale } from '@/lib/dsp/scales'
import { FrequencyAxis } from './FrequencyAxis'

export interface PlateCursor {
  /** Seconds from the start of the analysed audio. */
  timeSeconds: number
  frequencyHz: number
  /** Fractional bin index at the cursor. */
  bin: number
  /** Fraction along the plate, for the caller to look up a column. */
  x: number
}

interface Props {
  bitmap: PlateBitmap
  /** Bumped by the owner whenever the bitmap's contents change. */
  revision: number
  scale: FrequencyScale
  minHz: number
  maxHz: number
  /** Total seconds the plate's width represents. */
  durationSeconds: number
  /** FFT size, so the cursor can report a bin index. */
  N: number
  fs: number
  /** Where the scan edge sits, in [0, 1]. Null hides it. */
  scan: number | null
  /** Live capture scrolls; offline analysis does not. */
  scrolling: boolean
  height?: number
  onCursor?: (cursor: PlateCursor | null) => void
}

export function PlateCanvas({
  bitmap,
  revision,
  scale,
  minHz,
  maxHz,
  durationSeconds,
  N,
  fs,
  scan,
  scrolling,
  height = 340,
  onCursor,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const imageRef = useRef<ImageData | null>(null)
  const [cursor, setCursor] = useState<PlateCursor | null>(null)

  // The bitmap is blitted, never redrawn column by column (invariant 8).
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return

    if (offscreenRef.current === null) {
      offscreenRef.current = document.createElement('canvas')
    }
    const offscreen = offscreenRef.current
    if (offscreen.width !== bitmap.width || offscreen.height !== bitmap.height) {
      offscreen.width = bitmap.width
      offscreen.height = bitmap.height
      imageRef.current = null
    }

    const octx = offscreen.getContext('2d', { alpha: false })
    const ctx = canvas.getContext('2d', { alpha: false })
    if (octx === null || ctx === null) return

    if (imageRef.current === null) {
      imageRef.current = octx.createImageData(bitmap.width, bitmap.height)
    }
    const image = imageRef.current
    image.data.set(bitmap.data)
    octx.putImageData(image, 0, 0)

    const dpr = window.devicePixelRatio || 1
    const cssWidth = canvas.clientWidth
    const pixelWidth = Math.max(1, Math.round(cssWidth * dpr))
    const pixelHeight = Math.max(1, Math.round(height * dpr))
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth
      canvas.height = pixelHeight
    }

    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, pixelWidth, pixelHeight)

    // Live capture unrolls the ring so the oldest column is on the left; the
    // offline plate is already in order.
    const start = scrolling && bitmap.filled === bitmap.width ? bitmap.head : 0
    const lead = bitmap.width - start
    const leadPixels = (lead / bitmap.width) * pixelWidth

    ctx.drawImage(offscreen, start, 0, lead, bitmap.height, 0, 0, leadPixels, pixelHeight)
    if (start > 0) {
      ctx.drawImage(
        offscreen,
        0,
        0,
        start,
        bitmap.height,
        leadPixels,
        0,
        pixelWidth - leadPixels,
        pixelHeight,
      )
    }
  }, [bitmap, revision, height, scrolling])

  const handleMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (canvas === null) return
      const rect = canvas.getBoundingClientRect()

      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height
      if (x < 0 || x > 1 || y < 0 || y > 1) return

      const frequencyHz = frequencyAt(scale, 1 - y, minHz, maxHz)
      const next: PlateCursor = {
        x,
        timeSeconds: x * durationSeconds,
        frequencyHz,
        bin: (frequencyHz * N) / fs,
      }
      setCursor(next)
      onCursor?.(next)
    },
    [durationSeconds, fs, maxHz, minHz, N, onCursor, scale],
  )

  const handleLeave = useCallback(() => {
    setCursor(null)
    onCursor?.(null)
  }, [onCursor])

  const cursorTop = cursor === null ? 0 : (1 - positionOf(scale, cursor.frequencyHz, minHz, maxHz)) * 100

  return (
    <div className="flex">
      <FrequencyAxis scale={scale} minHz={minHz} maxHz={maxHz} height={height} />

      <div className="relative min-w-0 flex-1" style={{ height }}>
        <canvas
          ref={canvasRef}
          className="block h-full w-full bg-plate"
          style={{ height }}
          onPointerMove={handleMove}
          onPointerLeave={handleLeave}
        />

        {/* Annotation layer — instrument cyan only, never the energy ramp. */}
        {scan !== null && (
          <div
            className="pointer-events-none absolute top-0 h-full w-px bg-instrument/70"
            style={{ left: `${scan * 100}%` }}
          />
        )}

        {cursor !== null && (
          <>
            <div
              className="pointer-events-none absolute left-0 h-px w-full bg-instrument/50"
              style={{ top: `${cursorTop}%` }}
            />
            <div
              className="pointer-events-none absolute top-0 h-full w-px bg-instrument/50"
              style={{ left: `${cursor.x * 100}%` }}
            />
          </>
        )}
      </div>
    </div>
  )
}
