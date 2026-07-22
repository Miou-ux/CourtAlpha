"""Replay 1 Day 1 Pick : rang 1 de la sélection hybride Top 5 (même règles que /top5)."""
from __future__ import annotations

import sqlite3
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from api.services.hybrid_selection_text import hybrid_selection_description

PARIS = ZoneInfo("Europe/Paris")
EV_MIN_PCT = 15.0
EV_MAX_PCT = 100.0
DEFAULT_BANKROLL_EUR = 100.0


def _format_score(raw: object) -> str | None:
    from scripts.score_display import format_tennis_score_display

    return format_tennis_score_display(raw)


def _status_flags(status: object) -> dict[str, bool]:
    st = str(status or "").strip().lower()
    void = "annul" in st
    return {
        "won": "gagn" in st,
        "lost": "perdu" in st,
        "open": "cours" in st or st in {"", "en cours"},
        "void": void,
        "settled": "gagn" in st or "perdu" in st or void,
    }


def _profit_frac_for_pick(row: dict[str, Any]) -> float:
    flags = _status_flags(row.get("status"))
    if flags["void"]:
        return 0.0
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


def _enrich_picks_with_replay_pnl(
    picks: list[dict[str, Any]],
    *,
    bankroll_start: float,
) -> list[dict[str, Any]]:
    """Ajoute replay_net_profit_eur (simulation BR séquentielle, même logique que la courbe)."""
    bankroll = float(bankroll_start)
    out: list[dict[str, Any]] = []
    for row in picks:
        enriched = dict(row)
        flags = _status_flags(enriched.get("status"))
        profit_eur: float | None = None
        if flags["settled"]:
            if flags["void"]:
                profit_eur = 0.0
            else:
                profit_frac = _profit_frac_for_pick(enriched)
                profit_eur = round(bankroll * profit_frac, 2)
                bankroll += profit_eur
        enriched["replay_net_profit_eur"] = profit_eur
        out.append(enriched)
    return out


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
        "replay_net_profit_eur": row.get("replay_net_profit_eur"),
        "status": row.get("status"),
        "score_final": row.get("score_final"),
        "score_display": _format_score(row.get("score_final")),
        "capture_source": row.get("capture_source"),
        "won": flags["won"],
        "lost": flags["lost"],
        "void": flags["void"],
        "settled": flags["settled"],
        "open": flags["open"],
        "is_today": bool(row.get("is_today")),
        "selection_mode": row.get("selection_mode"),
    }


def _enrich_rows_reliability(
    rows: list[dict[str, Any]],
    *,
    db_path: str,
) -> list[dict[str, Any]]:
    """Score fiabilité manquant (replay historique avant backfill DB)."""
    if not any(r.get("data_reliability_score") is None for r in rows):
        return rows
    from scripts.match_rank_quality import match_data_reliability_score
    from scripts.reliability_pick_match import match_dict_from_top_proba_row
    from scripts.stats_engine import TennisStatsEngine

    engine = TennisStatsEngine(db_path=db_path)
    out: list[dict[str, Any]] = []
    for row in rows:
        d = dict(row)
        if d.get("data_reliability_score") is None:
            match = match_dict_from_top_proba_row(d, engine)
            score, flags = match_data_reliability_score(match)
            d["data_reliability_score"] = score
            d["data_reliability_flags"] = "|".join(flags) if flags else None
        out.append(d)
    return out


def _load_ranked_rows(
    db_path: str,
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
            ORDER BY calendar_date ASC, tour ASC, rank ASC
            """
        ).fetchall()
        out: list[dict[str, Any]] = []
        for r in rows:
            d = dict(r)
            tour = str(d.get("tour") or "").upper()
            tournament = str(d.get("tournament") or "")
            if not is_major_atp_wta_by_name(tour, tournament):
                continue
            out.append(d)
        return _enrich_rows_reliability(out, db_path=db_path)
    finally:
        conn.close()


def _resolve_today_pick(
    *,
    db_path: str,
    today: str,
    ev_min_pct: float,
    ev_max_pct: float,
) -> tuple[dict[str, Any] | None, str | None]:
    """Retourne (pick brut, source db|live) — Option A via discord_1d1p_core."""
    from scripts.discord_1d1p_core import load_1d1p_today_pick

    pick, _, _, _ = load_1d1p_today_pick(
        db_path=db_path,
        calendar_date=today,
        ev_min_pct=ev_min_pct,
        ev_max_pct=ev_max_pct,
    )
    if pick is None:
        return None, None
    return dict(pick), str(pick.get("source") or "live")


def _select_one_pick_per_day(
    rows: list[dict[str, Any]],
    *,
    exclude_date: str | None,
    ev_min_pct: float,
    ev_max_pct: float,
) -> list[dict[str, Any]]:
    from scripts.daily_top_proba_store import dedupe_top_proba_rows_by_match, matchup_players_key
    from scripts.discord_1d1p_core import select_1d1p_pick
    from scripts.tournament_tier import is_major_atp_wta_by_name

    def _major_row(row: dict[str, Any]) -> bool:
        return is_major_atp_wta_by_name(
            str(row.get("tour") or ""),
            str(row.get("tournament") or ""),
        )

    by_day: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        cal = str(row.get("calendar_date") or "")
        if not cal:
            continue
        if exclude_date and cal >= exclude_date:
            continue
        by_day.setdefault(cal, []).append(row)

    picks: list[dict[str, Any]] = []
    used_matchups: set[str] = set()
    for cal in sorted(by_day.keys()):
        day_rows = dedupe_top_proba_rows_by_match(by_day[cal])

        def _row_ok(row: dict[str, Any]) -> bool:
            if not _major_row(row):
                return False
            key = matchup_players_key(row)
            return not key or key not in used_matchups

        best = select_1d1p_pick(
            day_rows,
            ev_min_pct=ev_min_pct,
            ev_max_pct=ev_max_pct,
            row_ok=_row_ok,
        )
        if best is not None:
            picks.append(best)
            mk = matchup_players_key(best)
            if mk:
                used_matchups.add(mk)
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
    n_won = n_lost = n_void = n_open = n_settled = 0

    for i, row in enumerate(picks, start=1):
        flags = _status_flags(row.get("status"))
        stake_frac = _stake_frac(row)
        profit_eur = 0.0
        profit_frac = None

        if flags["settled"]:
            n_settled += 1
            profit_frac = _profit_frac_for_pick(row)
            if flags["void"]:
                n_void += 1
            else:
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
                "daily_stake_eur": round(bankroll * stake_frac, 2)
                if flags["settled"] and not flags["void"]
                else 0.0,
                "n_picks_cum": i,
                "pnl_cum_eur": round(bankroll - bankroll_start, 2),
                "drawdown_pct": round(dd_pct, 2),
                "settled": flags["settled"],
            }
        )

    net_profit = bankroll - bankroll_start
    growth_pct = (net_profit / bankroll_start * 100.0) if bankroll_start > 0 else 0.0
    roi_staked = (net_profit / total_staked_eur * 100.0) if total_staked_eur > 0 else 0.0
    n_decided = n_won + n_lost
    hit_pct = (n_won / n_decided * 100.0) if n_decided > 0 else 0.0

    summary = {
        "n_picks": len(picks),
        "n_settled": n_settled,
        "n_open": n_open,
        "n_won": n_won,
        "n_lost": n_lost,
        "n_void": n_void,
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
    """Construit le replay 1 Day 1 Pick depuis daily_top_proba_picks (+ live pour aujourd'hui).

    Aujourd'hui : jamais rejoué depuis l'archive DB (snapshots intraday) — uniquement le pick
    live hybride (aligné Top 5 replay / Telegram matin).
    """
    today = datetime.now(PARIS).date().isoformat()

    raw_rows = _load_ranked_rows(db_path)
    today_raw, today_source = _resolve_today_pick(
        db_path=db_path,
        today=today,
        ev_min_pct=float(ev_min_pct),
        ev_max_pct=float(ev_max_pct),
    )

    picks_raw = _select_one_pick_per_day(
        raw_rows,
        exclude_date=today,
        ev_min_pct=float(ev_min_pct),
        ev_max_pct=float(ev_max_pct),
    )
    if not exclude_today and today_raw is not None:
        today_row = dict(today_raw)
        today_row["is_today"] = True
        if today_source:
            today_row["source"] = today_source
        picks_raw.append(today_row)
        picks_raw.sort(key=lambda r: str(r.get("calendar_date") or ""))

    picks_raw = _enrich_picks_with_replay_pnl(picks_raw, bankroll_start=float(bankroll_start))

    picks = [
        _serialize_pick({**row, "is_today": str(row.get("calendar_date") or "") == today}, day_rank=i)
        for i, row in enumerate(picks_raw, start=1)
    ]

    curve, summary = _build_curve(picks_raw, bankroll_start=float(bankroll_start))

    start_date = str(picks_raw[0].get("calendar_date") or "") if picks_raw else None
    end_date = str(picks_raw[-1].get("calendar_date") or "") if picks_raw else None
    picks_display = list(reversed(picks))

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
            "mode": "one_day_one_pick_hybrid",
            "description": hybrid_selection_description(rank1=True),
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
        "picks": picks_display,
        "curve": curve,
        "generated_at": datetime.now(PARIS).isoformat(timespec="seconds"),
    }