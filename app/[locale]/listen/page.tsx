import { LOCALES, copyFor } from '@/lib/i18n'
import { PlateWorkbench } from '@/components/plate/PlateWorkbench'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function PlatePage({ params }: { params: { locale: string } }) {
  const copy = copyFor(params.locale)

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8">
      <header className="mb-6">
        <h1 className="font-display text-4xl text-energyHigh">{copy.plateTitle}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-inkMuted">{copy.plateLead}</p>
      </header>

      <PlateWorkbench copy={copy} />
    </div>
  )
}
