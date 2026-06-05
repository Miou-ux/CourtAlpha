export type LiveMeta = {
  calendar_date: string
  n_matches_today: number
  n_scanned: number
  snapshot_age_min: number | null
}

export type LiveMatchesResponse = {
  calendar_date: string
  count: number
  snapshot_age_min: number | null
  matches: MatchRow[]
}

export type MatchRow = {
  player1?: string
  player2?: string
  tournament?: string
  tour?: string
  category?: string
  date?: string
  time?: string
  odd_p1?: number
  odd_p2?: number
  true_odd_p1?: number
  true_odd_p2?: number
  surface?: string
  p1_prob?: number
  feature_snapshot?: {
    capped_p1_prob?: number
    [key: string]: unknown
  }
}

export type PickRow = {
  rank?: number
  bet_on?: string
  opponent?: string
  match_name?: string
  tournament?: string
  tour?: string
  p_model_pct?: number
  p_model_fav?: number
  ev_fav_pct?: number
  ev_pct?: number
  odd_fav?: number
  odd_book?: number
  true_odd?: number
  match_time?: string
  surface?: string
  theoretical_stake_frac?: number
  is_value?: boolean
  segment_brier?: number
  sharpe_ratio?: number
  priority_score?: number
  p_implicit_pct?: number
  side?: number
}

export type WhyValueExplain = {
  quick_summary?: string
  human_factors?: Array<{ signal: string; value: string }>
  comparison?: Array<{ indicator: string; player: string; opponent: string; advantage: string }>
  dynamics?: Array<Record<string, string>>
  advanced?: Array<Record<string, string>>
  analysis?: string
  model_audit?: Array<Record<string, string>>
  top_features?: Array<Record<string, string>>
  tour?: string
  calibration_used?: string
}

export type LiveValueBet = PickRow & {
  idx?: number
  why_value?: WhyValueExplain | null
}

export type LiveValueBetsResponse = {
  calendar_date: string
  n_scanned: number
  n_picks: number
  mode: string
  ev_min_pct: number | null
  snapshot_age_min: number | null
  bankroll: { available_eur: number; equity_eur?: number; start_eur?: number } | null
  picks: LiveValueBet[]
}

export type PicksResponse = {
  calendar_date: string
  n_picks: number
  n_scanned?: number
  n_pool?: number
  snapshot_age_min: number | null
  picks: PickRow[]
}

export type PortfolioSummary = {
  scope: 'global' | 'telegram'
  telegram_user_id?: string | null
  bankroll: {
    available_eur: number
    equity_eur: number
    settled_profit_eur: number
    committed_open_eur: number
    start_eur?: number
    manual_adjust_eur?: number
    bankroll_mode?: string
  }
  n_bets_open: number
  n_bets_settled: number
  n_total: number
  n_won: number
  n_lost: number
  n_void: number
  win_rate_pct: number
  roi_pct: number
  total_profit_eur: number
  total_staked_eur: number
  avg_odds: number
  max_drawdown_pct: number
  kelly?: {
    n_bets: number
    n_open: number
    n_top5: number
    settled_profit_eur: number
    roi_pct: number
    win_rate_pct: number
  } | null
  daily_curve: Array<{
    date: string
    daily_profit_eur: number
    daily_stake_eur: number
    n_bets: number
    cumulative_profit_eur: number
    drawdown_pct: number
  }>
  clv?: {
    mean_pct: number
    median_pct: number
    n_with_closing: number
    coverage_pct: number
  } | null
  clv_curve: Array<{ date: string; cum_clv_pct: number; cum_profit_eur: number }>
  clv_by_tour: Array<{ tour: string; clv_mean_pct: number; n: number }>
  clv_by_segment: Array<{ segment: string; clv_mean_pct: number; n: number }>
}

export type BetRow = {
  id: number
  date?: string
  match_name?: string
  bet_on?: string
  odds?: number
  stake?: number
  status?: string
  profit?: number
  tournament?: string
  tour?: string
  match_date?: string
  ev_at_bet?: number
  p_model?: number
  tracker_source?: string
  closing_odd?: number
  clv_score?: number
  segment_key?: string
  notes?: string
}

export type PortfolioBetsQuery = {
  limit?: number
  status?: string
  min_stake?: number
  sort?: 'recent' | 'oldest' | 'profit_desc' | 'profit_asc'
}

export type BetCreatePayload = {
  match_name: string
  bet_on: string
  odds: number
  stake: number
  match_date?: string
  tour?: string
  surface?: string
  tournament?: string
  p_model?: number
  ev_at_bet?: number
  tracker_source?: string
  notes?: string
}

function authHeaders(token: string | null): HeadersInit {
  const h: Record<string, string> = {}
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

async function getJson<T>(path: string, token?: string | null): Promise<T> {
  const res = await fetch(path, { headers: authHeaders(token ?? null) })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

async function postJson<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token ?? null) },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

async function patchJson<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  const res = await fetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token ?? null) },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

export type AuthUser = {
  username: string
  display_name: string
  role: string
  telegram_user_id?: string
  telegram_username?: string
  avatar_url?: string
  email?: string
}

export type ProfileUpdatePayload = {
  display_name?: string
  telegram_user_id?: string
  telegram_username?: string
  clear_telegram?: boolean
}

export type TopProbaRow = {
  rank: number
  proba_fav_pct: number
  p1_pct: number
  tour: string
  favori: string
  adversaire: string
  tournament: string
  cotes: string
  ev_fav_pct: number | null
  gap_pp: number | null
  gap_warn: boolean
}

export type TopProbasResponse = {
  calendar_date: string
  n_pool: number
  n_rows: number
  include_challengers: boolean
  ev_band: boolean
  snapshot_age_min: number | null
  rows: TopProbaRow[]
  chart: Array<{
    rank: number
    favori: string
    adversaire: string
    tour: string
    tournament: string
    proba_model_pct: number
    proba_book_pct: number | null
    ev_fav_pct: number | null
    gap_pp: number | null
  }>
}

export type BacktestSimulateRequest = {
  year: number
  bankroll_start?: number
  kelly_multiplier?: number
  max_stake_pct?: number
  daily_stake_budget_pct?: number
  ev_min_pct?: number | null
  use_fixed_stake_pct?: boolean
  fixed_stake_pct?: number
  use_adaptive_kelly?: boolean
  adaptive_kelly_base_fraction?: number
}

export type BacktestSummary = {
  bankroll_final: number
  net_profit_eur: number
  growth_pct: number
  n_bets: number
  n_wins: number
  roi_on_staked_pct: number
  max_drawdown_pct: number
  win_rate_pct: number
}

export type BacktestSimulateResponse = {
  year: number
  csv_path: string
  n_bets_input: number
  summary: BacktestSummary
  history: Array<{ date: string; bankroll: number; n_bets_cum: number; pnl_cum_eur: number }>
  daily_pnls: number[]
}

export type TrackingResponse = {
  ok: boolean
  reason?: string
  global?: {
    n: number
    hit: number
    expected_hit: number
    realised_roi: number
    expected_roi: number
    brier: number
    baseline_hit: number
    baseline_roi: number
    baseline_brier: number
  }
  calibration?: Array<{ n: number; mean_p: number; observed: number; gap: number }>
  drift?: { level: string; message: string }
}

export type SystemStatusResponse = {
  checked_at: string
  bettinghud_root: string
  env: string
  snapshot: { n_matches: number; age_min: number | null; level: string; path: string }
  prematch_csv: { file: string | null; age_min: number | null; level: string }
  portfolio_daemon: { active: boolean; heartbeat_age_min: number | null; level: string }
  data_freshness: Record<string, unknown>
}

export const api = {
  health: () => getJson<{ status: string; bettinghud_root: string }>('/api/health'),
  liveMeta: () => getJson<LiveMeta>('/api/live/meta'),
  liveMatches: () => getJson<LiveMatchesResponse>('/api/live/matches'),
  liveValueBets: (opts?: { ev_min_pct?: number; mode?: 'value' | 'all' }, token?: string | null) => {
    const q = new URLSearchParams()
    if (opts?.ev_min_pct != null) q.set('ev_min_pct', String(opts.ev_min_pct))
    if (opts?.mode) q.set('mode', opts.mode)
    const qs = q.toString()
    return getJson<LiveValueBetsResponse>(`/api/live/value-bets${qs ? `?${qs}` : ''}`, token)
  },
  picksJour: () => getJson<PicksResponse>('/api/picks/jour'),
  picksTop5: () => getJson<PicksResponse>('/api/picks/top5'),
  picksTopProbas: (opts?: { limit?: number; include_challengers?: boolean; ev_band?: boolean }) => {
    const q = new URLSearchParams()
    if (opts?.limit) q.set('limit', String(opts.limit))
    if (opts?.include_challengers) q.set('include_challengers', 'true')
    if (opts?.ev_band === false) q.set('ev_band', 'false')
    const qs = q.toString()
    return getJson<TopProbasResponse>(`/api/picks/top-probas${qs ? `?${qs}` : ''}`)
  },
  portfolioSummary: (token?: string | null) => getJson<PortfolioSummary>('/api/portfolio/summary', token),
  portfolioBets: (opts?: PortfolioBetsQuery, token?: string | null) => {
    const q = new URLSearchParams()
    if (opts?.limit) q.set('limit', String(opts.limit))
    if (opts?.status && opts.status !== 'Tous') q.set('status', opts.status)
    if (opts?.min_stake != null && opts.min_stake > 0) q.set('min_stake', String(opts.min_stake))
    if (opts?.sort) q.set('sort', opts.sort)
    const qs = q.toString()
    return getJson<{ count: number; bets: BetRow[] }>(`/api/portfolio/bets${qs ? `?${qs}` : ''}`, token)
  },
  portfolioSettleBet: (betId: number, status: 'Gagné' | 'Perdu', token?: string | null) =>
    patchJson<{ ok: boolean; bet_id: number; profit: number }>(`/api/portfolio/bets/${betId}`, { status }, token),
  portfolioClvSync: (token?: string | null) =>
    postJson<{ ok: boolean; updated: number }>('/api/portfolio/actions/clv-sync', {}, token),
  portfolioUpdateResults: (token?: string | null) =>
    postJson<{ ok: boolean; updated: number }>('/api/portfolio/actions/update-results', {}, token),
  portfolioReconcile: (token?: string | null) =>
    postJson<{ ok: boolean; summary: Record<string, unknown> }>('/api/portfolio/actions/reconcile', {}, token),
  portfolioReconcileStatus: (token?: string | null) =>
    getJson<{ days_since: number | null; due: boolean; interval_days: number }>(
      '/api/portfolio/reconcile-status',
      token,
    ),
  portfolioBankrollAdjust: (amount_eur: number, token?: string | null) =>
    postJson<{
      ok: boolean
      amount_eur: number
      manual_adjust_eur: number
      manual_adjust_eur_before: number
      bankroll: PortfolioSummary['bankroll']
    }>('/api/portfolio/bankroll/adjust', { amount_eur }, token),
  createBet: (payload: BetCreatePayload, token?: string | null) =>
    postJson<{ ok: boolean; bet_id: number }>('/api/bets', payload, token),
  backtestYears: (token: string | null) => getJson<{ years: number[]; count: number }>('/api/backtest/years', token),
  backtestSimulate: (body: BacktestSimulateRequest, token: string | null) =>
    postJson<BacktestSimulateResponse>('/api/backtest/simulate', body, token),
  tracking: (token: string | null) => getJson<TrackingResponse>('/api/tracking', token),
  systemStatus: (token: string | null) => getJson<SystemStatusResponse>('/api/system/status', token),
  authLogin: (username: string, password: string) =>
    postJson<{ ok: boolean; token: string; user: AuthUser }>('/api/auth/login', { username, password }),
  authRegister: (body: { username: string; email: string; password: string; display_name?: string }) =>
    postJson<{ ok: boolean; token: string; user: AuthUser }>('/api/auth/register', body),
  authPasswordResetRequest: (email: string) =>
    postJson<{ ok: boolean; message: string }>('/api/auth/password-reset/request', { email }),
  authPasswordResetValidate: (token: string) =>
    getJson<{ ok: boolean; valid: boolean }>(`/api/auth/password-reset/validate?token=${encodeURIComponent(token)}`),
  authPasswordResetConfirm: (token: string, password: string) =>
    postJson<{ ok: boolean; message: string }>('/api/auth/password-reset/confirm', { token, password }),
  authMe: (token: string | null) =>
    getJson<{
      ok: boolean
      authenticated: boolean
      auth_required: boolean
      registration_open?: boolean
      user?: AuthUser
    }>('/api/auth/me', token),
  authLogout: (token: string) => postJson<{ ok: boolean }>('/api/auth/logout', {}, token),
  authUpdateProfile: (token: string, body: ProfileUpdatePayload) =>
    patchJson<{ ok: boolean; user: AuthUser }>('/api/auth/profile', body, token),
  authUploadAvatar: async (token: string, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/auth/avatar', { method: 'POST', headers: authHeaders(token), body: fd })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 200)}`)
    }
    return res.json() as Promise<{ ok: boolean; user: AuthUser }>
  },
}
