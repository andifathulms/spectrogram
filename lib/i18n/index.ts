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

  navListen: string
  navBuild: string
  navProof: string
  navHome: string
  skipToContent: string
  footerCredit: string

  // Home
  heroTitle: string
  heroLede: string
  heroCta: string
  heroSecondary: string
  heroCaption: string
  readTitle: string
  readTimeTitle: string
  readTimeBody: string
  readPitchTitle: string
  readPitchBody: string
  readBrightTitle: string
  readBrightBody: string
  tryTitle: string
  tryListenBody: string
  tryBuildBody: string
  tryProofBody: string
  homeWhyTitle: string
  homeWhyBody: string
  homeTradeoffTitle: string
  homeTradeoffBody: string
  homePrivacyTitle: string
  homePrivacyBody: string

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
  axisTime: string
  axisPitch: string
  quiet: string
  loud: string
  privacyBadge: string
  units: { hz: string; db: string; ms: string; s: string; samples: string }
}

const id: Copy = {
  localeName: 'Bahasa Indonesia',
  otherLocaleName: 'English',

  title: 'Spectrogram',

  navListen: 'Lihat suara',
  navBuild: 'Susun nada',
  navProof: 'Buktikan',
  navHome: 'Beranda',
  skipToContent: 'Lewati ke konten',
  footerCredit:
    'Dibuat sebagai penjelasan, bukan produk. Transform-nya ditulis dari nol — Cooley & Tukey (1965), dan Harris (1978) untuk window function.',

  heroTitle: 'Lihat wujud sebuah suara',
  heroLede:
    'Setiap suara adalah tumpukan nada murni. Putar contoh di sini, atau bersiul ke mikrofon Anda, dan halaman ini akan memisahkan nada-nadanya lalu melukisnya begitu terdengar.',
  heroCta: 'Mulai lihat suara',
  heroSecondary: 'Cara membacanya',
  heroCaption:
    'Satu petikan senar gitar: nada dasarnya, dan overtone yang bertumpuk di atasnya. Setiap piksel di sini dihitung oleh transform milik halaman ini sendiri.',

  readTitle: 'Cara membaca gambarnya',
  readTimeTitle: 'Kiri ke kanan: waktu',
  readTimeBody:
    'Gambarnya dilukis satu kolom tipis sekali jalan, seperti seismograf. Tepi kanan adalah suara yang paling baru.',
  readPitchTitle: 'Bawah ke atas: nada',
  readPitchBody:
    'Dengungan rendah berada di bawah, desis dan simbal di atas. Nada yang naik menggambar garis yang memanjat.',
  readBrightTitle: 'Terang berarti keras',
  readBrightBody:
    'Pita terang berarti nada yang kuat; gelap berarti sunyi pada nada itu. Satu petikan gitar menggambar setumpuk garis — nada dasarnya, ditambah overtone di atasnya yang membuatnya terdengar seperti gitar dan bukan seruling.',

  tryTitle: 'Tiga hal untuk dicoba',
  tryListenBody:
    'Putar petikan gitar, akor, ketukan drum, atau suara Anda sendiri, lalu lihat gambarnya terbentuk saat itu juga.',
  tryBuildBody:
    'Tumpuk nada murni dengan slider, dengarkan hasilnya, dan periksa bahwa gambarnya menemukan persis nada yang Anda masukkan.',
  tryProofBody:
    'Jalankan transform kami berdampingan dengan milik browser, dan lihat sendiri seberapa jauh kedua jawabannya berbeda.',

  homeTradeoffTitle: 'Satu gagasan yang layak dibawa pulang',
  homeTradeoffBody:
    'Anda tidak bisa tahu persis kapan sebuah suara terjadi dan persis nada apa itu, sekaligus. Mengukur nada rendah butuh waktu — beberapa siklusnya harus diamati — jadi makin tajam nadanya, makin kabur waktunya. Geser slider detail dan Anda bisa melihat gambarnya menukar yang satu dengan yang lain. Ini matematika yang sama dengan prinsip ketidakpastian Heisenberg, bukan keterbatasan halaman ini.',

  homePrivacyTitle: 'Mikrofon Anda tidak meninggalkan halaman ini',
  homePrivacyBody:
    'Setelah dimuat, halaman ini tidak melakukan permintaan jaringan apa pun — tanpa analytics, tanpa pelaporan error, tanpa apa pun. Suara diproses di dalam tab ini lalu dibuang. Contoh audionya dibangkitkan oleh kode, bukan diunduh, dan ada tes di repositori yang menggagalkan build jika satu saja panggilan jaringan ditambahkan.',

  homeWhyTitle: 'Ditulis tangan, dengan sengaja',
  homeWhyBody:
    'Browser sudah menyediakan Fourier transform, dan spectrogram di atasnya selesai dalam sepuluh baris tanpa mengajarkan apa pun. Transform di sini ditulis dari nol — algoritma Cooley-Tukey yang sama dari 1965 — dan diperiksa dengan empat cara yang saling bebas: terhadap definisi bakunya, terhadap sebuah hukum kekekalan, dengan menjalankannya mundur, dan terhadap sinyal yang jawabannya sudah diketahui lebih dulu.',

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

  axisTime: 'Waktu \u2192',
  axisPitch: '\u2191 Nada',
  quiet: 'sunyi',
  loud: 'keras',
  privacyBadge: 'Tidak ada jaringan',
  units: { hz: 'Hz', db: 'dB', ms: 'ms', s: 's', samples: 'sample' },
}

const en: Copy = {
  localeName: 'English',
  otherLocaleName: 'Bahasa Indonesia',

  title: 'Spectrogram',

  navListen: 'See sound',
  navBuild: 'Build a sound',
  navProof: 'Check the maths',
  navHome: 'Home',
  skipToContent: 'Skip to content',
  footerCredit:
    'Built as an explanation, not a product. The transform is written from scratch — Cooley & Tukey (1965), and Harris (1978) for the windows.',

  heroTitle: 'See what sound looks like',
  heroLede:
    'Every sound is a stack of pure tones. Play one of the samples, or whistle into your microphone, and watch this page pull the tones apart and paint them as they arrive.',
  heroCta: 'Start listening',
  heroSecondary: 'How to read it',
  heroCaption:
    'One plucked guitar string: the note itself, and the overtones stacked above it. Every pixel here was computed by this page\u2019s own transform.',

  readTitle: 'How to read the picture',
  readTimeTitle: 'Left to right is time',
  readTimeBody:
    'The picture is drawn one thin column at a time, the way a seismograph draws. The right-hand edge is the newest sound.',
  readPitchTitle: 'Bottom to top is pitch',
  readPitchBody:
    'Low rumbles sit at the bottom, hiss and cymbals at the top. A note that slides upwards draws a line that climbs.',
  readBrightTitle: 'Bright means loud',
  readBrightBody:
    'A bright band is a strong tone; dark is silence at that pitch. One plucked guitar string draws a whole stack of stripes \u2014 the note itself, plus the overtones above it that make it sound like a guitar and not a flute.',

  tryTitle: 'Three things to try',
  tryListenBody:
    'Play a guitar note, a chord, a drum hit, or your own voice, and watch the picture build as it happens.',
  tryBuildBody:
    'Stack pure tones with sliders, hear the result, and check that the picture finds exactly the tones you put in.',
  tryProofBody:
    'Run our transform beside the browser\u2019s own on the same sound, and see for yourself how far apart the two answers are.',

  homeTradeoffTitle: 'The one idea worth taking away',
  homeTradeoffBody:
    'You cannot know exactly when a sound happened and exactly what pitch it was, both at once. Measuring a low note takes time \u2014 you have to watch several of its cycles go by \u2014 so the sharper the pitch, the blurrier the timing. Drag the detail slider and you can watch the picture trade one for the other. It is the same mathematics as Heisenberg\u2019s uncertainty principle, not a limitation of this page.',

  homePrivacyTitle: 'Your microphone never leaves this page',
  homePrivacyBody:
    'Once loaded, this page makes no network requests at all \u2014 no analytics, no error reporting, nothing. Sound is analysed inside this tab and thrown away. The sample sounds are generated by code rather than downloaded, and a test in the repository fails the build if a single network call is ever added.',

  homeWhyTitle: 'Written by hand, on purpose',
  homeWhyBody:
    'Browsers already ship a Fourier transform, and a spectrogram built on top of it takes ten lines and teaches nobody anything. The transform here is written from scratch \u2014 the same Cooley-Tukey algorithm from 1965 \u2014 and checked four independent ways: against the textbook definition, against a conservation law, by running it backwards, and against signals whose answers are known in advance.',

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

  axisTime: 'Time \u2192',
  axisPitch: '\u2191 Pitch',
  quiet: 'quiet',
  loud: 'loud',
  privacyBadge: 'No network',
  units: { hz: 'Hz', db: 'dB', ms: 'ms', s: 's', samples: 'samples' },
}

export const COPY: Record<Locale, Copy> = { en, id }

export function copyFor(locale: string): Copy {
  return isLocale(locale) ? COPY[locale] : COPY[DEFAULT_LOCALE]
}
