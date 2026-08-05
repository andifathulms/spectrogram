/**
 * Microphone capture.
 *
 * Audio never leaves the device (PRD §7). This module opens a MediaStream,
 * taps it, and hands the samples to the caller — there is no fetch, no upload,
 * and no recording. The stream is stopped explicitly on teardown so the
 * browser's in-use indicator goes out when the user expects it to.
 *
 * Permission denial is an ordinary outcome, not an error path: the app is
 * fully functional without it (invariant 13), so the result type says so.
 */

export type CaptureResult =
  | { type: 'started'; capture: Capture }
  | { type: 'denied' }
  | { type: 'no-device' }
  | { type: 'unsupported'; reason: string }
  | { type: 'failed'; message: string }

export interface Capture {
  readonly usingWorklet: boolean
  stop(): void
}

/** Where the tap worklet is served from, under the production basePath. */
function tapWorkletUrl(): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
  return `${basePath}/worklets/tap.worklet.js`
}

export interface CaptureOptions {
  context: AudioContext
  /** Receives every batch of captured samples, on the main thread. */
  onSamples: (samples: Float32Array) => void
}

export async function startCapture(options: CaptureOptions): Promise<CaptureResult> {
  const { context, onSamples } = options

  if (typeof navigator === 'undefined' || navigator.mediaDevices?.getUserMedia === undefined) {
    return { type: 'unsupported', reason: 'Browser ini tidak menyediakan akses mikrofon.' }
  }

  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        // Processing the browser applies before we see the samples would make
        // the plate a picture of the processing, not of the room.
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
      video: false,
    })
  } catch (error) {
    const name = error instanceof DOMException ? error.name : ''
    if (name === 'NotAllowedError' || name === 'SecurityError') return { type: 'denied' }
    if (name === 'NotFoundError' || name === 'OverconstrainedError') return { type: 'no-device' }
    return { type: 'failed', message: error instanceof Error ? error.message : String(error) }
  }

  const source = context.createMediaStreamSource(stream)

  const teardown: Array<() => void> = [
    () => source.disconnect(),
    () => stream.getTracks().forEach((track) => track.stop()),
  ]

  if (typeof AudioWorkletNode !== 'undefined') {
    try {
      await context.audioWorklet.addModule(tapWorkletUrl())
      const tap = new AudioWorkletNode(context, 'urai-tap', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
      })

      tap.port.onmessage = (event: MessageEvent<Float32Array>) => {
        const samples = event.data
        onSamples(samples)
      }

      source.connect(tap)
      teardown.push(() => {
        tap.port.postMessage({ type: 'stop' })
        tap.port.onmessage = null
        tap.disconnect()
      })

      return { type: 'started', capture: { usingWorklet: true, stop: () => runAll(teardown) } }
    } catch {
      // Fall through to the ScriptProcessor path below.
    }
  }

  // Fallback for browsers without AudioWorklet. Deprecated and on the main
  // thread, but it only copies samples — the transform still runs in the
  // worker, so invariant 7 holds either way.
  const BUFFER = 2048
  const processor = context.createScriptProcessor(BUFFER, 1, 1)
  const silent = context.createGain()
  silent.gain.value = 0

  processor.onaudioprocess = (event) => {
    onSamples(Float32Array.from(event.inputBuffer.getChannelData(0)))
  }

  source.connect(processor)
  processor.connect(silent).connect(context.destination)

  teardown.push(() => {
    processor.onaudioprocess = null
    processor.disconnect()
    silent.disconnect()
  })

  return { type: 'started', capture: { usingWorklet: false, stop: () => runAll(teardown) } }
}

function runAll(steps: Array<() => void>): void {
  for (const step of steps.reverse()) {
    try {
      step()
    } catch {
      // Teardown is best-effort; one failure must not strand the rest.
    }
  }
}
