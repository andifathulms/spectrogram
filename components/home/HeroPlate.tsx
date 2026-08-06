'use client'

import { useEffect, useMemo } from 'react'

import { SAMPLES, sampleById } from '@/data/samples'
import { MIN_PLOT_HZ, useSpectrogram, type SpectrogramSettings } from '@/lib/hooks/useSpectrogram'
import { PlateCanvas } from '@/components/plate/PlateCanvas'
import { RampLegend } from '@/components/plate/RampLegend'
import type { Copy } from '@/lib/i18n'

/**
 * The landing page shows the thing itself rather than a description of it.
 *
 * This is a real spectrogram of a bundled sample, computed by the same worker
 * and the same transform as the live view — not a picture. It costs one worker
 * and about a hundred milliseconds, and it answers "what is this site?" before
 * a word of the copy is read.
 */

const FS = 48_000

/** Module scope, so the identity is stable and the worker is configured once. */
const SETTINGS: SpectrogramSettings = {
  N: 1024,
  overlap: 0.75,
  window: 'hann',
  minDb: -90,
  maxDb: -10,
  scale: 'log',
}

export function HeroPlate({ copy }: { copy: Copy }) {
  const sample = sampleById('senar-gitar') ?? SAMPLES[0]
  const audio = useMemo(() => sample.render(FS, sample.seconds), [sample])

  const { bitmap, revision, analyseBuffer } = useSpectrogram(SETTINGS, FS, 'sample')

  useEffect(() => {
    analyseBuffer(audio)
  }, [audio, analyseBuffer])

  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-card border border-hairline bg-plate shadow-card">
        <div className="flex items-center justify-between gap-4 border-b border-hairline px-3 py-2">
          <span className="control-label">{copy.axisPitch}</span>
          <RampLegend quiet={copy.quiet} loud={copy.loud} />
        </div>

        <PlateCanvas
          bitmap={bitmap}
          revision={revision}
          scale={SETTINGS.scale}
          minHz={MIN_PLOT_HZ}
          maxHz={FS / 2}
          durationSeconds={audio.length / FS}
          N={SETTINGS.N}
          fs={FS}
          scan={null}
          scrolling={false}
          height={260}
        />

        <div className="flex justify-end border-t border-hairline px-3 py-2">
          <span className="control-label">{copy.axisTime}</span>
        </div>
      </div>

      <figcaption className="mt-3 max-w-readable text-sm leading-relaxed text-inkFaint">
        {copy.heroCaption}
      </figcaption>
    </figure>
  )
}
