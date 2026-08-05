/**
 * The AudioContext boundary.
 *
 * Invariant 14: iOS will not start an AudioContext without a user gesture, and
 * will suspend one that was created outside a gesture handler. There is no
 * autostart anywhere in this app — every path here runs from a click.
 */

export type AudioSupport =
  | { type: 'supported'; worklet: boolean }
  | { type: 'unsupported'; reason: string }

type ContextConstructor = typeof AudioContext

function constructorFor(): ContextConstructor | null {
  if (typeof window === 'undefined') return null
  const scope = window as unknown as {
    AudioContext?: ContextConstructor
    webkitAudioContext?: ContextConstructor
  }
  return scope.AudioContext ?? scope.webkitAudioContext ?? null
}

export function audioSupport(): AudioSupport {
  const Constructor = constructorFor()
  if (Constructor === null) {
    return { type: 'unsupported', reason: 'Browser ini tidak menyediakan Web Audio API.' }
  }
  return { type: 'supported', worklet: typeof AudioWorkletNode !== 'undefined' }
}

let shared: AudioContext | null = null

/**
 * Returns the shared context, creating it on first call. Must be called from
 * within a user gesture handler — that is the whole point of the function.
 */
export async function startAudioContext(): Promise<AudioContext> {
  const Constructor = constructorFor()
  if (Constructor === null) throw new Error('Web Audio API tidak tersedia di browser ini.')

  if (shared === null || shared.state === 'closed') {
    shared = new Constructor()
  }
  if (shared.state === 'suspended') {
    await shared.resume()
  }
  return shared
}

/** The live context, or null if one has never been started. Never creates one. */
export function currentAudioContext(): AudioContext | null {
  return shared !== null && shared.state !== 'closed' ? shared : null
}

export async function closeAudioContext(): Promise<void> {
  if (shared !== null && shared.state !== 'closed') {
    await shared.close()
  }
  shared = null
}

/** Sample rate of the live context, or the common default before one exists. */
export function currentSampleRate(fallback = 48_000): number {
  return currentAudioContext()?.sampleRate ?? fallback
}
