/** Calculs Live Tracker alignés dashboard / value_detector.py */

const KELLY_BASE = 0.5
const BRIER_CAP = 0.25
const MAX_STAKE_FRAC = 0.15
const PREMIUM_BRIER_MAX = 0.18

export function computeEvPct(bookOdd: number, trueOdd: number): number {
  if (bookOdd <= 1 || trueOdd <= 1) return 0
  const trueProb = 1 / trueOdd
  const expectedYield = trueProb * (bookOdd - 1) - (1 - trueProb)
  return expectedYield * 100
}

export function computeKellyStake(
  pModel: number,
  customOdd: number,
  segmentBrier: number,
  bankrollAvail: number,
): { frac: number; eur: number; pct: number; brierFactor: number } {
  const p = Math.max(0, Math.min(1, pModel))
  const o = customOdd
  if (o <= 1 || p <= 0 || p >= 1) {
    return { frac: 0, eur: 0, pct: 0, brierFactor: 0 }
  }
  const b = Math.max(0.01, o - 1)
  const kellyFull = Math.max(0, (b * p - (1 - p)) / b)
  const brier = Math.max(0.05, segmentBrier)
  const brierFactor = Math.max(0, 1 - brier / BRIER_CAP)
  const frac = Math.max(0, Math.min(KELLY_BASE * kellyFull * brierFactor, MAX_STAKE_FRAC))
  return {
    frac,
    eur: bankrollAvail * frac,
    pct: frac * 100,
    brierFactor,
  }
}

export function isPremiumSegment(segmentBrier: number): boolean {
  return segmentBrier < PREMIUM_BRIER_MAX
}

export type EvTier = 'strong' | 'ok' | 'weak' | 'neg'

export function evTier(evPct: number): EvTier {
  if (evPct >= 15) return 'strong'
  if (evPct >= 8) return 'ok'
  if (evPct >= 0) return 'weak'
  return 'neg'
}
