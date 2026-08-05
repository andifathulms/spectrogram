/**
 * Playback of a generated buffer.
 *
 * Capture and playback only — never analysis (invariant 2). Nothing here
 * touches an AnalyserNode.
 */

export interface PlaybackHandle {
  /** Seconds of audio elapsed, clamped to the buffer's duration. */
  elapsed(): number
  readonly duration: number
  stop(): void
  readonly ended: Promise<void>
}

export interface PlaybackOptions {
  loop?: boolean
  /** Linear gain, applied through a GainNode rather than by scaling samples. */
  gain?: number
}

export function toAudioBuffer(context: AudioContext, samples: Float32Array): AudioBuffer {
  const buffer = context.createBuffer(1, samples.length, context.sampleRate)
  buffer.copyToChannel(samples, 0)
  return buffer
}

export function play(
  context: AudioContext,
  samples: Float32Array,
  options: PlaybackOptions = {},
): PlaybackHandle {
  const buffer = toAudioBuffer(context, samples)
  const source = context.createBufferSource()
  source.buffer = buffer
  source.loop = options.loop ?? false

  const gain = context.createGain()
  gain.gain.value = options.gain ?? 1
  source.connect(gain).connect(context.destination)

  const startedAt = context.currentTime
  const duration = buffer.duration
  let stopped = false

  const ended = new Promise<void>((resolve) => {
    source.onended = () => {
      stopped = true
      resolve()
    }
  })

  source.start()

  return {
    duration,

    elapsed(): number {
      if (stopped) return duration
      const t = context.currentTime - startedAt
      if (source.loop) return t % duration
      return t < 0 ? 0 : t > duration ? duration : t
    },

    stop(): void {
      if (stopped) return
      stopped = true
      try {
        source.stop()
      } catch {
        // Already stopped; nothing to undo.
      }
      source.disconnect()
      gain.disconnect()
    },

    ended,
  }
}
