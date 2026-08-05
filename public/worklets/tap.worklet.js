/**
 * Capture tap — an AudioWorkletProcessor that computes nothing.
 *
 * Its entire job is to copy each 128-sample render quantum off the audio
 * thread and post it to the main thread, which forwards it to the analysis
 * worker. The transform deliberately does not live here: an AudioWorklet
 * module cannot reliably use ES imports, so the FFT would have to be a second,
 * inlined copy of lib/dsp — untested by the correctness suites, and the exact
 * failure mode the project exists to rule out.
 *
 * Plain JavaScript on purpose. It is loaded by URL with addModule(), so it is
 * a static asset rather than something the bundler sees, and nothing here
 * needs types or a build step.
 *
 * Samples are batched to keep the message rate reasonable; at 48 kHz a batch
 * of 16 quanta is about 43 ms of audio.
 */

const QUANTA_PER_MESSAGE = 16
const QUANTUM = 128

const BATCH_SAMPLES = QUANTA_PER_MESSAGE * QUANTUM

class TapProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.buffer = new Float32Array(BATCH_SAMPLES)
    this.filled = 0
    this.running = true
    // Buffers the main thread has finished with and sent back. Allocating on
    // the audio thread is the one thing worth avoiding here.
    this.pool = []

    this.port.onmessage = (event) => {
      const data = event.data
      if (data && data.type === 'stop') {
        this.running = false
      } else if (data instanceof Float32Array && this.pool.length < 4) {
        this.pool.push(data)
      }
    }
  }

  process(inputs) {
    if (!this.running) return false

    const input = inputs[0]
    if (!input || input.length === 0) return true

    // Mono: the spectrogram analyses one channel, and averaging two would
    // cancel out-of-phase content rather than show it.
    const channel = input[0]
    if (!channel) return true

    const room = this.buffer.length - this.filled
    const take = channel.length < room ? channel.length : room
    this.buffer.set(channel.subarray(0, take), this.filled)
    this.filled += take

    if (this.filled >= this.buffer.length) {
      const out = this.buffer
      this.buffer = this.pool.pop() ?? new Float32Array(BATCH_SAMPLES)
      this.filled = 0
      this.port.postMessage(out, [out.buffer])
    }

    return true
  }
}

registerProcessor('urai-tap', TapProcessor)
