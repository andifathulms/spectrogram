import { emphasis } from '@/lib/ui/emphasis'

/** A headline from the dictionary, with its one `*marked*` word set in italic. */
export function Emphasis({ text }: { text: string }) {
  return (
    <>
      {emphasis(text).map((part, index) =>
        part.em ? <em key={index}>{part.text}</em> : <span key={index}>{part.text}</span>,
      )}
    </>
  )
}
