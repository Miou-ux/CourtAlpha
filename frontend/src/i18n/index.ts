import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import fr from './locales/fr.json'

export const LANG_STORAGE_KEY = 'courtalpha_lang'
export const SUPPORTED_LANGS = ['fr', 'en'] as const
export type AppLang = (typeof SUPPORTED_LANGS)[number]

function storedLang(): AppLang | null {
  try {
    const raw = localStorage.getItem(LANG_STORAGE_KEY)
    if (raw === 'fr' || raw === 'en') return raw
  } catch {
    /* private mode */
  }
  return null
}

function detectLang(): AppLang {
  const saved = storedLang()
  if (saved) return saved

  const browser = (navigator.language || '').toLowerCase()
  if (browser.startsWith('en')) return 'en'
  return 'fr'
}

export function setAppLang(lang: AppLang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang)
  } catch {
    /* private mode */
  }
  document.documentElement.lang = lang
  void i18n.changeLanguage(lang)
}

function syncDocumentLang(lang: string) {
  document.documentElement.lang = lang.startsWith('en') ? 'en' : 'fr'
}

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: detectLang(),
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
})

syncDocumentLang(i18n.language)
i18n.on('languageChanged', syncDocumentLang)

export default i18n
