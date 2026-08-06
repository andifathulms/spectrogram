'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { SAMPLES, sampleById } from '@/data/samples'
import { FFT_SIZES } from '@/lib/dsp/errors'
import { FREQUENCY_SCALES, SCALE_LABELS, type FrequencyScale } from '@/lib/dsp/scales'
import { WINDOW_KINDS, WINDOW_LABELS, type WindowKind } from '@/lib/dsp/windows'
import { hopFor } from '@/lib/dsp/spectrum'
import { startAudioContext, audioSupport, currentSampleRate } from '@/lib/audio/context'
import { startCapture, type Capture } from '@/lib/audio/capture'
import { play, type PlaybackHandle } from '@/lib/audio/playback'
import { MIN_PLOT_HZ, useSpectrogram, type SourceMode } from '@/lib/hooks/useSpectrogram'
import * as fmt from '@/lib/ui/format'
import type { Copy } from '@/lib/i18n'

import { Button, Field, Segmented, Slider } from '@/components/controls/Control'
import { Readout, ReadoutRow } from '@/components/ui/Readout'
import { PlateCanvas, type PlateCursor } from './PlateCanvas'
import { RampLegend } from './RampLegend'
import { Waveform } from '@/components/wave/Waveform'

/** Window sizes offered by the slider. Below 128 the plate stops being legible. */
const SIZES = FFT_SIZES.filter((N) => N >= 128 && N <= 8192)
const OVERLAPS = [0, 0.5, 0.75, 0.875] as const

export function PlateWorkbench({ copy }: { copy: Copy }) {
  const [sizeIndex, setSizeIndex] = useState(SIZES.indexOf(2048))
  const [overlapIndex, setOverlapIndex] = useState(2)
  const [windowKind, setWindowKind] = useState<WindowKind>('hann')
  const [scale, setScale] = useState<FrequencyScale>('log')
  const [floorDb, setFloorDb] = useState(-90)
  const [mode, setMode] = useState<SourceMode>('sample')
  const [sampleId, setSampleId] = useState(SAMPLES[0].id)

  const [fs, setFs] = useState(48_000)
  const [audioReady, setAudioReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [scan, setScan] = useState<number | null>(null)
  const [cursor, setCursor] = useState<PlateCursor | null>(null)
  const [micStatus, setMicStatus] = useState<string | null>(null)
  const [micLive, setMicLive] = useState(false)

  const playbackRef = useRef<PlaybackHandle | null>(null)
  const captureRef = useRef<Capture | null>(null)
  const frameRef = useRef<number | null>(null)

  const N = SIZES[sizeIndex]
  const overlap = OVERLAPS[overlapIndex]

  const settings = useMemo(
    () => ({ N, overlap, window: windowKind, minDb: floorDb, maxDb: -10, scale }),
    [N, overlap, windowKind, floorDb, scale],
  )

  const spectrogram = useSpectrogram(settings, fs, mode)
  const { analyseBuffer, pushSamples, reset, info } = spectrogram

  const sample = sampleById(sampleId) ?? SAMPLES[0]

  // The sample is regenerated whenever the sample rate changes, so what is
  // analysed and what is played are always the same audio.
  const audio = useMemo(() => sample.render(fs, sample.seconds), [sample, fs])

  useEffect(() => {
    if (mode !== 'sample') return
    analyseBuffer(audio)
  }, [audio, analyseBuffer, mode])

  const stopPlayback = useCallback(() => {
    playbackRef.current?.stop()
    playbackRef.current = null
    setPlaying(false)
    setScan(null)
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
  }, [])

  const stopMic = useCallback(() => {
    captureRef.current?.stop()
    captureRef.current = null
    setMicLive(false)
  }, [])

  useEffect(() => stopPlayback, [stopPlayback])
  useEffect(() => stopMic, [stopMic])

  const enableAudio = useCallback(async () => {
    const support = audioSupport()
    if (support.type === 'unsupported') {
      setMicStatus(support.reason)
      return null
    }
    const context = await startAudioContext()
    setFs(context.sampleRate)
    setAudioReady(true)
    return context
  }, [])

  const onPlay = useCallback(async () => {
    const context = (await enableAudio()) ?? null
    if (context === null) return

    stopPlayback()
    const handle = play(context, sample.render(context.sampleRate, sample.seconds))
    playbackRef.current = handle
    setPlaying(true)

    const tick = () => {
      const current = playbackRef.current
      if (current === null) return
      const t = current.elapsed()
      setScan(Math.min(1, t / current.duration))
      if (t >= current.duration) {
        stopPlayback()
        return
      }
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
  }, [enableAudio, sample, stopPlayback])

  const onMic = useCallback(async () => {
    if (micLive) {
      stopMic()
      setMode('sample')
      return
    }

    const context = (await enableAudio()) ?? null
    if (context === null) return

    stopPlayback()
    setMode('mic')
    reset()

    const result = await startCapture({
      context,
      onSamples: (samples) => pushSamples(samples),
    })

    switch (result.type) {
      case 'started':
        captureRef.current = result.capture
        setMicLive(true)
        setMicStatus(null)
        return
      case 'denied':
        setMicStatus(copy.micDenied)
        setMode('sample')
        return
      case 'no-device':
        setMicStatus(copy.micNoDevice)
        setMode('sample')
        return
      case 'unsupported':
        setMicStatus(copy.micUnsupported)
        setMode('sample')
        return
      case 'failed':
        setMicStatus(result.message)
        setMode('sample')
        return
      default: {
        const never: never = result
        setMicStatus(String(never))
      }
    }
  }, [copy, enableAudio, micLive, pushSamples, reset, stopMic, stopPlayback])

  const nyquist = fs / 2
  const hop = hopFor(N, overlap)
  const duration = mode === 'sample' ? audio.length / fs : (info?.hopSeconds ?? 0) * 1024

  const cursorDb = cursor === null ? null : spectrogram.dbAt(cursor.x, cursor.bin)
  const cursorTime = cursor === null ? null : spectrogram.timeAt(cursor.x)

  // The bracket follows the cursor when hovering, the scan edge otherwise —
  // so the waveform and the plate stay tied together either way.
  const bracketAt =
    cursorTime !== null && mode === 'sample'
      ? cursorTime
      : scan !== null
        ? scan * duration
        : null

  return (
    <div className="space-y-6">
      <section>
        <Waveform
          samples={mode === 'sample' ? audio : null}
          fs={fs}
          windowStartSeconds={bracketAt}
          windowSeconds={N / fs}
        />
        <PlateCanvas
          bitmap={spectrogram.bitmap}
          revision={spectrogram.revision}
          scale={scale}
          minHz={scale === 'linear' ? 0 : MIN_PLOT_HZ}
          maxHz={nyquist}
          durationSeconds={duration}
          N={N}
          fs={fs}
          scan={mode === 'sample' ? scan : null}
          scrolling={mode === 'mic'}
          onCursor={setCursor}
        />
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-emulsion px-[68px] py-2">
          <span className="tabular text-[10px] text-inkFaint">
            {mode === 'sample'
              ? `0 ${copy.units.s} → ${duration.toFixed(2)} ${copy.units.s}`
              : `−${duration.toFixed(1)} ${copy.units.s} → 0 ${copy.units.s}`}
          </span>
          <RampLegend />
        </div>
      </section>

      <section className="rounded-sm border border-emulsion p-4">
        <ReadoutRow>
          <Readout
            label={copy.time}
            value={cursorTime === null ? copy.hoverHint : fmt.seconds(cursorTime)}
            emphasis={cursorTime !== null}
          />
          <Readout
            label={copy.frequency}
            value={cursor === null ? '—' : fmt.hz(cursor.frequencyHz)}
            emphasis={cursor !== null}
          />
          <Readout
            label={copy.magnitude}
            value={cursorDb === null ? '—' : fmt.db(cursorDb)}
            emphasis={cursorDb !== null}
          />
          <Readout label={copy.bin} value={cursor === null ? '—' : fmt.count(Math.round(cursor.bin))} />
          <Readout label={copy.peak} value={fmt.db(20 * Math.log10(Math.max(spectrogram.peak, 1e-6)))} />
          <div>
            <div className="control-label">{copy.clipping}</div>
            <div
              className={`tabular mt-0.5 text-sm ${spectrogram.clipped ? 'text-clip' : 'text-inkFaint'}`}
            >
              {spectrogram.clipped ? copy.clipping : '—'}
            </div>
          </div>
        </ReadoutRow>
      </section>

      <section className="grid gap-6 lg:grid-cols-4">
        <Field
          label={copy.windowSize}
          help={copy.windowSizeHelp}
          value={`${N} ${copy.units.samples}`}
        >
          <Slider
            min={0}
            max={SIZES.length - 1}
            value={sizeIndex}
            onChange={setSizeIndex}
            ariaLabel={copy.windowSize}
            ticks={[String(SIZES[0]), String(SIZES[SIZES.length - 1])]}
          />
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            <Readout label={copy.binSpacing} value={fmt.hz(fs / N)} />
            <Readout label={copy.windowDuration} value={fmt.seconds(N / fs)} />
          </div>
        </Field>

        <Field label={copy.overlap} help={copy.overlapHelp} value={fmt.ratio(overlap)}>
          <Slider
            min={0}
            max={OVERLAPS.length - 1}
            value={overlapIndex}
            onChange={setOverlapIndex}
            ariaLabel={copy.overlap}
            ticks={['0 %', '87 %']}
          />
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            <Readout label={copy.hopDuration} value={fmt.seconds(hop / fs)} />
            <Readout label={copy.bins} value={fmt.count(N / 2 + 1)} />
          </div>
        </Field>

        <Field label={copy.windowFunction} help={copy.windowFunctionHelp}>
          <Segmented
            ariaLabel={copy.windowFunction}
            value={windowKind}
            onChange={setWindowKind}
            options={WINDOW_KINDS.map((kind) => ({
              value: kind,
              label: kind,
              title: WINDOW_LABELS[kind],
            }))}
          />
          <p className="mt-2 text-xs text-inkMuted">{WINDOW_LABELS[windowKind]}</p>
        </Field>

        <Field label={copy.frequencyScale} help={copy.frequencyScaleHelp}>
          <Segmented
            ariaLabel={copy.frequencyScale}
            value={scale}
            onChange={setScale}
            options={FREQUENCY_SCALES.map((value) => ({
              value,
              label: value,
              title: SCALE_LABELS[value],
            }))}
          />
          <div className="mt-3">
            <Field label={copy.dynamicRange} value={`${floorDb} ${copy.units.db} → −10 ${copy.units.db}`}>
              <Slider
                min={-120}
                max={-40}
                step={5}
                value={floorDb}
                onChange={setFloorDb}
                ariaLabel={copy.dynamicRange}
              />
            </Field>
          </div>
        </Field>
      </section>

      <section className="grid gap-6 border-t border-emulsion pt-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="control-label">{copy.source}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SAMPLES.map((entry) => (
              <button
                key={entry.id}
                type="button"
                title={entry.hint}
                onClick={() => {
                  stopMic()
                  setMode('sample')
                  setSampleId(entry.id)
                }}
                className={`border px-2.5 py-1 text-xs ${
                  mode === 'sample' && entry.id === sampleId
                    ? 'border-instrument text-instrument'
                    : 'border-emulsion text-inkMuted hover:text-energyHigh'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-inkMuted">{sample.hint}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!audioReady && (
              <Button variant="primary" onClick={() => void enableAudio()}>
                {copy.startAudio}
              </Button>
            )}
            <Button onClick={playing ? stopPlayback : () => void onPlay()}>
              {playing ? copy.stop : copy.play}
            </Button>
            <Button onClick={() => void onMic()} variant={micLive ? 'default' : 'primary'}>
              {micLive ? copy.micStop : copy.micStart}
            </Button>
            {micLive && (
              <span className="tabular text-xs text-instrument">
                ● {copy.micLive} — {copy.micNote}
              </span>
            )}
          </div>

          {micStatus !== null && (
            <p className="mt-3 max-w-2xl border-l-2 border-clip pl-3 text-xs leading-relaxed text-inkMuted">
              {micStatus}
            </p>
          )}
          {spectrogram.fault !== null && (
            <p className="mt-3 max-w-2xl border-l-2 border-clip pl-3 text-xs text-clip">
              {spectrogram.fault}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 self-start">
          <Readout label={copy.sampleRate} value={`${(fs / 1000).toFixed(3)} kHz`} />
          <Readout label={copy.nyquist} value={fmt.hz(nyquist)} />
          <Readout label={copy.bins} value={fmt.count(info?.bins ?? N / 2 + 1)} />
          <Readout label="columns" value={fmt.count(spectrogram.columns)} />
        </div>
      </section>
    </div>
  )
}
