import Link from 'next/link'

import { LOCALES, copyFor } from '@/lib/i18n'
import { path, type Route } from '@/lib/routes'
import { HeroPlate } from '@/components/home/HeroPlate'
import { TradeoffFigure } from '@/components/home/TradeoffFigure'
import { BuildPreview, ListenPreview, ProofPreview } from '@/components/home/ModePreviews'
import { Emphasis } from '@/components/ui/Emphasis'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

/*
 * The page follows one rule: show, then explain. The plate comes first and
 * teaches itself with markers; the tradeoff is three plates side by side
 * rather than a paragraph; the claims are figures you can check.
 */
export default function HomePage({ params }: { params: { locale: string } }) {
  const copy = copyFor(params.locale)
  const { locale } = params

  const modes: { route: Route; title: string; body: string; preview: React.ReactNode }[] = [
    { route: 'listen', title: copy.navListen, body: copy.tryListenBody, preview: <ListenPreview /> },
    { route: 'build', title: copy.navBuild, body: copy.tryBuildBody, preview: <BuildPreview /> },
    { route: 'proof', title: copy.navProof, body: copy.tryProofBody, preview: <ProofPreview /> },
  ]

  const trust = [
    { figure: '0', label: copy.trustNetwork },
    { figure: '4', label: copy.trustChecks },
    { figure: '0', label: copy.trustLibraries },
  ]

  return (
    <div className="shell pb-4 pt-12 sm:pt-16">
      {/* The claim, then the thing itself at full width. */}
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-14">
        <h1 className="display-xl text-balance">
          <Emphasis text={copy.heroTitle} />
        </h1>
        <div>
          <p className="lede max-w-readable">{copy.heroLede}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href={path(locale, 'listen')} className="action-primary">
              {copy.heroCta}
            </Link>
            <a href="#tradeoff" className="action-quiet">
              {copy.heroSecondary}
            </a>
          </div>
        </div>
      </section>

      <div className="mt-10 sm:mt-12">
        <HeroPlate copy={copy} />
      </div>

      {/* The lesson, as a comparison you can see before touching anything. */}
      <section id="tradeoff" className="scroll-mt-24 pt-24 sm:pt-32">
        <p className="eyebrow">{copy.tradeoffEyebrow}</p>
        <h2 className="display-lg mt-4 max-w-[22ch] text-balance">
          <Emphasis text={copy.tradeoffTitle} />
        </h2>
        <p className="lede mt-5 max-w-readable">{copy.tradeoffBody}</p>

        <div className="mt-10">
          <TradeoffFigure copy={copy} />
        </div>

        <Link href={path(locale, 'listen')} className="action-quiet mt-8">
          {copy.tradeoffCta} →
        </Link>
      </section>

      {/* Where to go next. Unequal on purpose: See sound is the main experience. */}
      <section className="pt-24 sm:pt-32">
        <p className="eyebrow">{copy.modesEyebrow}</p>
        <h2 className="display-lg mt-4 text-balance">
          <Emphasis text={copy.modesTitle} />
        </h2>

        <div className="mt-10 grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {modes.map((mode, index) => (
            <Link
              key={mode.route}
              href={path(locale, mode.route)}
              className={`group grid overflow-hidden rounded-card border border-hairline bg-plate shadow-glass transition-colors hover:border-emulsion ${
                index === 0 ? 'grid-rows-[minmax(13rem,1fr)_auto] md:row-span-2' : 'grid-rows-[auto_1fr]'
              }`}
            >
              <div
                className={`border-b border-hairline px-6 py-6 ${index === 0 ? '' : 'h-32'}`}
              >
                <div className="relative h-full">{mode.preview}</div>
              </div>
              <div className="flex flex-col gap-2 p-6">
                <h3 className="display-md">{mode.title}</h3>
                <p className="body max-w-readable flex-1">{mode.body}</p>
                <span className="mt-2 text-sm font-medium text-energyHigh">
                  {index === 0 ? copy.heroCta : copy.modeOpen}{' '}
                  <span className="inline-block transition-transform group-hover:translate-x-0.5" aria-hidden>
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* The two claims that need to be believed, as figures, then in words. */}
      <section className="pt-24 sm:pt-32">
        <p className="eyebrow">{copy.trustEyebrow}</p>
        <h2 className="display-lg mt-4 text-balance">
          <Emphasis text={copy.trustTitle} />
        </h2>

        <div className="mt-10 grid border-y border-hairline sm:grid-cols-3">
          {trust.map((item, index) => (
            <div
              key={item.label}
              className={`py-6 sm:pr-6 ${index > 0 ? 'border-t border-hairline sm:border-l sm:border-t-0 sm:pl-6' : ''}`}
            >
              <p className="m-0">
                <span className="block font-display text-6xl leading-none text-energyHigh">{item.figure}</span>
                <span className="mt-2 block max-w-[26ch] text-sm leading-relaxed text-inkMuted">{item.label}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="display-md">{copy.homePrivacyTitle}</h3>
            <p className="body mt-3 max-w-readable">{copy.homePrivacyBody}</p>
          </div>
          <div>
            <h3 className="display-md">{copy.homeWhyTitle}</h3>
            <p className="body mt-3 max-w-readable">{copy.homeWhyBody}</p>
            <Link href={path(locale, 'proof')} className="action-quiet mt-5">
              {copy.navProof} →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
