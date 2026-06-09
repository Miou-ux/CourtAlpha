"""Replay historique : 1 Day 1 Pick (meilleure proba rank=1 ATP vs WTA) sur tournois majeurs."""
from __future__ import annotations

import sqlite3
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

PARIS = ZoneInfo("Europe/Paris")
EV_MIN_PCT = 15.0
EV_MAX_PCT = 100.0
DEFAULT_BANKROLL_EUR = 100.0


def _format_score(raw: object) -> str | None:
    from scripts.score_display import format_tennis_score_display

    return format_tennis_score_display(raw)


def _status_flags(status: object) -> dict[str, bool]:
    st = str(status or "").strip().lower()
    return {
        "won": "gagn" in st,
        "lost": "perdu" in st,
        "open": "cours" in st or st in {"", "en cours"},
        "void": "annul" in st,
        "settled": "gagn" in st or "perdu" in st,
    }


def _profit_frac_for_pick(row: dict[str, Any]) -> float:
    flags = _status_flags(row.get("status"))
    if not flags["settled"]:
        return 0.0
    try:
        stored = float(row.get("theoretical_profit"))
        if stored != 0.0 or flags["won"] or flags["lost"]:
            return stored
    except (TypeError, ValueError):
        pass
    from scripts.bets_db import _algo_profit_for_status

    return float(
        _algo_profit_for_status(
            str(row.get("status") or ""),
            row.get("odd_fav"),
            row.get("theoretical_stake_frac"),
        )
    )


def _stake_frac(row: dict[str, Any]) -> float:
    try:
        stake = float(row.get("theoretical_stake_frac") or 0.0)
        if stake > 0.0:
            return stake
    except (TypeError, ValueError):
        pass
    from scripts.bets_db import _algo_kelly_stake_frac

    return float(
        _algo_kelly_stake_frac(
            row.get("p_model_fav"),
            row.get("odd_fav"),
            row.get("segment_brier"),
        )
    )


def _serialize_pick(row: dict[str, Any], *, day_rank: int) -> dict[str, Any]:
    flags = _status_flags(row.get("status"))
    try:
        p_model = float(row.get("p_model_fav") or 0.0)
    except (TypeError, ValueError):
        p_model = 0.0
    try:
        ev_pct = float(row.get("ev_fav_pct")) if row.get("ev_fav_pct") is not None else None
    except (TypeError, ValueError):
        ev_pct = None
    try:
        odd = float(row.get("odd_fav")) if row.get("odd_fav") is not None else None
    except (TypeError, ValueError):
        odd = None
    stake_frac = _stake_frac(row)
    profit_frac = _profit_frac_for_pick(row) if flags["settled"] else None
    return {
        "calendar_date": str(row.get("calendar_date") or ""),
        "match_date": row.get("match_date"),
        "tour": str(row.get("tour") or "").upper(),
        "rank": int(row.get("rank") or 1),
        "day_rank": day_rank,
        "match_name": row.get("match_name"),
        "fav_player": row.get("fav_player"),
        "underdog_player": row.get("underdog_player"),
        "bet_on": row.get("bet_on") or row.get("fav_player"),
        "opponent": row.get("opponent") or row.get("underdog_player"),
        "tournament": row.get("tournament"),
        "surface": row.get("surface"),
        "p_model_fav": round(p_model, 4),
        "p_model_pct": round(p_model * 100.0, 1),
        "ev_fav_pct": round(ev_pct, 1) if ev_pct is not None else None,
        "odd_fav": round(odd, 3) if odd is not None else None,
        "theoretical_stake_frac": round(stake_frac, 5),
        "theoretical_stake_pct": round(stake_frac * 100.0, 2),
        "theoretical_profit_frac": round(profit_frac, 5) if profit_frac is not None else None,
        "status": row.get("status"),
        "score_final": row.get("score_final"),
        "score_display": _format_score(row.get("score_final")),
        "capture_source": row.get("capture_source"),
        "won": flags["won"],
        "lost": flags["lost"],
        "settled": flags["settled"],
        "open": flags["open"],
        "is_today": bool(row.get("is_today")),
    }


def _load_rank1_rows(
    db_path: str,
    *,
    ev_min_pct: float,
    ev_max_pct: float,
) -> list[dict[str, Any]]:
    from scripts.bets_db import ensure_daily_top_proba_schema, sync_daily_top_proba_from_results
    from scripts.tournament_tier import is_major_atp_wta_by_name

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        ensure_daily_top_proba_schema(conn)
        sync_daily_top_proba_from_results(conn)
        rows = conn.execute(
            """
            SELECT *
            FROM daily_top_proba_picks
            WHERE rank = 1
            ORDER BY calendar_date ASC, tour ASC
            """
        ).fetchall()
        out: list[dict[str, Any]] = []
        for r in rows:
            d = dict(r)
            tour = str(d.get("tour") or "").upper()
            tournament = str(d.get("tournament") or "")
            if not is_major_atp_wta_by_name(tour, tournament):
                continue
            try:
                ev = float(d.get("ev_fav_pct"))
            except (TypeError, ValueError):
                continue
            if ev < ev_min_pct or ev > ev_max_pct:
                continue
            out.append(d)
        return out
    finally:
        conn.close()


def _best_rank1_between_circuits(candidates: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not candidates:
        return None
    return max(
        candidates,
        key=lambda r: (
            float(r.get("p_model_fav") or 0.0),
            str(r.get("tour") or "").upper() == "ATP",
        ),
    )


def _passes_ev_band(row: dict[str, Any], *, ev_min_pct: float, ev_max_pct: float) -> bool:
    try:
        ev = float(row.get("ev_fav_pct"))
    except (TypeError, ValueError):
        return False
    return ev_min_pct <= ev <= ev_max_pct


def _compute_live_today_pick(
    *,
    today: str,
    ev_min_pct: float,
    ev_max_pct: float,
) -> dict[str, Any] | None:
    """Pick du jour depuis le snapshot live si pas encore en base."""
    from scripts.daily_top_proba_store import collect_daily_top_proba_rows, load_today_matches_for_daily_top_proba

    matches, _meta = load_today_matches_for_daily_top_proba()
    if not matches:
        return None
    rank1_rows = collect_daily_top_proba_rows(
        matches,
        calendar_date=today,
        top_limit=1,
        today_only=True,
    )
    eligible = [r for r in rank1_rows if _passes_ev_band(r, ev_min_pct=ev_min_pct, ev_max_pct=ev_max_pct)]
    pick = _best_rank1_between_circuits(eligible)
    if pick is None:
        return None
    out = dict(pick)
    out.setdefault("calendar_date", today)
    out.setdefault("status", "En cours")
    out["capture_source"] = "live_snapshot"
    return out


def _resolve_today_pick(
    raw_rank1: list[dict[str, Any]],
    *,
    today: str,
    ev_min_pct: float,
    ev_max_pct: float,
) -> tuple[dict[str, Any] | None, str | None]:
    """Retourne (pick brut, source db|live)."""
    today_db = [
        r
        for r in raw_rank1
        if str(r.get("calendar_date") or "") == today and _passes_ev_band(r, ev_min_pct=ev_min_pct, ev_max_pct=ev_max_pct)
    ]
    pick = _best_rank1_between_circuits(today_db)
    if pick is not None:
        return pick, "db"
    live = _compute_live_today_pick(today=today, ev_min_pct=ev_min_pct, ev_max_pct=ev_max_pct)
    if live is not None:
        return live, "live"
    return None, None


def _select_one_pick_per_day(rows: list[dict[str, Any]], *, exclude_date: str | None) -> list[dict[str, Any]]:
    by_day: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        cal = str(row.get("calendar_date") or "")
        if not cal:
            continue
        if exclude_date and cal >= exclude_date:
            continue
        by_day.setdefault(cal, []).append(row)

    picks: list[dict[str, Any]] = []
    for cal in sorted(by_day.keys()):
        best = _best_rank1_between_circuits(by_day[cal])
        if best is not None:
            picks.append(best)
    return picks


def _build_curve(
    picks: list[dict[str, Any]],
    *,
    bankroll_start: float,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    bankroll = float(bankroll_start)
    peak = bankroll
    max_dd_pct = 0.0
    total_staked_eur = 0.0
    curve: list[dict[str, Any]] = []
    n_won = n_lost = n_open = n_settled = 0

    for i, row in enumerate(picks, start=1):
        flags = _status_flags(row.get("status"))
        stake_frac = _stake_frac(row)
        profit_eur = 0.0
        profit_frac = None

        if flags["settled"]:
            n_settled += 1
            profit_frac = _profit_frac_for_pick(row)
            stake_eur = bankroll * stake_frac
            profit_eur = bankroll * profit_frac
            total_staked_eur += stake_eur
            bankroll += profit_eur
            if flags["won"]:
                n_won += 1
            elif flags["lost"]:
                n_lost += 1
        elif flags["open"]:
            n_open += 1

        peak = max(peak, bankroll)
        dd_pct = ((peak - bankroll) / peak * 100.0) if peak > 0 else 0.0
        max_dd_pct = max(max_dd_pct, dd_pct)

        cal = str(row.get("calendar_date") or "")
        curve.append(
            {
                "date": cal,
                "bankroll": round(bankroll, 2),
                "daily_profit_eur": round(profit_eur, 2),
                "daily_stake_eur": round(bankroll * stake_frac, 2) if flags["settled"] else 0.0,
                "n_picks_cum": i,
                "pnl_cum_eur": round(bankroll - bankroll_start, 2),
                "drawdown_pct": round(dd_pct, 2),
                "settled": flags["settled"],
            }
        )

    net_profit = bankroll - bankroll_start
    growth_pct = (net_profit / bankroll_start * 100.0) if bankroll_start > 0 else 0.0
    roi_staked = (net_profit / total_staked_eur * 100.0) if total_staked_eur > 0 else 0.0
    hit_pct = (n_won / n_settled * 100.0) if n_settled > 0 else 0.0

    summary = {
        "n_picks": len(picks),
        "n_settled": n_settled,
        "n_open": n_open,
        "n_won": n_won,
        "n_lost": n_lost,
        "hit_pct": round(hit_pct, 1),
        "bankroll_start_eur": round(bankroll_start, 2),
        "bankroll_final_eur": round(bankroll, 2),
        "net_profit_eur": round(net_profit, 2),
        "growth_pct": round(growth_pct, 1),
        "total_staked_eur": round(total_staked_eur, 2),
        "roi_on_staked_pct": round(roi_staked, 1),
        "max_drawdown_pct": round(max_dd_pct, 1),
    }
    return curve, summary


def build_one_day_one_pick_replay(
    *,
    db_path: str,
    bankroll_start: float = DEFAULT_BANKROLL_EUR,
    ev_min_pct: float = EV_MIN_PCT,
    ev_max_pct: float = EV_MAX_PCT,
    exclude_today: bool = False,
) -> dict[str, Any]:
    """Construit le replay 1 Day 1 Pick depuis daily_top_proba_picks (+ snapshot live pour aujourd'hui)."""
    today = datetime.now(PARIS).date().isoformat()
    exclude_date = today if exclude_today else None

    raw_rank1 = _load_rank1_rows(db_path, ev_min_pct=float(ev_min_pct), ev_max_pct=float(ev_max_pct))
    today_raw, today_source = _resolve_today_pick(
        raw_rank1,
        today=today,
        ev_min_pct=float(ev_min_pct),
        ev_max_pct=float(ev_max_pct),
    )

    picks_raw = _select_one_pick_per_day(raw_rank1, exclude_date=exclude_date)
    if not exclude_today and today_raw is not None:
        if not picks_raw or str(picks_raw[-1].get("calendar_date") or "") != today:
            today_row = dict(today_raw)
            today_row["is_today"] = True
            picks_raw = [r for r in picks_raw if str(r.get("calendar_date") or "") != today]
            picks_raw.append(today_row)
            picks_raw.sort(key=lambda r: str(r.get("calendar_date") or ""))

    picks = [
        _serialize_pick({**row, "is_today": str(row.get("calendar_date") or "") == today}, day_rank=i)
        for i, row in enumerate(picks_raw, start=1)
    ]

    curve, summary = _build_curve(picks_raw, bankroll_start=float(bankroll_start))

    start_date = picks[0]["calendar_date"] if picks else None
    end_date = picks[-1]["calendar_date"] if picks else None

    pick_today: dict[str, Any] | None = None
    if today_raw is not None:
        pick_today = next((dict(p) for p in picks if p.get("is_today")), None)
        if pick_today is None:
            today_flags = _status_flags(today_raw.get("status"))
            row = dict(today_raw)
            if today_source == "live" and not today_flags["settled"]:
                row.setdefault("status", "En cours")
            pick_today = _serialize_pick({**row, "is_today": True}, day_rank=len(picks) or 1)
        if pick_today is not None and today_source:
            pick_today["source"] = today_source

    return {
        "selection": {
            "mode": "one_day_one_pick",
            "description": (
                "Chaque jour : meilleur rank=1 entre ATP et WTA (proba favori modèle max), "
                f"EV favori {ev_min_pct:.0f}–{ev_max_pct:.0f} %, tournois main draw 250+."
            ),
            "ev_min_pct": ev_min_pct,
            "ev_max_pct": ev_max_pct,
            "exclude_today": exclude_today,
            "bankroll_start_eur": bankroll_start,
        },
        "today_date": today,
        "pick_today": pick_today,
        "period": {
            "start_date": start_date,
            "end_date": end_date,
            "n_days": len(picks),
        },
        "summary": summary,
        "picks": picks,
        "curve": curve,
        "generated_at": datetime.now(PARIS).isoformat(timespec="seconds"),
    }
