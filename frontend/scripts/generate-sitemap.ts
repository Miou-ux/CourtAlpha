/** Génère sitemap.xml dans dist/ après le build. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { allSitemapPaths, SITE_URL } from '../src/lib/seoData.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')
const today = new Date().toISOString().slice(0, 10)

function priority(pathname: string): string {
  if (pathname === '/1-day-1-pick' || pathname === '/en/1-day-1-pick') return '1.0'
  if (pathname === '/track-record-faq' || pathname === '/en/track-record-faq') return '0.85'
  if (pathname === '/pricing' || pathname === '/methodo' || pathname === '/en/methodo') return '0.8'
  if (pathname === '/1-day-1-pick/archive' || pathname === '/en/1-day-1-pick/archive') return '0.7'
  return '0.6'
}

function changefreq(pathname: string): string {
  if (pathname === '/1-day-1-pick' || pathname.startsWith('/1-day-1-pick/archive/')) return 'daily'
  if (pathname === '/en/1-day-1-pick' || pathname.startsWith('/en/1-day-1-pick/archive/')) return 'daily'
  if (pathname === '/pricing') return 'weekly'
  return 'monthly'
}

const urls = allSitemapPaths()
  .map(
    (p) => `  <url>
    <loc>${SITE_URL}${p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq(p)}</changefreq>
    <priority>${priority(p)}</priority>
  </url>`,
  )
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf8')
console.log(`[seo] sitemap.xml — ${allSitemapPaths().length} URLs`)
