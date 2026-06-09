import { useTranslation } from 'react-i18next'
import { type AppLang, setAppLang, SUPPORTED_LANGS } from '../i18n'
import { cn } from '../lib/utils'

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation()
  const current = (SUPPORTED_LANGS.includes(i18n.language as AppLang) ? i18n.language : 'fr') as AppLang

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border border-border bg-bg-elevated p-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-xs',
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {SUPPORTED_LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setAppLang(lang)}
          className={cn(
            'rounded-full px-2 py-1 transition sm:px-2.5',
            current === lang ? 'bg-accent/20 text-white' : 'text-muted hover:text-white',
          )}
          aria-pressed={current === lang}
        >
          {lang}
        </button>
      ))}
    </div>
  )
}
