/**
 * English is the default; Indonesian is complete beside it.
 *
 * Signal-processing terms stay in English in both dictionaries — bin, window,
 * overlap, Nyquist, aliasing, leakage — because the reader will meet them in
 * that form everywhere else.
 */

export const LOCALES = ['en', 'id'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

export interface Copy {
  localeName: string
  otherLocaleName: string

  title: string
  tagline: string

  navListen: string
  navBuild: string
  navProof: string
  navHome: string
  skipToContent: string
  footerCredit: string

  homeLead: string
  homeWhyTitle: string
  homeWhyBody: string
  homeTradeoffTitle: string
  homeTradeoffBody: string
  homePrivacyTitle: string
  homePrivacyBody: string
  homeStart: string

  // Plate
  plateTitle: string
  plateLead: string
  source: string
  sourceSample: string
  sourceMic: string
  play: string
  stop: string
  startAudio: string
  micStart: string
  micStop: string
  micDenied: string
  micNoDevice: string
  micUnsupported: string
  micLive: string
  micNote: string

  // Controls
  windowSize: string
  windowSizeHelp: string
  overlap: string
  overlapHelp: string
  windowFunction: string
  windowFunctionHelp: string
  frequencyScale: string
  frequencyScaleHelp: string
  dynamicRange: string
  dynamicRangeHelp: string

  // Readouts
  binSpacing: string
  windowDuration: string
  hopDuration: string
  bins: string
  sampleRate: string
  nyquist: string
  time: string
  frequency: string
  magnitude: string
  bin: string
  peak: string
  clipping: string
  hoverHint: string

  // Synthesis
  synthesisTitle: string
  synthesisLead: string
  addPartial: string
  removePartial: string
  partial: string
  amplitude: string
  phase: string
  roundTrip: string
  roundTripHelp: string
  roundTripError: string
  recovered: string
  expected: string
  spectrumTitle: string
  waveformTitle: string

  // Comparison
  comparisonTitle: string
  comparisonLead: string
  comparisonHonest: string
  ours: string
  theirs: string
  difference: string
  worstDifference: string
  runComparison: string
  comparisonUnavailable: string
  timing: string

  // Shared
  privacyBadge: string
  units: { hz: string; db: string; ms: string; s: string; samples: string }
}

const id: Copy = {
  localeName: 'Bahasa Indonesia',
  otherLocaleName: 'English',

  title: 'Spectrogram',
  tagline: 'Suara diurai menjadi frekuensinya, langsung, dengan transform yang ditulis sendiri.',

  navListen: 'Lihat suara',
  navBuild: 'Susun nada',
  navProof: 'Buktikan',
  navHome: 'Beranda',
  skipToContent: 'Lewati ke konten',
  footerCredit:
    'Dibuat sebagai penjelasan, bukan produk. Transform-nya ditulis dari nol — Cooley & Tukey (1965), dan Harris (1978) untuk window function.',

  homeLead:
    'Bentuk gelombang menunjukkan kuat lemahnya suara. Ia tidak bisa menunjukkan nada — dengungan rendah dan siulan tinggi sama-sama hanya coretan. Fourier transform menjawab pertanyaan yang lain: frekuensi apa saja yang ada, dan sekuat apa.',
  homeWhyTitle: 'Kenapa ditulis sendiri',
  homeWhyBody:
    'Browser menyediakan AnalyserNode, dan spectrogram di atasnya selesai dalam sepuluh baris. Yang dibangun di sini adalah transform-nya: radix-2 Cooley-Tukey, in-place, dengan twiddle factor dan bit-reversal yang dihitung di muka. Kebenarannya diuji terhadap DFT naif, identitas Parseval, round-trip, dan sinyal yang spektrumnya diketahui secara analitik.',
  homeTradeoffTitle: 'Yang ingin diajarkan',
  homeTradeoffBody:
    'Resolusi waktu dan resolusi frekuensi tidak bisa tajam bersamaan. Untuk mengukur frekuensi rendah Anda harus mengamati beberapa siklusnya, jadi window harus panjang — tetapi semua isi window itu runtuh menjadi satu kolom. Perpendek window agar waktunya tajam, dan jarak bin melebar. Ini matematika yang sama dengan prinsip ketidakpastian Heisenberg, bukan keterbatasan teknik.',
  homePrivacyTitle: 'Audio Anda tidak ke mana-mana',
  homePrivacyBody:
    'Tidak ada permintaan jaringan apa pun setelah halaman dimuat. Tidak ada analytics, tidak ada telemetry, tidak ada pelaporan error. Audio mikrofon diproses di dalam tab ini dan tidak pernah meninggalkan perangkat. Sample audio dibangkitkan oleh kode, bukan diunduh.',
  homeStart: 'Buka plate',

  plateTitle: 'Plate',
  plateLead:
    'Waktu mendatar, frekuensi ke atas, terang berarti energi. Arahkan kursor ke plate untuk membaca angkanya.',
  source: 'Sumber',
  sourceSample: 'Sample',
  sourceMic: 'Mikrofon',
  play: 'Putar',
  stop: 'Hentikan',
  startAudio: 'Aktifkan audio',
  micStart: 'Nyalakan mikrofon',
  micStop: 'Matikan mikrofon',
  micDenied:
    'Izin mikrofon ditolak. Tidak masalah — sample dan mode Susun adalah pengalaman yang utuh.',
  micNoDevice: 'Tidak ada perangkat masukan yang ditemukan.',
  micUnsupported: 'Browser ini tidak menyediakan akses mikrofon.',
  micLive: 'Mikrofon aktif',
  micNote: 'Audio diproses di perangkat ini saja.',

  windowSize: 'Window size',
  windowSizeHelp: 'Inilah tradeoff-nya. Geser dan perhatikan mana yang menajam dan mana yang kabur.',
  overlap: 'Overlap',
  overlapHelp: 'Seberapa banyak window berikutnya menumpuk dengan yang sekarang. Menentukan hop.',
  windowFunction: 'Window function',
  windowFunctionHelp: 'Memotong sinyal secara mendadak menciptakan frekuensi yang tidak ada — leakage.',
  frequencyScale: 'Skala frekuensi',
  frequencyScaleHelp: 'Linear apa adanya dari FFT, log sesuai nada, mel sesuai pendengaran.',
  dynamicRange: 'Rentang dinamis',
  dynamicRangeHelp: 'Bagian dB mana yang dipetakan ke ramp warna.',

  binSpacing: 'Jarak bin',
  windowDuration: 'Durasi window',
  hopDuration: 'Hop',
  bins: 'Jumlah bin',
  sampleRate: 'Sample rate',
  nyquist: 'Nyquist',
  time: 'Waktu',
  frequency: 'Frekuensi',
  magnitude: 'Magnitude',
  bin: 'Bin',
  peak: 'Puncak',
  clipping: 'CLIPPING',
  hoverHint: 'Arahkan kursor ke plate',

  synthesisTitle: 'Susun',
  synthesisLead:
    'Bangun sinyal dari komponen sinus, lalu transform dan lihat spektrumnya menemukan kembali persis apa yang Anda masukkan. Anda yang menentukan kebenarannya, jadi Anda bisa memeriksa alat ini, bukan mempercayainya.',
  addPartial: 'Tambah komponen',
  removePartial: 'Hapus',
  partial: 'Komponen',
  amplitude: 'Amplitudo',
  phase: 'Fase',
  roundTrip: 'Round trip',
  roundTripHelp: 'FFT lalu inverse FFT harus mengembalikan sinyal yang sama persis.',
  roundTripError: 'Selisih terbesar',
  recovered: 'Terbaca',
  expected: 'Dimasukkan',
  spectrumTitle: 'Spektrum',
  waveformTitle: 'Bentuk gelombang',

  comparisonTitle: 'Banding',
  comparisonLead:
    'FFT kami di samping AnalyserNode bawaan browser, pada masukan yang sama, dengan selisih per bin.',
  comparisonHonest:
    'Jujur soal hasilnya: milik browser lebih cepat karena native. Klaim di sini adalah kebenaran, bukan kecepatan.',
  ours: 'FFT kami',
  theirs: 'AnalyserNode',
  difference: 'Selisih per bin',
  worstDifference: 'Selisih terbesar',
  runComparison: 'Jalankan perbandingan',
  comparisonUnavailable: 'AnalyserNode tidak tersedia di browser ini.',
  timing: 'Waktu komputasi',

  privacyBadge: 'Tidak ada jaringan',
  units: { hz: 'Hz', db: 'dB', ms: 'ms', s: 's', samples: 'sample' },
}

const en: Copy = {
  localeName: 'English',
  otherLocaleName: 'Bahasa Indonesia',

  title: 'Spectrogram',
  tagline: 'Sound decomposed into its frequencies, live, with the transform written from scratch.',

  navListen: 'See sound',
  navBuild: 'Build a sound',
  navProof: 'Check the maths',
  navHome: 'Home',
  skipToContent: 'Skip to content',
  footerCredit:
    'Built as an explanation, not a product. The transform is written from scratch — Cooley & Tukey (1965), and Harris (1978) for the windows.',

  homeLead:
    'A waveform shows loudness over time. It cannot show you pitch — a low hum and a high whistle are both squiggles. The Fourier transform answers the other question: which frequencies are present, and how strongly.',
  homeWhyTitle: 'Why it is written by hand',
  homeWhyBody:
    'The browser provides AnalyserNode, and a spectrogram on top of it takes ten lines. What is built here is the transform itself: radix-2 Cooley-Tukey, in place, over precomputed twiddle factors and bit-reversal tables. Its correctness is checked against a naive DFT, Parseval’s identity, a round trip, and signals whose spectra are known analytically.',
  homeTradeoffTitle: 'The idea worth teaching',
  homeTradeoffBody:
    'You cannot have sharp time resolution and sharp frequency resolution at once. To measure a low frequency you must observe several of its cycles, so the window must be long — but everything inside it collapses into one column. Shorten the window for sharper timing and bin spacing widens. This is the same mathematics as the Heisenberg uncertainty principle, not an engineering limitation.',
  homePrivacyTitle: 'Your audio goes nowhere',
  homePrivacyBody:
    'There are no network requests of any kind after load. No analytics, no telemetry, no error reporting. Microphone audio is processed inside this tab and never leaves the device. The sample audio is generated by code rather than downloaded.',
  homeStart: 'Open the plate',

  plateTitle: 'Plate',
  plateLead:
    'Time across, frequency up, brightness as energy. Hover the plate to read exact numbers.',
  source: 'Source',
  sourceSample: 'Sample',
  sourceMic: 'Microphone',
  play: 'Play',
  stop: 'Stop',
  startAudio: 'Start audio',
  micStart: 'Turn on microphone',
  micStop: 'Turn off microphone',
  micDenied:
    'Microphone permission denied. That is fine — the samples and synthesis mode are complete experiences.',
  micNoDevice: 'No input device was found.',
  micUnsupported: 'This browser does not provide microphone access.',
  micLive: 'Microphone live',
  micNote: 'Audio is processed on this device only.',

  windowSize: 'Window size',
  windowSizeHelp: 'This is the tradeoff. Drag it and watch which axis sharpens and which blurs.',
  overlap: 'Overlap',
  overlapHelp: 'How much each window shares with the last one. It sets the hop.',
  windowFunction: 'Window function',
  windowFunctionHelp: 'Cutting a signal abruptly creates frequencies that were never there — leakage.',
  frequencyScale: 'Frequency scale',
  frequencyScaleHelp: 'Linear is what the FFT gives you, log is pitch, mel is hearing.',
  dynamicRange: 'Dynamic range',
  dynamicRangeHelp: 'Which slice of dB the colour ramp is mapped across.',

  binSpacing: 'Bin spacing',
  windowDuration: 'Window duration',
  hopDuration: 'Hop',
  bins: 'Bins',
  sampleRate: 'Sample rate',
  nyquist: 'Nyquist',
  time: 'Time',
  frequency: 'Frequency',
  magnitude: 'Magnitude',
  bin: 'Bin',
  peak: 'Peak',
  clipping: 'CLIPPING',
  hoverHint: 'Hover the plate',

  synthesisTitle: 'Synthesis',
  synthesisLead:
    'Build a signal from sine components, then transform it and watch the spectrum recover exactly what you put in. You supply the ground truth, so you can check the tool rather than trust it.',
  addPartial: 'Add component',
  removePartial: 'Remove',
  partial: 'Component',
  amplitude: 'Amplitude',
  phase: 'Phase',
  roundTrip: 'Round trip',
  roundTripHelp: 'FFT then inverse FFT must return the identical signal.',
  roundTripError: 'Worst deviation',
  recovered: 'Recovered',
  expected: 'Entered',
  spectrumTitle: 'Spectrum',
  waveformTitle: 'Waveform',

  comparisonTitle: 'Comparison',
  comparisonLead:
    'Our FFT beside the browser’s AnalyserNode, on the same input, with the per-bin difference.',
  comparisonHonest:
    'Honest about the result: the browser’s is faster because it is native. The claim here is correctness, not speed.',
  ours: 'Our FFT',
  theirs: 'AnalyserNode',
  difference: 'Per-bin difference',
  worstDifference: 'Worst difference',
  runComparison: 'Run the comparison',
  comparisonUnavailable: 'AnalyserNode is not available in this browser.',
  timing: 'Compute time',

  privacyBadge: 'No network',
  units: { hz: 'Hz', db: 'dB', ms: 'ms', s: 's', samples: 'samples' },
}

export const COPY: Record<Locale, Copy> = { en, id }

export function copyFor(locale: string): Copy {
  return isLocale(locale) ? COPY[locale] : COPY[DEFAULT_LOCALE]
}
