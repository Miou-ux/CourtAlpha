from __future__ import annotations

import os
import time
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends

from api.bridge import bootstrap_bettinghud
from api.routes.auth import require_admin
from api.config import bettinghud_root
from api.serialize import to_jsonable

router = APIRouter(prefix="/system", tags=["system"])
PARIS = ZoneInfo("Europe/Paris")


def _file_age_sec(path: str) -> float | None:
    try:
        if not os.path.isfile(path):
            return None
        return max(0.0, time.time() - os.path.getmtime(path))
    except OSError:
        return None


def _level(age: float | None, *, ok_h: float, warn_h: float, present: bool = True) -> str:
    if not present:
        return "error"
    if age is None:
        return "warn"
    if age <= ok_h * 3600:
        return "ok"
    if age <= warn_h * 3600:
        return "warn"
    return "error"


@router.get("/status")
def system_status(_user: dict = Depends(require_admin)) -> dict:
    bootstrap_bettinghud()
    from scripts.bets_db import DB_PATH_DEFAULT, get_data_freshness_snapshot
    from scripts.live_snapshot import SNAPSHOT_PATH, snapshot_meta
    from scripts.portfolio_sync_lock import daemon_recently_active

    now = time.time()
    meta = snapshot_meta() or {}
    snap_n = int(meta.get("n_matches") or 0)
    built_at = meta.get("built_at")
    try:
        snap_age = (now - float(built_at)) if built_at else None
    except (TypeError, ValueError):
        snap_age = None

    hb_path = os.path.join("data", "cache", ".portfolio_results_daemon.heartbeat")
    hb_age = _file_age_sec(hb_path)
    daemon_ok = daemon_recently_active()

    freshness = get_data_freshness_snapshot(DB_PATH_DEFAULT)

    prematch_dir = os.path.join("data", "scraped")
    csv_age = None
    csv_name = None
    try:
        if os.path.isdir(prematch_dir):
            files = [
                f
                for f in os.listdir(prematch_dir)
                if f.startswith("prematch_odds_") and f.endswith(".csv")
            ]
            if files:
                latest = max(files)
                csv_name = latest
                csv_age = _file_age_sec(os.path.join(prematch_dir, latest))
    except OSError:
        pass

    return to_jsonable(
        {
            "checked_at": datetime.now(PARIS).isoformat(timespec="seconds"),
            "bettinghud_root": str(bettinghud_root()),
            "env": os.getenv("BETTINGHUD_ENV", "preprod"),
            "snapshot": {
                "n_matches": snap_n,
                "built_at": built_at,
                "age_min": (snap_age / 60.0) if snap_age is not None else None,
                "level": _level(snap_age, ok_h=6.0, warn_h=24.0, present=snap_n > 0),
                "path": SNAPSHOT_PATH,
            },
            "prematch_csv": {
                "file": csv_name,
                "age_min": (csv_age / 60.0) if csv_age is not None else None,
                "level": _level(csv_age, ok_h=0.5, warn_h=3.0, present=bool(csv_name)),
            },
            "portfolio_daemon": {
                "active": daemon_ok,
                "heartbeat_age_min": (hb_age / 60.0) if hb_age is not None else None,
                "level": "ok" if daemon_ok else ("warn" if hb_age is not None else "error"),
            },
            "data_freshness": freshness,
        }
    )
