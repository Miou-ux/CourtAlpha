import type { PickRow } from '../api/client'

/** Joueur parié (favori modèle) — aligné Telegram / Paris du jour / Top 5. */
export function pickBetOn(pick: PickRow): string {
  const direct = pick.bet_on || pick.fav_player
  if (direct) return direct
  const fromName = pick.match_name?.split(/\s+vs\s+/i)[0]?.trim()
  return fromName || pick.player1 || '—'
}

/** Adversaire du pick. */
export function pickOpponent(pick: PickRow): string {
  const direct = pick.opponent || pick.underdog_player
  if (direct) return direct
  const parts = pick.match_name?.split(/\s+vs\s+/i)
  if (parts && parts.length > 1) return parts.slice(1).join(' vs ').trim()
  return pick.player2 || '—'
}
