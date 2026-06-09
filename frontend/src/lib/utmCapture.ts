const UTM_STORAGE_KEY = 'courtalpha_utm_v1'

export type UtmParams = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

export function readUtmFromSearch(search: string): UtmParams {
  const p = new URLSearchParams(search)
  const out: UtmParams = {}
  const src = p.get('utm_source')?.trim()
  const med = p.get('utm_medium')?.trim()
  const camp = p.get('utm_campaign')?.trim()
  if (src) out.utm_source = src
  if (med) out.utm_medium = med
  if (camp) out.utm_campaign = camp
  return out
}

/** Conserve les UTM de la landing (session) pour les pages suivantes en SPA. */
export function captureUtmSession(search: string): UtmParams {
  const fromUrl = readUtmFromSearch(search)
  if (fromUrl.utm_source || fromUrl.utm_medium || fromUrl.utm_campaign) {
    try {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl))
    } catch {
      /* ignore */
    }
    return fromUrl
  }
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as UtmParams
  } catch {
    return {}
  }
}
