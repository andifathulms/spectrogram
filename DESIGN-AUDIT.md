# Design Audit — Spectrogram

Factual inventory of the codebase as built. No recommendations.

## 1. What this app is

Per PRD.md: a live, browser-based spectrogram whose Fourier transform is a hand-written radix-2 Cooley-Tukey FFT (not `AnalyserNode`), built to demonstrate that the transform is correct and to make the time-frequency resolution tradeoff into a slider a visitor can drag. It is a personal portfolio project (owner: Andi Fathul Mukminin Salahuddin), open source, educational, deployed as a static export to GitHub Pages with no backend, no accounts, and no telemetry. UI copy is Indonesian-first with English secondary; signal-processing terms (bin, window, overlap, Nyquist, aliasing) stay in English in both locales.

The core object is the spectrogram plate — a scrolling time-vs-frequency bitmap with brightness as energy — rendered by `components/plate/PlateCanvas.tsx`. It is driven by `lib/hooks/useSpectrogram.ts`, which owns the analysis worker, a column ring buffer (`lib/render/ring.ts`), an offline column store for sample playback (`lib/render/columns.ts`), and the RGBA bitmap that gets blitted (`lib/render/plate.ts`). No computation happens inside the component itself.

## 2. Stack & constraints

- Next.js 14.2.15, App Router, `output: 'export'` (static export only) — `next.config.js` sets `basePath` (default `/spectrogram`), `trailingSlash: true`, `images.unoptimized: true`, `reactStrictMode: true`.
- React 18.3.1, TypeScript 5.5.3, Tailwind CSS 3.4.6, Vitest 1.6.0, pnpm.
- Deploy target: GitHub Pages. Built `out/` directory present with `en/` and `id/` locale trees, each containing `build/`, `listen/`, `proof/`.
- Routing: `app/[locale]/{listen,build,proof}` plus a root `app/page.tsx` client-side redirect stub to `/${DEFAULT_LOCALE}/`.
- Styling: Tailwind utility classes inline in components; a closed semantic token set defined in `tailwind.config.ts`, reproduced verbatim below. No CSS-in-JS, no styled-components.
- No visualization/animation/DSP library is imported anywhere. `package.json` dependencies are limited to `next`, `react`, `react-dom`. The spectrogram plate, waveform, spectrum chart, and comparison charts are all hand-drawn to `<canvas>` with `CanvasRenderingContext2D`.
- Constraints observed in code: static hosting (no API routes), no backend calls, bundled/self-hosted Google Fonts via `next/font/google` (no runtime font CDN request), i18n via a single centralized dictionary (`lib/i18n/index.ts`), mobile handled via Tailwind responsive classes (e.g. `sm:` breakpoints on section padding, header/footer stacking).

Tailwind theme token block (`tailwind.config.ts`), verbatim:

```
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
  surface: '#181C21',
  raised: '#1F252B',
  hairline: '#242B32',
  ink: '#E6ECF2',
  inkMuted: '#A9B5C1',
  inkFaint: '#7C8995',
},
```

Other tokens in the same `extend` block: `fontFamily` (display/sans/mono, see §3), `fontFeatureSettings.tabular = '"tnum" 1, "zero" 1'`, `maxWidth.shell = 1320px`, `maxWidth.readable = 64ch`, `borderRadius.card = 0.75rem`, `boxShadow.card = inset 0 1px 0 0 rgb(255 255 255/0.03), 0 12px 32px -20px rgb(0 0 0/0.9)`, `keyframes.pulseDot` / `animation.pulseDot` (1.6s ease-in-out infinite, opacity 1→0.25→1).

## 3. Visual system as-built

**Colour literals found outside `tailwind.config.ts` and `lib/ui/colors.ts`:**

| Value | Location | Count | Note |
|---|---|---|---|
| `#14171A` | `app/layout.tsx` (`metadata.themeColor`) | 1 | matches `plate` token |
| `#D9954B`, `#E8E8E4`, `#3A5A86` | `components/chrome/SiteHeader.tsx` (code comment) | 1 each | brand-kit hex names, documented in a comment only, not used as style/fill values |
| `rgba(95, 168, 181, 0.45)` | `components/synth/SpectrumChart.tsx` | 1 | equals `instrument` (`#5FA8B5`) at 45% alpha, hard-coded rather than sourced from `lib/ui/colors` |
| `rgb(${r}, ${g}, ${b})` | `components/synth/SpectrumChart.tsx`, `lib/render/palette.ts` | template literals | built dynamically per-pixel from the energy-ramp LUT, not fixed literals |

`lib/ui/colors.ts` (canvas-only mirror, checked against Tailwind by `tests/ui/tokens.test.ts`):

```
CANVAS = {
  plate: '#14171A', emulsion: '#2A3138', hairline: '#242B32',
  ink: '#E6ECF2', inkMuted: '#A9B5C1', inkFaint: '#7C8995',
  instrument: '#5FA8B5', energyHigh: '#F5E9D0', clip: '#C4453A',
}
```
`energyLow`, `energyMid`, `surface`, `raised` are not mirrored here — they are not consumed by canvas code.

No `hsl()`/`hsla()` usage anywhere in the codebase.

**Fonts.** `app/layout.tsx` loads three Google fonts via `next/font/google`: `Instrument_Serif` (weight `'400'` only, `--font-display`), `Instrument_Sans` (`--font-sans`), `Chivo_Mono` (`--font-mono`) — all `display: 'swap'`, fetched/self-hosted at build time. `tailwind.config.ts` maps these into `font-display`, `font-sans`, `font-mono` utility families with system fallbacks (`Georgia, serif` / `system-ui, sans-serif` / `ui-monospace, monospace`). `font-display` is used directly in two places (`app/page.tsx` redirect stub, `SiteHeader.tsx` site title); all other headings go through `.display-xl` / `.display-lg` / `.display-md` CSS classes in `app/globals.css` that `@apply font-display text-ink`. Only one font-weight utility appears in the whole codebase: `font-medium` on the hero CTA button (`app/[locale]/page.tsx`) — no other explicit weight classes are used, so Instrument Serif ships at its only loaded weight, 400. A `.tabular` utility (`app/globals.css`) sets `font-family: theme('fontFamily.mono')` plus `font-variant-numeric: tabular-nums slashed-zero` and `font-feature-settings: 'tnum' 1, 'zero' 1'`, and is applied to numeric readouts throughout.

**Spacing / radius / shadow.** Beyond the `tailwind.config.ts` tokens above, arbitrary-value Tailwind utilities found (each occurs once): `text-[10px]` (`SpectrumChart.tsx`, `FrequencyAxis.tsx`, `Control.tsx`), `text-[0.6875rem]` (`.control-label` in `globals.css`), `h-[3px]` and `gap-[3px]` and `rounded-[1px]` (home page's inline `PitchFigure`/`TimeFigure` decorative figures). No arbitrary `p-[...]`, `m-[...]`, `shadow-[...]`, `w-[...]`, `top-[...]`/`left-[...]` values were found elsewhere. Range-input (`<input type=range>`) styling is hand-written CSS in `app/globals.css`: track height `3px`, thumb `20×20px` with a `3px solid plate` border, `2.25rem` tap-target height on the input, and `transform: scale(1.15)` on `:active`.

**Centralization.** Colour and type tokens are centralized in `tailwind.config.ts` (utility classes) and duplicated once, deliberately, in `lib/ui/colors.ts` for canvas code that cannot read a Tailwind class — the project's own test (`tests/ui/tokens.test.ts`) asserts the two stay in sync. The two literal exceptions found above (`themeColor` in metadata, and the hard-coded `rgba(95, 168, 181, 0.45)` in `SpectrumChart.tsx`) sit outside that mirrored pair.

**Dark mode.** No `dark:` Tailwind variant appears anywhere in the codebase (zero grep hits), and there is no theme toggle, context, or media-query-driven light palette. `app/globals.css` sets `:root { color-scheme: dark; }` with an accompanying comment identifying this as an intentional single-theme, dark-first design rather than a partial implementation — no light theme exists at all.

## 4. Screen & component inventory

**Routes** (each wrapped by `app/[locale]/layout.tsx`: skip link → `SiteHeader` → `<main id="content">` → `SiteFooter`):

- `app/page.tsx` — client-side redirect to `/${DEFAULT_LOCALE}/`, with a fallback link if JS redirect hasn't fired.
- `app/[locale]/page.tsx` (home) — hero section (heading, lede, CTA pair, privacy line, `HeroPlate` live spectrogram on the right); "How to read it" 3-card grid (`TimeFigure`, `PitchFigure`, `BrightFigure` inline figures); "Try" 3-card grid linking to listen/build/proof; a tradeoff panel (bordered box restating the time-frequency thesis); a two-column privacy/why text section.
- `app/[locale]/listen/page.tsx` — page header (`h1.display-lg` + `p.lede`) → `PlateWorkbench`.
- `app/[locale]/build/page.tsx` — page header → `SynthesisWorkbench`.
- `app/[locale]/proof/page.tsx` — page header → `ComparisonWorkbench`.

**Reusable components, one line each:**

- `SiteHeader` — sticky, translucent/blurred header bar with an inline SVG "Batang" brand mark (three bars in energy-ramp colors), site title, three pill nav links, a hidden-on-mobile "no network" privacy badge, and a locale-swap pill.
- `SiteFooter` — bordered-top footer row: credit text + privacy line on the left, `MakerSignature` on the right.
- `MakerSignature` — "Designed & built by / © year" line plus four 36×36px icon links to the author's own profiles (the one place absolute external URLs are permitted).
- `HeroPlate` — a real (non-mock) spectrogram of a bundled guitar sample at fixed settings, in a bordered/shadowed card with a ramp legend and caption.
- `FrequencyAxis` — a 56px-wide tick-label gutter for linear or log frequency ticks, collision-avoided.
- `PlateCanvas` — the spectrogram plate itself (canvas + overlay annotation divs); see §4 core-object detail below.
- `PlateWorkbench` — the full `/listen` page body: sample/mic picker card, waveform+plate instrument card, cursor readout card, tradeoff (window-size/overlap) card, frequency-scale card, and an "Advanced" `<details>` disclosure.
- `RampLegend` / `RampBar` — a 17-stop CSS gradient swatch built from the same energy-ramp LUT the canvas uses, with "quiet"/"loud" labels.
- `Waveform` — min/max envelope waveform canvas with the current analysis window drawn as an absolutely positioned cyan bracket overlay.
- `Control.tsx` exports: `Field` (label/value/help wrapper), `Segmented` (radio-group styled as pill buttons), `Slider` (native range input + optional tick labels), `Button` (primary/default, disabled state).
- `Disclosure` — a plain `<details>`/`<summary>` accordion with a rotating chevron, used twice (advanced panels on listen and build).
- `Readout` — label + tabular numeric value, with an `emphasis` variant.
- `SpectrumChart` — canvas line chart of recovered amplitude spectrum in dB, with dB gridlines and translucent "expected frequency" markers.
- `SynthesisWorkbench` — the full `/build` page body: partial-tone editor list, waveform + spectrum chart column, a round-trip comparison table with Readouts, and an advanced disclosure.
- `ComparisonWorkbench` — the full `/proof` page body: window-size picker + run button, result Readout grid, and two stacked canvases (overlaid our-vs-`AnalyserNode` spectra, and a difference trace).

**Core object placement.** The plate (`PlateCanvas`) is the primary instrument on `/listen` and appears again, smaller, as `HeroPlate` on the home page. On `/listen` it sits inside a bordered card below the waveform, at a fixed internal render height of 340px (component default), with its container otherwise following the surrounding card's width (responsive, not viewport-fraction-locked); `HeroPlate` sets the plate to 260px. Exact viewport-fraction occupancy on desktop vs. mobile was not directly measured (see Open questions).

## 5. Interaction & state

**Inputs/controls found:** sample-selection pill buttons (`aria-pressed`), Play/Stop and Mic Start/Stop buttons, a `Segmented` radio-group control (used for detail preset, frequency scale, window function, and window-size-in-comparison — up to 4 distinct instances across pages), `Slider` native range inputs (window size, overlap, dynamic-range floor, per-partial frequency/amplitude/phase in synthesis mode), an "Advanced" `<details>` disclosure (2 instances), a locale-swap link, and nav links. Keyboard: `Segmented` uses real (visually hidden) radio inputs so native radio-group keyboard behavior applies; sliders are native `<input type=range>`; a skip-to-content link is present. No custom gesture/touch handling beyond native canvas `onPointerMove`/`onPointerLeave` for the plate's hover-readout crosshair.

**Animation:** the only Tailwind keyframe animation is `pulseDot` (1.6s opacity pulse), applied to the live-mic indicator dot in `PlateWorkbench`. Seven `transition-colors`/`transition-opacity`/`transition-transform` usages exist, all simple hover/state color or chevron-rotation transitions — no custom easing curves beyond the default. The range-input thumb has a hand-written `transition: transform 120ms ease` (scale on `:active`) in `app/globals.css`. `requestAnimationFrame`/`cancelAnimationFrame` is used only in `PlateWorkbench` to drive the scan-edge position during sample playback — functional, not decorative. No animation library is imported; no other `@keyframes` exist. `app/globals.css` contains a `@media (prefers-reduced-motion: reduce)` block that collapses all animation/transition durations to `0.01ms` and forces `scroll-behavior: auto`.

**State patterns present/missing:**
- *Loading*: no generic `isLoading` boolean pattern found; `ComparisonWorkbench` has a `running` boolean that disables its run button and swaps the label to "Running…" while the comparison executes.
- *Error*: handled via a `fault: string | null` field surfaced from the analysis worker (`PlateWorkbench`, `SynthesisWorkbench`) rendered as clip-red-bordered text, and a discriminated-union `micStatus` switch (permission-denied / no-device / unsupported / failed) with an exhaustive `never` default in `PlateWorkbench`. `ComparisonWorkbench` uses a `status` string for its own failure/unavailable messages.
- *Empty*: `Readout` components show an em-dash or a hover-hint placeholder string when no cursor position is set, rather than a blank or spinner; there is no dedicated empty-state illustration or component anywhere.
- *No-result*: not distinctly modeled beyond the same `fault`/`status` string fields above.
- *First-visit*: no onboarding/tour/first-run component was found; the home page's explanatory sections serve this role via static content.

## 6. Weak points, stated plainly

- No `role="alert"` or ARIA live-region markup was found on the `fault`/`micStatus`/`status` error text in `PlateWorkbench`, `SynthesisWorkbench`, or `ComparisonWorkbench` — these render as plain `<p>` elements, so a screen reader is not proactively notified when a mic-permission-denied or DSP-fault message appears.
- No explicit `tabindex` usage was found anywhere; all keyboard order relies on native DOM order (neither confirmed problematic nor confirmed sufficient without direct testing).
- No `<label for>` elements were found paired with any `Slider`; sliders rely on an `aria-label` prop passed to the native input rather than a visible/associated `<label>`.
- `SpectrumChart.tsx` hard-codes `rgba(95, 168, 181, 0.45)` instead of importing the value from `lib/ui/colors`, duplicating the `instrument` token as a literal outside the token files the project otherwise centralizes color in.
- The home page ("How to read it", "Try", tradeoff panel, privacy/why sections) is a sectioned single-page layout with card grids for two of its sections — but per the component reading in §4, the card content itself (inline waveform/spectrogram figures, links to the app's own three routes, the app's own thesis restated) is generated from the app's own visual language rather than generic stock icons or placeholder copy; whether this still reads as a template-shaped landing page is a matter of visual judgment not captured by source inspection alone.
- Contrast values for token pairs (e.g. `inkFaint` `#7C8995` on `plate` `#14171A`, or `energyMid` `#C97B24` against `plate`) were not computed as part of this audit — no automated contrast check was run.
- No dark/light theme fork exists to compare against; the single dark theme's contrast and focus-visibility were not independently measured beyond confirming the `:focus-visible` CSS rule and `prefers-reduced-motion` block exist.

## Open questions

- Exact viewport-fraction the plate (`PlateCanvas`) occupies on desktop vs. mobile — the source sets internal canvas heights (340px default, 260px in `HeroPlate`) and responsive container widths, but the resulting fraction of the visible viewport was not measured against a rendered layout or screenshot.
- Whether the home page's two card-grid sections visually read as "generic" in practice — this audit only confirmed their content is domain-specific in source, not how they render.
- Actual color-contrast ratios for text/background token pairs — not computed here.
- Whether keyboard navigation (native tab order, no explicit `tabindex`) is free of traps in practice — not exercised interactively as part of this audit.
- Whether the missing ARIA live-region on error/status text materially affects screen-reader users — flagged from source inspection only, not verified with an assistive-technology test.
