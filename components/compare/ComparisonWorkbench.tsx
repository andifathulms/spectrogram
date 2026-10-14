'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { runComparison, type ComparisonResult } from '@/lib/audio/compare'
import { startAudioContext, audioSupport } from '@/lib/audio/context'
import { FFT_SIZES } from '@/lib/dsp/errors'
import * as fmt from '@/lib/ui/format'
import { fill } from '@/lib/ui/verdict'
import type { Copy } from '@/lib/i18n'

import { Button, Field, Segmented } from '@/components/controls/Control'
import { Readout } from '@/components/ui/Readout'
import { CANVAS } from '@/lib/ui/colors'

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

  /*
   * The verdict leads. Before a run, the same place says what will appear
   * there; after one, it is a sentence with the number in it, and the charts
   * and readouts below are the evidence for it.
   */
  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-card border border-hairline bg-plate shadow-glass">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="grid gap-3" role="status">
            <p className="eyebrow m-0">{copy.comparisonEyebrow}</p>
            {result === null ? (
              <p className="m-0 max-w-[36ch] font-display text-[clamp(1.5rem,1.2rem+1.4vw,2.25rem)] leading-tight text-inkMuted">
                {copy.comparisonPrompt}
              </p>
            ) : (
              <p className="m-0 max-w-[30ch] font-display text-[clamp(1.6rem,1.2rem+1.8vw,2.6rem)] leading-tight text-ink">
                {fill(copy.comparisonVerdict, { db: fmt.dbSize(result.worstNearPeaksDb) })}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <Field label={copy.windowSize} value={`${size} ${copy.units.samples}`}>
              <Segmented
                ariaLabel={copy.windowSize}
                value={size}
                onChange={setSize}
                options={SIZES.map((value) => ({ value, label: value }))}
              />
            </Field>
            <Button variant="primary" onClick={() => void run()} disabled={running}>
              {running ? copy.comparisonRunning : copy.runComparison}
            </Button>
          </div>
        </div>

        {status !== null && (
          <p role="alert" className="m-0 border-t border-hairline px-5 py-4 text-sm text-ink sm:px-7">
            <span className="border-l-2 border-inkFaint pl-3">{status}</span>
          </p>
        )}

        {result !== null && (
          <>
            <div className="flex flex-wrap items-center gap-5 border-y border-hairline px-4 py-2.5 text-sm">
              <span className="flex items-center gap-2 text-energyHigh">
                <span className="block h-0.5 w-5 bg-energyHigh" /> {copy.ours}
              </span>
              <span className="flex items-center gap-2 text-instrument">
                <span className="block h-px w-5 bg-instrument" /> {copy.theirs}
              </span>
            </div>
            <canvas ref={overlayRef} className="block w-full" style={{ height: 280 }} />

            <div className="border-y border-hairline px-4 py-2.5">
              <span className="control-label">{copy.difference}</span>
            </div>
            <canvas ref={deltaRef} className="tabular block w-full" style={{ height: 140 }} />

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-hairline p-5 sm:grid-cols-3 lg:grid-cols-6">
              <Readout label={copy.worstDifference} value={fmt.db(result.worstNearPeaksDb)} emphasis />
              <Readout label={copy.meanDifference} value={fmt.db(result.meanAbsDb)} />
              <Readout label={`${copy.timing}: ${copy.ours}`} value={fmt.milliseconds(result.oursMs)} />
              <Readout label={`${copy.timing}: ${copy.theirs}`} value={fmt.milliseconds(result.theirsMs)} />
              <Readout label={copy.bins} value={fmt.count(result.bins)} />
              <Readout label={copy.sampleRate} value={`${(result.fs / 1000).toFixed(3)} kHz`} />
            </div>
            <div className="border-t border-hairline px-5 py-2.5">
              <span className="tabular text-xs text-inkFaint">0 Hz → {fmt.hz(result.fs / 2)}</span>
            </div>
          </>
        )}
      </section>

      <section className="grid gap-8 pt-6 md:grid-cols-2">
        <div>
          <h2 className="display-md">{copy.comparisonHowTitle}</h2>
          <p className="body mt-3 max-w-readable">{copy.comparisonHowBody}</p>
        </div>
        <p className="m-0 max-w-readable self-start border-l-2 border-emulsion pl-4 text-[0.9375rem] leading-relaxed text-inkMuted md:mt-11">
          {copy.comparisonHonest}
        </p>
      </section>
    </div>
  )
}

function prepare(canvas: HTMLCanvasElement, height: number): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext('2d', { alpha: false })
  if (ctx === null) return null

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr))
  canvas.height = Math.max(1, Math.round(height * dpr))

  ctx.fillStyle = CANVAS.plate
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  return ctx
}

function drawSpectra(canvas: HTMLCanvasElement, result: ComparisonResult): void {
  const ctx = prepare(canvas, 280)
  if (ctx === null) return

  const { width, height } = canvas
  const minDb = -180
  const maxDb = 0

  ctx.strokeStyle = CANVAS.emulsion
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
  trace(result.ours, CANVAS.energyHigh, 2.5)
  trace(result.theirs, CANVAS.instrument, 1)
}

function drawDifference(canvas: HTMLCanvasElement, result: ComparisonResult): void {
  const ctx = prepare(canvas, 140)
  if (ctx === null) return

  const { width, height } = canvas
  const scale = Math.max(result.worstNearPeaksDb, 0.1) * 1.2
  const mid = height / 2

  ctx.strokeStyle = CANVAS.emulsion
  ctx.beginPath()
  ctx.moveTo(0, mid)
  ctx.lineTo(width, mid)
  ctx.stroke()

  ctx.strokeStyle = CANVAS.instrument
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let k = 0; k < result.difference.length; k++) {
    const x = (k / (result.difference.length - 1)) * width
    const y = mid - (result.difference[k] / scale) * mid
    if (k === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  ctx.fillStyle = CANVAS.inkMuted
  ctx.font = `${11 * (window.devicePixelRatio || 1)}px ${getComputedStyle(canvas).fontFamily || 'monospace'}`
  ctx.fillText(`±${scale.toFixed(2)} dB`, 6, 14 * (window.devicePixelRatio || 1))
}
