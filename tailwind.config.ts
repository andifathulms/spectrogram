import type { Config } from 'tailwindcss'

/**
 * Palette is normative — PRD §8. Never write raw hex in components.
 *
 * Two groups, and the split matters. The first seven are the instrument: the
 * plate, the energy ramp painted on it, the cyan annotation layer and the clip
 * red. Those are fixed by the PRD and nothing may be added to them — an extra
 * hue in the ramp would be a lie about the data.
 *
 * The rest is chrome: the ground the page sits on, raised controls, hairlines
 * and the three text tones the interface is written in. They exist so the page
 * around the instrument can be built without inventing a colour at each call
 * site, and every text tone here clears 4.5:1 against every ground it is used
 * on (tests/ui/tokens.test.ts).
 *
 * The ground, `void`, is darker than `plate` on purpose. Instruments — the
 * plate, the waveform, the spectrum, the controls that act on them — are
 * framed as glass in `plate`; prose sits directly on the ground. The two used
 * to differ by 1.05:1, so borders did all the separating and every block read
 * as the same kind of box.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // The instrument.
        plate: '#14171A',
        emulsion: '#2A3138',
        energyLow: '#24345C',
        energyMid: '#C97B24',
        energyHigh: '#F5E9D0',
        instrument: '#5FA8B5',
        clip: '#C4453A',

        // The page around it.
        void: '#0D0F12',
        raised: '#1A1F25',
        hairline: '#252C34',
        ink: '#E6ECF2',
        inkMuted: '#A9B5C1',
        inkFaint: '#8693A0',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontFeatureSettings: {
        tabular: '"tnum" 1, "zero" 1',
      },
      maxWidth: {
        /** The instrument needs width; prose does not. */
        shell: '1320px',
        readable: '64ch',
      },
      borderRadius: {
        card: '0.75rem',
      },
      boxShadow: {
        card: 'inset 0 1px 0 0 rgb(255 255 255 / 0.03), 0 12px 32px -20px rgb(0 0 0 / 0.9)',
        /*
         * An instrument: lifted off the ground, with a faint amber light
         * around it — as if from the picture. The one place the ramp's hue
         * appears outside the data, and it never reaches 15% alpha.
         */
        glass:
          'inset 0 1px 0 0 rgb(255 255 255 / 0.035), 0 40px 80px -48px rgb(0 0 0 / 0.95), 0 0 140px -40px rgb(201 123 36 / 0.13)',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.25' },
        },
      },
      animation: {
        /** The live indicator, and nothing else. Decoration does not move. */
        pulseDot: 'pulseDot 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
