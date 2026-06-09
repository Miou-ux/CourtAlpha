import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { canonicalUrl, jsonLdForPath, OG_IMAGE, SITE_NAME, seoForPath } from '../lib/seo'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

function upsertJsonLd(blocks: object[]) {
  const id = 'seo-jsonld'
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!blocks.length) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(blocks.length === 1 ? blocks[0] : blocks)
}

/** Met à jour title, canonical, meta, OG, Twitter et JSON-LD à chaque route. */
export function usePageSeo() {
  const { pathname } = useLocation()
  const { i18n } = useTranslation()
  const lang = i18n.language

  useEffect(() => {
    const seo = seoForPath(pathname, lang)
    const url = canonicalUrl(pathname)
    const ogImage = seo.ogImage ?? OG_IMAGE
    const ogLocale = lang.startsWith('en') ? 'en_GB' : 'fr_FR'

    document.title = seo.title
    upsertMeta('name', 'description', seo.description)
    upsertMeta('name', 'robots', seo.robots)
    upsertLink('canonical', url)

    upsertMeta('property', 'og:title', seo.title)
    upsertMeta('property', 'og:description', seo.description)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:image', ogImage)
    upsertMeta('property', 'og:locale', ogLocale)

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', seo.title)
    upsertMeta('name', 'twitter:description', seo.description)
    upsertMeta('name', 'twitter:image', ogImage)

    upsertJsonLd(jsonLdForPath(pathname, lang))
  }, [pathname, lang])
}
