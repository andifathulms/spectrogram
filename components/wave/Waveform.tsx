'use client'

import { useEffect, useRef } from 'react'
import { CANVAS } from '@/lib/ui/colors'

interface Props {
  samples: Float32Array | null
  fs: number
  /** Analysis window position in seconds, drawn as a bracket. Null hides it. */
  windowStartSeconds: number | null
  windowSeconds: number
  height?: number
  /** Left gutter, so the waveform lines up with the plate's frequency axis. */
  gutter?: number
}

/**
 * The waveform with the current analysis window drawn as a bracket, so the
 * relationship between the two views is visible rather than assumed (PRD §4.1).
 *
 * Min/max envelope per pixel column: a waveform drawn by sampling misses
 * transients, and a missed transient here would contradict the plate.
 */
export function Waveform({
  samples,
  fs,
  windowStartSeconds,
  windowSeconds,
  height = 96,
  gutter = 68,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (ctx === null) return

    const dpr = window.devicePixelRatio || 1
    const width = Math.max(1, Math.round(canvas.clientWidth * dpr))
    const pixelHeight = Math.max(1, Math.round(height * dpr))
    if (canvas.width !== width || canvas.height !== pixelHeight) {
      canvas.width = width
      canvas.height = pixelHeight
    }

    ctx.fillStyle = CANVAS.plate
    ctx.fillRect(0, 0, width, pixelHeight)

    // Zero line, in emulsion — structure, not data.
    ctx.strokeStyle = CANVAS.emulsion
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, pixelHeight / 2)
    ctx.lineTo(width, pixelHeight / 2)
    ctx.stroke()

    if (samples === null || samples.length === 0) return

    const mid = pixelHeight / 2
    const columns = Math.min(width, 4096)

    ctx.strokeStyle = CANVAS.inkMuted
    ctx.beginPath()
    for (let x = 0; x < columns; x++) {
      const from = Math.floor((x * samples.length) / columns)
      const to = Math.max(from + 1, Math.floor(((x + 1) * samples.length) / columns))

      let low = 1
      let high = -1
      for (let i = from; i < to; i++) {
        const sample = samples[i]
        if (sample < low) low = sample
        if (sample > high) high = sample
      }

      const px = (x / columns) * width + 0.5
      ctx.moveTo(px, mid - high * mid * 0.94)
      ctx.lineTo(px, mid - low * mid * 0.94)
    }
    ctx.stroke()
  }, [samples, height])

  const duration = samples === null ? 0 : samples.length / fs
  const showBracket = windowStartSeconds !== null && duration > 0
  const left = showBracket ? Math.max(0, (windowStartSeconds / duration) * 100) : 0
  const widthPercent = showBracket ? Math.min(100 - left, (windowSeconds / duration) * 100) : 0

  return (
    <div className="flex">
      <div className="w-[68px] shrink-0 border-r border-emulsion" style={{ width: gutter }} />
      <div className="relative min-w-0 flex-1" style={{ height }}>
        <canvas ref={canvasRef} className="block h-full w-full" style={{ height }} />

        {/* The analysis-window bracket. Cyan, and it moves with the scan. */}
        {showBracket && widthPercent > 0 && (
          <div
            className="pointer-events-none absolute top-0 h-full border-x-2 border-instrument bg-instrument/10"
            style={{ left: `${left}%`, width: `${Math.max(widthPercent, 0.4)}%` }}
          >
            <span className="absolute -top-px left-0 h-1 w-full bg-instrument" />
            <span className="absolute -bottom-px left-0 h-1 w-full bg-instrument" />
          </div>
        )}
      </div>
    </div>
  )
}
