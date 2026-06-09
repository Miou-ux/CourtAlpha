from __future__ import annotations



import os

import time

from datetime import datetime, timedelta, timezone
from typing import Callable

from zoneinfo import ZoneInfo



from fastapi import APIRouter, Depends, HTTPException



from api.bridge import bootstrap_bettinghud

from api.routes.auth import require_admin

from api.config import bettinghud_root

from api.serialize import to_jsonable



router = APIRouter(prefix="/system", tags=["system"])

PARIS = ZoneInfo("Europe/Paris")



ML_INTERVAL_SEC = max(3600, int(os.getenv("BETTINGHUD_AUTO_ML_TRAIN_INTERVAL_SEC", "604800")))

SYNC_INTERVAL_SEC = max(300, int(os.getenv("BETTINGHUD_AUTO_SYNC_INTERVAL_SEC", "86400")))

DAEMON_INTERVAL_SEC = max(300, int(os.getenv("BETTINGHUD_LIVE_DATA_DAEMON_INTERVAL_SEC", "900")))

PREMATCH_TTL_MIN = max(1, int(os.getenv("BETTINGHUD_PREMATCH_TTL_MIN", "20")))

MORNING_CRON_HOURS = (2, 7)





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





def _parse_iso(iso: str | None) -> datetime | None:

    if not iso:

        return None

    s = str(iso).strip()

    if not s:

        return None

    try:

        if s.endswith("Z"):

            return datetime.fromisoformat(s.replace("Z", "+00:00")).astimezone(PARIS)

        dt = datetime.fromisoformat(s)

        if dt.tzinfo is None:

            dt = dt.replace(tzinfo=timezone.utc)

        return dt.astimezone(PARIS)

    except ValueError:

        return None





def _iso_paris(dt: datetime | None) -> str | None:

    if dt is None:

        return None

    return dt.astimezone(PARIS).isoformat(timespec="seconds")





def _next_interval(last_iso: str | None, interval_sec: int) -> datetime | None:

    last = _parse_iso(last_iso)

    if last is None:

        return None

    return last + timedelta(seconds=interval_sec)





def _next_cron_slot(hours: tuple[int, ...] = MORNING_CRON_HOURS) -> datetime:

    now = datetime.now(PARIS)

    for h in sorted(hours):

        slot = now.replace(hour=h, minute=0, second=0, microsecond=0)

        if slot > now:

            return slot

    tomorrow = now + timedelta(days=1)

    return tomorrow.replace(hour=min(hours), minute=0, second=0, microsecond=0)





def _min_dt(*candidates: datetime | None) -> datetime | None:

    vals = [c for c in candidates if c is not None]

    return min(vals) if vals else None





def _format_match_detail(match: dict | None) -> str | None:

    if not match:

        return None

    return (

        f"{match.get('date', '—')} · {match.get('tourney_name', '—')} · "

        f"{match.get('winner_name', '—')} vs {match.get('loser_name', '—')}"

    )





def _build_pipelines(

    *,

    freshness: dict,

    snap_built_at: float | None,

    snap_age_sec: float | None,

    csv_age_sec: float | None,

    csv_name: str | None,

    job_running: Callable[[str], bool],

) -> list[dict]:

    now = datetime.now(PARIS)

    ml_last = freshness.get("last_ml_train_iso")

    tml_last = freshness.get("last_tml_sync_iso")

    sack_last = freshness.get("last_sackmann_sync_iso")

    model_mtime = freshness.get("model_bundle_mtime")



    ml_next = _next_interval(ml_last, ML_INTERVAL_SEC)

    tml_next = _next_interval(tml_last, SYNC_INTERVAL_SEC)

    sack_next = _next_interval(sack_last, SYNC_INTERVAL_SEC)



    snap_last_dt = None

    if snap_built_at is not None:

        try:

            snap_last_dt = datetime.fromtimestamp(float(snap_built_at), PARIS)

        except (TypeError, ValueError, OSError):

            snap_last_dt = None

    snap_interval_next = (

        snap_last_dt + timedelta(seconds=DAEMON_INTERVAL_SEC) if snap_last_dt else None

    )

    snap_next = _min_dt(snap_interval_next, _next_cron_slot())



    te_last_dt = None

    if csv_age_sec is not None:

        te_last_dt = now - timedelta(seconds=csv_age_sec)

    te_interval_next = (

        te_last_dt + timedelta(minutes=PREMATCH_TTL_MIN) if te_last_dt else None

    )

    te_next = _min_dt(te_interval_next, _next_cron_slot())



    def _row(

        job_id: str,

        label: str,

        *,

        last_iso: str | None,

        last_detail: str | None,

        next_dt: datetime | None,

        schedule_label: str,

        driver: str,

        level: str,

    ) -> dict:

        running = job_running(job_id)

        status = "running" if running else level

        return {

            "id": job_id,

            "label": label,

            "last_run_at": last_iso,

            "last_run_detail": last_detail,

            "next_run_at": _iso_paris(next_dt),

            "schedule_label": schedule_label,

            "schedule_driver": driver,

            "status": status,

            "running": running,

            "can_force": not running,

        }



    ml_level = _level(

        (time.time() - float(model_mtime)) if model_mtime else None,

        ok_h=24 * 7,

        warn_h=24 * 10,

        present=bool(model_mtime),

    )



    return [

        _row(

            "ml_train",

            "Entraînement ML",

            last_iso=ml_last,

            last_detail=(

                f"Bundle {freshness.get('model_bundle_path', '')}"

                if model_mtime

                else None

            ),

            next_dt=ml_next,

            schedule_label=f"Tous les {ML_INTERVAL_SEC // 86400} j (thread dashboard)",

            driver="bettinghud-dashboard",

            level=ml_level,

        ),

        _row(

            "sync_sackmann",

            "Source WTA Sackmann",

            last_iso=sack_last,

            last_detail=_format_match_detail(freshness.get("last_wta_match")),

            next_dt=sack_next,

            schedule_label=f"Tous les {SYNC_INTERVAL_SEC // 3600} h (thread dashboard)",

            driver="bettinghud-dashboard",

            level=_level(

                (now - _parse_iso(sack_last)).total_seconds() if _parse_iso(sack_last) else None,

                ok_h=30,

                warn_h=48,

                present=bool(sack_last),

            ),

        ),

        _row(

            "sync_tml",

            "Source ATP TennisMyLife",

            last_iso=tml_last,

            last_detail=_format_match_detail(freshness.get("last_atp_match")),

            next_dt=tml_next,

            schedule_label=f"Tous les {SYNC_INTERVAL_SEC // 3600} h (thread dashboard)",

            driver="bettinghud-dashboard",

            level=_level(

                (now - _parse_iso(tml_last)).total_seconds() if _parse_iso(tml_last) else None,

                ok_h=30,

                warn_h=48,

                present=bool(tml_last),

            ),

        ),

        _row(

            "rebuild_snapshot",

            "Snapshot live (projection)",

            last_iso=_iso_paris(snap_last_dt),

            last_detail=None,

            next_dt=snap_next,

            schedule_label=f"~{DAEMON_INTERVAL_SEC // 60} min + cron 02h/07h Paris",

            driver="daemon + cron",

            level=_level(snap_age_sec, ok_h=6.0, warn_h=24.0, present=snap_last_dt is not None),

        ),

        _row(

            "scrape_te",

            "Scraper Tennis Explorer",

            last_iso=_iso_paris(te_last_dt),

            last_detail=csv_name,

            next_dt=te_next,

            schedule_label=f"TTL {PREMATCH_TTL_MIN} min + cron 02h/07h Paris",

            driver="daemon + cron",

            level=_level(

                csv_age_sec,

                ok_h=PREMATCH_TTL_MIN / 60.0,

                warn_h=3.0,

                present=bool(csv_name),

            ),

        ),

    ]





@router.get("/status")

def system_status(_user: dict = Depends(require_admin)) -> dict:

    bootstrap_bettinghud()

    from scripts.bets_db import DB_PATH_DEFAULT, get_data_freshness_snapshot

    from scripts.live_snapshot import SNAPSHOT_PATH, snapshot_meta

    from scripts.portfolio_sync_lock import daemon_recently_active

    from scripts.system_jobs import job_running



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



    pipelines = _build_pipelines(

        freshness=freshness,

        snap_built_at=float(built_at) if built_at else None,

        snap_age_sec=snap_age,

        csv_age_sec=csv_age,

        csv_name=csv_name,

        job_running=job_running,

    )



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

            "pipelines": pipelines,

        }

    )





@router.post("/jobs/{job_id}/run")

def system_run_job(job_id: str, _user: dict = Depends(require_admin)) -> dict:

    bootstrap_bettinghud()

    from scripts.system_jobs import JOB_IDS, start_job



    if job_id not in JOB_IDS:

        raise HTTPException(status_code=404, detail=f"Job inconnu: {job_id}")

    result = start_job(job_id)

    if not result.get("ok"):

        raise HTTPException(status_code=409, detail=str(result.get("error") or "Lancement refusé"))

    return to_jsonable(result)





@router.get("/jobs/{job_id}")

def system_job_status(job_id: str, _user: dict = Depends(require_admin)) -> dict:

    bootstrap_bettinghud()

    from scripts.system_jobs import JOB_IDS, get_job_status



    if job_id not in JOB_IDS:

        raise HTTPException(status_code=404, detail=f"Job inconnu: {job_id}")

    return to_jsonable(get_job_status(job_id))


