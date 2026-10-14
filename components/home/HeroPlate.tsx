'use client'

import { useEffect, useMemo } from 'react'

import { SAMPLES, sampleById } from '@/data/samples'
import { MIN_PLOT_HZ, useSpectrogram, type SpectrogramSettings } from '@/lib/hooks/useSpectrogram'
import { plotPoint } from '@/lib/ui/annotations'
import { PlateCanvas } from '@/components/plate/PlateCanvas'
import { AXIS_GUTTER_PX } from '@/components/plate/FrequencyAxis'
import { RampLegend } from '@/components/plate/RampLegend'
import type { Copy } from '@/lib/i18n'

/**
 * The landing page opens on the thing itself, at full width.
 *
 * A real spectrogram of a bundled sample, computed by the same worker and the
 * same transform as the live view — not a picture. Numbered cyan markers sit
 * on the features a first-time visitor needs to read it, so the plate teaches
 * itself instead of being explained in a row of cards beside it.
 */

const FS = 48_000
const HEIGHT = 340

/** Module scope, so the identity is stable and the worker is configured once. */
const SETTINGS: SpectrogramSettings = {
  N: 1024,
  overlap: 0.75,
  window: 'hann',
  minDb: -90,
  maxDb: -10,
  scale: 'log',
}

/**
 * Where each marker points, in the sample's own terms: seconds and Hz. The
 * guitar string's fundamental is 196 Hz (data/samples); its fourth harmonic
 * is still bright early on; the eighth has all but gone by 0.6 s.
 */
const MARKS = [
  { seconds: 1.55, hz: 196 },
  { seconds: 0.45, hz: 196 * 4 },
  { seconds: 0.62, hz: 196 * 8 },
] as const

export function HeroPlate({ copy }: { copy: Copy }) {
  const sample = sampleById('senar-gitar') ?? SAMPLES[0]
  const audio = useMemo(() => sample.render(FS, sample.seconds), [sample])
  const duration = audio.length / FS

  const { bitmap, revision, analyseBuffer } = useSpectrogram(SETTINGS, FS, 'sample')

  useEffect(() => {
    analyseBuffer(audio)
  }, [audio, analyseBuffer])

  const painted = revision > 0

  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-card border border-hairline bg-plate shadow-glass">
        <div className="flex items-center justify-between gap-4 border-b border-hairline px-4 py-2.5">
          <span className="control-label">{copy.axisPitch}</span>
          <RampLegend quiet={copy.quiet} loud={copy.loud} />
        </div>

        <div className="relative">
          <PlateCanvas
            bitmap={bitmap}
            revision={revision}
            scale={SETTINGS.scale}
            minHz={MIN_PLOT_HZ}
            maxHz={FS / 2}
            durationSeconds={duration}
            N={SETTINGS.N}
            fs={FS}
            scan={null}
            scrolling={false}
            height={HEIGHT}
          />

          <div
            className="pointer-events-none absolute inset-y-0 right-0 overflow-hidden"
            style={{ left: AXIS_GUTTER_PX }}
            aria-hidden
          >
            {/*
             * The plate develops once, left to right, behind a cyan scan edge
             * — the same motion as data arriving, and the only entrance on the
             * page. It waits for the first painted bitmap, and under reduced
             * motion it completes immediately.
             */}
            <div
              className={`absolute inset-y-0 right-0 border-l border-instrument bg-plate shadow-[-6px_0_16px_-4px_theme(colors.instrument/40%)] ${
                painted ? 'animate-develop' : 'left-0'
              }`}
            />

            {MARKS.map((mark, index) => {
              const point = plotPoint(SETTINGS.scale, mark.seconds, mark.hz, duration, MIN_PLOT_HZ, FS / 2)
              return (
                <span
                  key={index}
                  className={`tabular absolute -ml-3.5 -mt-3.5 grid h-7 w-7 place-items-center rounded-full border-[1.5px] border-instrument bg-plate/70 text-xs font-medium text-instrument transition-opacity duration-500 ${
                    painted ? 'opacity-100 delay-1000' : 'opacity-0'
                  }`}
                  style={{ left: `${point.left}%`, top: `${point.top}%` }}
                >
                  {index + 1}
                </span>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end border-t border-hairline px-4 py-2.5">
          <span className="control-label">{copy.axisTime}</span>
        </div>

        <ol className="m-0 grid list-none gap-x-8 gap-y-4 border-t border-hairline p-5 sm:grid-cols-3">
          {copy.heroMarks.map((mark, index) => (
            <li key={mark.title} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3">
              <span
                className="tabular grid h-6 w-6 place-items-center rounded-full border-[1.5px] border-instrument text-[0.6875rem] font-medium text-instrument"
                aria-hidden
              >
                {index + 1}
              </span>
              <p className="m-0">
                <span className="block text-[0.9375rem] font-medium text-ink">{mark.title}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-inkFaint">{mark.body}</span>
              </p>
            </li>
          ))}
        </ol>
      </div>

      <figcaption className="mt-3 max-w-readable text-sm leading-relaxed text-inkFaint">
        {copy.heroCaption}
      </figcaption>
    </figure>
  )
}
