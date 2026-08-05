/**
 * Invariant 9 and PRD §7: zero network requests at runtime. Verified, not
 * assumed.
 *
 * A promise in prose is worth nothing to someone deciding whether to grant
 * microphone access. This suite reads the source and fails if any network
 * primitive appears in shipped code at all — so the claim on the page is
 * structurally true rather than currently true.
 */

import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const ROOT = new URL('../..', import.meta.url).pathname

/** Everything that ships to the browser. */
const SHIPPED = ['app', 'components', 'lib', 'workers', 'data', 'public']

/** Anything here would move bytes off the device. */
const FORBIDDEN: { pattern: RegExp; what: string }[] = [
  { pattern: /\bfetch\s*\(/, what: 'fetch()' },
  { pattern: /\bXMLHttpRequest\b/, what: 'XMLHttpRequest' },
  { pattern: /\bnavigator\s*\.\s*sendBeacon\b/, what: 'navigator.sendBeacon' },
  { pattern: /\bnew\s+WebSocket\b/, what: 'WebSocket' },
  { pattern: /\bnew\s+EventSource\b/, what: 'EventSource' },
  { pattern: /\bimportScripts\s*\(/, what: 'importScripts()' },
  { pattern: /\bnavigator\s*\.\s*geolocation\b/, what: 'geolocation' },
  { pattern: /\bRTCPeerConnection\b/, what: 'RTCPeerConnection' },
  { pattern: /\bMediaRecorder\b/, what: 'MediaRecorder' },
  { pattern: /https?:\/\/(?!localhost)/, what: 'an absolute URL' },
]

function walk(directory: string, out: string[] = []): string[] {
  for (const entry of readdirSync(directory)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (['.ts', '.tsx', '.js', '.jsx', '.css'].includes(extname(path))) out.push(path)
  }
  return out
}

const files = SHIPPED.flatMap((directory) => walk(join(ROOT, directory)))

describe('nothing that ships can reach the network', () => {
  it('finds source to scan, so a passing run means something', () => {
    expect(files.length).toBeGreaterThan(20)
  })

  it.each(FORBIDDEN)('contains no $what', ({ pattern, what }) => {
    const offenders: string[] = []

    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      source.split('\n').forEach((line, index) => {
        // A comment may name the thing it is promising not to do.
        const trimmed = line.trim()
        if (trimmed.startsWith('*') || trimmed.startsWith('//')) return
        if (pattern.test(line)) offenders.push(`${relative(ROOT, file)}:${index + 1} — ${trimmed}`)
      })
    }

    expect(offenders, `${what} found in shipped code:\n${offenders.join('\n')}`).toEqual([])
  })
})

describe('audio never leaves the device', () => {
  it('nothing serialises a sample buffer anywhere but to our own worker', () => {
    const posts: string[] = []
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      if (/postMessage/.test(source)) posts.push(relative(ROOT, file))
    }

    // postMessage crosses threads inside this tab and nothing else. The list
    // is pinned so a new caller has to be considered rather than slipped in.
    expect(posts.sort()).toEqual([
      'lib/audio/analysis.ts',
      'lib/audio/capture.ts',
      'public/worklets/tap.worklet.js',
      'workers/analyser.worker.ts',
    ])
  })

  it('the microphone stream is stopped explicitly, not left to the collector', () => {
    const capture = readFileSync(join(ROOT, 'lib/audio/capture.ts'), 'utf8')
    expect(capture).toMatch(/getTracks\(\)\.forEach\(\(track\) => track\.stop\(\)\)/)
  })
})

describe('the transform is ours', () => {
  it('AnalyserNode is constructed only in the comparison view', () => {
    // Construction, not mention: the name legitimately appears in a comment
    // in playback.ts and as a label in the dictionary.
    const construction = /createAnalyser\s*\(|new\s+AnalyserNode\b/
    const users = files.filter((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .some((line) => {
          const trimmed = line.trim()
          if (trimmed.startsWith('*') || trimmed.startsWith('//')) return false
          return construction.test(line)
        }),
    )
    expect(users.map((file) => relative(ROOT, file)).sort()).toEqual(['lib/audio/compare.ts'])
  })

  it('the O(n²) oracle is never imported outside tests', () => {
    const importers = files.filter((file) => /from\s+['"].*dsp\/dft['"]/.test(readFileSync(file, 'utf8')))
    expect(importers).toEqual([])
  })

  it('no DSP, audio or charting dependency was added', () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>
    }
    expect(Object.keys(manifest.dependencies).sort()).toEqual(['next', 'react', 'react-dom'])
  })
})
