from __future__ import annotations

import asyncio
import sqlite3
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from api.auth_tokens import auth_required
from api.bridge import bootstrap_bettinghud
from api.routes.auth import current_user
from api.serialize import to_jsonable

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


def _telegram_uid(user: dict | None) -> str | None:
    tg = str((user or {}).get("telegram_user_id") or "").strip()
    return tg or None


def _bankroll_snapshot(conn: sqlite3.Connection, telegram_uid: str | None) -> dict:
    from scripts.bets_db import (
        APP_KELLY_TRACKER_SOURCES,
        compute_live_tracker_bankroll_eur,
        compute_telegram_user_bankroll_eur,
    )

    if telegram_uid:
        snap = compute_telegram_user_bankroll_eur(conn, telegram_uid)
        snap["bankroll_mode"] = "telegram"
        return snap

    snap = compute_live_tracker_bankroll_eur(conn)
    cur = conn.execute(
        """
        SELECT COALESCE(SUM(stake), 0)
        FROM user_bets
        WHERE COALESCE(TRIM(tracker_source), '') = ''
          AND COALESCE(TRIM(status), '') = 'En cours'
        """
    )
    legacy_open = float(cur.fetchone()[0] or 0.0)
    cur2 = conn.execute(
        """
        SELECT COALESCE(SUM(profit), 0)
        FROM user_bets
        WHERE COALESCE(TRIM(tracker_source), '') = ''
          AND COALESCE(TRIM(status), '') != 'En cours'
        """
    )
    legacy_profit = float(cur2.fetchone()[0] or 0.0)
    snap["committed_open_eur"] = float(snap.get("committed_open_eur", 0.0)) + legacy_open
    snap["settled_profit_eur"] = float(snap.get("settled_profit_eur", 0.0)) + legacy_profit
    snap["available_raw_eur"] = (
        float(snap["start_eur"]) + float(snap["settled_profit_eur"]) - float(snap["committed_open_eur"])
    )
    snap["available_eur"] = float(snap["available_raw_eur"]) + float(snap.get("manual_adjust_eur", 0.0))
    snap["equity_eur"] = float(snap["available_eur"]) + float(snap["committed_open_eur"])
    snap["bankroll_mode"] = "mixed"
    snap["kelly_sources"] = list(APP_KELLY_TRACKER_SOURCES)
    return snap


def _fetch_bets_rows(conn: sqlite3.Connection, telegram_uid: str | None) -> list[dict]:
    conn.row_factory = sqlite3.Row
    if telegram_uid:
        rows = conn.execute(
            """
            SELECT *
            FROM user_bets
            WHERE telegram_user_id = ?
            ORDER BY id ASC
            """,
            (telegram_uid,),
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM user_bets ORDER BY id ASC").fetchall()
    return [dict(r) for r in rows]


def _bet_date_key(row: dict) -> str:
    from scripts.bets_db import normalize_schedule_date

    md = normalize_schedule_date(row.get("match_date"))
    if md:
        return md
    d = str(row.get("date") or "").strip()
    return d[:10] if d else datetime.utcnow().date().isoformat()


def _compute_analytics(bets: list[dict]) -> dict:
    from scripts.bets_db import APP_KELLY_TRACKER_SOURCES

    if not bets:
        return {
            "n_total": 0,
            "n_open": 0,
            "n_won": 0,
            "n_lost": 0,
            "n_void": 0,
            "win_rate_pct": 0.0,
            "roi_pct": 0.0,
            "total_profit_eur": 0.0,
            "total_staked_eur": 0.0,
            "avg_odds": 0.0,
            "max_drawdown_pct": 0.0,
            "kelly": None,
            "daily_curve": [],
            "clv": None,
            "clv_curve": [],
            "clv_by_tour": [],
            "clv_by_segment": [],
        }

    sorted_bets = sorted(bets, key=lambda r: (_bet_date_key(r), int(r.get("id") or 0)))

    def _f(row: dict, key: str) -> float:
        try:
            return float(row.get(key) or 0.0)
        except (TypeError, ValueError):
            return 0.0

    def _status(row: dict) -> str:
        return str(row.get("status") or "").strip() or "En cours"

    n_open = sum(1 for r in bets if _status(r) == "En cours")
    n_won = sum(1 for r in bets if _status(r) == "Gagné")
    n_lost = sum(1 for r in bets if _status(r) == "Perdu")
    n_void = sum(1 for r in bets if _status(r) == "Annulé")
    nb_closed = n_won + n_lost
    win_rate = (100.0 * n_won / nb_closed) if nb_closed > 0 else 0.0

    total_profit = sum(_f(r, "profit") for r in bets)
    total_staked = sum(_f(r, "stake") for r in bets)
    roi = (100.0 * total_profit / total_staked) if total_staked > 0 else 0.0
    odds_vals = [_f(r, "odds") for r in bets if _f(r, "odds") > 1.0]
    avg_odd = sum(odds_vals) / len(odds_vals) if odds_vals else 0.0

    daily: dict[str, dict] = {}
    for row in sorted_bets:
        dk = _bet_date_key(row)
        if dk not in daily:
            daily[dk] = {"date": dk, "daily_profit_eur": 0.0, "daily_stake_eur": 0.0, "n_bets": 0}
        daily[dk]["daily_profit_eur"] += _f(row, "profit")
        daily[dk]["daily_stake_eur"] += _f(row, "stake")
        daily[dk]["n_bets"] += 1

    daily_curve = sorted(daily.values(), key=lambda x: x["date"])
    peak = 0.0
    max_dd = 0.0
    cum = 0.0
    for pt in daily_curve:
        cum += float(pt["daily_profit_eur"])
        pt["cumulative_profit_eur"] = cum
        peak = max(peak, cum)
        dd = ((peak - cum) / abs(peak) * 100.0) if abs(peak) > 1e-9 else 0.0
        pt["drawdown_pct"] = dd
        max_dd = max(max_dd, dd)

    kelly_bets = [
        r
        for r in bets
        if str(r.get("tracker_source") or "").strip() in APP_KELLY_TRACKER_SOURCES
        or str(r.get("tracker_source") or "").strip() == ""
    ]
    kelly_stats = None
    if kelly_bets:
        lt_open = [r for r in kelly_bets if _status(r) == "En cours"]
        lt_closed = [r for r in kelly_bets if _status(r) != "En cours"]
        st_sub = sum(_f(r, "stake") for r in lt_closed)
        pl_sub = sum(_f(r, "profit") for r in lt_closed)
        w_lt = sum(1 for r in lt_closed if _status(r) == "Gagné")
        wr_lt = (100.0 * w_lt / len(lt_closed)) if lt_closed else 0.0
        roi_lt = (100.0 * pl_sub / st_sub) if st_sub > 0 else 0.0
        n_top5 = sum(
            1 for r in kelly_bets if str(r.get("tracker_source") or "").strip() == "top5_proba_action"
        )
        kelly_stats = {
            "n_bets": len(kelly_bets),
            "n_open": len(lt_open),
            "n_top5": n_top5,
            "settled_profit_eur": pl_sub,
            "roi_pct": roi_lt,
            "win_rate_pct": wr_lt,
        }

    clv_rows = []
    for row in sorted_bets:
        try:
            clv = float(row["clv_score"]) if row.get("clv_score") is not None else None
        except (TypeError, ValueError):
            clv = None
        if clv is not None:
            clv_rows.append({**row, "_clv": clv})

    clv_block = None
    clv_curve: list[dict] = []
    clv_by_tour: list[dict] = []
    clv_by_segment: list[dict] = []
    if clv_rows:
        clv_vals = [r["_clv"] for r in clv_rows]
        clv_mean = sum(clv_vals) / len(clv_vals)
        clv_sorted = sorted(clv_vals)
        mid = len(clv_sorted) // 2
        clv_med = (
            clv_sorted[mid]
            if len(clv_sorted) % 2
            else (clv_sorted[mid - 1] + clv_sorted[mid]) / 2.0
        )
        clv_block = {
            "mean_pct": clv_mean * 100.0,
            "median_pct": clv_med * 100.0,
            "n_with_closing": len(clv_rows),
            "coverage_pct": 100.0 * len(clv_rows) / max(1, len(bets)),
        }
        cum_clv = 0.0
        cum_profit = 0.0
        for row in clv_rows:
            cum_clv += row["_clv"] * 100.0
            cum_profit += _f(row, "profit")
            clv_curve.append(
                {
                    "date": _bet_date_key(row),
                    "cum_clv_pct": cum_clv,
                    "cum_profit_eur": cum_profit,
                }
            )
        tour_agg: dict[str, list[float]] = {}
        seg_agg: dict[str, list[float]] = {}
        for row in clv_rows:
            tour = str(row.get("tour") or "N/A").strip() or "N/A"
            tour_agg.setdefault(tour, []).append(row["_clv"])
            seg = str(row.get("segment_key") or "").strip()
            if seg:
                seg_agg.setdefault(seg, []).append(row["_clv"])
        clv_by_tour = [
            {"tour": k, "clv_mean_pct": 100.0 * sum(v) / len(v), "n": len(v)}
            for k, v in sorted(tour_agg.items(), key=lambda x: -len(x[1]))
        ]
        clv_by_segment = [
            {"segment": k, "clv_mean_pct": 100.0 * sum(v) / len(v), "n": len(v)}
            for k, v in sorted(seg_agg.items(), key=lambda x: -len(x[1]))
        ]

    return {
        "n_total": len(bets),
        "n_open": n_open,
        "n_won": n_won,
        "n_lost": n_lost,
        "n_void": n_void,
        "win_rate_pct": win_rate,
        "roi_pct": roi,
        "total_profit_eur": total_profit,
        "total_staked_eur": total_staked,
        "avg_odds": avg_odd,
        "max_drawdown_pct": max_dd,
        "kelly": kelly_stats,
        "daily_curve": daily_curve,
        "clv": clv_block,
        "clv_curve": clv_curve,
        "clv_by_tour": clv_by_tour,
        "clv_by_segment": clv_by_segment,
    }


@router.get("/summary")
def portfolio_summary(user: dict | None = Depends(current_user)) -> dict:
    bootstrap_bettinghud()
    from scripts.bets_db import DB_PATH_DEFAULT, ensure_user_bets_schema

    tg = _telegram_uid(user)
    conn = sqlite3.connect(DB_PATH_DEFAULT)
    try:
        ensure_user_bets_schema(conn)
        bankroll = _bankroll_snapshot(conn, tg)
        bets = _fetch_bets_rows(conn, tg)
        analytics = _compute_analytics(bets)
        return to_jsonable(
            {
                "scope": "telegram" if tg else "global",
                "telegram_user_id": tg,
                "bankroll": bankroll,
                "n_bets_open": analytics["n_open"],
                "n_bets_settled": analytics["n_won"] + analytics["n_lost"] + analytics["n_void"],
                **analytics,
            }
        )
    finally:
        conn.close()


@router.get("/bets")
def portfolio_bets(
    limit: int = Query(500, ge=1, le=500),
    status: str | None = Query(default=None),
    min_stake: float = Query(0.0, ge=0.0),
    sort: Literal["recent", "oldest", "profit_desc", "profit_asc"] = Query("recent"),
    user: dict | None = Depends(current_user),
) -> dict:
    bootstrap_bettinghud()
    from scripts.bets_db import DB_PATH_DEFAULT, ensure_user_bets_schema

    tg = _telegram_uid(user)
    conn = sqlite3.connect(DB_PATH_DEFAULT)
    conn.row_factory = sqlite3.Row
    try:
        ensure_user_bets_schema(conn)
        if tg:
            rows = conn.execute(
                """
                SELECT id, date, match_name, bet_on, odds, stake, status, profit,
                       tournament, tour, match_date, ev_at_bet, p_model, tracker_source,
                       closing_odd, clv_score, segment_key, notes
                FROM user_bets
                WHERE telegram_user_id = ?
                ORDER BY id DESC
                """,
                (tg,),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT id, date, match_name, bet_on, odds, stake, status, profit,
                       tournament, tour, match_date, ev_at_bet, p_model, tracker_source,
                       closing_odd, clv_score, segment_key, notes
                FROM user_bets
                ORDER BY id DESC
                """
            ).fetchall()
        bets = [dict(r) for r in rows]

        if status and status != "Tous":
            bets = [b for b in bets if str(b.get("status") or "").strip() == status]
        bets = [b for b in bets if float(b.get("stake") or 0.0) >= float(min_stake)]

        if sort == "oldest":
            bets.sort(key=lambda b: int(b.get("id") or 0))
        elif sort == "profit_desc":
            bets.sort(key=lambda b: float(b.get("profit") or 0.0), reverse=True)
        elif sort == "profit_asc":
            bets.sort(key=lambda b: float(b.get("profit") or 0.0))
        else:
            bets.sort(key=lambda b: int(b.get("id") or 0), reverse=True)

        bets = bets[: int(limit)]
        return {"count": len(bets), "bets": to_jsonable(bets)}
    finally:
        conn.close()


class BetSettleRequest(BaseModel):
    status: Literal["Gagné", "Perdu"] = Field(...)


@router.patch("/bets/{bet_id}")
def settle_bet_manual(
    bet_id: int,
    body: BetSettleRequest,
    user: dict | None = Depends(current_user),
) -> dict:
    if auth_required() and not user:
        raise HTTPException(status_code=401, detail="Authentification requise")
    bootstrap_bettinghud()
    from scripts.bets_db import DB_PATH_DEFAULT, ensure_user_bets_schema, settle_bet

    tg = _telegram_uid(user)
    conn = sqlite3.connect(DB_PATH_DEFAULT)
    conn.row_factory = sqlite3.Row
    try:
        ensure_user_bets_schema(conn)
        row = conn.execute("SELECT * FROM user_bets WHERE id = ?", (int(bet_id),)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Pari introuvable")
        bet = dict(row)
        if tg:
            bet_tg = str(bet.get("telegram_user_id") or "").strip()
            if bet_tg and bet_tg != tg:
                raise HTTPException(status_code=403, detail="Pari d'un autre utilisateur")
        if str(bet.get("status") or "").strip() != "En cours":
            raise HTTPException(status_code=400, detail="Pari déjà réglé")

        odds = float(bet.get("odds") or 0.0)
        stake = float(bet.get("stake") or 0.0)
        if body.status == "Gagné":
            profit = (odds - 1.0) * stake
        else:
            profit = -stake
        settle_bet(
            conn,
            bet_id=int(bet_id),
            status=body.status,
            profit=profit,
            result_source="manual_web",
        )
        return {"ok": True, "bet_id": int(bet_id), "status": body.status, "profit": profit}
    finally:
        conn.close()


@router.post("/actions/clv-sync")
def portfolio_clv_sync(user: dict | None = Depends(current_user)) -> dict:
    if auth_required() and not user:
        raise HTTPException(status_code=401, detail="Authentification requise")
    bootstrap_bettinghud()
    from scripts.bets_db import DB_PATH_DEFAULT
    from scripts.sync_tml_recent import update_closing_odds

    n = int(update_closing_odds(db_path=DB_PATH_DEFAULT))
    return {"ok": True, "updated": n}


@router.post("/actions/update-results")
async def portfolio_update_results(user: dict | None = Depends(current_user)) -> dict:
    if auth_required() and not user:
        raise HTTPException(status_code=401, detail="Authentification requise")
    bootstrap_bettinghud()
    from scripts.scraper_results import ResultsScraper

    scraper = ResultsScraper()
    updated = int(await scraper.update_pending_bets())
    return {"ok": True, "updated": updated}


@router.post("/actions/reconcile")
async def portfolio_reconcile(user: dict | None = Depends(current_user)) -> dict:
    if auth_required() and not user:
        raise HTTPException(status_code=401, detail="Authentification requise")
    bootstrap_bettinghud()
    from scripts.reconcile_bets import RECONCILE_INTERVAL_DAYS, reconcile

    summary = await reconcile(window_days=RECONCILE_INTERVAL_DAYS)
    return {"ok": True, "summary": to_jsonable(summary)}


@router.get("/reconcile-status")
def portfolio_reconcile_status(user: dict | None = Depends(current_user)) -> dict:
    bootstrap_bettinghud()
    from scripts.bets_db import DB_PATH_DEFAULT
    from scripts.reconcile_bets import (
        RECONCILE_INTERVAL_DAYS,
        days_since_last_reconciliation,
        is_reconciliation_due,
    )

    d_since = days_since_last_reconciliation(db_path=DB_PATH_DEFAULT)
    return {
        "days_since": d_since,
        "due": is_reconciliation_due(db_path=DB_PATH_DEFAULT),
        "interval_days": RECONCILE_INTERVAL_DAYS,
    }
