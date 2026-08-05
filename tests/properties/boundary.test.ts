/**
 * Invariant 6: sizes are validated at the boundary with a structured error,
 * and we never silently zero-pad to the next power of two.
 */

import { describe, expect, it } from 'vitest'

import { DspError, assertRadix2, isPowerOfTwo, MAX_FFT_SIZE } from '../../lib/dsp/errors'
import { fft, ifft, binCount } from '../../lib/dsp/fft'

function faultOf(run: () => void): DspError['fault'] {
  try {
    run()
  } catch (error) {
    if (error instanceof DspError) return error.fault
    throw error
  }
  throw new Error('expected a DspError, none was thrown')
}

describe('size validation', () => {
  it('accepts powers of two only', () => {
    expect(isPowerOfTwo(1024)).toBe(true)
    expect(isPowerOfTwo(1000)).toBe(false)
    expect(isPowerOfTwo(0)).toBe(false)
    expect(isPowerOfTwo(-8)).toBe(false)
    expect(isPowerOfTwo(2.5)).toBe(false)
  })

  it('rejects a non-power-of-two rather than padding it', () => {
    const fault = faultOf(() => fft(new Float64Array(1000), new Float64Array(1000)))
    expect(fault).toEqual({ type: 'not-power-of-two', N: 1000 })
  })

  it('rejects sizes outside the supported range', () => {
    expect(faultOf(() => assertRadix2(1)).type).toBe('size-out-of-range')
    expect(faultOf(() => assertRadix2(MAX_FFT_SIZE * 2)).type).toBe('size-out-of-range')
  })

  it('rejects mismatched real and imaginary lengths', () => {
    const fault = faultOf(() => fft(new Float64Array(256), new Float64Array(128)))
    expect(fault).toEqual({ type: 'length-mismatch', expected: 256, received: 128, buffer: 'im' })
  })

  it('validates the inverse transform on the same terms', () => {
    expect(faultOf(() => ifft(new Float64Array(96), new Float64Array(96))).type).toBe(
      'not-power-of-two',
    )
  })

  it('carries a message that names the size', () => {
    expect(() => fft(new Float64Array(3), new Float64Array(3))).toThrow(/power of two.*3/)
  })
})

describe('bin arithmetic', () => {
  it('counts one-sided bins including DC and Nyquist', () => {
    expect(binCount(1024)).toBe(513)
    expect(binCount(2)).toBe(2)
  })
})
