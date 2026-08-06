import { LOCALES, copyFor } from '@/lib/i18n'
import { PlateWorkbench } from '@/components/plate/PlateWorkbench'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function ListenPage({ params }: { params: { locale: string } }) {
  const copy = copyFor(params.locale)

  return (
    <div className="shell py-8 sm:py-10">
      <header className="mb-6">
        <h1 className="display-lg">{copy.listenTitle}</h1>
        <p className="lede mt-3 max-w-readable">{copy.listenLede}</p>
      </header>

      <PlateWorkbench copy={copy} />
    </div>
  )
}
