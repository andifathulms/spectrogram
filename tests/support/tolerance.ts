/**
 * Floating-point tolerance, set once and never widened to make a test pass.
 *
 * Both transforms accumulate error roughly linearly in N against the largest
 * intermediate magnitude, at about 2.2e-16 per operation. The constants below
 * sit three to four orders of magnitude above that measured floor: loose
 * enough that a correct implementation never flakes, tight enough that a sign
 * error, a bit-reversal slip, or a missing normalisation cannot hide.
 *
 * If a DSP test fails, our FFT is wrong. Not the oracle, not this file.
 */

/** Absolute tolerance for a transform of length N over unit-scale input. */
export function transformTolerance(N: number): number {
  return 1e-12 * N
}

/** Absolute tolerance for a signal recovered by FFT → inverse FFT. */
export function roundTripTolerance(N: number): number {
  return 1e-13 * N
}

/** Relative tolerance for Parseval's identity, which sums N positive terms. */
export const PARSEVAL_RELATIVE_TOLERANCE = 1e-12

/** Window coefficients are pure arithmetic on published constants. */
export const WINDOW_TOLERANCE = 1e-12

export function expectClose(actual: number, expected: number, tolerance: number, what: string): void {
  const delta = Math.abs(actual - expected)
  if (!(delta <= tolerance)) {
    throw new Error(
      `${what}: expected ${expected}, received ${actual} (delta ${delta}, tolerance ${tolerance})`,
    )
  }
}

export function expectArrayClose(
  actual: Float64Array,
  expected: Float64Array,
  tolerance: number,
  what: string,
): void {
  if (actual.length !== expected.length) {
    throw new Error(`${what}: length ${actual.length} != ${expected.length}`)
  }
  let worstIndex = -1
  let worstDelta = 0
  for (let i = 0; i < actual.length; i++) {
    const delta = Math.abs(actual[i] - expected[i])
    if (delta > worstDelta) {
      worstDelta = delta
      worstIndex = i
    }
  }
  if (!(worstDelta <= tolerance)) {
    throw new Error(
      `${what}: worst delta ${worstDelta} at index ${worstIndex} ` +
        `(${actual[worstIndex]} vs ${expected[worstIndex]}), tolerance ${tolerance}`,
    )
  }
}
