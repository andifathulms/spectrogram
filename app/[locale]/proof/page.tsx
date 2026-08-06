import { LOCALES, copyFor } from '@/lib/i18n'
import { ComparisonWorkbench } from '@/components/compare/ComparisonWorkbench'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function ComparisonPage({ params }: { params: { locale: string } }) {
  const copy = copyFor(params.locale)

  return (
    <div className="shell py-8 sm:py-10">
      <header className="mb-6">
        <h1 className="display-lg">{copy.comparisonTitle}</h1>
        <p className="lede mt-3 max-w-readable">{copy.comparisonLead}</p>
      </header>

      <ComparisonWorkbench copy={copy} />
    </div>
  )
}
