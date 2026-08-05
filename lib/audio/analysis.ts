/**
 * Main-thread handle on the analysis worker.
 *
 * Owns the worker's lifetime, keeps the typed protocol honest, and hands
 * column buffers back for recycling once the caller has consumed them.
 */

import type { WindowKind } from '../dsp/windows'
import type { AnalyserRequest, AnalyserResponse, AnalysisConfig, AnalysisInfo } from './protocol'

export interface Inspection {
  readonly N: number
  readonly fs: number
  /** One-sided amplitude spectrum, in the units of the input signal. */
  readonly amplitude: Float32Array
  readonly roundTripError: number
  readonly timeEnergy: number
  readonly spectralEnergy: number
}

export interface ColumnBatch {
  /** `count × bins` floats, packed column-major. Valid until the callback returns. */
  readonly columns: Float32Array
  readonly count: number
  readonly bins: number
  /** Index of the first column, counted from the last reset. */
  readonly first: number
  readonly peak: number
  readonly clipped: boolean
}

export interface AnalysisClientHandlers {
  onReady?: (info: AnalysisInfo) => void
  onColumns?: (batch: ColumnBatch) => void
  onComplete?: (id: number, count: number) => void
  onFault?: (message: string) => void
}

export interface AnalysisClient {
  configure(config: AnalysisConfig): void
  push(samples: Float32Array): void
  /** Analyses a whole buffer; resolves with the number of columns produced. */
  analyse(samples: Float32Array): Promise<number>
  /** One-shot spectrum and round-trip check on a single N-point frame. */
  inspect(samples: Float32Array, window: WindowKind, fs: number): Promise<Inspection>
  reset(): void
  terminate(): void
  readonly info: AnalysisInfo | null
}

export function createAnalysisClient(handlers: AnalysisClientHandlers): AnalysisClient {
  const worker = new Worker(new URL('../../workers/analyser.worker.ts', import.meta.url), {
    type: 'module',
    name: 'urai-analyser',
  })

  let info: AnalysisInfo | null = null
  let nextId = 1
  const pending = new Map<number, (count: number) => void>()
  const inspections = new Map<number, (result: Inspection) => void>()

  function send(message: AnalyserRequest, transfer?: Transferable[]): void {
    worker.postMessage(message, transfer ?? [])
  }

  worker.onmessage = (event: MessageEvent<AnalyserResponse>) => {
    const message = event.data
    switch (message.type) {
      case 'ready':
        info = message.info
        handlers.onReady?.(message.info)
        return

      case 'columns': {
        const columns = new Float32Array(message.buffer)
        handlers.onColumns?.({
          columns,
          count: message.count,
          bins: message.bins,
          first: message.first,
          peak: message.peak,
          clipped: message.clipped,
        })
        // Consumed; give the storage back rather than letting it be collected.
        send({ type: 'recycle', buffer: message.buffer }, [message.buffer])
        return
      }

      case 'complete': {
        pending.get(message.id)?.(message.count)
        pending.delete(message.id)
        handlers.onComplete?.(message.id, message.count)
        return
      }

      case 'inspection': {
        inspections.get(message.id)?.({
          N: message.N,
          fs: message.fs,
          amplitude: new Float32Array(message.amplitude),
          roundTripError: message.roundTripError,
          timeEnergy: message.timeEnergy,
          spectralEnergy: message.spectralEnergy,
        })
        inspections.delete(message.id)
        return
      }

      case 'fault':
        handlers.onFault?.(message.message)
        return

      default: {
        const never: never = message
        handlers.onFault?.(`unknown response: ${JSON.stringify(never)}`)
      }
    }
  }

  worker.onerror = (event) => {
    handlers.onFault?.(event.message || 'analysis worker failed')
  }

  return {
    get info() {
      return info
    },

    configure(config: AnalysisConfig): void {
      send({ type: 'configure', config })
    },

    push(samples: Float32Array): void {
      send({ type: 'push', samples }, [samples.buffer])
    },

    analyse(samples: Float32Array): Promise<number> {
      const id = nextId++
      // The caller keeps its copy of the audio for playback, so this one is
      // transferred and the caller's array is left alone.
      const owned = Float32Array.from(samples)
      return new Promise<number>((resolve) => {
        pending.set(id, resolve)
        send({ type: 'analyse', id, samples: owned }, [owned.buffer])
      })
    },

    inspect(samples: Float32Array, window: WindowKind, fs: number): Promise<Inspection> {
      const id = nextId++
      const owned = Float32Array.from(samples)
      return new Promise<Inspection>((resolve) => {
        inspections.set(id, resolve)
        send({ type: 'inspect', id, samples: owned, window, fs }, [owned.buffer])
      })
    },

    reset(): void {
      send({ type: 'reset' })
    },

    terminate(): void {
      worker.terminate()
      pending.clear()
      inspections.clear()
    },
  }
}
