import Link from 'next/link'

import { LOCALES, copyFor } from '@/lib/i18n'
import { path } from '@/lib/routes'
import { RampLegend } from '@/components/plate/RampLegend'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function HomePage({ params }: { params: { locale: string } }) {
  const copy = copyFor(params.locale)

  const sections = [
    { title: copy.homeWhyTitle, body: copy.homeWhyBody },
    { title: copy.homeTradeoffTitle, body: copy.homeTradeoffBody },
    { title: copy.homePrivacyTitle, body: copy.homePrivacyBody },
  ]

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-14">
      <h1 className="font-display text-5xl leading-tight text-energyHigh sm:text-7xl">
        {copy.tagline}
      </h1>

      <p className="mt-8 max-w-3xl text-lg leading-relaxed text-[#b3bdc7]">{copy.homeLead}</p>

      <div className="mt-10 flex flex-wrap items-center gap-6">
        <Link
          href={path(params.locale, 'listen')}
          className="border border-instrument px-5 py-2.5 text-sm text-instrument hover:bg-instrument hover:text-plate"
        >
          {copy.homeStart}
        </Link>
        <RampLegend />
      </div>

      <div className="mt-16 grid gap-10 border-t border-emulsion pt-10 md:grid-cols-3">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-2xl text-energyHigh">{section.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#9aa6b2]">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
