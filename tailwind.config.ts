import type { Config } from 'tailwindcss'

/** Palette is normative — PRD §8. Never write raw hex in components. */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        plate: '#14171A',
        emulsion: '#2A3138',
        energyLow: '#24345C',
        energyMid: '#C97B24',
        energyHigh: '#F5E9D0',
        instrument: '#5FA8B5',
        clip: '#C4453A',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontFeatureSettings: {
        tabular: '"tnum" 1, "zero" 1',
      },
    },
  },
  plugins: [],
}

export default config
