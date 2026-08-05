'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { apparentFrequency, isAliased, peakOf, renderPartials, type Partial } from '@/lib/dsp/additive'
import { FREQUENCY_SCALES, SCALE_LABELS, type FrequencyScale } from '@/lib/dsp/scales'
import { WINDOW_KINDS, WINDOW_LABELS, type WindowKind } from '@/lib/dsp/windows'
import { createAnalysisClient, type AnalysisClient, type Inspection } from '@/lib/audio/analysis'
import { startAudioContext } from '@/lib/audio/context'
import { play, type PlaybackHandle } from '@/lib/audio/playback'
import * as fmt from '@/lib/ui/format'
import type { Copy } from '@/lib/i18n'

import { Button, Field, Segmented, Slider } from '@/components/controls/Control'
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
    <div className="space-y-8">
      <section className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          {partials.map((partial, index) => {
            const aliased = isAliased(partial.frequencyHz, FS)
            return (
              <div key={index} className="rounded-sm border border-emulsion p-3">
                <div className="flex items-baseline justify-between">
                  <span className="control-label">
                    {copy.partial} {index + 1}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-[#6f7c88] hover:text-clip"
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
                  <p className="tabular mt-2 text-xs text-clip">
                    &gt; Nyquist — aliasing to {fmt.hz(apparentFrequency(partial.frequencyHz, FS))}
                  </p>
                )}
              </div>
            )
          })}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() =>
                setPartials((c) => [...c, { frequencyHz: 1000, amplitude: 0.2, phase: 0 }])
              }
            >
              {copy.addPartial}
            </Button>
            <Button variant="primary" onClick={() => void onPlay()}>
              {copy.play}
            </Button>
            <Button onClick={() => playbackRef.current?.stop()}>{copy.stop}</Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="control-label">{copy.waveformTitle}</h2>
            <div className="mt-2">
              <Waveform
                samples={signal}
                fs={FS}
                windowStartSeconds={0}
                windowSeconds={N / FS}
                gutter={0}
                height={110}
              />
            </div>
          </div>

          <div>
            <h2 className="control-label">{copy.spectrumTitle}</h2>
            <div className="mt-2">
              <SpectrumChart
                amplitude={inspection?.amplitude ?? null}
                N={N}
                fs={FS}
                scale={scale}
                expected={expected}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 border-t border-emulsion pt-6 lg:grid-cols-2">
        <div className="space-y-4">
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
          </Field>
          <Field label={copy.frequencyScale}>
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
          </Field>
        </div>

        <div>
          <h2 className="control-label">{copy.roundTrip}</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#6f7c88]">{copy.roundTripHelp}</p>

          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            <Readout
              label={copy.roundTripError}
              value={fmt.scientific(inspection?.roundTripError ?? Number.NaN)}
              emphasis
            />
            <Readout label="Parseval" value={fmt.scientific(parsevalError)} />
            <Readout label={copy.peak} value={peak.toFixed(3)} />
          </div>

          <table className="tabular mt-4 w-full text-xs">
            <thead>
              <tr className="text-left text-[#6f7c88]">
                <th className="py-1 font-normal">{copy.frequency}</th>
                <th className="py-1 font-normal">{copy.expected}</th>
                <th className="py-1 font-normal">{copy.recovered}</th>
              </tr>
            </thead>
            <tbody>
              {partials.map((partial, index) => (
                <tr key={index} className="border-t border-emulsion text-energyHigh">
                  <td className="py-1">{fmt.hz(expected[index])}</td>
                  <td className="py-1">{partial.amplitude.toFixed(3)}</td>
                  <td className="py-1 text-instrument">{(recovered[index] ?? 0).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {fault !== null && (
        <p className="border-l-2 border-clip pl-3 text-xs text-clip">{fault}</p>
      )}
    </div>
  )
}
