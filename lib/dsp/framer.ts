/**
 * Overlapping frame extraction.
 *
 * Audio arrives in whatever chunk size the hardware feels like (128 samples
 * from an AudioWorklet); analysis wants N-sample frames advancing by `hop`.
 * This sits between them.
 *
 * A ring of exactly N samples, unwrapped into one reusable scratch frame.
 * Frames are handed to a callback as they complete rather than queued,
 * because queuing them would mean either allocating or dropping — and the
 * callback is supplied once, at construction, so nothing is allocated per
 * frame either (invariant 4).
 */

import { assertRadix2 } from './errors'

export interface Framer {
  readonly N: number
  readonly hop: number
  /** Samples consumed since the last reset. */
  readonly consumed: number
  /** Frames emitted since the last reset. */
  readonly frames: number

  /** Appends samples, invoking the frame callback for each completed frame. */
  push(samples: Float32Array | Float64Array): number
  reset(): void
}

/** Receives the scratch frame. Valid only for the duration of the call. */
export type FrameSink = (frame: Float64Array) => void

export function createFramer(N: number, hop: number, onFrame: FrameSink): Framer {
  assertRadix2(N)
  if (!Number.isInteger(hop) || hop < 1 || hop > N) {
    throw new Error(`hop must be an integer in [1, ${N}]; received ${hop}`)
  }

  const ring = new Float64Array(N)
  const scratch = new Float64Array(N)
  let pos = 0
  let consumed = 0
  let frames = 0

  function emit(): void {
    // `pos` is the oldest sample; unwrap in two copies rather than N reads.
    const tail = N - pos
    scratch.set(ring.subarray(pos), 0)
    if (pos > 0) scratch.set(ring.subarray(0, pos), tail)
    frames++
    onFrame(scratch)
  }

  return {
    N,
    hop,

    get consumed() {
      return consumed
    },
    get frames() {
      return frames
    },

    push(samples: Float32Array | Float64Array): number {
      const before = frames
      for (let i = 0; i < samples.length; i++) {
        ring[pos] = samples[i]
        pos = pos + 1 === N ? 0 : pos + 1
        consumed++
        if (consumed >= N && (consumed - N) % hop === 0) emit()
      }
      return frames - before
    },

    reset(): void {
      ring.fill(0)
      pos = 0
      consumed = 0
      frames = 0
    },
  }
}
