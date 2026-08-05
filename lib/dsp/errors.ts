/**
 * Boundary validation for lib/dsp.
 *
 * Invariant 6: sizes are powers of two, validated at the boundary with a
 * structured error. We never silently zero-pad to the next power of two —
 * that changes the result and the caller must know.
 */

export type DspFault =
  | { type: 'not-power-of-two'; N: number }
  | { type: 'size-out-of-range'; N: number; min: number; max: number }
  | { type: 'length-mismatch'; expected: number; received: number; buffer: string }

export class DspError extends Error {
  readonly fault: DspFault

  constructor(fault: DspFault) {
    super(describe(fault))
    this.name = 'DspError'
    this.fault = fault
  }
}

/** Smallest transform worth doing, and the largest we precompute tables for. */
export const MIN_FFT_SIZE = 2
export const MAX_FFT_SIZE = 32768

export function isPowerOfTwo(N: number): boolean {
  return Number.isInteger(N) && N > 0 && (N & (N - 1)) === 0
}

/** Supported transform sizes, ascending. Used by tests and by the UI slider. */
export const FFT_SIZES: readonly number[] = (() => {
  const sizes: number[] = []
  for (let N = MIN_FFT_SIZE; N <= MAX_FFT_SIZE; N *= 2) sizes.push(N)
  return sizes
})()

export function assertRadix2(N: number): void {
  if (!isPowerOfTwo(N)) throw new DspError({ type: 'not-power-of-two', N })
  if (N < MIN_FFT_SIZE || N > MAX_FFT_SIZE) {
    throw new DspError({ type: 'size-out-of-range', N, min: MIN_FFT_SIZE, max: MAX_FFT_SIZE })
  }
}

export function assertLength(buffer: string, received: number, expected: number): void {
  if (received !== expected) {
    throw new DspError({ type: 'length-mismatch', expected, received, buffer })
  }
}

function describe(fault: DspFault): string {
  switch (fault.type) {
    case 'not-power-of-two':
      return `FFT size must be a power of two; received ${fault.N}. Zero-padding is the caller's decision, not ours.`
    case 'size-out-of-range':
      return `FFT size ${fault.N} is outside the supported range [${fault.min}, ${fault.max}].`
    case 'length-mismatch':
      return `Buffer "${fault.buffer}" has length ${fault.received}; expected ${fault.expected}.`
    default: {
      const never: never = fault
      return `Unknown DSP fault: ${JSON.stringify(never)}`
    }
  }
}
