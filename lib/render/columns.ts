/**
 * Storage for analysed columns, and the two ways they reach the plate.
 *
 * Offline analysis produces every column at once and the plate is fixed width,
 * so more columns than pixels is the normal case; live capture produces one
 * column at a time and scrolls. Both end up in the same bitmap.
 */

import type { PlateBitmap } from './plate'

export interface ColumnStore {
  readonly bins: number
  /** Columns appended since the last reset. */
  readonly count: number
  append(batch: Float32Array, columns: number): void
  /** A view onto one column. Valid until the next growth. */
  columnAt(index: number): Float32Array | null
  /** Reads a single value without materialising a view. */
  valueAt(index: number, bin: number): number
  reset(): void
}

/**
 * Grows by doubling. Growth allocates, appending does not — and growth stops
 * happening within a second of starting, because the capacity is sized from
 * the expected column count up front.
 */
export function createColumnStore(bins: number, expectedColumns: number): ColumnStore {
  let capacity = Math.max(16, expectedColumns)
  let data = new Float32Array(capacity * bins)
  let count = 0

  function ensure(columns: number): void {
    if (count + columns <= capacity) return
    while (count + columns > capacity) capacity *= 2
    const grown = new Float32Array(capacity * bins)
    grown.set(data.subarray(0, count * bins))
    data = grown
  }

  return {
    bins,

    get count() {
      return count
    },

    append(batch: Float32Array, columns: number): void {
      ensure(columns)
      data.set(batch.subarray(0, columns * bins), count * bins)
      count += columns
    },

    columnAt(index: number): Float32Array | null {
      if (index < 0 || index >= count) return null
      return data.subarray(index * bins, (index + 1) * bins)
    },

    valueAt(index: number, bin: number): number {
      if (index < 0 || index >= count || bin < 0 || bin >= bins) return 0
      return data[index * bins + bin]
    },

    reset(): void {
      count = 0
    },
  }
}

/**
 * Paints a whole store into a plate of fixed width.
 *
 * When there are more columns than pixels the surplus is max-pooled rather
 * than sampled: a spectrogram's information is in its peaks, and dropping
 * columns would make a brief transient disappear entirely at some window
 * sizes and not others — which would look like a bug in the transform.
 */
export function paintStore(
  plate: PlateBitmap,
  store: ColumnStore,
  scaleMap: Float32Array,
  pooled: Float32Array,
): void {
  plate.clear()
  if (store.count === 0) return

  const width = plate.width
  const columns = store.count

  for (let x = 0; x < width; x++) {
    const from = Math.floor((x * columns) / width)
    const to = Math.max(from + 1, Math.floor(((x + 1) * columns) / width))

    const first = store.columnAt(from)
    if (first === null) break
    pooled.set(first)

    for (let c = from + 1; c < to && c < columns; c++) {
      const column = store.columnAt(c)
      if (column === null) break
      for (let k = 0; k < pooled.length; k++) {
        if (column[k] > pooled[k]) pooled[k] = column[k]
      }
    }

    plate.writeColumn(pooled, scaleMap)
  }
}

/** Maps a plate x-coordinate back to a store column index, for the readout. */
export function columnAtX(x: number, width: number, columns: number): number {
  if (columns === 0) return 0
  const index = Math.floor((x / width) * columns)
  return index < 0 ? 0 : index >= columns ? columns - 1 : index
}
