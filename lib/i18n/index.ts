/**
 * English is the default; Indonesian is complete beside it.
 *
 * The interface is written for someone who has never seen a spectrogram: the
 * plain word leads and the technical term follows it — "Detail", with "window
 * size" waiting in the advanced panel — so a visitor is never stopped by
 * vocabulary, and a reader who already has the vocabulary can still find the
 * control they came for. Signal-processing terms themselves are never
 * translated: bin, window, overlap, Nyquist, leakage and aliasing appear in
 * that form in every textbook the reader will meet next.
 */

export const LOCALES = ['en', 'id'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

/** Keyed by sample id — the words live here, the signal lives in data/samples. */
export interface SampleCopy {
  label: string
  /** What to look for on the plate. Shown on the page, not hidden in a tooltip. */
  hint: string
}

export interface Copy {
  otherLocaleName: string

  title: string

  navListen: string
  navBuild: string
  navProof: string
  /** The nav's accessible name, so it is not announced as the site title. */
  navLabel: string
  /** Short labels for the phone's bottom tab bar. */
  tabListen: string
  tabBuild: string
  tabProof: string
  skipToContent: string
  footerCredit: string

  // Home
  heroTitle: string
  heroLede: string
  heroCta: string
  heroSecondary: string
  heroCaption: string
  /** The numbered markers on the hero plate, in order. */
  heroMarks: { title: string; body: string }[]
  tradeoffEyebrow: string
  tradeoffTitle: string
  tradeoffBody: string
  /** What each Detail preset shows on the tones-and-clicks sample. */
  tradeoffRows: { sharp: string; balanced: string; fine: string }
  tradeoffWindow: string
  tradeoffWindowShort: string
  tradeoffBin: string
  tradeoffCta: string
  modesEyebrow: string
  modesTitle: string
  tryListenBody: string
  tryBuildBody: string
  tryProofBody: string
  modeOpen: string
  trustEyebrow: string
  trustTitle: string
  trustNetwork: string
  trustChecks: string
  trustLibraries: string
  homeWhyTitle: string
  homeWhyBody: string
  homePrivacyTitle: string
  homePrivacyBody: string

  // Listen
  listenTitle: string
  listenLede: string
  soundTitle: string
  waveTitle: string
  samples: Record<string, SampleCopy>
  play: string
  stop: string
  micStart: string
  micStop: string
  micDenied: string
  micNoDevice: string
  micUnsupported: string
  micLive: string
  micNote: string

  // The tradeoff, as the one control the page is built around
  detailTitle: string
  detailHelp: string
  detailSharpTiming: string
  detailBalanced: string
  detailFinePitch: string
  detailCustom: string
  detailTimingNote: string
  detailPitchNote: string
  timingBlur: string
  pitchBlur: string
  blurNote: string
  fineTune: string

  viewTitle: string
  scaleLabels: Record<string, string>
  windowLabels: Record<string, string>

  advancedTitle: string
  advancedHelp: string

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
  columns: string
  sampleRate: string
  nyquist: string
  time: string
  frequency: string
  magnitude: string
  bin: string
  peak: string
  clipping: string
  clippingHelp: string
  hoverHint: string

  // Build
  synthesisTitle: string
  synthesisLead: string
  addPartial: string
  removePartial: string
  partial: string
  tonesTitle: string
  recoveredNote: string
  amplitude: string
  phase: string
  roundTrip: string
  roundTripHelp: string
  roundTripError: string
  recovered: string
  expected: string
  spectrumTitle: string
  waveformTitle: string
  aliasedWarning: string
  parsevalLabel: string
  verdictExact: string
  verdictOff: string

  // Proof
  comparisonTitle: string
  comparisonLead: string
  comparisonHonest: string
  comparisonHowTitle: string
  comparisonHowBody: string
  ours: string
  theirs: string
  difference: string
  meanDifference: string
  worstDifference: string
  runComparison: string
  comparisonRunning: string
  comparisonUnavailable: string
  timing: string
  comparisonEyebrow: string
  comparisonPrompt: string
  /** One sentence with a `{db}` slot for the worst difference near a peak. */
  comparisonVerdict: string

  // Shared
  axisTime: string
  axisPitch: string
  quiet: string
  loud: string
  privacyBadge: string
  privacyShort: string
  units: { hz: string; db: string; ms: string; s: string; samples: string }
}

const en: Copy = {
  otherLocaleName: 'Bahasa Indonesia',

  title: 'Spectrogram',

  navListen: 'See sound',
  navBuild: 'Build a sound',
  navProof: 'Check the maths',
  navLabel: 'Main',
  tabListen: 'See',
  tabBuild: 'Build',
  tabProof: 'Check',
  skipToContent: 'Skip to content',
  footerCredit:
    'Built as an explanation, not a product. The transform is written from scratch — Cooley-Tukey (1965), and Harris (1978) for the windows.',

  heroTitle: 'See what sound *looks* like',
  heroLede:
    'Every sound is a stack of pure tones. Play one of the samples, or whistle into your microphone, and watch this page pull the tones apart and paint them as they arrive.',
  heroCta: 'Start listening',
  heroSecondary: 'See the tradeoff',
  heroCaption:
    'One plucked guitar string. Time runs left to right, pitch bottom to top, and brighter means louder. Every pixel was computed by this page’s own transform.',
  heroMarks: [
    { title: 'The note', body: 'The brightest line, at 196 Hz. That is the pitch you hear.' },
    {
      title: 'Its overtones',
      body: 'Evenly spaced lines above it. They are why a guitar sounds like a guitar and not a flute.',
    },
    {
      title: 'The fade',
      body: 'High overtones die first, which is why a note mellows as it rings.',
    },
  ],

  tradeoffEyebrow: 'The one idea worth taking away',
  tradeoffTitle: 'You can have sharp timing *or* sharp pitch',
  tradeoffBody:
    'One sound, analysed three ways: two steady notes close together, and a click every half second. The cyan bump above each picture is the window — how much sound goes into one column — drawn to the same time scale. A short window catches the clicks and blurs the notes into one band. A long one splits the notes and smears the clicks. It is the same mathematics as Heisenberg’s uncertainty principle, not a limitation of this page.',
  tradeoffRows: {
    sharp: 'Each click is a thin vertical line. The two notes blur into one wide band.',
    balanced: 'Clicks and notes are both readable, and neither is crisp.',
    fine: 'The two notes are two clean lines. Each click smears across its window.',
  },
  tradeoffWindow: 'window',
  tradeoffWindowShort: 'analysis window, to scale',
  tradeoffBin: 'per bin',
  tradeoffCta: 'Drag it yourself',

  modesEyebrow: 'Three ways in',
  modesTitle: 'Look, *build*, then check',
  tryListenBody:
    'Play a guitar note, a chord, a drum hit, or your own voice, and watch the picture build as it happens.',
  tryBuildBody:
    'Stack pure tones with sliders, hear the result, and check that the picture finds exactly the tones you put in.',
  tryProofBody:
    'Run our transform beside the browser’s own on the same sound, and see how far apart the two answers are.',
  modeOpen: 'Open',

  trustEyebrow: 'Two claims you can check',
  trustTitle: 'Private by construction, *correct* by test',
  trustNetwork: 'network requests after the page loads',
  trustChecks: 'independent correctness checks on the transform',
  trustLibraries: 'audio or maths libraries. The FFT is written from scratch.',

  homePrivacyTitle: 'Your microphone never leaves this page',
  homePrivacyBody:
    'Once loaded, this page makes no network requests at all — no analytics, no error reporting, nothing. Sound is analysed inside this tab and thrown away. The sample sounds are generated by code rather than downloaded, and a test in the repository fails the build if a single network call is ever added.',

  homeWhyTitle: 'Written by hand, on purpose',
  homeWhyBody:
    'Browsers already ship a Fourier transform, and a spectrogram built on top of it takes ten lines and teaches nobody anything. The transform here is written from scratch — the same Cooley-Tukey algorithm from 1965 — and checked four independent ways: against the textbook definition, against a conservation law, by running it backwards, and against signals whose answers are known in advance.',

  listenTitle: 'See sound',
  listenLede:
    'Pick a sound, or turn on your microphone. Time runs left to right, pitch runs bottom to top, and the brighter a spot is the louder that pitch was at that moment. Point at the picture to read exact numbers.',
  soundTitle: 'Pick a sound',
  waveTitle: 'The sound wave',
  samples: {
    'senar-gitar': {
      label: 'Guitar string',
      hint: 'One note at 196 Hz, with overtones stacked evenly above it. That stack is why it sounds like a guitar and not a flute.',
    },
    siulan: {
      label: 'Whistle',
      hint: 'A single clean line climbing the picture — straight on the pitch scale, curved on the even one.',
    },
    desis: {
      label: 'Hiss, “sss”',
      hint: 'No line at all. The energy is smeared across every high frequency at once, which is what noise looks like.',
    },
    akor: {
      label: 'C major chord',
      hint: 'Three notes at once, so three stacks side by side. Move detail towards fine pitch to pull them apart.',
    },
    'nada-dan-klik': {
      label: 'Two tones and clicks',
      hint: 'Two steady notes close together, and a click every half second. No detail setting shows both sharply: the clicks want sharp timing, the two notes want fine pitch.',
    },
    ketukan: {
      label: 'Drum hits',
      hint: 'Very short sounds. Move detail towards sharp timing to see each hit land — and watch the pitch go blurry as you do.',
    },
    'sapuan-nyquist': {
      label: 'Sweep past the limit',
      hint: 'The tone keeps climbing, but its reflection turns around and comes back down. That fold is aliasing.',
    },
  },

  play: 'Play',
  stop: 'Stop',
  micStart: 'Use my microphone',
  micStop: 'Turn microphone off',
  micDenied:
    'Microphone permission was declined. Nothing is lost — the samples and the build page are complete on their own.',
  micNoDevice: 'No input device was found.',
  micUnsupported: 'This browser does not offer microphone access.',
  micLive: 'Microphone on',
  micNote: 'Analysed on this device, never sent anywhere.',

  detailTitle: 'Detail',
  detailHelp:
    'This is the tradeoff, and it is the whole lesson. Sharper timing blurs the pitch; finer pitch blurs the timing. Nothing makes both sharp at once.',
  detailSharpTiming: 'Sharp timing',
  detailBalanced: 'Balanced',
  detailFinePitch: 'Fine pitch',
  detailCustom: 'Custom',
  detailTimingNote: 'Each column covers',
  detailPitchNote: 'Pitches closer than this merge',
  timingBlur: 'Timing blur',
  pitchBlur: 'Pitch blur',
  blurNote: 'One bar always shrinks as the other grows. Nothing makes both short.',
  fineTune: 'Fine-tune',

  viewTitle: 'View',
  scaleLabels: {
    linear: 'Even spacing',
    log: 'By pitch',
    mel: 'By hearing',
  },
  windowLabels: {
    rectangular: 'Rectangular — no taper, most leakage',
    hann: 'Hann — cosine taper, the usual choice',
    hamming: 'Hamming — lower skirts',
    blackman: 'Blackman — least leakage, widest peak',
  },

  advancedTitle: 'Everything else',
  advancedHelp: 'The controls the picture is actually made of. None of it is needed to read it.',

  windowSize: 'Window size',
  windowSizeHelp: 'How many samples go into one column. This is what the detail control sets.',
  overlap: 'Overlap',
  overlapHelp: 'How much each window shares with the last one. It sets the hop.',
  windowFunction: 'Window function',
  windowFunctionHelp:
    'Cutting a signal off abruptly invents frequencies that were never in it — leakage. A taper is how that is kept down.',
  frequencyScale: 'Frequency scale',
  frequencyScaleHelp:
    'Linear is what the FFT returns, log matches how pitch is heard, mel matches how hearing spaces it out.',
  dynamicRange: 'Dynamic range',
  dynamicRangeHelp: 'Which slice of dB the colour ramp is stretched across.',

  binSpacing: 'Bin spacing',
  windowDuration: 'Window duration',
  hopDuration: 'Hop',
  bins: 'Bins',
  columns: 'Columns',
  sampleRate: 'Sample rate',
  nyquist: 'Nyquist',
  time: 'Time',
  frequency: 'Pitch',
  magnitude: 'Loudness',
  bin: 'Bin',
  peak: 'Peak',
  clipping: 'Too loud',
  clippingHelp:
    'The input is clipping — turn the source down, or move further from the microphone.',
  hoverHint: 'Point at the picture',

  synthesisTitle: 'Build a sound',
  synthesisLead:
    'Stack pure tones and listen to what you have made. Then check the picture underneath: the transform should find exactly the tones you put in, at exactly the strengths you chose. You supply the right answer, so you can test the tool rather than trust it.',
  addPartial: 'Add a tone',
  removePartial: 'Remove',
  partial: 'Tone',
  tonesTitle: 'Your tones',
  recoveredNote:
    'The strengths found come out a shade under the ones you set. That is not an error: a tone whose pitch falls between two bins is shared across both of them, so neither reads its full height. Land a tone exactly on a bin — 187.5 Hz here — and it comes back whole.',
  amplitude: 'Strength',
  phase: 'Phase',
  roundTrip: 'Does it come back?',
  roundTripHelp:
    'Run the transform, then run it backwards. If it is correct, the signal that comes out is the one that went in — to the last decimal a computer can hold.',
  roundTripError: 'Worst deviation',
  recovered: 'Found',
  expected: 'You set',
  spectrumTitle: 'What the transform found',
  waveformTitle: 'The wave you built',
  aliasedWarning: 'Above the limit — this tone folds back down to',
  parsevalLabel: 'Energy kept (Parseval)',
  verdictExact: 'Matches to floating-point precision',
  verdictOff: 'Does not match — worth a closer look',

  comparisonTitle: 'Check the maths',
  comparisonLead:
    'The browser has a Fourier transform of its own built in. Here it runs beside ours on exactly the same sound, with the difference between the two answers drawn underneath.',
  comparisonHonest:
    'Honest about the result: the browser’s is faster, because it is native code. The claim being made here is correctness, not speed.',
  comparisonHowTitle: 'What you are looking at',
  comparisonHowBody:
    'The pale line is our transform, the cyan line is the browser’s. Where they agree, the cyan simply covers the pale one. The panel below draws what is left over, magnified — a few hundredths of a dB near the peaks is floating-point arithmetic, not disagreement.',
  ours: 'Our FFT',
  theirs: 'The browser’s',
  difference: 'Difference per bin',
  meanDifference: 'Mean difference',
  worstDifference: 'Worst difference',
  runComparison: 'Run the comparison',
  comparisonRunning: 'Running…',
  comparisonUnavailable: 'AnalyserNode is not available in this browser.',
  timing: 'Compute time',
  comparisonEyebrow: 'Result',
  comparisonPrompt: 'Run both transforms on the same sound and the answer appears here, in one sentence.',
  comparisonVerdict: 'Our transform and the browser’s agree within {db} near every peak.',

  axisTime: 'Time →',
  axisPitch: '↑ Pitch',
  quiet: 'quiet',
  loud: 'loud',
  privacyBadge: 'Private · no network',
  privacyShort: 'Private',
  units: { hz: 'Hz', db: 'dB', ms: 'ms', s: 's', samples: 'samples' },
}

const id: Copy = {
  otherLocaleName: 'English',

  title: 'Spectrogram',

  navListen: 'Lihat suara',
  navBuild: 'Susun nada',
  navProof: 'Periksa hitungannya',
  navLabel: 'Utama',
  tabListen: 'Lihat',
  tabBuild: 'Susun',
  tabProof: 'Periksa',
  skipToContent: 'Lewati ke konten',
  footerCredit:
    'Dibuat sebagai penjelasan, bukan produk. Transform-nya ditulis dari nol — Cooley-Tukey (1965), dan Harris (1978) untuk window function.',

  heroTitle: 'Lihat *wujud* sebuah suara',
  heroLede:
    'Setiap suara adalah tumpukan nada murni. Putar salah satu contoh, atau bersiul ke mikrofon Anda, dan lihat halaman ini memisahkan nada-nadanya lalu melukisnya begitu terdengar.',
  heroCta: 'Mulai lihat suara',
  heroSecondary: 'Lihat tradeoff-nya',
  heroCaption:
    'Satu petikan senar gitar. Waktu berjalan dari kiri ke kanan, nada dari bawah ke atas, dan makin terang makin keras. Setiap pikselnya dihitung oleh transform milik halaman ini sendiri.',
  heroMarks: [
    { title: 'Nadanya', body: 'Garis paling terang, di 196 Hz. Itulah nada yang Anda dengar.' },
    {
      title: 'Overtone-nya',
      body: 'Garis berjarak rata di atasnya. Karena merekalah gitar terdengar seperti gitar, bukan seruling.',
    },
    {
      title: 'Memudarnya',
      body: 'Overtone tinggi hilang lebih dulu, karena itu nada terdengar makin lembut saat berdenging.',
    },
  ],

  tradeoffEyebrow: 'Satu gagasan yang layak dibawa pulang',
  tradeoffTitle: 'Waktu yang tajam *atau* nada yang tajam',
  tradeoffBody:
    'Satu suara, dianalisis dengan tiga cara: dua nada tetap yang berdekatan, dan satu klik setiap setengah detik. Tonjolan cyan di atas tiap gambar adalah window — seberapa banyak suara yang masuk ke satu kolom — digambar dengan skala waktu yang sama. Window pendek menangkap klik dan mengaburkan dua nada menjadi satu pita. Window panjang memisahkan kedua nada dan mengaburkan klik. Ini matematika yang sama dengan prinsip ketidakpastian Heisenberg, bukan keterbatasan halaman ini.',
  tradeoffRows: {
    sharp: 'Setiap klik menjadi garis tegak yang tipis. Dua nadanya menyatu menjadi satu pita lebar.',
    balanced: 'Klik dan nada sama-sama terbaca, dan tidak ada yang tajam.',
    fine: 'Dua nadanya menjadi dua garis bersih. Setiap klik terhampar selebar window-nya.',
  },
  tradeoffWindow: 'window',
  tradeoffWindowShort: 'window analisis, sesuai skala',
  tradeoffBin: 'per bin',
  tradeoffCta: 'Geser sendiri',

  modesEyebrow: 'Tiga pintu masuk',
  modesTitle: 'Lihat, *susun*, lalu periksa',
  tryListenBody:
    'Putar petikan gitar, akor, ketukan drum, atau suara Anda sendiri, lalu lihat gambarnya terbentuk saat itu juga.',
  tryBuildBody:
    'Tumpuk nada murni dengan slider, dengarkan hasilnya, dan periksa bahwa gambarnya menemukan persis nada yang Anda masukkan.',
  tryProofBody:
    'Jalankan transform kami berdampingan dengan milik browser pada suara yang sama, dan lihat seberapa jauh kedua jawabannya berbeda.',
  modeOpen: 'Buka',

  trustEyebrow: 'Dua klaim yang bisa Anda periksa',
  trustTitle: 'Privat sejak rancangannya, *benar* menurut tesnya',
  trustNetwork: 'permintaan jaringan setelah halaman dimuat',
  trustChecks: 'pemeriksaan kebenaran yang saling bebas pada transform-nya',
  trustLibraries: 'library audio atau matematika. FFT-nya ditulis dari nol.',

  homePrivacyTitle: 'Mikrofon Anda tidak meninggalkan halaman ini',
  homePrivacyBody:
    'Setelah dimuat, halaman ini tidak melakukan permintaan jaringan apa pun — tanpa analytics, tanpa pelaporan error, tanpa apa pun. Suara diproses di dalam tab ini lalu dibuang. Contoh audionya dibangkitkan oleh kode, bukan diunduh, dan ada tes di repositori yang menggagalkan build jika satu saja panggilan jaringan ditambahkan.',

  homeWhyTitle: 'Ditulis tangan, dengan sengaja',
  homeWhyBody:
    'Browser sudah menyediakan Fourier transform, dan spectrogram di atasnya selesai dalam sepuluh baris tanpa mengajarkan apa pun. Transform di sini ditulis dari nol — algoritma Cooley-Tukey yang sama dari 1965 — dan diperiksa dengan empat cara yang saling bebas: terhadap definisi bakunya, terhadap sebuah hukum kekekalan, dengan menjalankannya mundur, dan terhadap sinyal yang jawabannya sudah diketahui lebih dulu.',

  listenTitle: 'Lihat suara',
  listenLede:
    'Pilih satu suara, atau nyalakan mikrofon Anda. Waktu berjalan dari kiri ke kanan, nada dari bawah ke atas, dan makin terang sebuah titik makin keras nada itu pada saat itu. Arahkan kursor ke gambarnya untuk membaca angka persisnya.',
  soundTitle: 'Pilih suara',
  waveTitle: 'Gelombang suaranya',
  samples: {
    'senar-gitar': {
      label: 'Senar gitar',
      hint: 'Satu nada di 196 Hz, dengan overtone bertumpuk rapi di atasnya. Tumpukan itulah yang membuatnya terdengar seperti gitar, bukan seruling.',
    },
    siulan: {
      label: 'Siulan',
      hint: 'Satu garis bersih memanjat gambar — lurus pada skala nada, melengkung pada skala rata.',
    },
    desis: {
      label: 'Desis “sss”',
      hint: 'Tidak ada garis sama sekali. Energinya terhampar di semua frekuensi tinggi sekaligus — begitulah wujud noise.',
    },
    akor: {
      label: 'Akor C mayor',
      hint: 'Tiga nada sekaligus, jadi tiga tumpukan berdampingan. Geser detail ke arah nada halus untuk memisahkannya.',
    },
    'nada-dan-klik': {
      label: 'Dua nada dan klik',
      hint: 'Dua nada tetap yang berdekatan, dan satu klik setiap setengah detik. Tidak ada pengaturan detail yang menajamkan keduanya: klik butuh waktu tajam, dua nada butuh nada halus.',
    },
    ketukan: {
      label: 'Ketukan',
      hint: 'Suara yang sangat pendek. Geser detail ke arah waktu tajam agar setiap ketukan terlihat mendarat — dan perhatikan nadanya jadi kabur.',
    },
    'sapuan-nyquist': {
      label: 'Sapuan melewati batas',
      hint: 'Nadanya terus naik, tetapi pantulannya berbalik dan turun lagi. Lipatan itu namanya aliasing.',
    },
  },

  play: 'Putar',
  stop: 'Hentikan',
  micStart: 'Pakai mikrofon saya',
  micStop: 'Matikan mikrofon',
  micDenied:
    'Izin mikrofon ditolak. Tidak ada yang hilang — contoh suara dan halaman Susun nada sudah utuh dengan sendirinya.',
  micNoDevice: 'Tidak ada perangkat masukan yang ditemukan.',
  micUnsupported: 'Browser ini tidak menyediakan akses mikrofon.',
  micLive: 'Mikrofon menyala',
  micNote: 'Diproses di perangkat ini, tidak dikirim ke mana pun.',

  detailTitle: 'Detail',
  detailHelp:
    'Inilah tradeoff-nya, dan inilah seluruh pelajarannya. Waktu yang lebih tajam mengaburkan nada; nada yang lebih halus mengaburkan waktu. Tidak ada cara membuat keduanya tajam sekaligus.',
  detailSharpTiming: 'Waktu tajam',
  detailBalanced: 'Seimbang',
  detailFinePitch: 'Nada halus',
  detailCustom: 'Bebas',
  detailTimingNote: 'Satu kolom mencakup',
  detailPitchNote: 'Nada yang lebih rapat dari ini menyatu',
  timingBlur: 'Kabur waktu',
  pitchBlur: 'Kabur nada',
  blurNote: 'Satu batang selalu memendek saat yang lain memanjang. Tidak ada yang membuat keduanya pendek.',
  fineTune: 'Penyetelan halus',

  viewTitle: 'Tampilan',
  scaleLabels: {
    linear: 'Jarak rata',
    log: 'Sesuai nada',
    mel: 'Sesuai pendengaran',
  },
  windowLabels: {
    rectangular: 'Rectangular — tanpa taper, leakage terbesar',
    hann: 'Hann — taper kosinus, pilihan umum',
    hamming: 'Hamming — skirt lebih rendah',
    blackman: 'Blackman — leakage terkecil, puncak terlebar',
  },

  advancedTitle: 'Selebihnya',
  advancedHelp:
    'Kontrol yang sebenarnya membentuk gambar ini. Tidak ada yang wajib disentuh untuk membacanya.',

  windowSize: 'Window size',
  windowSizeHelp: 'Berapa sample yang masuk ke satu kolom. Inilah yang diatur kontrol detail.',
  overlap: 'Overlap',
  overlapHelp: 'Seberapa banyak setiap window menumpuk dengan sebelumnya. Menentukan hop.',
  windowFunction: 'Window function',
  windowFunctionHelp:
    'Memotong sinyal secara mendadak menciptakan frekuensi yang sebenarnya tidak ada — leakage. Taper-lah yang menekannya.',
  frequencyScale: 'Skala frekuensi',
  frequencyScaleHelp:
    'Linear adalah apa adanya dari FFT, log sesuai cara nada didengar, mel sesuai cara pendengaran menatanya.',
  dynamicRange: 'Rentang dinamis',
  dynamicRangeHelp: 'Bagian dB mana yang direntangkan ke ramp warna.',

  binSpacing: 'Jarak bin',
  windowDuration: 'Durasi window',
  hopDuration: 'Hop',
  bins: 'Jumlah bin',
  columns: 'Kolom',
  sampleRate: 'Sample rate',
  nyquist: 'Nyquist',
  time: 'Waktu',
  frequency: 'Nada',
  magnitude: 'Kenyaringan',
  bin: 'Bin',
  peak: 'Puncak',
  clipping: 'Terlalu keras',
  clippingHelp:
    'Masukannya clipping — kecilkan sumbernya, atau menjauh sedikit dari mikrofon.',
  hoverHint: 'Arahkan ke gambar',

  synthesisTitle: 'Susun nada',
  synthesisLead:
    'Tumpuk nada murni lalu dengarkan hasilnya. Setelah itu periksa gambarnya: transform seharusnya menemukan persis nada yang Anda masukkan, dengan kekuatan yang persis Anda pilih. Anda yang memegang jawaban benarnya, jadi Anda bisa menguji alat ini, bukan mempercayainya.',
  addPartial: 'Tambah nada',
  removePartial: 'Hapus',
  partial: 'Nada',
  tonesTitle: 'Nada Anda',
  recoveredNote:
    'Kekuatan yang ditemukan sedikit di bawah yang Anda atur. Itu bukan kesalahan: nada yang jatuh di antara dua bin terbagi ke keduanya, jadi tidak ada satu pun yang membaca tinggi penuhnya. Tempatkan nada persis di sebuah bin — 187,5 Hz di sini — dan angkanya kembali utuh.',
  amplitude: 'Kekuatan',
  phase: 'Fase',
  roundTrip: 'Apakah kembali utuh?',
  roundTripHelp:
    'Jalankan transform, lalu jalankan mundur. Kalau benar, sinyal yang keluar sama persis dengan yang masuk — sampai desimal terakhir yang sanggup disimpan komputer.',
  roundTripError: 'Selisih terbesar',
  recovered: 'Ditemukan',
  expected: 'Anda atur',
  spectrumTitle: 'Yang ditemukan transform',
  waveformTitle: 'Gelombang yang Anda susun',
  aliasedWarning: 'Di atas batas — nada ini terlipat turun ke',
  parsevalLabel: 'Energi terjaga (Parseval)',
  verdictExact: 'Sama hingga presisi floating-point',
  verdictOff: 'Tidak sama — layak diperiksa lebih dekat',

  comparisonTitle: 'Periksa hitungannya',
  comparisonLead:
    'Browser punya Fourier transform-nya sendiri. Di sini keduanya berjalan berdampingan pada suara yang persis sama, dengan selisih kedua jawabannya digambar di bawahnya.',
  comparisonHonest:
    'Jujur soal hasilnya: milik browser lebih cepat karena kode native. Yang diklaim di sini adalah kebenaran, bukan kecepatan.',
  comparisonHowTitle: 'Apa yang Anda lihat',
  comparisonHowBody:
    'Garis pucat adalah transform kami, garis cyan milik browser. Di tempat keduanya sepakat, cyan hanya menutupi yang pucat. Panel di bawah menggambar sisanya, diperbesar — beberapa perseratus dB di dekat puncak adalah aritmetika floating-point, bukan ketidaksepakatan.',
  ours: 'FFT kami',
  theirs: 'Milik browser',
  difference: 'Selisih per bin',
  meanDifference: 'Selisih rata-rata',
  worstDifference: 'Selisih terbesar',
  runComparison: 'Jalankan perbandingan',
  comparisonRunning: 'Menjalankan…',
  comparisonUnavailable: 'AnalyserNode tidak tersedia di browser ini.',
  timing: 'Waktu komputasi',
  comparisonEyebrow: 'Hasil',
  comparisonPrompt: 'Jalankan kedua transform pada suara yang sama, dan jawabannya muncul di sini dalam satu kalimat.',
  comparisonVerdict: 'Transform kami dan milik browser sepakat dalam selisih {db} di sekitar setiap puncak.',

  axisTime: 'Waktu →',
  axisPitch: '↑ Nada',
  quiet: 'sunyi',
  loud: 'keras',
  privacyBadge: 'Privat · tanpa jaringan',
  privacyShort: 'Privat',
  units: { hz: 'Hz', db: 'dB', ms: 'ms', s: 's', samples: 'sample' },
}

export const COPY: Record<Locale, Copy> = { en, id }

export function copyFor(locale: string): Copy {
  return isLocale(locale) ? COPY[locale] : COPY[DEFAULT_LOCALE]
}
