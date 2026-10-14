'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { apparentFrequency, isAliased, peakOf, renderPartials, type Partial } from '@/lib/dsp/additive'
import { FREQUENCY_SCALES, type FrequencyScale } from '@/lib/dsp/scales'
import { WINDOW_KINDS, type WindowKind } from '@/lib/dsp/windows'
import { createAnalysisClient, type AnalysisClient, type Inspection } from '@/lib/audio/analysis'
import { startAudioContext } from '@/lib/audio/context'
import { play, type PlaybackHandle } from '@/lib/audio/playback'
import * as fmt from '@/lib/ui/format'
import { isExact } from '@/lib/ui/verdict'
import type { Copy } from '@/lib/i18n'

import { Button, Field, Segmented, Slider } from '@/components/controls/Control'
import { Disclosure } from '@/components/controls/Disclosure'
import { Quantity } from '@/components/ui/Quantity'
import { SpectrumChart } from './SpectrumChart'
import { Waveform } from '@/components/wave/Waveform'

const N = 4096
const FS = 48_000

const INITIAL: Partial[] = [
  { frequencyHz: 220, amplitude: 0.6, phase: 0 },
  { frequencyHz: 440, amplitude: 0.3, phase: 0 },
  { frequencyHz: 660, amplitude: 0.15, phase: Math.PI / 3 },
]

export function SynthesisWorkbench({ copy }: { copy: Copy }) {
  const [partials, setPartials] = useState<Partial[]>(INITIAL)
  const [windowKind, setWindowKind] = useState<WindowKind>('blackman')
  const [scale, setScale] = useState<FrequencyScale>('log')
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [fault, setFault] = useState<string | null>(null)

  const clientRef = useRef<AnalysisClient | null>(null)
  const playbackRef = useRef<PlaybackHandle | null>(null)

  useEffect(() => {
    const client = createAnalysisClient({ onFault: setFault })
    clientRef.current = client
    return () => {
      client.terminate()
      clientRef.current = null
    }
  }, [])

  // The signal the user built. One frame, exactly N samples, so the transform
  // sees precisely what the builder describes.
  const signal = useMemo(() => {
    const out = new Float32Array(N)
    renderPartials(partials, out, FS)
    return out
  }, [partials])

  useEffect(() => {
    let live = true
    void clientRef.current?.inspect(signal, windowKind, FS).then((result) => {
      if (live) setInspection(result)
    })
    return () => {
      live = false
    }
  }, [signal, windowKind])

  useEffect(() => () => playbackRef.current?.stop(), [])

  const onPlay = useCallback(async () => {
    const context = await startAudioContext()
    playbackRef.current?.stop()

    // A single frame is 85 ms — too short to hear. Render two seconds of the
    // same signal at the context's own rate for playback only.
    const seconds = 2
    const out = new Float32Array(Math.floor(context.sampleRate * seconds))
    renderPartials(partials, out, context.sampleRate)

    const peak = peakOf(out)
    if (peak > 0) for (let n = 0; n < out.length; n++) out[n] = (out[n] / peak) * 0.7

    playbackRef.current = play(context, out, { gain: 0.9 })
  }, [partials])

  const update = useCallback((index: number, change: globalThis.Partial<Partial>) => {
    setPartials((current) =>
      current.map((partial, i) => (i === index ? { ...partial, ...change } : partial)),
    )
  }, [])

  const peak = peakOf(signal)
  const expected = partials.map((partial) => apparentFrequency(partial.frequencyHz, FS))

  /** Amplitude the transform recovered at each requested frequency. */
  const recovered = useMemo(() => {
    if (inspection === null) return []
    return partials.map((partial) => {
      const bin = Math.round((apparentFrequency(partial.frequencyHz, FS) * N) / FS)
      let best = 0
      for (let k = Math.max(0, bin - 4); k <= Math.min(inspection.amplitude.length - 1, bin + 4); k++) {
        if (inspection.amplitude[k] > best) best = inspection.amplitude[k]
      }
      return best
    })
  }, [inspection, partials])

  const parsevalError =
    inspection === null
      ? 0
      : Math.abs(inspection.spectralEnergy - inspection.timeEnergy) /
        Math.max(inspection.timeEnergy, 1e-12)

  const roundTripError = inspection?.roundTripError ?? Number.NaN

  return (
    <div className="grid gap-4">
      <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        {/*
         * What you are making: one panel of rows, not a card per tone. Each
         * tone's number reappears on the spectrum, over the peak it made.
         */}
        <div className="overflow-hidden rounded-card border border-hairline bg-plate shadow-glass">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
            <h2 className="text-[0.9375rem] font-semibold text-ink">{copy.tonesTitle}</h2>
            <Quantity value={String(partials.length)} className="text-sm text-inkMuted" />
          </div>

          <ol className="m-0 list-none p-0">
            {partials.map((partial, index) => {
              const aliased = isAliased(partial.frequencyHz, FS)
              return (
                <li
                  key={index}
                  className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 border-b border-hairline px-5 py-4 last:border-b-0"
                >
                  <span
                    className="tabular mt-0.5 grid h-6 w-6 place-items-center rounded-full border-[1.5px] border-instrument text-[0.6875rem] font-medium text-instrument"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <div className="grid min-w-0 gap-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-ink">
                        {copy.partial} {index + 1}
                      </span>
                      <button
                        type="button"
                        className="text-xs text-inkFaint underline-offset-4 hover:text-ink hover:underline"
                        onClick={() => setPartials((c) => c.filter((_, i) => i !== index))}
                      >
                        {copy.removePartial}
                      </button>
                    </div>

                    <Field label={copy.frequency} value={fmt.hz(partial.frequencyHz)}>
                      <Slider
                        min={20}
                        max={30_000}
                        step={1}
                        value={partial.frequencyHz}
                        ariaLabel={`${copy.frequency} ${index + 1}`}
                        onChange={(frequencyHz) => update(index, { frequencyHz })}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label={copy.amplitude} value={partial.amplitude.toFixed(2)}>
                        <Slider
                          min={0}
                          max={1}
                          step={0.01}
                          value={partial.amplitude}
                          ariaLabel={`${copy.amplitude} ${index + 1}`}
                          onChange={(amplitude) => update(index, { amplitude })}
                        />
                      </Field>
                      <Field label={copy.phase} value={`${(partial.phase / Math.PI).toFixed(2)} π`}>
                        <Slider
                          min={0}
                          max={Math.PI * 2}
                          step={0.01}
                          value={partial.phase}
                          ariaLabel={`${copy.phase} ${index + 1}`}
                          onChange={(phase) => update(index, { phase })}
                        />
                      </Field>
                    </div>

                    {aliased && (
                      <p className="m-0 border-l-2 border-emulsion pl-3 text-sm text-inkMuted">
                        {copy.aliasedWarning} {fmt.hz(apparentFrequency(partial.frequencyHz, FS))}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="flex flex-wrap gap-2 border-t border-hairline px-5 py-4">
            <Button variant="primary" onClick={() => void onPlay()}>
              {copy.play}
            </Button>
            <Button onClick={() => playbackRef.current?.stop()}>{copy.stop}</Button>
            <Button
              onClick={() => setPartials((c) => [...c, { frequencyHz: 1000, amplitude: 0.2, phase: 0 }])}
            >
              {copy.addPartial}
            </Button>
          </div>
        </div>

        {/* What the transform makes of it. One instrument, wave above spectrum, kept in view. */}
        <div className="overflow-hidden rounded-card border border-hairline bg-plate shadow-glass lg:sticky lg:top-20">
          <div className="border-b border-hairline px-4 py-2.5">
            <h2 className="control-label">{copy.waveformTitle}</h2>
          </div>
          {/* No window bracket here: the window is the whole signal, so a
              bracket would just outline the entire canvas. */}
          <Waveform samples={signal} fs={FS} windowStartSeconds={null} windowSeconds={N / FS} gutter={0} height={96} />

          <div className="border-y border-hairline px-4 py-2.5">
            <h2 className="control-label">{copy.spectrumTitle}</h2>
          </div>
          <SpectrumChart
            amplitude={inspection?.amplitude ?? null}
            N={N}
            fs={FS}
            scale={scale}
            expected={expected}
            height={300}
          />
          <div className="h-2" />
        </div>
      </section>

      {/*
       * The point of the page. The two checks lead as verdicts; the table —
       * you set these tones, the transform found these — backs them up.
       */}
      <section className="card grid gap-6 p-5 sm:p-6">
        <div>
          <h2 className="display-md">{copy.roundTrip}</h2>
          <p className="body mt-2 max-w-readable">{copy.roundTripHelp}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Verdict
            label={copy.roundTripError}
            value={fmt.scientific(roundTripError)}
            exact={inspection === null ? null : isExact(roundTripError)}
            copy={copy}
          />
          <Verdict
            label={copy.parsevalLabel}
            value={fmt.scientific(parsevalError)}
            exact={inspection === null ? null : isExact(parsevalError)}
            copy={copy}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[22rem] text-sm">
            <thead>
              <tr className="text-left text-xs text-inkFaint">
                <th className="py-2 pr-4 font-normal">#</th>
                <th className="py-2 pr-4 font-normal">{copy.frequency}</th>
                <th className="py-2 pr-4 font-normal">{copy.expected}</th>
                <th className="py-2 font-normal">{copy.recovered}</th>
              </tr>
            </thead>
            <tbody>
              {partials.map((partial, index) => (
                <tr key={index} className="border-t border-hairline text-ink">
                  <td className="tabular py-2 pr-4 text-instrument">{index + 1}</td>
                  <td className="py-2 pr-4">
                    <Quantity value={fmt.hz(expected[index])} />
                  </td>
                  <td className="py-2 pr-4">
                    <Quantity value={partial.amplitude.toFixed(3)} />
                  </td>
                  <td className="py-2">
                    <Quantity value={(recovered[index] ?? 0).toFixed(3)} className="text-instrument" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="caption m-0 max-w-readable">
          {copy.recoveredNote} {copy.peak}: <Quantity value={peak.toFixed(3)} className="text-inkMuted" />
        </p>
      </section>

      <details className="card group">
        <summary className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-raised/40">
          <span className="text-[0.9375rem] font-semibold text-ink">{copy.fineTune}</span>
          <span
            className="tabular text-lg leading-none text-inkFaint transition-transform group-open:rotate-45 motion-reduce:transition-none"
            aria-hidden
          >
            +
          </span>
        </summary>
        <div className="grid gap-6 border-t border-hairline p-5 sm:grid-cols-2">
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
          <Field label={copy.frequencyScale} help={copy.frequencyScaleHelp}>
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
          </Field>
        </div>
      </details>

      {fault !== null && (
        <p role="alert" className="border-l-2 border-inkFaint pl-3 text-sm text-ink">
          {fault}
        </p>
      )}
    </div>
  )
}

/**
 * A correctness figure, and in words whether it is floating-point residue.
 * `exact` is null until the first analysis arrives, so nothing is claimed
 * about a result that does not exist yet.
 */
function Verdict({
  label,
  value,
  exact,
  copy,
}: {
  label: string
  value: string
  exact: boolean | null
  copy: Copy
}) {
  return (
    <div className="grid gap-1.5 rounded-lg border border-hairline bg-void p-4" role="status">
      <span className="text-xs text-inkFaint">{label}</span>
      <Quantity value={value} className="text-lg text-ink" />
      {exact !== null && (
        <span className={`flex items-center gap-2 text-xs ${exact ? 'text-instrument' : 'text-inkMuted'}`}>
          <span className={`block h-1.5 w-1.5 rounded-full ${exact ? 'bg-instrument' : 'bg-inkFaint'}`} aria-hidden />
          {exact ? copy.verdictExact : copy.verdictOff}
        </span>
      )}
    </div>
  )
}
