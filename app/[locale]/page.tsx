import Link from 'next/link'

import { LOCALES, copyFor } from '@/lib/i18n'
import { path, type Route } from '@/lib/routes'
import { HeroPlate } from '@/components/home/HeroPlate'
import { RampBar } from '@/components/plate/RampLegend'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function HomePage({ params }: { params: { locale: string } }) {
  const copy = copyFor(params.locale)
  const { locale } = params

  const axes = [
    { title: copy.readTimeTitle, body: copy.readTimeBody, figure: <TimeFigure /> },
    { title: copy.readPitchTitle, body: copy.readPitchBody, figure: <PitchFigure /> },
    { title: copy.readBrightTitle, body: copy.readBrightBody, figure: <BrightFigure /> },
  ]

  const destinations: { route: Route; title: string; body: string }[] = [
    { route: 'listen', title: copy.navListen, body: copy.tryListenBody },
    { route: 'build', title: copy.navBuild, body: copy.tryBuildBody },
    { route: 'proof', title: copy.navProof, body: copy.tryProofBody },
  ]

  return (
    <div className="shell pb-4 pt-10 sm:pt-14">
      {/* Hero: the claim on the left, the thing itself on the right. */}
      <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-14">
        <div>
          <h1 className="display-xl text-balance">{copy.heroTitle}</h1>
          <p className="lede mt-6 max-w-readable">{copy.heroLede}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={path(locale, 'listen')}
              className="rounded-full bg-instrument px-5 py-2.5 text-sm font-medium text-plate transition-opacity hover:opacity-90"
            >
              {copy.heroCta}
            </Link>
            <a
              href="#read"
              className="rounded-full border border-hairline px-5 py-2.5 text-sm text-inkMuted transition-colors hover:border-instrument hover:text-instrument"
            >
              {copy.heroSecondary}
            </a>
          </div>

          <p className="mt-6 flex items-center gap-2 text-sm text-inkFaint">
            <span className="block h-1.5 w-1.5 rounded-full bg-instrument" aria-hidden />
            {copy.homePrivacyTitle}
          </p>
        </div>

        <HeroPlate copy={copy} />
      </section>

      {/* How to read it — the three questions every first-time viewer has. */}
      <section id="read" className="scroll-mt-20 pt-20 sm:pt-24">
        <h2 className="display-lg">{copy.readTitle}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {axes.map((axis) => (
            <div key={axis.title} className="card p-5">
              <div className="mb-5 h-14">{axis.figure}</div>
              <h3 className="display-md">{axis.title}</h3>
              <p className="body mt-2">{axis.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Where to go next. */}
      <section className="pt-20 sm:pt-24">
        <h2 className="display-lg">{copy.tryTitle}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {destinations.map((destination, index) => (
            <Link
              key={destination.route}
              href={path(locale, destination.route)}
              className="card group flex flex-col p-5 transition-colors hover:border-instrument"
            >
              <span className="tabular text-xs text-inkFaint">{`0${index + 1}`}</span>
              <h3 className="display-md mt-2 group-hover:text-instrument">{destination.title}</h3>
              <p className="body mt-2 flex-1">{destination.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* The lesson. Given the most room on the page, because it is the point. */}
      <section className="mt-20 rounded-card border border-hairline bg-surface p-6 sm:mt-24 sm:p-10">
        <h2 className="display-lg max-w-readable text-balance">{copy.homeTradeoffTitle}</h2>
        <p className="lede mt-5 max-w-readable">{copy.homeTradeoffBody}</p>
        <Link
          href={path(locale, 'listen')}
          className="mt-7 inline-block rounded-full border border-instrument px-5 py-2.5 text-sm text-instrument transition-colors hover:bg-instrument hover:text-plate"
        >
          {copy.heroCta}
        </Link>
      </section>

      {/* The two claims that need to be believed, not just stated. */}
      <section className="grid gap-10 pt-20 sm:pt-24 md:grid-cols-2">
        <div>
          <h2 className="display-md">{copy.homePrivacyTitle}</h2>
          <p className="body mt-3 max-w-readable">{copy.homePrivacyBody}</p>
        </div>
        <div>
          <h2 className="display-md">{copy.homeWhyTitle}</h2>
          <p className="body mt-3 max-w-readable">{copy.homeWhyBody}</p>
        </div>
      </section>
    </div>
  )
}

/*
 * The three figures below are the axes drawn small, in the plate's own tones.
 * They are decoration in the sense that they carry no data, and explanation in
 * the sense that they are the same shapes the plate draws.
 */

function TimeFigure() {
  const columns = [3, 6, 10, 16, 24, 34, 44, 52, 46, 36, 26, 18, 12, 8, 5, 3]

  return (
    <div className="flex h-full items-end gap-[3px]" aria-hidden>
      {columns.map((height, index) => (
        <span
          key={index}
          className="block w-full rounded-[1px] bg-energyMid"
          style={{ height: `${height}%`, opacity: 0.35 + (index / columns.length) * 0.65 }}
        />
      ))}
    </div>
  )
}

function PitchFigure() {
  const stripes = [
    { top: '8%', width: '55%', className: 'bg-energyHigh' },
    { top: '32%', width: '78%', className: 'bg-energyMid' },
    { top: '56%', width: '92%', className: 'bg-energyMid/70' },
    { top: '80%', width: '70%', className: 'bg-energyLow' },
  ]

  return (
    <div className="relative h-full w-full" aria-hidden>
      {stripes.map((stripe) => (
        <span
          key={stripe.top}
          className={`absolute left-0 block h-[3px] rounded-full ${stripe.className}`}
          style={{ top: stripe.top, width: stripe.width }}
        />
      ))}
    </div>
  )
}

function BrightFigure() {
  return (
    <div className="flex h-full items-center" aria-hidden>
      <RampBar className="h-3 w-full" />
    </div>
  )
}
