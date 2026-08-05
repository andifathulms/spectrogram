# CLAUDE.md — Urai

Spectrogram and FFT explainer. Hand-written Cooley-Tukey transform, live spectrogram plate, and the time-frequency tradeoff as a draggable control. Static site, GitHub Pages, no backend.

Read `PRD.md` before starting any task. It fixes scope; this file describes how to work in the repo.

**Three things shape everything:**

1. **The transform is the project.** `AnalyserNode` would give a working spectrogram in ten lines and demonstrate nothing. The hand-written FFT, verified against the definition, is the entire claim. Never route production analysis through the browser's FFT.
2. **A wrong FFT still draws a beautiful picture.** This is the failure mode. Four independent correctness signals exist for it — DFT oracle, Parseval, round-trip, analytic fixtures — and all four land in M0, before any UI.
3. **Microphone audio never leaves the device.** Zero network requests at runtime. This is structural, not a promise.

---

## Stack

- Next.js 14, App Router, `output: 'export'` — static only
- TypeScript, `strict: true`
- Tailwind CSS
- Vitest
- pnpm
- **No DSP library.** No fft.js, no dsp.js, no ml-fft. Writing the transform is the point.
- Web Audio API for capture and playback only — never for analysis.

## Commands

```bash
pnpm dev
pnpm build                  # static export to ./out
pnpm preview                # serve ./out under the production basePath
pnpm test                   # vitest watch
pnpm test:run               # vitest once — before every commit
pnpm test:dsp               # DFT oracle, Parseval, round-trip, analytic fixtures
pnpm bench:fft              # throughput + heap-growth benchmark
pnpm typecheck
pnpm lint
```

`pnpm test:dsp` and `pnpm bench:fft` gate every commit touching `lib/dsp`.

## Layout

```
app/
  [locale]/                 # id (default), en
    plat/                   # the spectrogram plate
    susun/                  # synthesis mode
    banding/                # our FFT vs AnalyserNode
components/
  plate/                    # scrolling bitmap, axes, cursor readout
  wave/                     # waveform + analysis-window bracket
  controls/                 # window size, overlap, window function, scale
lib/
  dsp/                      # THE CORE. Pure. Typed arrays in, typed arrays out.
    fft.ts                  # in-place radix-2 Cooley-Tukey + inverse
    dft.ts                  # naive O(n²) — TESTS ONLY, never imported by app/
    tables.ts               # twiddle factors, bit-reversal, cached per size
    windows.ts              # rectangular, Hann, Hamming, Blackman
    magnitude.ts            # complex → magnitude → dB
    scales.ts               # linear, log, mel bin mapping
  audio/                    # Web Audio boundary — capture and playback only
  render/                   # ring buffer, ImageData column blitting
worklets/
  analyser.worklet.ts       # the only runtime caller of lib/dsp
data/
  samples/                  # bundled audio, license recorded
tests/
  oracle/                   # FFT vs DFT
  analytic/                 # known-signal fixtures
  properties/               # Parseval, round-trip
  windows/
```

## Invariants

1. **`lib/dsp` is pure and environment-free.** Typed arrays in, typed arrays out. No Web Audio, no DOM, no React, no clock, no module-level mutable state beyond the twiddle-table cache. It must run identically in Node — that is what makes the correctness claims testable.

2. **Never use `AnalyserNode` for production analysis.** It appears only in the comparison view and in browser tests, clearly labelled as the reference implementation. Every spectrogram column the app draws comes from our FFT.

3. **`dft.ts` is never imported outside tests.** It is O(n²) and exists solely as the oracle. An import from `app/` or `components/` is a bug.

4. **No allocation in the hot loop.** Twiddle factors, bit-reversal tables, window coefficients, and output buffers are precomputed or reused. No `new Float32Array` per frame, no array literals, no closures allocated per call. A GC pause at 60fps reads as a broken app, and the benchmark asserts flat heap growth.

5. **Separate real and imaginary `Float64Array`s.** Never objects with `{re, im}`, never interleaved without a documented reason. Complex-number objects allocate and destroy the hot loop.

6. **The FFT is in-place and radix-2.** Sizes are powers of two, validated at the boundary with a structured error. Do not silently zero-pad to the next power of two — that changes the result and the user must know.

7. **Analysis runs off the main thread.** AudioWorklet where available, Worker otherwise. The render loop only consumes finished columns; it never computes one.

8. **The plate is a ring buffer blitted as `ImageData`.** Never redraw the full history per frame. Never one canvas operation per pixel.

9. **Zero network requests at runtime.** No fetch, no analytics, no error reporting, no font CDN at runtime, no remote sample loading. Everything is bundled. This is verified, not assumed.

10. **Every readout carries units.** Hz, dB, ms, bin index. A bare number in an instrument is a defect.

11. **Tabular figures on every numeric readout.** Values change continuously; a readout that reflows as digits change is unreadable.

12. **Instrument cyan is the annotation layer only** — window bracket, cursors, axes labels. It never appears in the energy ramp. Clip red marks input clipping and nothing else. See PRD §8.

13. **The app is fully functional with microphone permission denied.** Sample audio and synthesis mode are complete experiences. Never gate the core lesson behind a permission prompt.

14. **iOS requires a user gesture to start an `AudioContext`.** Handle it explicitly with a start control; never attempt autostart.

15. **Nothing is computed in a component.** Components render columns and readouts.

## Working style

- **Verify the transform before building anything on it.** M0 has no UI on purpose. Do not start M1 until `pnpm test:dsp` passes in full.
- **Write `dft.ts` first.** The naive transform is the definition, it takes twenty lines, and it is what makes the fast one trustworthy.
- **Benchmark from M0.** A correct FFT that misses the frame budget is a rewrite discovered late. Measure at 2048 points with 75% overlap, on a real mid-range phone, before the UI exists.
- **When a DSP test fails, our FFT is wrong.** Not the oracle, not the tolerance, not the corpus. Investigate in that order and only in that order.
- **Never widen a tolerance to make a test pass.** Floating-point tolerance is set once from the analytic fixtures and does not move.
- **Test on a real device early.** iOS audio, mic permission, and worklet support all behave differently from desktop Chrome, and all three are load-bearing.
- **Small increments.** One window function, verified against published coefficients, beats four approximated.
- **Don't touch `next.config.js`, the Actions workflow, or the worklet registration without saying so explicitly.**
- **Don't add a DSP, audio, or charting dependency.**

## Conventions

- Named exports; defaults only where Next requires them.
- Discriminated unions for results and errors, keyed on `type`. Exhaustive `switch` with a `never` default.
- No `any`. No non-null `!` in `lib/dsp`.
- `Float64Array` in the transform, `Float32Array` at the Web Audio boundary. Convert once, at the boundary, deliberately.
- Follow standard DSP notation in identifiers — `N`, `re`, `im`, `bin`, `hop`, `fs`, `nyquist`. This is the one place terse names are correct, and a reader should be able to hold a textbook beside the code.
- Comments cite the algorithm or the published coefficient table they implement.
- Signal-processing terms stay in English in code and UI; interface copy is Indonesian.
- Sample audio carries a recorded licence in `data/samples/LICENSES.md`. Never bundle audio without one.
- Tailwind utilities inline; semantic tokens in `tailwind.config.ts` — `plate`, `emulsion`, `energyLow`, `energyMid`, `energyHigh`, `instrument`, `clip`. Never raw hex in components.

## Testing rules

- `pnpm test:run` before every commit; `pnpm test:dsp` and `pnpm bench:fft` before any commit touching `lib/dsp`.
- **Parseval's identity is asserted on every DSP test input.** Total time-domain energy equals total frequency-domain energy — one scalar, always true, catches whole classes of scaling and indexing bugs.
- FFT must agree with the naive DFT to tolerance, across every supported size and the random corpus.
- Round-trip (FFT → inverse → original) asserted to tolerance across the corpus.
- Analytic fixtures are permanent: bin-centred sine → single bin; DC → bin 0 only; unit impulse → flat magnitude; half-bin-offset sine → known leakage shape.
- New window function → symmetry, endpoint, and coherent-gain assertions against published values.
- Benchmark asserts flat heap growth over sustained frames, not just throughput.
- Browser test cross-checks against `AnalyserNode`; divergences are investigated and documented, never auto-aligned.
- Bug fix → failing test first.

## Deployment

`main` builds and deploys via Actions. `basePath` must match the repository name; `.nojekyll` must exist in `out/`. Sample audio is bundled and preloaded. Verify with `pnpm preview` before pushing, and check on a real iOS device before any release touching audio startup.

## Framing

The site states plainly that microphone audio never leaves the device, that there are no network requests after load, and that the transform is implemented from scratch rather than delegated to the browser. The comparison view is honest that `AnalyserNode` is faster because it is native — the claim here is correctness, not speed.

## Current state

M0 — not yet scaffolded. Next: package scaffold, then `dft.ts`, then `fft.ts`, then the four correctness suites. **No UI work until `pnpm test:dsp` passes and `pnpm bench:fft` clears the frame budget.**
