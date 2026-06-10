from __future__ import annotations

import os
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query

from api.bridge import bootstrap_bettinghud
from api.routes.auth import require_premium
from api.config import bettinghud_root
from api.serialize import to_jsonable
from api.services.one_day_one_pick import DEFAULT_BANKROLL_EUR
from api.user_scope import enrich_picks_existing_stake, existing_stakes_index

router = APIRouter(prefix="/picks", tags=["picks"])
PARIS = ZoneInfo("Europe/Paris")


@router.get("/top5")
def picks_top5(
    limit: int = Query(5, ge=1, le=20),
    ev_min_pct: float = Query(15.0, ge=0),
    ev_max_pct: float = Query(100.0, ge=0),
    user: dict = Depends(require_premium),
) -> dict:
    bootstrap_bettinghud()
    import sqlite3

    from scripts.bets_db import DB_PATH_DEFAULT
    from scripts.telegram_top5_notify import _load_top5_context

    picks, meta, cal_day, pool_n, age_min = _load_top5_context(
        limit=limit,
        ev_min_pct=ev_min_pct,
        ev_max_pct=ev_max_pct,
    )
    conn = sqlite3.connect(DB_PATH_DEFAULT)
    try:
        stakes = existing_stakes_index(conn, user)
        enrich_picks_existing_stake(picks, stakes)
    finally:
        conn.close()
    return {
        "calendar_date": cal_day,
        "n_picks": len(picks),
        "n_pool": pool_n,
        "snapshot_age_min": age_min,
        "picks": to_jsonable(picks),
        "meta": to_jsonable(meta or {}),
    }


@router.get("/jour")
def picks_jour(
    ev_min_pct: float = Query(15.0, ge=0),
    limit: int | None = Query(None, ge=1, le=100),
    user: dict = Depends(require_premium),
) -> dict:
    bootstrap_bettinghud()
    import sqlite3

    from scripts.bets_db import DB_PATH_DEFAULT
    from scripts.telegram_top5_notify import _load_live_tracker_jour_context

    picks, meta, cal_day, pool_n, age_min = _load_live_tracker_jour_context(
        limit=limit,
        ev_threshold_pct=ev_min_pct,
    )
    conn = sqlite3.connect(DB_PATH_DEFAULT)
    try:
        stakes = existing_stakes_index(conn, user)
        enrich_picks_existing_stake(picks, stakes)
    finally:
        conn.close()
    return {
        "calendar_date": cal_day,
        "n_picks": len(picks),
        "n_scanned": pool_n,
        "snapshot_age_min": age_min,
        "picks": to_jsonable(picks),
        "meta": to_jsonable(meta or {}),
    }


@router.get("/one-day-one-pick")
def picks_one_day_one_pick(
    bankroll_start: float = Query(DEFAULT_BANKROLL_EUR, gt=0, le=1_000_000),
    ev_min_pct: float = Query(15.0, ge=0, le=100),
    ev_max_pct: float = Query(100.0, ge=0, le=500),
    exclude_today: bool = Query(False, description="Exclure le jour calendaire en cours (Paris)"),
) -> dict:
    """Replay public avec pick du jour (snapshot live si absent en base)."""
    bootstrap_bettinghud()
    from scripts.bets_db import DB_PATH_DEFAULT

    from api.services.one_day_one_pick import build_one_day_one_pick_replay

    db_path = str(bettinghud_root() / "data" / "bettinghud.db")
    if not os.path.isfile(db_path):
        db_path = DB_PATH_DEFAULT
    return to_jsonable(
        build_one_day_one_pick_replay(
            db_path=db_path,
            bankroll_start=float(bankroll_start),
            ev_min_pct=float(ev_min_pct),
            ev_max_pct=float(ev_max_pct),
            exclude_today=bool(exclude_today),
        )
    )


@router.get("/methodo-yearly-stats")
def picks_methodo_yearly_stats(
    years: str | None = Query(
        None,
        description="Comma-separated years (default 2024,2025,2026)",
    ),
) -> dict:
    """Yearly backtest excerpts for /methodo: volume ROI + 1D1P flat ROI."""
    bootstrap_bettinghud()
    from api.services.methodo_yearly_stats import build_methodo_yearly_stats

    year_list: list[int] | None = None
    if years:
        year_list = [int(y.strip()) for y in years.split(",") if y.strip()]
    return to_jsonable(build_methodo_yearly_stats(years=year_list))
