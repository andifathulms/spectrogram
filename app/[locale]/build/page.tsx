import { LOCALES, copyFor } from '@/lib/i18n'
import { SynthesisWorkbench } from '@/components/synth/SynthesisWorkbench'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function SynthesisPage({ params }: { params: { locale: string } }) {
  const copy = copyFor(params.locale)

  return (
    <div className="shell py-8 sm:py-10">
      <header className="mb-6">
        <h1 className="display-lg">{copy.synthesisTitle}</h1>
        <p className="lede mt-3 max-w-readable">{copy.synthesisLead}</p>
      </header>

      <SynthesisWorkbench copy={copy} />
    </div>
  )
}
