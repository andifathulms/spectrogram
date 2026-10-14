/**
 * One emphasised word per headline, written in the dictionary as `*word*`.
 *
 * The marker lives in the copy rather than in a component so each language
 * chooses its own word — English stresses "looks", Indonesian "wujud" — and
 * a translator sees the emphasis while translating.
 */

export interface TextPart {
  text: string
  em: boolean
}

export function emphasis(text: string): TextPart[] {
  const parts: TextPart[] = []
  const pattern = /\*([^*]+)\*/g
  let last = 0
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0
    if (at > last) parts.push({ text: text.slice(last, at), em: false })
    parts.push({ text: match[1], em: true })
    last = at + match[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), em: false })
  return parts
}

/** The same string with its markers removed, for metadata and accessible names. */
export function plain(text: string): string {
  return text.replace(/\*([^*]+)\*/g, '$1')
}
