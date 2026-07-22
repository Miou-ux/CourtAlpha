"""Replay Top 5 hybride : jusqu'à 5 picks/jour depuis daily_top_proba_picks."""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Any

from api.services.hybrid_selection_text import hybrid_selection_description
from api.services.one_day_one_pick import (
    DEFAULT_BANKROLL_EUR,
    EV_MAX_PCT,
    EV_MIN_PCT,
    _build_curve,
    _enrich_picks_with_replay_pnl,
    _load_ranked_rows,
    _serialize_pick,
    _status_flags,
    PARIS,
)


def _norm_pick_row(row: dict[str, Any]) -> dict[str, Any]:
    from scripts.backtest_prod_top5_2026 import _norm_pick_row as norm

    return norm(row)


def _select_top5_per_day(
    rows: list[dict[str, Any]],
    *,
    exclude_date: str | None,
    limit: int = 5,
) -> list[dict[str, Any]]:
    from scripts.backtest_prod_top5_2026 import select_prod_top5_day
    from scripts.daily_top_proba_store import dedupe_top_proba_rows_by_match

    by_day: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        cal = str(row.get("calendar_date") or "")
        if not cal:
            continue
        if exclude_date and cal >= exclude_date:
            continue
        by_day[cal].append(_norm_pick_row(dict(row)))

    picks: list[dict[str, Any]] = []
    for cal in sorted(by_day.keys()):
        day_rows = dedupe_top_proba_rows_by_match(by_day[cal])
        day_picks = select_prod_top5_day(day_rows, limit=limit)
        for rank, pick in enumerate(day_picks, start=1):
            row = dict(pick)
            row["rank"] = rank
            picks.append(row)
    return picks


def _resolve_today_picks(
    *,
    limit: int = 5,
    ev_min_pct: float = EV_MIN_PCT,
    ev_max_pct: float = EV_MAX_PCT,
) -> tuple[list[dict[str, Any]], str | None]:
    from scripts.pick_modes import Channel, PickMode, load_picks

    res = load_picks(
        PickMode.TOP5,
        channel=Channel.WEB,
        limit=limit,
        ev_min_pct=ev_min_pct,
        ev_max_pct=ev_max_pct,
    )
    if not res.picks:
        return [], res.calendar_date
    out: list[dict[str, Any]] = []
    for rank, pick in enumerate(res.picks[:limit], start=1):
        row = dict(pick)
        row["rank"] = rank
        row["is_today"] = True
        row["source"] = "live"
        out.append(row)
    return out, res.calendar_date


def _build_daily_summaries(picks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_day: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in picks:
        cal = str(row.get("calendar_date") or "")
        if cal:
            by_day[cal].append(row)

    daily: list[dict[str, Any]] = []
    for cal in sorted(by_day.keys()):
        rows = by_day[cal]
        n_won = n_lost = n_void = n_open = 0
        daily_profit = 0.0
        for row in rows:
            flags = _status_flags(row.get("status"))
            if flags["won"]:
                n_won += 1
            elif flags["lost"]:
                n_lost += 1
            elif flags["void"]:
                n_void += 1
            elif flags["open"]:
                n_open += 1
            rep = row.get("replay_net_profit_eur")
            if rep is not None:
                daily_profit += float(rep)
        n_decided = n_won + n_lost
        hit_pct = (n_won / n_decided * 100.0) if n_decided > 0 else 0.0
        daily.append(
            {
                "date": cal,
                "n_picks": len(rows),
                "n_won": n_won,
                "n_lost": n_lost,
                "n_void": n_void,
                "n_open": n_open,
                "hit_pct": round(hit_pct, 1),
                "daily_profit_eur": round(daily_profit, 2),
            }
        )
    return list(reversed(daily))


def build_top5_replay(
    *,
    db_path: str,
    bankroll_start: float = DEFAULT_BANKROLL_EUR,
    ev_min_pct: float = EV_MIN_PCT,
    ev_max_pct: float = EV_MAX_PCT,
    exclude_today: bool = False,
    limit: int = 5,
) -> dict[str, Any]:
    """Construit le replay Top 5 hybride depuis daily_top_proba_picks (+ live pour aujourd'hui).

    Aujourd'hui : jamais rejoué depuis l'archive DB — uniquement ``load_picks(TOP5)`` live.
    """
    today = datetime.now(PARIS).date().isoformat()

    raw_rows = _load_ranked_rows(db_path)
    today_picks, _ = _resolve_today_picks(
        limit=limit,
        ev_min_pct=float(ev_min_pct),
        ev_max_pct=float(ev_max_pct),
    )

    picks_raw = _select_top5_per_day(raw_rows, exclude_date=today, limit=limit)
    if not exclude_today and today_picks:
        picks_raw = [r for r in picks_raw if str(r.get("calendar_date") or "") != today]
        picks_raw.extend(today_picks)
        picks_raw.sort(key=lambda r: (str(r.get("calendar_date") or ""), int(r.get("rank") or 99)))

    picks_raw = _enrich_picks_with_replay_pnl(picks_raw, bankroll_start=float(bankroll_start))

    day_rank = 0
    picks: list[dict[str, Any]] = []
    for row in picks_raw:
        day_rank += 1
        cal = str(row.get("calendar_date") or "")
        picks.append(
            _serialize_pick(
                {**row, "is_today": cal == today},
                day_rank=day_rank,
            )
        )

    curve, summary = _build_curve(picks_raw, bankroll_start=float(bankroll_start))
    daily = _build_daily_summaries(picks)

    dates = sorted({str(r.get("calendar_date") or "") for r in picks_raw if r.get("calendar_date")})
    start_date = dates[0] if dates else None
    end_date = dates[-1] if dates else None
    picks_display = list(reversed(picks))

    picks_today = [p for p in picks if p.get("is_today")]
    if not picks_today and today_picks:
        picks_today = [
            _serialize_pick({**row, "is_today": True}, day_rank=i)
            for i, row in enumerate(today_picks, start=1)
        ]

    return {
        "selection": {
            "mode": "top5_hybrid",
            "description": hybrid_selection_description(rank1=False),
            "ev_min_pct": ev_min_pct,
            "ev_max_pct": ev_max_pct,
            "exclude_today": exclude_today,
            "bankroll_start_eur": bankroll_start,
            "max_picks_per_day": limit,
        },
        "today_date": today,
        "picks_today": picks_today,
        "period": {
            "start_date": start_date,
            "end_date": end_date,
            "n_days": len(dates),
        },
        "summary": summary,
        "daily": daily,
        "picks": picks_display,
        "curve": curve,
        "generated_at": datetime.now(PARIS).isoformat(timespec="seconds"),
    }
