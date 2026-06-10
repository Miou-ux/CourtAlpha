/** Contenu statique public — page /methodo (stratégie & positionnement). */

export const METHODO_INTRO = {
  title: 'Data, tennis, paris',
  lead: 'CourtAlpha est né d’une obsession : mesurer avant de miser. Pas de « feeling », pas de picks effacés après une mauvaise journée — uniquement des probabilités, de l’expected value et un historique qu’on peut auditer.',
} as const

export const METHODO_DIFFERENTIATORS = [
  {
    title: 'Track record public',
    body: 'Chaque pick du jour est archivé avec cote, proba, EV et résultat. L’historique 1 Day 1 Pick est consultable sans compte — la transparence n’est pas un argument marketing, c’est le produit.',
  },
  {
    title: 'Backtests no-leak',
    body: 'Les simulations multi-années entraînent le modèle avant la période testée. Pas de regard dans le futur : on reproduit ce qu’on aurait pu faire en conditions réelles.',
  },
  {
    title: 'Mises calibrées',
    body: 'Kelly fractionnel ajusté par la qualité de calibration (Brier par segment), avec plafond de liquidité. La taille de mise fait partie de la stratégie — pas seulement le choix du match.',
  },
  {
    title: 'Tennis only, profondeur',
    body: 'Un seul sport, un pipeline dédié : snapshots live, sync tournois, modèle recalibré. La concurrence généraliste paris sportifs ne descend pas à ce niveau de granularité ATP/WTA.',
  },
  {
    title: 'Je parie le système',
    body: 'CourtAlpha n’est pas une vitrine déconnectée : portefeuille réel, suivi CLV, daemon de résultats. Les outils servent d’abord à mes propres décisions.',
  },
] as const

/** Stratégie exposée publiquement — sans détail des features modèle. */
export const METHODO_STRATEGY_TEASER = [
  {
    step: '01',
    title: 'Probabilité modèle',
    body: 'Estimation de la chance de victoire à partir de milliers de matchs historiques (forme, surface, niveau tournoi, dynamique de classement). Le cœur du modèle reste propriétaire — seules les sorties (proba, EV) sont publiées.',
  },
  {
    step: '02',
    title: 'Expected value',
    body: 'On ne joue que lorsque la cote du marché semble supérieure à notre proba — typiquement EV favori entre +15 % et +100 % sur les tournois majeurs (main draw 250+).',
  },
  {
    step: '03',
    title: 'Sélection',
    body: 'Paris du jour : Top 5 trié par probabilité modèle (pas par EV brute seule). 1 Day 1 Pick : un seul match/jour — le favori le plus confiant entre ATP et WTA dans la bande EV.',
  },
  {
    step: '04',
    title: 'Exécution & suivi',
    body: 'Snapshot live plusieurs fois par jour, capture automatique des picks, réconciliation des résultats. Le live tracker Premium expose la même logique en temps réel.',
  },
] as const

/** Top 5 proba — fallback statique si API indisponible (scripts/methodo_yearly_stats.py). */
export const METHODO_BACKTEST_ROWS = [
  {
    year: '2024',
    bets: 1220,
    days: 292,
    hitPct: 71.4,
    roiYearPct: 17.6,
    roi1d1pPct: 30.2,
    brier: 0.172,
    note: null,
  },
  {
    year: '2025',
    bets: 1212,
    days: 296,
    hitPct: 76.5,
    roiYearPct: 29.2,
    roi1d1pPct: 43.0,
    brier: 0.14,
    note: null,
  },
  {
    year: '2026',
    bets: 395,
    days: 114,
    hitPct: 65.3,
    roiYearPct: 29.9,
    roi1d1pPct: 34.6,
    brier: 0.179,
    note: 'Année partielle (janv.–mai)',
  },
] as const

export const METHODO_BACKTEST_FOOTNOTE =
  'Protocole : ATP+WTA, tournois G/M/A, EV 15–100 %, Top 5/jour trié par proba modèle, modèle entraîné avant chaque année testée. ROI année = Kelly ½ × Brier (cap 15 % liquidité), rapporté au volume misé sur l’année. ROI 1D1P = 1 pick/jour (meilleur rank=1 ATP vs WTA), mise fixe 1 unité. Détails complets non publiés — résultats indicatifs, passé ≠ futur.'

export const METHODO_NOT_PUBLISHED = [
  'Les features exactes et l’architecture du modèle ML',
  'Les seuils internes de filtrage hors bande EV publique',
  'Les ajustements temps réel sur cotes bookmaker spécifiques',
] as const

export const METHODO_VS_COMPETITION = [
  { them: 'Picks du jour sans historique', us: 'Replay public vérifiable' },
  { them: 'Screenshots de gains', us: 'Courbe bankroll + chaque match passé' },
  { them: 'Promesses de ROI', us: 'Backtests no-leak + disclaimer variance' },
  { them: 'Multi-sports superficiel', us: 'Tennis ATP/WTA uniquement' },
] as const
