from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Query

from api.bridge import bootstrap_bettinghud
from api.serialize import to_jsonable
from api.services.top_probas import (
    FAVORITE_EV_BAND_MAX_FRAC,
    FAVORITE_EV_BAND_MIN_FRAC,
    TOP_PROBAS_DISPLAY_LIMIT,
    collect_top_probas_rows,
    filter_matches_scope,
    rows_to_chart,
    rows_to_table,
)

router = APIRouter(prefix="/picks", tags=["picks"])
PARIS = ZoneInfo("Europe/Paris")


@router.get("/top-probas")
def picks_top_probas(
    limit: int = Query(TOP_PROBAS_DISPLAY_LIMIT, ge=1, le=30),
    include_challengers: bool = Query(False, description="Inclure challengers (défaut = main draw 250+)"),
    ev_band: bool = Query(True, description="Bande EV favori +15 % à +100 %"),
) -> dict:
    bootstrap_bettinghud()
    from scripts.daily_top_proba_store import load_today_matches_for_daily_top_proba

    matches, meta = load_today_matches_for_daily_top_proba()
    scoped = filter_matches_scope(matches, include_challengers=include_challengers)
    ev_min = FAVORITE_EV_BAND_MIN_FRAC if ev_band else None
    ev_max = FAVORITE_EV_BAND_MAX_FRAC if ev_band else None
    rows = collect_top_probas_rows(
        scoped,
        limit=limit,
        ev_min_frac=ev_min,
        ev_max_frac=ev_max,
        today_only=True,
    )
    built = (meta or {}).get("built_at")
    snap_age_min = None
    if built:
        try:
            snap_age_min = max(0.0, (datetime.now(PARIS).timestamp() - float(built)) / 60.0)
        except (TypeError, ValueError):
            pass
    return {
        "calendar_date": datetime.now(PARIS).date().isoformat(),
        "n_pool": len(scoped),
        "n_rows": len(rows),
        "include_challengers": include_challengers,
        "ev_band": ev_band,
        "snapshot_age_min": snap_age_min,
        "rows": to_jsonable(rows_to_table(rows)),
        "chart": to_jsonable(rows_to_chart(rows)),
    }
