import { Link } from 'react-router-dom'

type SeoEditorialProps = {
  title: string
  paragraphs: readonly string[]
  links?: readonly { href: string; label: string }[]
}

export function SeoEditorial({ title, paragraphs, links }: SeoEditorialProps) {
  return (
    <section className="mt-8 rounded-2xl border border-border/80 bg-panel/60 p-5 text-sm leading-relaxed text-muted">
      <h2 className="mb-3 text-base font-semibold text-white">{title}</h2>
      <div className="space-y-3">
        {paragraphs.map((p) => (
          <p key={p.slice(0, 40)}>{p}</p>
        ))}
      </div>
      {links && links.length > 0 && (
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-accent">
          {links.map((l) => (
            <Link key={l.href} to={l.href} className="hover:underline">
              {l.label} →
            </Link>
          ))}
        </p>
      )}
    </section>
  )
}
