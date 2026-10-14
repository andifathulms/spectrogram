/**
 * Small pictures of each destination, drawn in the instruments' own visual
 * language. They are illustrations, not data, and are hidden from assistive
 * technology: the tile's heading and sentence say what is behind it.
 */

/**
 * A harmonic stack fading out — the shape a plucked string draws: the
 * fundamental brightest and longest, each overtone fainter and shorter.
 */
export function ListenPreview() {
  const stripes = Array.from({ length: 9 }, (_, h) => ({
    y: 86 - Math.log2(h + 1) * 22,
    w: 96 - h * 9,
    className: h === 0 ? 'fill-energyHigh' : h < 4 ? 'fill-energyMid' : 'fill-energyLow',
    opacity: 1 - h * 0.07,
  }))

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden focusable="false">
      <defs>
        <linearGradient id="fade-right" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="white" stopOpacity="1" />
          <stop offset="0.55" stopColor="white" stopOpacity="0.8" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="fade-mask">
          <rect width="100" height="100" fill="url(#fade-right)" />
        </mask>
      </defs>
      <g mask="url(#fade-mask)">
        {stripes.map((stripe) => (
          <rect
            key={stripe.y}
            x="0"
            y={stripe.y}
            width={stripe.w}
            height="3.2"
            rx="1.6"
            className={stripe.className}
            opacity={stripe.opacity}
          />
        ))}
      </g>
    </svg>
  )
}

const PEAKS_PATH =
  'M0,92 C14,90 20,86 24,80 C26,70 27,30 29,22 C31,30 32,70 34,80 C38,86 42,84 46,82 C48,74 49,46 51,40 C53,46 54,74 56,82 C60,88 64,86 68,86 C69,80 70,62 72,58 C74,62 75,80 76,86 C82,90 92,92 100,93'

/** Three tones, three peaks, each with its number on the annotation layer. */
export function BuildPreview() {
  const marks = [
    { x: 29, y: 12, n: 1 },
    { x: 51, y: 30, n: 2 },
    { x: 72, y: 48, n: 3 },
  ]

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden focusable="false">
      <path d={PEAKS_PATH} fill="none" className="stroke-energyHigh" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {marks.map((mark) => (
        <line
          key={mark.n}
          x1={mark.x}
          x2={mark.x}
          y1={mark.y + 4}
          y2="96"
          className="stroke-instrument/40"
          strokeDasharray="2 3"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}

/** Two answers on one axis, ours solid and the reference dashed, and what is left over. */
export function ProofPreview() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden focusable="false">
      <g transform="translate(0 -14) scale(1 0.82)">
        <path d={PEAKS_PATH} fill="none" className="stroke-energyHigh" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        <path
          d={PEAKS_PATH}
          fill="none"
          className="stroke-instrument"
          strokeWidth="1.25"
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke"
        />
      </g>
      <line x1="0" x2="100" y1="90" y2="90" className="stroke-emulsion" vectorEffect="non-scaling-stroke" />
      <path
        d="M0,90 L12,89.6 L24,90.5 L29,88.8 L34,90.3 L46,89.7 L51,91 L56,89.5 L68,90.2 L72,89.2 L76,90.6 L88,89.8 L100,90.1"
        fill="none"
        className="stroke-instrument"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
