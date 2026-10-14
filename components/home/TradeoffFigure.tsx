'use client'

import { useEffect, useMemo } from 'react'

import { SAMPLES, sampleById } from '@/data/samples'
import { MIN_PLOT_HZ, useSpectrogram, type SpectrogramSettings } from '@/lib/hooks/useSpectrogram'
import { HANN_PATH, windowFraction } from '@/lib/ui/annotations'
import * as fmt from '@/lib/ui/format'
import type { Copy } from '@/lib/i18n'

import { PlateCanvas } from '@/components/plate/PlateCanvas'
import { AXIS_GUTTER_PX } from '@/components/plate/FrequencyAxis'
import { Quantity } from '@/components/ui/Quantity'

/**
 * The tradeoff as a comparison rather than a control (DESIGN-REWORK §3–4).
 *
 * The same sample at the three Detail presets the Listen page offers, all
 * visible at once, each with its analysis window drawn above it at the same
 * time scale. Computed once, offline, by the same worker and transform as
 * every other plate; never animated, because it is a still comparison.
 */

const FS = 48_000
const HEIGHT = 150

type RowKey = 'sharp' | 'balanced' | 'fine'

const ROWS: readonly { key: RowKey; settings: SpectrogramSettings }[] = (
  [
    ['sharp', 512],
    ['balanced', 2048],
    ['fine', 8192],
  ] as const
).map(([key, N]) => ({
  key,
  settings: { N, overlap: 0.875, window: 'hann', minDb: -90, maxDb: -10, scale: 'log' },
}))

export function TradeoffFigure({ copy }: { copy: Copy }) {
  const sample = sampleById('nada-dan-klik') ?? SAMPLES[0]
  const audio = useMemo(() => sample.render(FS, sample.seconds), [sample])

  const names: Record<RowKey, string> = {
    sharp: copy.detailSharpTiming,
    balanced: copy.detailBalanced,
    fine: copy.detailFinePitch,
  }

  return (
    <figure className="m-0 grid gap-5">
      {ROWS.map((row) => (
        <TradeoffRow
          key={row.key}
          name={names[row.key]}
          sentence={copy.tradeoffRows[row.key]}
          settings={row.settings}
          audio={audio}
          copy={copy}
        />
      ))}
    </figure>
  )
}

function TradeoffRow({
  name,
  sentence,
  settings,
  audio,
  copy,
}: {
  name: string
  sentence: string
  settings: SpectrogramSettings
  audio: Float32Array
  copy: Copy
}) {
  const { bitmap, revision, analyseBuffer } = useSpectrogram(settings, FS, 'sample')
  const duration = audio.length / FS
  const { N } = settings
  const width = windowFraction(N, FS, duration) * 100

  useEffect(() => {
    analyseBuffer(audio)
  }, [audio, analyseBuffer])

  return (
    <div className="grid gap-3 md:grid-cols-[13.5rem_minmax(0,1fr)] md:gap-6">
      <div className="grid content-center gap-1.5">
        <h3 className="display-md">{name}</h3>
        <div className="grid gap-0.5 text-sm text-inkMuted">
          <Quantity value={`${N} ${copy.units.samples}`} />
          <span>
            <Quantity value={fmt.seconds(N / FS)} /> {copy.tradeoffWindow} ·{' '}
            <Quantity value={fmt.hz(FS / N)} /> {copy.tradeoffBin}
          </span>
        </div>
        <p className="m-0 mt-1 text-sm leading-relaxed text-inkFaint">{sentence}</p>
      </div>

      <div className="overflow-hidden rounded-card border border-hairline bg-plate shadow-glass">
        <div className="flex h-6 border-b border-hairline" aria-hidden>
          <div className="shrink-0 border-r border-emulsion" style={{ width: AXIS_GUTTER_PX }} />
          <div className="relative min-w-0 flex-1">
            <svg
              className="absolute bottom-0 h-[18px] overflow-visible"
              style={{ left: '3%', width: `${width}%` }}
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
              focusable="false"
            >
              <path
                d={HANN_PATH}
                fill="none"
                className="stroke-instrument"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <span
              className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap pl-2 text-[0.6875rem] text-instrument"
              style={{ left: `calc(3% + ${width}%)` }}
            >
              {copy.tradeoffWindowShort}
            </span>
          </div>
        </div>

        <PlateCanvas
          bitmap={bitmap}
          revision={revision}
          scale={settings.scale}
          minHz={MIN_PLOT_HZ}
          maxHz={FS / 2}
          durationSeconds={duration}
          N={N}
          fs={FS}
          scan={null}
          scrolling={false}
          height={HEIGHT}
        />
      </div>
    </div>
  )
}
