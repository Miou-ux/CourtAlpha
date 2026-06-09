/**
 * P0 — Génère des index.html par route publique (head + noscript) pour les crawlers.
 * À lancer après `vite build`.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  allSitemapPaths,
  canonicalUrl,
  hasHreflangPair,
  hreflangAlternates,
  jsonLdForPath,
  noscriptHtmlForPath,
  OG_IMAGE,
  parseSeoPath,
  seoForPath,
  SITE_NAME,
} from '../src/lib/seoData.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')

function injectHead(html: string, pathname: string): string {
  const { lang, logicalPath } = parseSeoPath(pathname)
  const seo = seoForPath(pathname)
  const url = canonicalUrl(pathname)
  const jsonLd = jsonLdForPath(pathname)
  const noscript = noscriptHtmlForPath(pathname)
  const ogLocale = lang === 'en' ? 'en_GB' : 'fr_FR'

  let out = html
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${seo.title}</title>`)
  out = out.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${seo.description}" />`,
  )

  const ogImage = seo.ogImage ?? OG_IMAGE

  const hreflangBlock =
    hasHreflangPair(logicalPath) ?
      hreflangAlternates(logicalPath)
        .map((h) => `<link rel="alternate" hreflang="${h.hreflang}" href="${h.href}" />`)
        .join('\n    ')
    : ''

  const headInject = `
    <meta name="robots" content="${seo.robots}" />
    <link rel="canonical" href="${url}" />
    ${hreflangBlock}
    <meta property="og:title" content="${seo.title}" />
    <meta property="og:description" content="${seo.description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:locale" content="${ogLocale}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${seo.title}" />
    <meta name="twitter:description" content="${seo.description}" />
    <meta name="twitter:image" content="${ogImage}" />
    ${jsonLd.length ? `<script type="application/ld+json">${JSON.stringify(jsonLd.length === 1 ? jsonLd[0] : jsonLd)}</script>` : ''}
  `

  out = out.replace('</head>', `${headInject}\n  </head>`)

  if (noscript) {
    out = out.replace(
      '<div id="root"></div>',
      `<noscript>${noscript}</noscript>\n    <div id="root"></div>`,
    )
  }

  return out
}

function routeToDir(routePath: string): string {
  if (routePath === '/') return distDir
  const segments = routePath.replace(/^\//, '').split('/')
  return path.join(distDir, ...segments)
}

function main() {
  const baseHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8')
  const routes = allSitemapPaths()

  for (const route of routes) {
    const dir = routeToDir(route)
    fs.mkdirSync(dir, { recursive: true })
    const html = injectHead(baseHtml, route)
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8')
  }

  console.log(`[seo] ${routes.length} pages statiques générées`)
}

main()
