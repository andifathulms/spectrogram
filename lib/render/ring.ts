/**
 * Ring buffer of spectrogram columns.
 *
 * The plate never redraws its history (invariant 8), so the history has to
 * live somewhere that can be blitted rather than recomputed. One flat
 * Float32Array holds `capacity` columns of `bins` values; writing a column
 * overwrites the oldest and advances the head. No allocation after
 * construction.
 */

export interface ColumnRing {
  readonly capacity: number
  readonly bins: number
  /** Index the next column will be written to. */
  readonly head: number
  /** Columns written so far, saturating at capacity. */
  readonly filled: number
  /** Total columns ever written — the scan position, monotonically increasing. */
  readonly written: number

  write(column: Float32Array): void
  /** Reads column `age` steps back from the newest (0 = newest) into `out`. */
  read(age: number, out: Float32Array): boolean
  /** One value from column `age`, without copying the column. For readouts. */
  valueAt(age: number, bin: number): number
  /** Raw slot access for the renderer, which walks the ring in place. */
  slotOffset(slot: number): number
  readonly data: Float32Array
  clear(): void
}

export function createColumnRing(capacity: number, bins: number): ColumnRing {
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new Error(`ring capacity must be a positive integer; received ${capacity}`)
  }
  if (!Number.isInteger(bins) || bins < 1) {
    throw new Error(`ring bin count must be a positive integer; received ${bins}`)
  }

  const data = new Float32Array(capacity * bins)
  let head = 0
  let filled = 0
  let written = 0

  return {
    capacity,
    bins,
    data,

    get head() {
      return head
    },
    get filled() {
      return filled
    },
    get written() {
      return written
    },

    write(column: Float32Array): void {
      if (column.length !== bins) {
        throw new Error(`column has ${column.length} bins; ring expects ${bins}`)
      }
      data.set(column, head * bins)
      head = (head + 1) % capacity
      if (filled < capacity) filled++
      written++
    },

    read(age: number, out: Float32Array): boolean {
      if (age < 0 || age >= filled) return false
      const slot = (head - 1 - age + capacity * 2) % capacity
      out.set(data.subarray(slot * bins, slot * bins + bins))
      return true
    },

    valueAt(age: number, bin: number): number {
      if (age < 0 || age >= filled || bin < 0 || bin >= bins) return 0
      const slot = (head - 1 - age + capacity * 2) % capacity
      return data[slot * bins + bin]
    },

    slotOffset(slot: number): number {
      return ((((slot % capacity) + capacity) % capacity) * bins)
    },

    clear(): void {
      data.fill(0)
      head = 0
      filled = 0
      written = 0
    },
  }
}
