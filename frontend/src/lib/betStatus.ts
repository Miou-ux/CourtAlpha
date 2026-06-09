import type { TFunction } from 'i18next'

/** API filter/settle values — always French on the backend. */
export const API_BET_STATUSES = ['Tous', 'En cours', 'Gagné', 'Perdu', 'Annulé'] as const
export type ApiBetStatusFilter = (typeof API_BET_STATUSES)[number]
export type ApiBetSettleStatus = 'Gagné' | 'Perdu'

export function translateBetStatus(status: string | undefined | null, t: TFunction): string {
  switch (status) {
    case 'Gagné':
      return t('common.statusWon')
    case 'Perdu':
      return t('common.statusLost')
    case 'En cours':
      return t('common.statusOpen')
    case 'Annulé':
      return t('common.statusCancelled')
    case 'Tous':
      return t('common.statusAll')
    default:
      return status?.trim() || '—'
  }
}
