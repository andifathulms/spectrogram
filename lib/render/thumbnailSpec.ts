/**
 * How the sample thumbnails are drawn. Shared by the test that produces them
 * and the component that shows them, so the component's stated size and the
 * file's pixels cannot disagree.
 */

import type { ThumbnailOptions } from './thumbnail'

export const THUMBNAIL: ThumbnailOptions & { fs: number } = {
  fs: 48_000,
  width: 240,
  height: 72,
  N: 1024,
  overlap: 0.75,
  window: 'hann',
  minDb: -90,
  maxDb: -10,
  scale: 'log',
  minHz: 20,
}
