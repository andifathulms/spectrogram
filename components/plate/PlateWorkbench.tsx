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
import { blurBars } from '@/lib/ui/annotations'
import { THUMBNAIL } from '@/lib/render/thumbnailSpec'
import { asset } from '@/lib/routes'
import type { Copy } from '@/lib/i18n'

import { Button, Field, Segmented, Slider } from '@/components/controls/Control'
import { Quantity } from '@/components/ui/Quantity'
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
  // At rest it sits near the start, so the window's width — what Detail
  // changes — is always on screen, not only while something moves.
  const bracketAt =
    cursorTime !== null && mode === 'sample'
      ? cursorTime
      : scan !== null
        ? scan * duration
        : mode === 'sample'
          ? duration * 0.12
          : null

  const preset: PresetKey = PRESETS.find((entry) => entry.N === N)?.key ?? 'custom'
  const presetLabels: Record<PresetKey, string> = {
    sharp: copy.detailSharpTiming,
    balanced: copy.detailBalanced,
    fine: copy.detailFinePitch,
    custom: copy.detailCustom,
  }

  const blur = blurBars(N, SIZES[0], SIZES[SIZES.length - 1])

  /*
   * One instrument and a rail beside it. The waveform and the plate are fused
   * so the window bracket sits directly above the columns it produces, and
   * Detail sits next to the plate, so dragging it and watching the picture
   * change happen in one glance. On a phone the order is source, instrument,
   * Detail, fine-tune — the way a first visit runs.
   */
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
      {/* The source comes first: a picture with no way to make it move is a dead end. */}
      <section className="card grid gap-4 p-5 lg:col-start-2 lg:row-start-1" aria-labelledby="sound-title">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="sound-title" className="text-[0.9375rem] font-semibold text-ink">
            {copy.soundTitle}
          </h2>
          {micLive && (
            <span className="flex items-center gap-2 text-sm text-instrument">
              <span className="block h-2 w-2 animate-pulseDot rounded-full bg-instrument" aria-hidden />
              {copy.micLive}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
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
                className={`group grid overflow-hidden rounded-lg border bg-void text-left transition-colors [&:last-child:nth-child(odd)]:col-span-2 ${
                  active ? 'border-instrument/60' : 'border-hairline hover:border-emulsion'
                }`}
              >
                {/* Rendered by lib/dsp at build time — see tests/render/thumbnails.test.ts. */}
                {/* eslint-disable-next-line @next/next/no-img-element -- a static export has no image optimiser; the file is already sized */}
                <img
                  src={asset(`thumbs/${entry.id}.png`)}
                  width={THUMBNAIL.width}
                  height={THUMBNAIL.height}
                  alt=""
                  className={`block h-10 w-full object-fill transition-opacity ${
                    active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                  }`}
                />
                <span className={`px-2.5 py-2 text-xs font-medium leading-tight ${active ? 'text-ink' : 'text-inkMuted'}`}>
                  {copy.samples[entry.id]?.label ?? entry.id}
                </span>
              </button>
            )
          })}
        </div>

        <p className="m-0 text-sm leading-relaxed text-inkMuted">
          {micLive ? copy.micNote : sampleCopy?.hint}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={playing ? stopPlayback : () => void onPlay()}>
            {playing ? copy.stop : copy.play}
          </Button>
          <Button onClick={() => void onMic()}>{micLive ? copy.micStop : copy.micStart}</Button>
        </div>

        {micStatus !== null && (
          <p role="status" className="m-0 border-l-2 border-inkFaint pl-3 text-sm leading-relaxed text-inkMuted">
            {micStatus}
          </p>
        )}
        {spectrogram.fault !== null && (
          <p role="alert" className="m-0 border-l-2 border-inkFaint pl-3 text-sm text-ink">
            {spectrogram.fault}
          </p>
        )}
      </section>

      {/* The instrument: the wave, its analysed slice bracketed, and the picture that slice becomes. */}
      <section
        className="overflow-hidden rounded-card border border-hairline bg-plate shadow-glass lg:sticky lg:top-20 lg:col-start-1 lg:row-span-3 lg:row-start-1"
        aria-label={copy.listenTitle}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-3 py-2.5">
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
          <RampLegend quiet={copy.quiet} loud={copy.loud} />
        </div>

        <Waveform
          samples={mode === 'sample' ? audio : null}
          fs={fs}
          windowStartSeconds={bracketAt}
          windowSeconds={N / fs}
          height={80}
        />

        <div className="flex items-center border-y border-hairline px-3 py-1.5">
          <span className="control-label">{copy.axisPitch}</span>
        </div>

        <div className="relative">
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
            height={420}
          />

          {/* What the cursor is over, on the plate itself. Annotation layer: cyan. */}
          <div
            className="pointer-events-none absolute right-3 top-3 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 rounded-lg border border-instrument/50 bg-void/80 px-3 py-2 text-xs backdrop-blur"
            aria-live="off"
          >
            {cursor === null ? (
              <span className="col-span-2 text-inkMuted">{copy.hoverHint}</span>
            ) : (
              <>
                <span className="text-inkFaint">{copy.time}</span>
                <Quantity value={cursorTime === null ? '—' : fmt.seconds(cursorTime)} className="text-right text-instrument" />
                <span className="text-inkFaint">{copy.frequency}</span>
                <Quantity value={fmt.hz(cursor.frequencyHz)} className="text-right text-instrument" />
                <span className="text-inkFaint">{copy.bin}</span>
                <Quantity value={fmt.count(cursor.bin)} className="text-right text-instrument" />
                <span className="text-inkFaint">{copy.magnitude}</span>
                <Quantity value={cursorDb === null ? '—' : fmt.db(cursorDb)} className="text-right text-instrument" />
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-hairline px-3 py-2">
          <span className="tabular text-xs text-inkFaint">
            {mode === 'sample'
              ? `0 ${copy.units.s} → ${duration.toFixed(2)} ${copy.units.s}`
              : `−${duration.toFixed(1)} ${copy.units.s} → 0 ${copy.units.s}`}
          </span>
          {spectrogram.clipped && (
            <span role="status" className="flex items-center gap-2 text-xs text-ink">
              <span className="flex items-center gap-1.5 rounded-full border border-clip px-2 py-0.5 font-medium">
                <span className="block h-1.5 w-1.5 rounded-full bg-clip" aria-hidden />
                {copy.clipping}
              </span>
              <span className="hidden sm:inline">{copy.clippingHelp}</span>
            </span>
          )}
          <span className="control-label">{copy.axisTime}</span>
        </div>
      </section>

      {/* The lesson, as a control, beside the picture it changes. */}
      <section className="card grid gap-4 p-5 lg:col-start-2 lg:row-start-2" aria-labelledby="detail-title">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="detail-title" className="display-md">
            {copy.detailTitle}
          </h2>
          <Quantity value={`${N} ${copy.units.samples}`} className="text-sm text-instrument" />
        </div>

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
            ...(preset === 'custom' ? [{ value: 'custom' as PresetKey, label: copy.detailCustom }] : []),
          ]}
        />

        <Field label={copy.windowSize} help={copy.detailHelp}>
          <Slider
            min={0}
            max={SIZES.length - 1}
            value={sizeIndex}
            onChange={setSizeIndex}
            ariaLabel={copy.windowSize}
            ticks={[copy.detailSharpTiming, copy.detailFinePitch]}
          />
        </Field>

        {/* The tradeoff in two bars: as one shrinks, the other grows. */}
        <div className="grid gap-3">
          <BlurBar label={copy.timingBlur} value={fmt.seconds(N / fs)} fraction={blur.timing} />
          <BlurBar label={copy.pitchBlur} value={fmt.hz(fs / N)} fraction={blur.pitch} />
          <p className="m-0 text-xs leading-relaxed text-inkFaint">{copy.blurNote}</p>
        </div>
      </section>

      <details className="card group lg:col-start-2 lg:row-start-3">
        <summary className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-raised/40">
          <span className="text-[0.9375rem] font-semibold text-ink">{copy.fineTune}</span>
          <span
            className="tabular text-lg leading-none text-inkFaint transition-transform group-open:rotate-45 motion-reduce:transition-none"
            aria-hidden
          >
            +
          </span>
        </summary>
        <div className="grid gap-6 border-t border-hairline p-5">
          <p className="m-0 text-sm leading-relaxed text-inkFaint">{copy.advancedHelp}</p>

          <Field label={copy.overlap} help={copy.overlapHelp} value={fmt.ratio(overlap)}>
            <Slider
              min={0}
              max={OVERLAPS.length - 1}
              value={overlapIndex}
              onChange={setOverlapIndex}
              ariaLabel={copy.overlap}
              ticks={['0 %', '87 %']}
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

          <p className="m-0 text-sm leading-relaxed text-inkFaint">{copy.frequencyScaleHelp}</p>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <Readout label={copy.binSpacing} value={fmt.hz(fs / N)} />
            <Readout label={copy.windowDuration} value={fmt.seconds(N / fs)} />
            <Readout label={copy.hopDuration} value={fmt.seconds(hop / fs)} />
            <Readout label={copy.sampleRate} value={`${(fs / 1000).toFixed(3)} kHz`} />
            <Readout label={copy.nyquist} value={fmt.hz(nyquist)} />
            <Readout label={copy.bins} value={fmt.count(info?.bins ?? N / 2 + 1)} />
            <Readout label={copy.columns} value={fmt.count(spectrogram.columns)} />
          </div>
        </div>
      </details>
    </div>
  )
}

function BlurBar({ label, value, fraction }: { label: string; value: string; fraction: number }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-[0.8125rem] text-inkMuted">
        <span>{label}</span>
        <Quantity value={value} className="text-ink" />
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-emulsion" aria-hidden>
        <div className="h-full rounded-full bg-instrument" style={{ width: `${fraction * 100}%` }} />
      </div>
    </div>
  )
}
