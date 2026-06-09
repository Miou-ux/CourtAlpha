/** Ping IndexNow (Bing, Yandex…) après déploiement. */
import {
  allSitemapPaths,
  INDEXNOW_KEY,
  INDEXNOW_KEY_URL,
  SITE_HOST,
  SITE_URL,
} from '../src/lib/seoData.ts'

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

async function main() {
  if (process.env.INDEXNOW_DISABLED === '1') {
    console.log('[indexnow] désactivé (INDEXNOW_DISABLED=1)')
    return
  }

  const urlList = [
    `${SITE_URL}/llms.txt`,
    `${SITE_URL}/llms-full.txt`,
    ...allSitemapPaths().map((p) => `${SITE_URL}${p}`),
  ]

  const body = {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_URL,
    urlList,
  }

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  })

  if (res.status === 200 || res.status === 202) {
    console.log(`[indexnow] OK ${res.status} — ${urlList.length} URL(s)`)
    return
  }

  const text = await res.text().catch(() => '')
  console.warn(`[indexnow] HTTP ${res.status}: ${text.slice(0, 300)}`)
  // Ne pas faire échouer le déploiement
  process.exitCode = 0
}

main().catch((err) => {
  console.warn('[indexnow] erreur:', err)
})
