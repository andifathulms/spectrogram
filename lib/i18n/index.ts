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

  // Shared
  axisTime: string
  axisPitch: string
  quiet: string
  loud: string
  privacyBadge: string
  units: { hz: string; db: string; ms: string; s: string; samples: string }
}

const en: Copy = {
  otherLocaleName: 'Bahasa Indonesia',

  title: 'Spectrogram',

  navListen: 'See sound',
  navBuild: 'Build a sound',
  navProof: 'Check the maths',
  skipToContent: 'Skip to content',
  footerCredit:
    'Built as an explanation, not a product. The transform is written from scratch — Cooley-Tukey (1965), and Harris (1978) for the windows.',

  heroTitle: 'See what sound looks like',
  heroLede:
    'Every sound is a stack of pure tones. Play one of the samples, or whistle into your microphone, and watch this page pull the tones apart and paint them as they arrive.',
  heroCta: 'Start listening',
  heroSecondary: 'How to read it',
  heroCaption:
    'One plucked guitar string: the note itself, and the overtones stacked above it. Every pixel here was computed by this page’s own transform.',

  readTitle: 'How to read the picture',
  readTimeTitle: 'Left to right is time',
  readTimeBody:
    'The picture is drawn one thin column at a time, the way a seismograph draws. The right-hand edge is the newest sound.',
  readPitchTitle: 'Bottom to top is pitch',
  readPitchBody:
    'Low rumbles sit at the bottom, hiss and cymbals at the top. A note that slides upwards draws a line that climbs.',
  readBrightTitle: 'Bright means loud',
  readBrightBody:
    'A bright band is a strong tone; dark is silence at that pitch. One plucked guitar string draws a whole stack of stripes — the note itself, plus the overtones above it that make it sound like a guitar and not a flute.',

  tryTitle: 'Three things to try',
  tryListenBody:
    'Play a guitar note, a chord, a drum hit, or your own voice, and watch the picture build as it happens.',
  tryBuildBody:
    'Stack pure tones with sliders, hear the result, and check that the picture finds exactly the tones you put in.',
  tryProofBody:
    'Run our transform beside the browser’s own on the same sound, and see for yourself how far apart the two answers are.',

  homeTradeoffTitle: 'The one idea worth taking away',
  homeTradeoffBody:
    'You cannot know exactly when a sound happened and exactly what pitch it was, both at once. Measuring a low note takes time — you have to watch several of its cycles go by — so the sharper the pitch, the blurrier the timing. Drag the detail control and you can watch the picture trade one for the other. It is the same mathematics as Heisenberg’s uncertainty principle, not a limitation of this page.',

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

  axisTime: 'Time →',
  axisPitch: '↑ Pitch',
  quiet: 'quiet',
  loud: 'loud',
  privacyBadge: 'No network',
  units: { hz: 'Hz', db: 'dB', ms: 'ms', s: 's', samples: 'samples' },
}

const id: Copy = {
  otherLocaleName: 'English',

  title: 'Spectrogram',

  navListen: 'Lihat suara',
  navBuild: 'Susun nada',
  navProof: 'Periksa hitungannya',
  skipToContent: 'Lewati ke konten',
  footerCredit:
    'Dibuat sebagai penjelasan, bukan produk. Transform-nya ditulis dari nol — Cooley-Tukey (1965), dan Harris (1978) untuk window function.',

  heroTitle: 'Lihat wujud sebuah suara',
  heroLede:
    'Setiap suara adalah tumpukan nada murni. Putar salah satu contoh, atau bersiul ke mikrofon Anda, dan lihat halaman ini memisahkan nada-nadanya lalu melukisnya begitu terdengar.',
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
    'Anda tidak bisa tahu persis kapan sebuah suara terjadi dan persis nada apa itu, sekaligus. Mengukur nada rendah butuh waktu — beberapa siklusnya harus diamati — jadi makin tajam nadanya, makin kabur waktunya. Geser kontrol detail dan Anda bisa melihat gambarnya menukar yang satu dengan yang lain. Ini matematika yang sama dengan prinsip ketidakpastian Heisenberg, bukan keterbatasan halaman ini.',

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

  axisTime: 'Waktu →',
  axisPitch: '↑ Nada',
  quiet: 'sunyi',
  loud: 'keras',
  privacyBadge: 'Tidak ada jaringan',
  units: { hz: 'Hz', db: 'dB', ms: 'ms', s: 's', samples: 'sample' },
}

export const COPY: Record<Locale, Copy> = { en, id }

export function copyFor(locale: string): Copy {
  return isLocale(locale) ? COPY[locale] : COPY[DEFAULT_LOCALE]
}
