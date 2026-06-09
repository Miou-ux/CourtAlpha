/** Génère llms.txt et llms-full.txt dans dist/ (crawlers IA). */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  allSitemapPaths,
  COURTALPHA_ABOUT,
  PAGE_SEO,
  SITE_URL,
} from '../src/lib/seoData.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')

const publicPages = allSitemapPaths()
  .map((p) => {
    const seo = PAGE_SEO[p]
    return seo ? `- [${p}](${SITE_URL}${p}) — ${seo.description}` : `- ${SITE_URL}${p}`
  })
  .join('\n')

const llmsTxt = `# CourtAlpha
> ${COURTALPHA_ABOUT.summary}

${COURTALPHA_ABOUT.disclaimer}

## Pages publiques
${publicPages}

## Fichiers
- Documentation étendue : ${SITE_URL}/llms-full.txt
- Sitemap : ${SITE_URL}/sitemap.xml
`

const llmsFull = `# CourtAlpha — documentation publique (LLM)

## ${COURTALPHA_ABOUT.title}

${COURTALPHA_ABOUT.summary}

${COURTALPHA_ABOUT.bullets.map((b) => `- ${b}`).join('\n')}

${COURTALPHA_ABOUT.disclaimer}

## Pages indexables

${publicPages
  .split('\n')
  .map((line) => line.replace(/^- /, '### '))
  .join('\n\n')}

## Identité
- Nom : CourtAlpha
- URL : ${SITE_URL}
- Catégorie : value bets tennis, probabilités modèle, track record public
- Langue principale : fr-FR
`

fs.writeFileSync(path.join(distDir, 'llms.txt'), llmsTxt, 'utf8')
fs.writeFileSync(path.join(distDir, 'llms-full.txt'), llmsFull, 'utf8')
console.log('[seo] llms.txt + llms-full.txt générés')
