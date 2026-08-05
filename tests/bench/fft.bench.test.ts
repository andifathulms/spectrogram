/**
 * Throughput and heap growth, measured from M0 — before any UI exists, because
 * a correct FFT that misses the frame budget is a rewrite discovered late.
 *
 * The reference load is PRD §10: 2048-point FFT at 75% overlap, sustained.
 * At 48 kHz that is 48000/512 ≈ 93.75 columns per second, so a frame's worth
 * of analysis must cost well under 1/60 s.
 *
 * The heap assertion matters more than the throughput one. A per-frame
 * allocation at 60fps is a GC pause, and a GC pause in an audio visualiser
 * reads as a broken app.
 */

import { describe, expect, it } from 'vitest'

import { createSpectrumAnalyser, hopFor } from '../../lib/dsp/spectrum'
import { fft } from '../../lib/dsp/fft'
import { randomReal } from '../support/signals'

const FS = 48_000
const N = 2048
const OVERLAP = 0.75
const HOP = hopFor(N, OVERLAP)
const COLUMNS_PER_SECOND = FS / HOP

declare const gc: (() => void) | undefined

function forceGc(): boolean {
  if (typeof gc === 'function') {
    gc()
    gc()
    return true
  }
  return false
}

function heapBytes(): number {
  return process.memoryUsage().heapUsed
}

describe('transform throughput', () => {
  it('sustains far more than real time at 2048 points with 75% overlap', () => {
    const analyser = createSpectrumAnalyser({ N, fs: FS, window: 'hann' })
    const source = randomReal(N, 20240501)
    const frame = source.re

    // Warm up so the JIT has settled before anything is timed.
    for (let i = 0; i < 200; i++) analyser.analyse(frame)

    const frames = 5000
    const started = process.hrtime.bigint()
    for (let i = 0; i < frames; i++) analyser.analyse(frame)
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6

    const perFrameMs = elapsedMs / frames
    const realTimeRatio = 1000 / (perFrameMs * COLUMNS_PER_SECOND)

    console.log(
      `N=${N} hop=${HOP}: ${perFrameMs.toFixed(4)} ms/column, ` +
        `${(1000 / perFrameMs).toFixed(0)} columns/s, ${realTimeRatio.toFixed(1)}x real time`,
    )

    // One column must cost less than a sixtieth of a frame budget, leaving the
    // render loop the rest of it.
    expect(perFrameMs).toBeLessThan(16.6 / 60)
    expect(realTimeRatio).toBeGreaterThan(10)
  })

  it('scales roughly as N log N, not as N squared', () => {
    const timings = new Map<number, number>()
    for (const size of [512, 4096]) {
      const re = randomReal(size, size).re
      const im = new Float64Array(size)
      const work = Float64Array.from(re)

      for (let i = 0; i < 100; i++) {
        work.set(re)
        im.fill(0)
        fft(work, im)
      }

      const iterations = 2000
      const started = process.hrtime.bigint()
      for (let i = 0; i < iterations; i++) {
        work.set(re)
        im.fill(0)
        fft(work, im)
      }
      timings.set(size, Number(process.hrtime.bigint() - started) / 1e6 / iterations)
    }

    const small = timings.get(512) as number
    const large = timings.get(4096) as number
    const ratio = large / small

    // N log N predicts 8 × (12/9) ≈ 10.7. N² would predict 64.
    console.log(`512: ${small.toFixed(5)} ms, 4096: ${large.toFixed(5)} ms, ratio ${ratio.toFixed(2)}`)
    expect(ratio).toBeLessThan(25)
  })
})

describe('heap growth stays flat over sustained frames', () => {
  it('allocates nothing per column', () => {
    if (!forceGc()) {
      throw new Error('benchmark requires --expose-gc; run via pnpm bench:fft')
    }

    const analyser = createSpectrumAnalyser({ N, fs: FS, window: 'blackman' })
    const frame = randomReal(N, 7).re

    // Tables, window coefficients and output buffers are built on first use.
    for (let i = 0; i < 1000; i++) analyser.analyse(frame)

    forceGc()
    const before = heapBytes()

    // Roughly a minute of analysis at the reference load.
    const frames = Math.round(COLUMNS_PER_SECOND * 60)
    for (let i = 0; i < frames; i++) analyser.analyse(frame)

    forceGc()
    const after = heapBytes()
    const growthBytes = after - before
    const growthPerFrame = growthBytes / frames

    console.log(
      `${frames} columns: heap ${(before / 1024).toFixed(0)} KiB → ${(after / 1024).toFixed(0)} KiB ` +
        `(${growthPerFrame.toFixed(2)} B/column)`,
    )

    // A single retained Float64Array of bins would be ~8 KiB; anything
    // per-frame would be megabytes over this many columns.
    expect(growthBytes).toBeLessThan(512 * 1024)
    expect(growthPerFrame).toBeLessThan(16)
  })

  it('the raw transform allocates nothing either', () => {
    if (!forceGc()) throw new Error('benchmark requires --expose-gc; run via pnpm bench:fft')

    const re = new Float64Array(N)
    const im = new Float64Array(N)
    const source = randomReal(N, 99).re

    for (let i = 0; i < 1000; i++) {
      re.set(source)
      im.fill(0)
      fft(re, im)
    }

    forceGc()
    const before = heapBytes()

    const frames = 20_000
    for (let i = 0; i < frames; i++) {
      re.set(source)
      im.fill(0)
      fft(re, im)
    }

    forceGc()
    const growthBytes = heapBytes() - before
    console.log(`${frames} transforms: heap growth ${(growthBytes / 1024).toFixed(1)} KiB`)
    expect(growthBytes).toBeLessThan(512 * 1024)
  })
})
