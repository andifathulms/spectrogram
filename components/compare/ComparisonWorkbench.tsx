'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { runComparison, type ComparisonResult } from '@/lib/audio/compare'
import { startAudioContext, audioSupport } from '@/lib/audio/context'
import { FFT_SIZES } from '@/lib/dsp/errors'
import * as fmt from '@/lib/ui/format'
import type { Copy } from '@/lib/i18n'

import { Button, Field, Segmented } from '@/components/controls/Control'
import { Readout } from '@/components/ui/Readout'

const SIZES = FFT_SIZES.filter((N) => N >= 512 && N <= 8192).map(String)

export function ComparisonWorkbench({ copy }: { copy: Copy }) {
  const [size, setSize] = useState('2048')
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  const overlayRef = useRef<HTMLCanvasElement>(null)
  const deltaRef = useRef<HTMLCanvasElement>(null)

  const run = useCallback(async () => {
    const support = audioSupport()
    if (support.type === 'unsupported') {
      setStatus(support.reason)
      return
    }

    setRunning(true)
    setStatus(null)
    try {
      const context = await startAudioContext()
      const outcome = await runComparison(context, Number(size))
      if (outcome.type === 'unavailable') {
        setStatus(copy.comparisonUnavailable)
        setResult(null)
      } else {
        setResult(outcome.result)
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    } finally {
      setRunning(false)
    }
  }, [copy, size])

  // Both spectra on one axis, then the difference below it at its own scale.
  useEffect(() => {
    const overlay = overlayRef.current
    const delta = deltaRef.current
    if (overlay === null || delta === null || result === null) return

    drawSpectra(overlay, result)
    drawDifference(delta, result)
  }, [result])

  return (
    <div className="space-y-6">
      <p className="max-w-3xl border-l-2 border-instrument pl-3 text-sm leading-relaxed text-[#b3bdc7]">
        {copy.comparisonHonest}
      </p>

      <div className="flex flex-wrap items-end gap-6">
        <Field label={copy.windowSize} value={`${size} ${copy.units.samples}`}>
          <Segmented
            ariaLabel={copy.windowSize}
            value={size}
            onChange={setSize}
            options={SIZES.map((value) => ({ value, label: value }))}
          />
        </Field>
        <Button variant="primary" onClick={() => void run()} disabled={running}>
          {copy.runComparison}
        </Button>
      </div>

      {status !== null && (
        <p className="border-l-2 border-clip pl-3 text-sm text-clip">{status}</p>
      )}

      {result !== null && (
        <>
          <section className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-sm border border-emulsion p-4 sm:grid-cols-3 lg:grid-cols-6">
            <Readout label={copy.worstDifference} value={fmt.db(result.worstNearPeaksDb)} emphasis />
            <Readout label={`${copy.difference} (mean)`} value={fmt.db(result.meanAbsDb)} />
            <Readout label={`${copy.ours} — ${copy.timing}`} value={fmt.milliseconds(result.oursMs)} />
            <Readout
              label={`${copy.theirs} — ${copy.timing}`}
              value={fmt.milliseconds(result.theirsMs)}
            />
            <Readout label={copy.bins} value={fmt.count(result.bins)} />
            <Readout label={copy.sampleRate} value={`${(result.fs / 1000).toFixed(3)} kHz`} />
          </section>

          <section>
            <div className="flex items-center gap-5 text-xs">
              <span className="flex items-center gap-2 text-energyHigh">
                <span className="block h-px w-5 bg-energyHigh" /> {copy.ours}
              </span>
              <span className="flex items-center gap-2 text-instrument">
                <span className="block h-px w-5 bg-instrument" /> {copy.theirs}
              </span>
            </div>
            <canvas ref={overlayRef} className="mt-2 block w-full" style={{ height: 280 }} />
          </section>

          <section>
            <h2 className="control-label">{copy.difference}</h2>
            <canvas ref={deltaRef} className="mt-2 block w-full" style={{ height: 140 }} />
            <p className="tabular mt-1 text-[10px] text-[#5c6874]">
              0 Hz → {fmt.hz(result.fs / 2)}
            </p>
          </section>
        </>
      )}
    </div>
  )
}

function prepare(canvas: HTMLCanvasElement, height: number): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext('2d', { alpha: false })
  if (ctx === null) return null

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr))
  canvas.height = Math.max(1, Math.round(height * dpr))

  ctx.fillStyle = '#14171A'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  return ctx
}

function drawSpectra(canvas: HTMLCanvasElement, result: ComparisonResult): void {
  const ctx = prepare(canvas, 280)
  if (ctx === null) return

  const { width, height } = canvas
  const minDb = -180
  const maxDb = 0

  ctx.strokeStyle = '#2A3138'
  for (let db = minDb; db <= maxDb; db += 30) {
    const y = ((maxDb - db) / (maxDb - minDb)) * height
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  const trace = (values: Float32Array, colour: string, lineWidth: number) => {
    ctx.strokeStyle = colour
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    for (let k = 0; k < values.length; k++) {
      const value = Number.isFinite(values[k]) ? values[k] : minDb
      const clamped = value < minDb ? minDb : value > maxDb ? maxDb : value
      const x = (k / (values.length - 1)) * width
      const y = ((maxDb - clamped) / (maxDb - minDb)) * height
      if (k === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // Ours underneath in the ramp's brightest tone, theirs over it in cyan, so
  // where they agree the cyan simply covers the pale line.
  trace(result.ours, '#F5E9D0', 2.5)
  trace(result.theirs, '#5FA8B5', 1)
}

function drawDifference(canvas: HTMLCanvasElement, result: ComparisonResult): void {
  const ctx = prepare(canvas, 140)
  if (ctx === null) return

  const { width, height } = canvas
  const scale = Math.max(result.worstNearPeaksDb, 0.1) * 1.2
  const mid = height / 2

  ctx.strokeStyle = '#2A3138'
  ctx.beginPath()
  ctx.moveTo(0, mid)
  ctx.lineTo(width, mid)
  ctx.stroke()

  ctx.strokeStyle = '#5FA8B5'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let k = 0; k < result.difference.length; k++) {
    const x = (k / (result.difference.length - 1)) * width
    const y = mid - (result.difference[k] / scale) * mid
    if (k === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  ctx.fillStyle = '#8b97a3'
  ctx.font = `${11 * (window.devicePixelRatio || 1)}px monospace`
  ctx.fillText(`±${scale.toFixed(2)} dB`, 6, 14 * (window.devicePixelRatio || 1))
}
