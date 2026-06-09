from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query

from api.auth_tokens import auth_required
from api.bridge import bootstrap_bettinghud
from api.routes.auth import current_user, require_premium
from api.serialize import to_jsonable
from api.user_scope import bankroll_for_user, enrich_picks_existing_stake, existing_stakes_index

router = APIRouter(prefix="/live", tags=["live"])
PARIS = ZoneInfo("Europe/Paris")


def _snapshot_age_min(meta: dict) -> float | None:
    built = meta.get("built_at") or meta.get("mtime")
    if not built:
        return None
    try:
        return max(0.0, (datetime.now(PARIS).timestamp() - float(built)) / 60.0)
    except (TypeError, ValueError):
        return None


@router.get("/meta")
def live_meta(_user: dict = Depends(require_premium)) -> dict:
    bootstrap_bettinghud()
    from scripts.daily_top_proba_store import load_today_matches_for_daily_top_proba
    from scripts.live_tracker_picks import filter_live_tracker_day_matches

    matches, meta = load_today_matches_for_daily_top_proba()
    scanned = filter_live_tracker_day_matches(matches, today_only=True)
    return {
        "calendar_date": datetime.now(PARIS).date().isoformat(),
        "n_matches_today": len(matches),
        "n_scanned": len(scanned),
        "snapshot_age_min": _snapshot_age_min(meta or {}),
        "built_at": (meta or {}).get("built_at"),
        "meta": to_jsonable(meta or {}),
    }


@router.get("/value-bets")
def live_value_bets(
    ev_min_pct: float = Query(15.0, ge=0, le=100),
    mode: str = Query("value", description="value = EV+ uniquement, all = un côté par match"),
    user: dict = Depends(require_premium),
) -> dict:
    """Tuiles Live Tracker : value bets enrichies (proba, EV, Kelly, segment Brier)."""
    bootstrap_bettinghud()
    import sqlite3

    from scripts.bets_db import DB_PATH_DEFAULT
    from scripts.daily_top_proba_store import load_today_matches_for_daily_top_proba
    from scripts.live_tracker_picks import (
        collect_live_tracker_all_side_picks,
        collect_live_tracker_value_picks,
        filter_live_tracker_day_matches,
    )

    matches, meta = load_today_matches_for_daily_top_proba()
    scanned = filter_live_tracker_day_matches(matches, today_only=True)
    mode_norm = str(mode or "value").strip().lower()
    if mode_norm == "all":
        picks = collect_live_tracker_all_side_picks(scanned)
    else:
        picks = collect_live_tracker_value_picks(scanned, ev_threshold_pct=ev_min_pct)

    from scripts.live_value_explain import build_why_value_explain

    for pick in picks:
        idx = pick.get("idx")
        match = scanned[int(idx)] if idx is not None and 0 <= int(idx) < len(scanned) else None
        if not match:
            continue
        side = int(pick.get("side") or 1)
        try:
            pick["why_value"] = build_why_value_explain(
                match,
                player_name=str(pick.get("bet_on") or ""),
                opp_name=str(pick.get("opponent") or ""),
                side=side,
                odd_book=float(pick.get("odd_book") or pick.get("odd_fav") or 0),
                odd_true=float(pick.get("true_odd") or 0),
                val={
                    "value_pct": pick.get("ev_pct") or pick.get("ev_fav_pct"),
                    "sharpe_ratio": pick.get("sharpe_ratio"),
                },
            )
        except Exception:
            pick["why_value"] = None

    conn = sqlite3.connect(DB_PATH_DEFAULT)
    try:
        bankroll = bankroll_for_user(conn, user)
        stakes = existing_stakes_index(conn, user)
        enrich_picks_existing_stake(picks, stakes)
    finally:
        conn.close()

    return {
        "calendar_date": datetime.now(PARIS).date().isoformat(),
        "n_scanned": len(scanned),
        "n_picks": len(picks),
        "mode": mode_norm,
        "ev_min_pct": ev_min_pct if mode_norm == "value" else None,
        "snapshot_age_min": _snapshot_age_min(meta or {}),
        "bankroll": to_jsonable(bankroll) if bankroll else None,
        "picks": to_jsonable(picks),
    }


@router.get("/matches")
def live_matches(
    today_only: bool = Query(True, description="Matchs du jour (Europe/Paris)"),
    _user: dict = Depends(require_premium),
) -> dict:
    bootstrap_bettinghud()
    from scripts.daily_top_proba_store import load_today_matches_for_daily_top_proba
    from scripts.live_tracker_picks import filter_live_tracker_day_matches

    matches, meta = load_today_matches_for_daily_top_proba()
    if today_only:
        matches = filter_live_tracker_day_matches(matches, today_only=True)
    return {
        "calendar_date": datetime.now(PARIS).date().isoformat(),
        "count": len(matches),
        "snapshot_age_min": _snapshot_age_min(meta or {}),
        "matches": to_jsonable(matches),
    }
