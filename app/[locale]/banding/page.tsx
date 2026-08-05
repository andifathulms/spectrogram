import { LOCALES, copyFor } from '@/lib/i18n'
import { ComparisonWorkbench } from '@/components/compare/ComparisonWorkbench'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function ComparisonPage({ params }: { params: { locale: string } }) {
  const copy = copyFor(params.locale)

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8">
      <header className="mb-6">
        <h1 className="font-display text-4xl text-energyHigh">{copy.comparisonTitle}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#9aa6b2]">
          {copy.comparisonLead}
        </p>
      </header>

      <ComparisonWorkbench copy={copy} />
    </div>
  )
}
