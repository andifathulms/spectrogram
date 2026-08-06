'use client'

/**
 * The root path exists only to send visitors to the default locale. A static
 * export cannot issue a redirect, so it happens on the client, with a real
 * link behind it for anyone the script does not reach.
 */

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { DEFAULT_LOCALE } from '@/lib/i18n'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace(`/${DEFAULT_LOCALE}/`)
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Link href={`/${DEFAULT_LOCALE}/`} className="font-display text-3xl text-instrument underline">
        Spectrogram
      </Link>
    </main>
  )
}
