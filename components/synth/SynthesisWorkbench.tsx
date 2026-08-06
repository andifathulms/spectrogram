'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { apparentFrequency, isAliased, peakOf, renderPartials, type Partial } from '@/lib/dsp/additive'
import { FREQUENCY_SCALES, type FrequencyScale } from '@/lib/dsp/scales'
import { WINDOW_KINDS, type WindowKind } from '@/lib/dsp/windows'
import { createAnalysisClient, type AnalysisClient, type Inspection } from '@/lib/audio/analysis'
import { startAudioContext } from '@/lib/audio/context'
import { play, type PlaybackHandle } from '@/lib/audio/playback'
import * as fmt from '@/lib/ui/format'
import type { Copy } from '@/lib/i18n'

import { Button, Field, Segmented, Slider } from '@/components/controls/Control'
import { Disclosure } from '@/components/controls/Disclosure'
import { Readout } from '@/components/ui/Readout'
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

  return (
    <div className="space-y-5">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* What you are making. */}
        <div className="card p-5">
          <h2 className="control-label">{copy.tonesTitle}</h2>

          <div className="mt-3 space-y-3">
            {partials.map((partial, index) => {
              const aliased = isAliased(partial.frequencyHz, FS)
              return (
                <div key={index} className="rounded-card border border-hairline bg-raised/40 p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="control-label">
                      {copy.partial} {index + 1}
                    </span>
                    <button
                      type="button"
                      className="text-sm text-inkFaint hover:text-clip"
                      onClick={() => setPartials((c) => c.filter((_, i) => i !== index))}
                    >
                      {copy.removePartial}
                    </button>
                  </div>

                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
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
                    <p className="mt-2 text-sm text-clip">
                      {copy.aliasedWarning} {fmt.hz(apparentFrequency(partial.frequencyHz, FS))}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => void onPlay()}>
              {copy.play}
            </Button>
            <Button onClick={() => playbackRef.current?.stop()}>{copy.stop}</Button>
            <Button
              onClick={() =>
                setPartials((c) => [...c, { frequencyHz: 1000, amplitude: 0.2, phase: 0 }])
              }
            >
              {copy.addPartial}
            </Button>
          </div>
        </div>

        {/* What the transform makes of it. */}
        <div className="space-y-5">
          <div className="overflow-hidden rounded-card border border-hairline bg-plate">
            <div className="border-b border-hairline px-3 py-2">
              <h2 className="control-label">{copy.waveformTitle}</h2>
            </div>
            {/* No window bracket here: the window is the whole signal, so a
                bracket would just outline the entire canvas. */}
            <Waveform
              samples={signal}
              fs={FS}
              windowStartSeconds={null}
              windowSeconds={N / FS}
              gutter={0}
              height={110}
            />
          </div>

          <div className="overflow-hidden rounded-card border border-hairline bg-plate">
            <div className="border-b border-hairline px-3 py-2">
              <h2 className="control-label">{copy.spectrumTitle}</h2>
            </div>
            <SpectrumChart
              amplitude={inspection?.amplitude ?? null}
              N={N}
              fs={FS}
              scale={scale}
              expected={expected}
            />
          </div>
        </div>
      </section>

      {/*
       * The point of the page. The table is the claim — you set these tones,
       * the transform found these — so it leads, and the two scalars that
       * back it up sit beside it rather than above it.
       */}
      <section className="card p-5">
        <h2 className="display-md">{copy.roundTrip}</h2>
        <p className="body mt-2 max-w-readable">{copy.roundTripHelp}</p>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <table className="tabular w-full text-sm">
            <thead>
              <tr className="text-left text-inkFaint">
                <th className="py-1.5 font-normal">{copy.frequency}</th>
                <th className="py-1.5 font-normal">{copy.expected}</th>
                <th className="py-1.5 font-normal">{copy.recovered}</th>
              </tr>
            </thead>
            <tbody>
              {partials.map((partial, index) => (
                <tr key={index} className="border-t border-hairline text-ink">
                  <td className="py-1.5">{fmt.hz(expected[index])}</td>
                  <td className="py-1.5">{partial.amplitude.toFixed(3)}</td>
                  <td className="py-1.5 text-instrument">{(recovered[index] ?? 0).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4 self-start sm:grid-cols-3">
            <Readout
              label={copy.roundTripError}
              value={fmt.scientific(inspection?.roundTripError ?? Number.NaN)}
              emphasis
            />
            <Readout label="Parseval" value={fmt.scientific(parsevalError)} />
            <Readout label={copy.peak} value={peak.toFixed(3)} />
          </div>
        </div>

        <p className="caption mt-4 max-w-readable">{copy.recoveredNote}</p>
      </section>

      <Disclosure title={copy.advancedTitle} help={copy.advancedHelp}>
        <div className="grid gap-6 sm:grid-cols-2">
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
      </Disclosure>

      {fault !== null && <p className="border-l-2 border-clip pl-3 text-sm text-clip">{fault}</p>}
    </div>
  )
}
