import type { MatchRow, PickRow } from '../api/client'

/** Proba modèle (0–100 %) pour le joueur parié / favori d’un pick. */
export function pickModelProbaPct(pick: PickRow): number | null {
  if (pick.p_model_pct != null && Number.isFinite(pick.p_model_pct)) {
    return pick.p_model_pct
  }
  if (pick.p_model_fav != null && Number.isFinite(pick.p_model_fav)) {
    return pick.p_model_fav * 100
  }
  const trueOdd = pick.true_odd
  if (trueOdd != null && trueOdd > 1) {
    return (1 / trueOdd) * 100
  }
  return null
}

/** Proba modèle (0–100 %) pour P1 et P2 à partir du snapshot match. */
export function matchPlayerProbas(match: MatchRow): { p1Pct: number | null; p2Pct: number | null } {
  const fs = match.feature_snapshot
  const capped = fs?.capped_p1_prob
  if (capped != null && Number.isFinite(capped)) {
    const p1 = Math.max(0, Math.min(1, capped)) * 100
    return { p1Pct: p1, p2Pct: 100 - p1 }
  }
  if (match.p1_prob != null && Number.isFinite(match.p1_prob)) {
    const p1 = match.p1_prob <= 1 ? match.p1_prob * 100 : match.p1_prob
    return { p1Pct: p1, p2Pct: 100 - p1 }
  }
  return { p1Pct: null, p2Pct: null }
}

export function formatProbaPct(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${value.toFixed(digits)}%`
}

export const PROBA_GRADIENT = 'linear-gradient(to right, #00D4C8 0%, #00D4FF 50%, #C8F135 100%)'

/** Dégradé calé sur 0–v % (texte et barre partagent la même échelle). */
export function probaGradientStyles(pct: number): {
  backgroundImage: string
  backgroundSize: string
  innerWidthPct: string
  edgeColor: string
} {
  const v = Math.max(0.1, Math.min(100, pct))
  const scale = (100 / v) * 100
  return {
    backgroundImage: PROBA_GRADIENT,
    backgroundSize: `${scale}% 100%`,
    innerWidthPct: `${scale}%`,
    edgeColor: probaColor(pct),
  }
}

const PROBA_STOPS = [
  { at: 0, hex: '#00D4C8' },
  { at: 50, hex: '#00D4FF' },
  { at: 100, hex: '#C8F135' },
] as const

function hexToRgb(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`
}

/** Couleur unique dérivée de la proba (teal → cyan → lime), partagée texte + barre. */
export function probaColor(pct: number): string {
  const v = Math.max(0, Math.min(100, pct))
  let lo: (typeof PROBA_STOPS)[number] = PROBA_STOPS[0]
  let hi: (typeof PROBA_STOPS)[number] = PROBA_STOPS[PROBA_STOPS.length - 1]
  for (let i = 0; i < PROBA_STOPS.length - 1; i++) {
    if (v >= PROBA_STOPS[i].at && v <= PROBA_STOPS[i + 1].at) {
      lo = PROBA_STOPS[i]
      hi = PROBA_STOPS[i + 1]
      break
    }
  }
  const span = hi.at - lo.at || 1
  const t = (v - lo.at) / span
  const a = hexToRgb(lo.hex)
  const b = hexToRgb(hi.hex)
  return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t)
}
