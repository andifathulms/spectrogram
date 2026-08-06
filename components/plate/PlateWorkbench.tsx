'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { SAMPLES, sampleById } from '@/data/samples'
import { FFT_SIZES } from '@/lib/dsp/errors'
import { FREQUENCY_SCALES, type FrequencyScale } from '@/lib/dsp/scales'
import { WINDOW_KINDS, type WindowKind } from '@/lib/dsp/windows'
import { hopFor } from '@/lib/dsp/spectrum'
import { startAudioContext, audioSupport } from '@/lib/audio/context'
import { startCapture, type Capture } from '@/lib/audio/capture'
import { play, type PlaybackHandle } from '@/lib/audio/playback'
import { MIN_PLOT_HZ, useSpectrogram, type SourceMode } from '@/lib/hooks/useSpectrogram'
import * as fmt from '@/lib/ui/format'
import type { Copy } from '@/lib/i18n'

import { Button, Field, Segmented, Slider } from '@/components/controls/Control'
import { Disclosure } from '@/components/controls/Disclosure'
import { Readout } from '@/components/ui/Readout'
import { PlateCanvas, type PlateCursor } from './PlateCanvas'
import { RampLegend } from './RampLegend'
import { Waveform } from '@/components/wave/Waveform'

/** Window sizes offered by the slider. Below 128 the plate stops being legible. */
const SIZES = FFT_SIZES.filter((N) => N >= 128 && N <= 8192)
const OVERLAPS = [0, 0.5, 0.75, 0.875] as const

/**
 * The tradeoff as three places to stand.
 *
 * A slider from 128 to 8192 is the honest control and it stays, one panel
 * down. But "128" and "8192" mean nothing to someone meeting this for the
 * first time, and the point of the page is not the number — it is that moving
 * in either direction costs you something. Three named positions make that
 * legible in one glance, and the numbers underneath say what each one bought.
 */
const PRESETS = [
  { key: 'sharp', N: 512 },
  { key: 'balanced', N: 2048 },
  { key: 'fine', N: 8192 },
] as const

type PresetKey = (typeof PRESETS)[number]['key'] | 'custom'

export function PlateWorkbench({ copy }: { copy: Copy }) {
  const [sizeIndex, setSizeIndex] = useState(SIZES.indexOf(2048))
  const [overlapIndex, setOverlapIndex] = useState(2)
  const [windowKind, setWindowKind] = useState<WindowKind>('hann')
  const [scale, setScale] = useState<FrequencyScale>('log')
  const [floorDb, setFloorDb] = useState(-90)
  const [mode, setMode] = useState<SourceMode>('sample')
  const [sampleId, setSampleId] = useState(SAMPLES[0].id)

  const [fs, setFs] = useState(48_000)
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
  const sampleCopy = copy.samples[sample.id]

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
    cursorTime !== null && mode === 'sample' ? cursorTime : scan !== null ? scan * duration : null

  const preset: PresetKey = PRESETS.find((entry) => entry.N === N)?.key ?? 'custom'
  const presetLabels: Record<PresetKey, string> = {
    sharp: copy.detailSharpTiming,
    balanced: copy.detailBalanced,
    fine: copy.detailFinePitch,
    custom: copy.detailCustom,
  }

  return (
    <div className="space-y-5">
      {/*
       * The source comes first. It used to sit below the plate, which meant
       * the first thing a visitor saw was a picture with no obvious way to
       * make it move.
       */}
      <section className="card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 className="control-label">{copy.soundTitle}</h2>
          {micLive && (
            <span className="flex items-center gap-2 text-sm text-instrument">
              <span
                className="block h-2 w-2 animate-pulseDot rounded-full bg-instrument"
                aria-hidden
              />
              {copy.micLive} — {copy.micNote}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {SAMPLES.map((entry) => {
            const active = mode === 'sample' && entry.id === sampleId
            return (
              <button
                key={entry.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  stopMic()
                  setMode('sample')
                  setSampleId(entry.id)
                }}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  active
                    ? 'border-instrument bg-instrument/10 text-instrument'
                    : 'border-hairline text-inkMuted hover:border-inkFaint hover:text-ink'
                }`}
              >
                {copy.samples[entry.id]?.label ?? entry.id}
              </button>
            )
          })}
        </div>

        <p className="mt-3 max-w-readable text-sm leading-relaxed text-inkMuted">
          {sampleCopy?.hint}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={playing ? stopPlayback : () => void onPlay()}>
            {playing ? copy.stop : copy.play}
          </Button>
          <Button onClick={() => void onMic()}>{micLive ? copy.micStop : copy.micStart}</Button>
        </div>

        {micStatus !== null && (
          <p className="mt-4 max-w-readable border-l-2 border-clip pl-3 text-sm leading-relaxed text-inkMuted">
            {micStatus}
          </p>
        )}
        {spectrogram.fault !== null && (
          <p className="mt-4 max-w-readable border-l-2 border-clip pl-3 text-sm text-clip">
            {spectrogram.fault}
          </p>
        )}
      </section>

      {/* The instrument itself. */}
      <section className="overflow-hidden rounded-card border border-hairline bg-plate">
        {/* The wave first, with the analysed slice bracketed on it, then the
            picture that slice becomes. Each gets its own label: unlabelled,
            the waveform reads as part of the plate. */}
        <div className="border-b border-hairline px-3 py-2">
          <span className="control-label">{copy.waveTitle}</span>
        </div>

        <Waveform
          samples={mode === 'sample' ? audio : null}
          fs={fs}
          windowStartSeconds={bracketAt}
          windowSeconds={N / fs}
        />

        <div className="flex items-center justify-between gap-4 border-y border-hairline px-3 py-2">
          <span className="control-label">{copy.axisPitch}</span>
          <RampLegend quiet={copy.quiet} loud={copy.loud} />
        </div>

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

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-hairline px-3 py-2">
          <span className="tabular text-xs text-inkFaint">
            {mode === 'sample'
              ? `0 ${copy.units.s} → ${duration.toFixed(2)} ${copy.units.s}`
              : `−${duration.toFixed(1)} ${copy.units.s} → 0 ${copy.units.s}`}
          </span>
          <span className="control-label">{copy.axisTime}</span>
        </div>
      </section>

      {/* What the cursor is over. Three numbers, not six. */}
      <section className="card p-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
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
        </div>

        {spectrogram.clipped && (
          <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-clip">
            <span className="rounded-full border border-clip px-2 py-0.5 text-xs uppercase tracking-wider">
              {copy.clipping}
            </span>
            {copy.clippingHelp}
          </p>
        )}
      </section>

      {/* The lesson, as a control. */}
      <section className="card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 className="display-md">{copy.detailTitle}</h2>
          <span className="tabular text-sm text-instrument">
            {presetLabels[preset]} · {N} {copy.units.samples}
          </span>
        </div>
        <p className="body mt-2 max-w-readable">{copy.detailHelp}</p>

        <div className="mt-4">
          <Segmented
            ariaLabel={copy.detailTitle}
            value={preset}
            onChange={(key) => {
              const chosen = PRESETS.find((entry) => entry.key === key)
              if (chosen !== undefined) setSizeIndex(SIZES.indexOf(chosen.N))
            }}
            options={[
              ...PRESETS.map((entry) => ({ value: entry.key, label: presetLabels[entry.key] })),
              // Reachable only through the slider; shown so the state is never a lie.
              ...(preset === 'custom'
                ? [{ value: 'custom' as PresetKey, label: copy.detailCustom }]
                : []),
            ]}
          />
        </div>

        <div className="mt-5">
          <Slider
            min={0}
            max={SIZES.length - 1}
            value={sizeIndex}
            onChange={setSizeIndex}
            ariaLabel={copy.windowSize}
            ticks={[copy.detailSharpTiming, copy.detailFinePitch]}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Readout label={copy.detailTimingNote} value={fmt.seconds(N / fs)} />
          <Readout label={copy.detailPitchNote} value={fmt.hz(fs / N)} />
        </div>
      </section>

      {/* How the picture is laid out — a preference, not a measurement. */}
      <section className="card p-5">
        <h2 className="control-label">{copy.viewTitle}</h2>
        <div className="mt-3">
          <Segmented
            ariaLabel={copy.frequencyScale}
            value={scale}
            onChange={setScale}
            options={FREQUENCY_SCALES.map((value) => ({
              value,
              label: copy.scaleLabels[value],
              title: value,
            }))}
          />
        </div>
        <p className="body mt-3 max-w-readable">{copy.frequencyScaleHelp}</p>
      </section>

      <Disclosure title={copy.advancedTitle} help={copy.advancedHelp}>
        <div className="grid gap-6 lg:grid-cols-3">
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

          <Field
            label={copy.dynamicRange}
            help={copy.dynamicRangeHelp}
            value={`${floorDb} ${copy.units.db} → −10 ${copy.units.db}`}
          >
            <Slider
              min={-120}
              max={-40}
              step={5}
              value={floorDb}
              onChange={setFloorDb}
              ariaLabel={copy.dynamicRange}
            />
          </Field>

          <Field label={copy.windowFunction} help={copy.windowFunctionHelp}>
            <Segmented
              ariaLabel={copy.windowFunction}
              value={windowKind}
              onChange={setWindowKind}
              options={WINDOW_KINDS.map((kind) => ({
                value: kind,
                label: kind,
                title: copy.windowLabels[kind],
              }))}
            />
            <p className="mt-2 text-sm text-inkMuted">{copy.windowLabels[windowKind]}</p>
          </Field>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 self-start lg:col-span-2">
            <Readout label={copy.sampleRate} value={`${(fs / 1000).toFixed(3)} kHz`} />
            <Readout label={copy.nyquist} value={fmt.hz(nyquist)} />
            <Readout label={copy.bins} value={fmt.count(info?.bins ?? N / 2 + 1)} />
            <Readout label={copy.columns} value={fmt.count(spectrogram.columns)} />
          </div>
        </div>
      </Disclosure>
    </div>
  )
}
