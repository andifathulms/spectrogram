# PRD — Spectrogram

**Sound decomposed into its frequencies, live, with the transform written from scratch — and the time-frequency tradeoff made into a slider you can drag.**

> The product is named `Spectrogram`; the repository slug is `spectrogram`.

| | |
|---|---|
| **Status** | Draft — pre-implementation |
| **Owner** | Andi Fathul Mukminin Salahuddin |
| **Type** | Personal portfolio project, open source, educational |
| **Deployment** | GitHub Pages (static export, no server) |
| **Language** | Indonesian-first UI; English secondary. Signal-processing terms stay in English. |
| **Normative source** | Cooley & Tukey (1965), *An Algorithm for the Machine Calculation of Complex Fourier Series*. Harris (1978) for window functions. |

---

## 1. Why this, and why it isn't trivial

A waveform shows loudness over time. It cannot show you *pitch* — a low hum and a high whistle are both squiggles. The Fourier transform answers the other question: which frequencies are present, and how strongly. A spectrogram applies it repeatedly along a recording, producing frequency against time.

**The browser will do this for you in ten lines.** `AnalyserNode.getByteFrequencyData()` exists, and a spectrogram built on it demonstrates nothing beyond knowing the API.

**So the project is the transform itself.** A Cooley-Tukey radix-2 FFT written by hand — recursive decimation into even and odd samples, bit-reversal permutation, butterfly operations over precomputed twiddle factors — running at audio rates in a browser tab. Then run it beside `AnalyserNode` and assert they agree. **That comparison is simultaneously the correctness test and the portfolio artifact.**

**And it fills a real gap in the portfolio.** Every other project in this set produces a diagram. This one produces sound, and it's the only one where the user's own voice is the input.

## 2. The idea worth teaching

**You cannot have sharp time resolution and sharp frequency resolution at once.**

To measure a low frequency you must observe several of its cycles, so you need a long window — but everything inside that window collapses into one column, so you lose track of *when*. Shorten the window for sharper timing and frequency resolution collapses, because bin spacing is sample rate divided by window length.

This is not an engineering limitation waiting for a better algorithm. It is the same mathematics as the Heisenberg uncertainty principle, and it is why a piano chord and a drum hit want completely different analysis settings.

**A slider makes this land in four seconds.** Drag window size and watch the same audio go from sharp vertical smears with blurry pitch, to crisp horizontal bands with smeared timing. No explanation competes with that.

Two things fall out of it naturally:

- **Windowing.** Cutting a signal abruptly at the window edges creates frequencies that were never in the sound — spectral leakage. Tapering the edges with a Hann or Blackman window suppresses it. Toggle the window function and watch the artifacts appear and vanish.
- **Nyquist.** No frequency above half the sample rate is representable. Sweep a tone past that boundary and watch it fold back down the display as an alias — the visual explanation of why 44.1 kHz exists.

## 3. Non-goals

- **Not a DAW, not an editor.** No recording, no trimming, no effects, no export of audio.
- **No pitch detection or tuner.** Related, tempting, and a different product.
- **No music transcription, no note recognition, no beat detection.**
- **No ML audio classification.** Nothing here needs a model.
- **No audio upload beyond local file selection**, and even then the file never leaves the browser.
- **No accounts, no server, no telemetry.** See §7 — this one is non-negotiable.
- **No FFT sizes beyond radix-2 powers of two in v1.** Bluestein's algorithm for arbitrary lengths is real and interesting; it is not needed here.

## 4. Features

### 4.1 The plate — signature view
The spectrogram: time across, frequency up, brightness as energy. Rendered as a scrolling bitmap with a live scan edge. Above it, the waveform with the current analysis window drawn as a bracket, so the relationship between the two views is always visible rather than assumed.

Hovering anywhere on the plate gives an exact readout — time, frequency, magnitude in dB — because a heatmap without numbers is a picture, not an instrument.

### 4.2 The tradeoff slider
Window size, live, with bin spacing and window duration displayed as numbers alongside. The whole point of §2, and it should be the first control a visitor touches.

Overlap (hop size) beside it, since that is the other half of the time-resolution story.

### 4.3 Window functions
Rectangular, Hann, Hamming, Blackman. Each shown twice — its shape in the time domain, and its effect on the spectrum of a pure tone. Switching from rectangular to Hann on a single sine wave, and watching the skirts collapse, is the clearest demonstration of leakage there is.

### 4.4 Synthesis mode
Build a signal by adding sine components with chosen frequency, amplitude, and phase. Then transform it and see the spectrum recover exactly what you put in. **This is verification made visible** — the user constructs the ground truth themselves, so they can check the tool rather than trust it.

Includes an inverse FFT, so the round trip closes: build, transform, invert, compare.

### 4.5 Live input
Microphone, with graceful degradation. Bundled sample audio and synthesis mode both work without any permission, so the app is fully usable by someone who declines the mic — which many people will.

Preset guided moments: whistle a rising note and watch the streak climb; say "sss" and see broadband noise; play a single guitar string and see the harmonic stack — fundamental plus evenly spaced overtones — which is the most satisfying thing in the app.

### 4.6 Frequency scale
Linear, logarithmic, and mel. Linear is what the FFT gives you; log is how pitch works; mel is how hearing works. Switching between them on the same audio shows why speech tools use mel and why a linear plot wastes most of its height on frequencies nobody cares about.

### 4.7 Implementation comparison
Our FFT beside `AnalyserNode`, on the same input, with per-bin difference plotted and timing shown for both. Honest about the result: the browser's is faster because it is native. Ours is correct, and correctness is the claim being made.

### 4.8 Aliasing demonstration
A synthesised tone sweeping past Nyquist, folding back down the plate. Short, striking, and it explains sample rate better than a paragraph.

## 5. Architecture

Static Next.js 14 App Router export. No backend, no runtime fetches, no network at runtime.

```
samples (Float32Array)
  → window function      → windowed frame
  → fft (ours)           → complex bins
  → magnitude + dB       → column
  → ring buffer          → plate bitmap
```

**`lib/dsp` is pure and environment-free.** Takes and returns typed arrays. No Web Audio, no DOM, no React, no clock. This is what makes it testable in Node, which is what makes the correctness claims meaningful.

**Typed arrays throughout, and no allocation in the hot loop.** Twiddle factors and bit-reversal tables are precomputed per FFT size and cached. Output buffers are reused. A per-frame allocation at 60fps is a garbage-collection stutter, and stutter in an audio visualiser reads as a broken app.

**In-place radix-2 Cooley-Tukey**, real-input optimised where it pays. Separate real and imaginary `Float64Array`s rather than interleaved or object-based complex numbers.

**Analysis runs off the main thread** — an AudioWorklet where available, a Worker otherwise. The render loop only consumes finished columns.

**The plate is a scrolling bitmap, not a redraw.** A ring buffer of columns written into `ImageData`, blitted once per frame. Never redraw the whole history each frame.

**A naive DFT ships alongside**, used only in tests. It is the literal definition of the transform, it is O(n²), and it is the oracle our FFT is verified against.

## 6. Testing

This is where the project earns its claim, because "I implemented an FFT" is only interesting if it is provably right.

**Naive DFT as oracle.** The direct O(n²) transform is the definition. Our FFT must agree with it to floating-point tolerance across every supported size and a corpus of random signals. This is the backbone.

**Analytically known signals as fixtures.** A pure sine at exactly a bin centre produces energy in exactly one bin. DC produces energy only in bin 0. A unit impulse produces a flat magnitude spectrum. A sine at half a bin offset produces a known leakage pattern. Each is checkable by hand and none depends on another implementation.

**Parseval's theorem.** Total energy in the time domain equals total energy in the frequency domain. A single scalar identity that must hold for *every* input — the cheapest and most total property available, and the analogue of seed conservation in the game projects.

**Round-trip.** FFT then inverse FFT returns the original signal to floating-point tolerance, across the corpus.

**Window function properties.** Symmetry, endpoint values, and coherent gain checked against published values for each window.

**Cross-check against `AnalyserNode`** in a browser test, to tolerance and accounting for its internal windowing and smoothing. Divergences are investigated and documented, never auto-aligned.

**No allocation in the hot path**, asserted by a benchmark that runs many frames and checks that heap growth stays flat.

## 7. Privacy

**Microphone audio never leaves the device.** No network requests at runtime, of any kind. No analytics on audio, no telemetry, no error reporting that could carry a buffer. The app functions fully offline after first load, and this is stated plainly on the page rather than buried.

This is not a formality. A site that asks for microphone access owes the user an unambiguous answer about where the audio goes, and "nowhere, and here is why that is structurally true" is the right one.

## 8. Design direction

The material world is the **astronomical spectrogram plate** — the glass photographic plates on which spectra were recorded, dark emulsion with bright emission lines burned across it. The borrowing is literal: audio spectrograms took their name from spectroscopy, and the visual language of bright lines on a dark field is where the concept comes from.

**Palette.** Plate `#14171A`, near-black with a cool cast, as ground — the one dark-first design in this set, and appropriate, because a spectrogram is light on dark and always has been. Emulsion `#2A3138` for grid and rules. The energy ramp runs deep indigo `#24345C` → amber `#C97B24` → near-white `#F5E9D0`, a blackbody-like progression that reads as intensity without inventing a false rainbow. Instrument cyan `#5FA8B5` for the analysis window bracket, cursors, and readouts — the annotation layer, always distinct from the data. Clip red `#C4453A` reserved for input clipping and nothing else.

**Type.** **Instrument Serif** for display and headings, which carries the register of a scientific plate. **Instrument Sans** for controls and prose. **Chivo Mono** with tabular figures for every readout — Hz, dB, ms, bin index — because an instrument's numbers must align and must never reflow as they change.

**Structure.** The plate occupies the full width, with the waveform above it at a quarter height and the controls below. Frequency axis on the left, always labelled with real units. The analysis window bracket on the waveform is drawn in cyan and moves with the scan, so the two views stay tied together.

**Motion.** The scan edge advancing and the plate scrolling — which is not decoration but the data arriving. The window bracket sliding with it. Nothing else animates. Changing window size re-renders rather than transitions, because a transition would imply a continuity the data doesn't have.

**Copy.** Indonesian first; signal-processing terms stay in English — *bin*, *window*, *overlap*, *Nyquist*, *aliasing*, *leakage* — because the reader will meet them in that form everywhere else. Numbers always carry units.

## 9. Milestones

| | | |
|---|---|---|
| **M0** | The transform | Scaffold, radix-2 FFT, inverse, naive DFT oracle, window functions. Parseval, round-trip, and DFT-agreement tests green. **No UI at all.** |
| **M1** | Offline plate | Bundled sample audio, static spectrogram render, ring-buffer bitmap, axes and readouts. |
| **M2** | The tradeoff | Window size and overlap sliders, window function switching, leakage demonstration, frequency scales. **Ship publicly here — works with no microphone permission.** |
| **M3** | Live input | Mic capture, AudioWorklet, graceful degradation, guided presets. |
| **M4** | Synthesis | Additive builder, inverse transform, build-transform-invert round trip. |
| **M5** | Comparison + aliasing | Our FFT versus `AnalyserNode` with per-bin difference and timing; the Nyquist fold demonstration. |
| **M6** | Polish | Harmonics gallery, keyboard control, reduced motion, offline shell. |

**M0 has no interface deliberately.** The transform being provably correct is the project; building a plate on an unverified FFT would produce a pretty picture of nothing in particular.

**M2 ships before microphone support** because permission prompts are a real barrier, and a visitor who declines should still get the entire lesson.

## 10. Success criteria

- Our FFT agrees with the naive DFT to floating-point tolerance across every supported size.
- Parseval's identity holds for every input in the corpus.
- FFT → inverse FFT round-trips to tolerance.
- Analytically known signals produce their known spectra exactly.
- Sustained 60fps at 2048-point FFT with 75% overlap, with flat heap growth over minutes.
- Fully usable with microphone permission denied.
- Zero network requests after first load, verified.
- A visitor can see the time-frequency tradeoff within one interaction of arriving.
- Total JS ≤ 200 KB gzipped.

## 11. Deployment

`output: 'export'`, `basePath` matching the repository name, `images.unoptimized`, `trailingSlash: true`, `.nojekyll` in the output root. Sample audio bundled and preloaded. iOS requires a user gesture before an `AudioContext` will start — handle it explicitly rather than discovering it in production. Verify under the production `basePath` with `pnpm preview` before pushing.

## 12. Risks

| Risk | Mitigation |
|---|---|
| **A hand-written FFT too slow for real time.** | Precomputed twiddle and bit-reversal tables, typed arrays, in-place transform, zero allocation in the hot loop, off-main-thread analysis. Benchmark from M0, not after the UI exists. |
| **A subtly wrong FFT produces a plausible picture.** | Naive DFT oracle, Parseval, round-trip, analytic fixtures. Four independent signals, all before any UI. |
| **Microphone permission denied and the app is empty.** | M2 ships before mic support. Sample audio and synthesis mode are complete experiences on their own. |
| **iOS AudioContext requires a gesture.** | Explicit start interaction, tested on a real device. |
| **Canvas redraw kills the frame budget.** | Ring buffer plus `ImageData` blit. Never redraw history. |
| **Privacy concerns around mic access.** | Zero network at runtime, stated plainly on the page, structurally true and verifiable. |
| **Scope creep into a tuner or a DAW.** | §3 is binding. |
