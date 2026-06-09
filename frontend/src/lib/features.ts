/** Feature flags — prod off by default unless VITE_*=1 at build time. */

function _viteEnv(key: string): string {
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env
    return (env?.[key] ?? '').trim()
  } catch {
    return ''
  }
}

const flag = (key: string, defaultInDev: boolean): boolean => {
  const v = _viteEnv(key)
  if (v === '1') return true
  if (v === '0') return false
  return defaultInDev && !import.meta.env.PROD
}

/** Tarifs / checkout Premium — masqué en prod tant que VITE_PRICING_ENABLED≠1. */
export const PRICING_ENABLED = flag('VITE_PRICING_ENABLED', true)
