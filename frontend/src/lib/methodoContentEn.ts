/** Public static content — /methodo page (English). */

export const METHODO_INTRO = {
  title: 'Data, tennis, betting',
  lead: 'CourtAlpha was born from an obsession: measure before you bet. No gut feelings, no picks deleted after a bad day — only probabilities, expected value, and an auditable track record.',
} as const

export const METHODO_DIFFERENTIATORS = [
  {
    title: 'Public track record',
    body: 'Every daily pick is archived with odds, model probability, EV, and result. The 1 Day 1 Pick history is viewable without an account — transparency is not marketing copy, it is the product.',
  },
  {
    title: 'No-leak backtests',
    body: 'Multi-year simulations train the model before the test period. No peeking into the future: we reproduce what could have been done in real conditions.',
  },
  {
    title: 'Calibrated stakes',
    body: 'Fractional Kelly adjusted by calibration quality (Brier by segment), with a liquidity cap. Stake sizing is part of the strategy — not just match selection.',
  },
  {
    title: 'Tennis only, depth',
    body: 'One sport, one dedicated pipeline: live snapshots, tournament sync, recalibrated model. Generic multi-sport tipsters do not reach this ATP/WTA granularity.',
  },
  {
    title: 'I bet the system',
    body: 'CourtAlpha is not a disconnected showcase: real portfolio, CLV tracking, results daemon. The tools serve my own decisions first.',
  },
] as const

export const METHODO_STRATEGY_TEASER = [
  {
    step: '01',
    title: 'Model probability',
    body: 'Win probability estimated from thousands of historical matches (form, surface, tournament level, ranking dynamics). The model core stays proprietary — only outputs (proba, EV) are published.',
  },
  {
    step: '02',
    title: 'Expected value',
    body: 'We only play when market odds seem above our model probability — typically favorite EV between +15% and +100% on major tournaments (main draw 250+).',
  },
  {
    step: '03',
    title: 'Selection',
    body: "Today's picks: Top 5 sorted by model probability (not raw EV alone). 1 Day 1 Pick: one match/day — the most confident favorite across ATP and WTA within the EV band.",
  },
  {
    step: '04',
    title: 'Execution & tracking',
    body: 'Live snapshot several times per day, automatic pick capture, results reconciliation. The Premium live tracker exposes the same logic in real time.',
  },
] as const

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
    note: 'Partial year (Jan–May)',
  },
] as const

export const METHODO_BACKTEST_FOOTNOTE =
  'Protocol: ATP+WTA, G/M/A tournaments, EV 15–100%, Top 5/day sorted by model probability, model trained before each test year. Year ROI = ½ Kelly × Brier (15% liquidity cap), relative to total staked volume that year. 1D1P ROI = 1 pick/day (best rank=1 ATP vs WTA), fixed 1-unit stake. Full details not published — indicative results, past ≠ future.'

export const METHODO_NOT_PUBLISHED = [
  'Exact ML model features and architecture',
  'Internal filtering thresholds outside the public EV band',
  'Real-time adjustments on specific bookmaker odds',
] as const

export const METHODO_VS_COMPETITION = [
  { them: 'Daily picks with no history', us: 'Verifiable public replay' },
  { them: 'Profit screenshots', us: 'Bankroll curve + every past match' },
  { them: 'ROI promises', us: 'No-leak backtests + variance disclaimer' },
  { them: 'Shallow multi-sport coverage', us: 'ATP/WTA tennis only' },
] as const
