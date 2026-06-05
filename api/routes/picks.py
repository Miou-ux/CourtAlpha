from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Query

from api.bridge import bootstrap_bettinghud
from api.serialize import to_jsonable

router = APIRouter(prefix="/picks", tags=["picks"])
PARIS = ZoneInfo("Europe/Paris")


@router.get("/top5")
def picks_top5(
    limit: int = Query(5, ge=1, le=20),
    ev_min_pct: float = Query(15.0, ge=0),
    ev_max_pct: float = Query(100.0, ge=0),
) -> dict:
    bootstrap_bettinghud()
    from scripts.telegram_top5_notify import _load_top5_context

    picks, meta, cal_day, pool_n, age_min = _load_top5_context(
        limit=limit,
        ev_min_pct=ev_min_pct,
        ev_max_pct=ev_max_pct,
    )
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
) -> dict:
    bootstrap_bettinghud()
    from scripts.telegram_top5_notify import _load_live_tracker_jour_context

    picks, meta, cal_day, pool_n, age_min = _load_live_tracker_jour_context(
        limit=limit,
        ev_threshold_pct=ev_min_pct,
    )
    return {
        "calendar_date": cal_day,
        "n_picks": len(picks),
        "n_scanned": pool_n,
        "snapshot_age_min": age_min,
        "picks": to_jsonable(picks),
        "meta": to_jsonable(meta or {}),
    }
