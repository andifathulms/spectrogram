'use client'

import { useEffect, useRef } from 'react'

import { positionOf, type FrequencyScale } from '@/lib/dsp/scales'
import { ENERGY_PALETTE, PALETTE_SIZE } from '@/lib/render/palette'
import { frequencyTicks } from '@/components/plate/FrequencyAxis'
import { hz as formatHz } from '@/lib/ui/format'

interface Props {
  /** One-sided amplitude spectrum. */
  amplitude: Float32Array | null
  N: number
  fs: number
  scale: FrequencyScale
  minDb?: number
  maxDb?: number
  height?: number
  /** Frequencies the user asked for, marked in cyan on the annotation layer. */
  expected?: readonly number[]
}

/**
 * The spectrum as a line, in dB, drawn with the same ramp the plate uses so a
 * bright band there and a tall peak here are recognisably the same quantity.
 */
export function SpectrumChart({
  amplitude,
  N,
  fs,
  scale,
  minDb = -120,
  maxDb = 0,
  height = 240,
  expected = [],
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

    ctx.fillStyle = '#14171A'
    ctx.fillRect(0, 0, width, pixelHeight)

    const nyquist = fs / 2
    const minHz = scale === 'linear' ? 0 : 20

    // Grid, in emulsion. Structure, never data.
    ctx.strokeStyle = '#2A3138'
    ctx.lineWidth = 1
    for (let db = minDb; db <= maxDb; db += 20) {
      const y = ((maxDb - db) / (maxDb - minDb)) * pixelHeight
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    if (amplitude === null) return

    // Where the user's requested frequencies land — annotation layer, cyan.
    ctx.strokeStyle = 'rgba(95, 168, 181, 0.45)'
    for (const target of expected) {
      const x = positionOf(scale, target, minHz, nyquist) * width
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, pixelHeight)
      ctx.stroke()
    }

    // The spectrum itself, coloured by level from the energy LUT.
    const span = maxDb - minDb
    let previousX = 0
    let previousY = pixelHeight

    for (let k = 1; k < amplitude.length; k++) {
      const frequency = (k * fs) / N
      if (frequency < minHz) continue

      const db = amplitude[k] <= 0 ? minDb : 20 * Math.log10(amplitude[k])
      const clamped = db < minDb ? minDb : db > maxDb ? maxDb : db
      const t = (clamped - minDb) / span

      const x = positionOf(scale, frequency, minHz, nyquist) * width
      const y = (1 - t) * pixelHeight

      const level = Math.round(t * (PALETTE_SIZE - 1)) * 3
      ctx.strokeStyle = `rgb(${ENERGY_PALETTE[level]}, ${ENERGY_PALETTE[level + 1]}, ${ENERGY_PALETTE[level + 2]})`
      ctx.beginPath()
      ctx.moveTo(previousX, previousY)
      ctx.lineTo(x, y)
      ctx.stroke()

      previousX = x
      previousY = y
    }
  }, [amplitude, N, fs, scale, minDb, maxDb, height, expected])

  const ticks = frequencyTicks(scale, scale === 'linear' ? 0 : 20, fs / 2)

  return (
    <div>
      <canvas ref={canvasRef} className="block w-full" style={{ height }} />
      <div className="relative mt-1 h-4">
        {ticks.map((tick) => {
          const t = positionOf(scale, tick, scale === 'linear' ? 0 : 20, fs / 2)
          if (t < 0 || t > 1) return null
          return (
            <span
              key={tick}
              className="tabular absolute -translate-x-1/2 text-[10px] text-[#5c6874]"
              style={{ left: `${t * 100}%` }}
            >
              {formatHz(tick)}
            </span>
          )
        })}
      </div>
    </div>
  )
}
