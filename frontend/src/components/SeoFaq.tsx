type FaqItem = { q: string; a: string }

type SeoFaqProps = {
  title?: string
  items: readonly FaqItem[]
}

export function SeoFaq({ title = 'Questions fréquentes', items }: SeoFaqProps) {
  return (
    <section className="mt-8 rounded-2xl border border-border bg-panel p-5" aria-labelledby="seo-faq-title">
      <h2 id="seo-faq-title" className="mb-4 text-lg font-semibold">
        {title}
      </h2>
      <dl className="space-y-4">
        {items.map((item) => (
          <div key={item.q}>
            <dt className="font-medium text-white">{item.q}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
